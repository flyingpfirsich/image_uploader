import webpush from 'web-push';
import cron from 'node-cron';
import { eq, ne, and } from 'drizzle-orm';
import {
  db,
  pushSubscriptions,
  notificationPreferences,
  dailyNotificationTime,
} from '../db/index.js';
import { generateId } from '../utils/nanoid.js';
import { config } from '../config.js';

// Fun kaomoji for notifications
const KAOMOJI = {
  happy: ['(◕‿◕)', '(✿◠‿◠)', '(◕ᴗ◕✿)', '٩(◕‿◕｡)۶', '(づ◡‿◡)づ', '(っ◔◡◔)っ'],
  excited: ['(★‿★)', '(ノ◕ヮ◕)ノ*:・゚✧', '\\(^ヮ^)/', '(ﾉ´ヮ`)ﾉ*: ・゚✧'],
  friendly: ['(◕ᴗ◕)', '(◠‿◠)', '(◕‿◕✿)', '(◡‿◡✿)'],
};

// Daily reminder messages
const DAILY_MESSAGES = [
  { title: 'hey, show us your day!', body: "your friends are waiting to see what you're up to" },
  { title: 'time to share a moment!', body: 'capture something special today' },
  { title: 'your friends miss you!', body: "show them what's happening" },
  { title: 'what are you up to?', body: 'share a peek at your world' },
  { title: 'moment check!', body: 'snap something and share it' },
];

// Friend post notification messages
const FRIEND_POST_MESSAGES = [
  { title: '{name} just posted!', body: "check out what they're up to" },
  { title: '{name} shared a moment!', body: "see what's happening" },
  { title: 'new post from {name}!', body: "don't miss it" },
  { title: '{name} is sharing!', body: 'take a look' },
];

// Configure web-push with VAPID keys
export function initializeWebPush(): void {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    console.warn('[Notifications] VAPID keys not configured. Push notifications disabled.');
    return;
  }

  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);

  console.log('[Notifications] Web Push initialized');
}

// Get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random time between 9am and 11pm
function generateDailyTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Random hour between 9 (9am) and 22 (10pm, so notification before 11pm)
  const randomHour = 9 + Math.floor(Math.random() * 14); // 9-22
  const randomMinute = Math.floor(Math.random() * 60);

  const scheduledTime = new Date(tomorrow);
  scheduledTime.setHours(randomHour, randomMinute, 0, 0);

  return scheduledTime;
}

// Get or create today's notification time
export async function getTodayNotificationTime(): Promise<Date | null> {
  const existing = await db.query.dailyNotificationTime.findFirst();

  if (existing) {
    const generatedDate = new Date(existing.generatedAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If generated today, return existing time
    if (generatedDate >= today) {
      return new Date(existing.scheduledTime);
    }
  }

  return null;
}

// Schedule tomorrow's notification time (called at midnight)
async function scheduleNextDayNotification(): Promise<Date> {
  const scheduledTime = generateDailyTime();

  // Upsert the daily notification time
  await db.delete(dailyNotificationTime);
  await db.insert(dailyNotificationTime).values({
    id: 1,
    scheduledTime,
    generatedAt: new Date(),
  });

  console.log(
    `[Notifications] Next daily notification scheduled for: ${scheduledTime.toLocaleString()}`
  );
  return scheduledTime;
}

// Subscribe user to push notifications
export async function subscribeToPush(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  // Remove existing subscriptions for this user
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  // Add new subscription
  await db.insert(pushSubscriptions).values({
    id: generateId(),
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });

  // Ensure notification preferences exist
  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });

  if (!prefs) {
    await db.insert(notificationPreferences).values({
      userId,
      dailyReminder: true,
      friendPosts: true,
    });
  }

  console.log(`[Notifications] User ${userId} subscribed to push`);
}

// Unsubscribe user from push notifications
export async function unsubscribeFromPush(userId: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  console.log(`[Notifications] User ${userId} unsubscribed from push`);
}

// Get user's notification preferences
export async function getPreferences(userId: string) {
  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });

  return prefs || { userId, dailyReminder: true, friendPosts: true };
}

// Update user's notification preferences
export async function updatePreferences(
  userId: string,
  updates: { dailyReminder?: boolean; friendPosts?: boolean }
): Promise<void> {
  const existing = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      dailyReminder: updates.dailyReminder ?? true,
      friendPosts: updates.friendPosts ?? true,
    });
  }
}

// Send push notification to a single subscription
async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or invalid - remove it
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      console.log('[Notifications] Removed expired subscription');
    } else {
      console.error('[Notifications] Push failed:', error);
    }
    return false;
  }
}

// Send daily reminders to all subscribed users
export async function sendDailyReminders(): Promise<number> {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    console.warn('[Notifications] Cannot send: VAPID keys not configured');
    return 0;
  }

  // Get all subscriptions for users with dailyReminder enabled
  const subscriptions = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(
      notificationPreferences,
      eq(pushSubscriptions.userId, notificationPreferences.userId)
    )
    .where(eq(notificationPreferences.dailyReminder, true));

  if (subscriptions.length === 0) {
    console.log('[Notifications] No users to notify for daily reminder');
    return 0;
  }

  const message = randomItem(DAILY_MESSAGES);
  const kaomoji = randomItem(KAOMOJI.happy);

  const payload = {
    type: 'daily',
    title: `${kaomoji} ${message.title}`,
    body: message.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'daily-reminder',
    data: { url: '/' },
  };

  console.log(`[Notifications] Sending daily reminders to ${subscriptions.length} users`);

  let sent = 0;
  for (const sub of subscriptions) {
    const success = await sendPushToSubscription(sub, payload);
    if (success) sent++;
  }

  console.log(`[Notifications] Daily reminders sent: ${sent}/${subscriptions.length}`);
  return sent;
}

// Notify all friends when someone posts
export async function notifyFriendPosted(
  posterUserId: string,
  posterName: string
): Promise<number> {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    return 0;
  }

  // Get all subscriptions except the poster, for users with friendPosts enabled
  const subscriptions = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(
      notificationPreferences,
      eq(pushSubscriptions.userId, notificationPreferences.userId)
    )
    .where(
      and(ne(pushSubscriptions.userId, posterUserId), eq(notificationPreferences.friendPosts, true))
    );

  if (subscriptions.length === 0) {
    return 0;
  }

  const message = randomItem(FRIEND_POST_MESSAGES);
  const kaomoji = randomItem(KAOMOJI.excited);

  const payload = {
    type: 'friend_post',
    title: `${kaomoji} ${message.title.replace('{name}', posterName)}`,
    body: message.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `friend-post-${posterUserId}`,
    data: { url: '/' },
  };

  console.log(`[Notifications] Notifying ${subscriptions.length} users about ${posterName}'s post`);

  let sent = 0;
  for (const sub of subscriptions) {
    const success = await sendPushToSubscription(sub, payload);
    if (success) sent++;
  }

  return sent;
}

// Helper to safely query dailyNotificationTime (handles missing table)
async function safeGetTodayNotificationTime(): Promise<Date | null> {
  try {
    return await getTodayNotificationTime();
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('no such table')) {
      console.warn('[Notifications] daily_notification_time table missing - skipping scheduler');
      return null;
    }
    throw error;
  }
}

// Helper to safely schedule next notification (handles missing table)
async function safeScheduleNextDayNotification(): Promise<void> {
  try {
    await scheduleNextDayNotification();
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('no such table')) {
      console.warn('[Notifications] daily_notification_time table missing - cannot schedule');
      return;
    }
    throw error;
  }
}

// Initialize daily notification scheduler
export function initializeScheduler(): void {
  // At midnight, generate tomorrow's notification time
  cron.schedule('0 0 * * *', async () => {
    console.log("[Notifications] Midnight: scheduling tomorrow's notification");
    await safeScheduleNextDayNotification();
  });

  // Check every minute if it's time to send daily notifications
  cron.schedule('* * * * *', async () => {
    const scheduledTime = await safeGetTodayNotificationTime();
    if (!scheduledTime) {
      // No time scheduled yet for today, generate one
      await safeScheduleNextDayNotification();
      return;
    }

    const now = new Date();
    const diff = Math.abs(now.getTime() - scheduledTime.getTime());

    // If within 30 seconds of scheduled time, send notifications
    if (diff < 30000 && now >= scheduledTime) {
      // Check if we already sent today by comparing with generatedAt
      try {
        const record = await db.query.dailyNotificationTime.findFirst();
        if (record) {
          const lastSent = new Date(record.generatedAt);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Only send if we haven't already today
          if (lastSent.toDateString() === now.toDateString()) {
            await sendDailyReminders();
            // Schedule next day immediately after sending
            await safeScheduleNextDayNotification();
          }
        }
      } catch (error) {
        const err = error as Error;
        if (!err.message?.includes('no such table')) {
          throw error;
        }
      }
    }
  });

  console.log('[Notifications] Scheduler initialized');

  // On startup, ensure we have a scheduled time
  safeGetTodayNotificationTime().then(async (time) => {
    if (!time) {
      await safeScheduleNextDayNotification();
    } else {
      console.log(`[Notifications] Today's notification scheduled for: ${time.toLocaleString()}`);
    }
  });
}

// Get VAPID public key for frontend
export function getVapidPublicKey(): string {
  return config.vapidPublicKey || '';
}
