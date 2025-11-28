import { Router, Request, Response } from 'express';
import { eq, desc, gte, count } from 'drizzle-orm';
import { db, users, posts, media, reactions, inviteCodes, pushSubscriptions } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { hashPassword } from '../utils/password.js';
import { generateInviteCode, generateId } from '../utils/nanoid.js';
import { config } from '../config.js';
import * as notificationService from '../services/notification.service.js';

const router = Router();

// All admin routes require auth + admin check
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// GET /api/admin/stats - Total counts
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [postCount] = await db.select({ count: count() }).from(posts);
    const [reactionCount] = await db.select({ count: count() }).from(reactions);
    const [mediaCount] = await db.select({ count: count() }).from(media);
    const [subscriptionCount] = await db.select({ count: count() }).from(pushSubscriptions);
    
    // Posts today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [postsToday] = await db
      .select({ count: count() })
      .from(posts)
      .where(gte(posts.createdAt, today));
    
    // Active users this week (users who posted in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = await db
      .selectDistinct({ userId: posts.userId })
      .from(posts)
      .where(gte(posts.createdAt, weekAgo));
    
    res.json({
      totalUsers: userCount.count,
      totalPosts: postCount.count,
      totalReactions: reactionCount.count,
      totalMedia: mediaCount.count,
      pushSubscriptions: subscriptionCount.count,
      postsToday: postsToday.count,
      activeUsersThisWeek: activeUsers.length,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/activity - Posts and signups over time (last 30 days)
router.get('/activity', async (_req: Request, res: Response) => {
  try {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Get all posts in the period
    const recentPosts = await db.query.posts.findMany({
      where: gte(posts.createdAt, startDate),
      columns: { createdAt: true },
    });
    
    // Get all users in the period
    const recentUsers = await db.query.users.findMany({
      where: gte(users.createdAt, startDate),
      columns: { createdAt: true },
    });
    
    // Build daily counts
    const activity: { date: string; posts: number; signups: number }[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayPosts = recentPosts.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate >= date && pDate < nextDate;
      }).length;
      
      const daySignups = recentUsers.filter(u => {
        const uDate = new Date(u.createdAt);
        return uDate >= date && uDate < nextDate;
      }).length;
      
      activity.push({
        date: date.toISOString().split('T')[0],
        posts: dayPosts,
        signups: daySignups,
      });
    }
    
    res.json({ activity });
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/admin/top-posters - Users ranked by post count
router.get('/top-posters', async (_req: Request, res: Response) => {
  try {
    const topPosters = await db
      .select({
        userId: posts.userId,
        postCount: count(),
      })
      .from(posts)
      .groupBy(posts.userId)
      .orderBy(desc(count()))
      .limit(10);
    
    // Get user details
    const postersWithDetails = await Promise.all(
      topPosters.map(async (p) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, p.userId),
          columns: { id: true, username: true, displayName: true, avatar: true },
        });
        return {
          user,
          postCount: p.postCount,
        };
      })
    );
    
    res.json({ topPosters: postersWithDetails });
  } catch (error) {
    console.error('Top posters error:', error);
    res.status(500).json({ error: 'Failed to fetch top posters' });
  }
});

// GET /api/admin/engagement - Reaction stats
router.get('/engagement', async (_req: Request, res: Response) => {
  try {
    // Get reaction counts per post
    const reactionStats = await db
      .select({
        postId: reactions.postId,
        reactionCount: count(),
      })
      .from(reactions)
      .groupBy(reactions.postId)
      .orderBy(desc(count()))
      .limit(10);
    
    // Get post details with reactions
    const topEngagedPosts = await Promise.all(
      reactionStats.map(async (r) => {
        const post = await db.query.posts.findFirst({
          where: eq(posts.id, r.postId),
        });
        const user = post ? await db.query.users.findFirst({
          where: eq(users.id, post.userId),
          columns: { id: true, username: true, displayName: true },
        }) : null;
        return {
          post: post ? {
            id: post.id,
            text: post.text,
            createdAt: post.createdAt,
          } : null,
          user,
          reactionCount: r.reactionCount,
        };
      })
    );
    
    // Average reactions per post
    const [totalReactions] = await db.select({ count: count() }).from(reactions);
    const [totalPosts] = await db.select({ count: count() }).from(posts);
    const avgReactionsPerPost = totalPosts.count > 0 
      ? (totalReactions.count / totalPosts.count).toFixed(2) 
      : '0';
    
    // Most used kaomoji
    const kaomojiStats = await db
      .select({
        kaomoji: reactions.kaomoji,
        count: count(),
      })
      .from(reactions)
      .groupBy(reactions.kaomoji)
      .orderBy(desc(count()))
      .limit(5);
    
    res.json({
      topEngagedPosts,
      avgReactionsPerPost: parseFloat(avgReactionsPerPost),
      topKaomoji: kaomojiStats,
    });
  } catch (error) {
    console.error('Engagement error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement stats' });
  }
});

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/users - List all users with stats
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });
    
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const [postCount] = await db
          .select({ count: count() })
          .from(posts)
          .where(eq(posts.userId, user.id));
        
        const [reactionCount] = await db
          .select({ count: count() })
          .from(reactions)
          .where(eq(reactions.userId, user.id));
        
        const hasPushSubscription = await db.query.pushSubscriptions.findFirst({
          where: eq(pushSubscriptions.userId, user.id),
        });
        
        const { passwordHash: _, ...safeUser } = user;
        return {
          ...safeUser,
          postCount: postCount.count,
          reactionCount: reactionCount.count,
          hasPushSubscription: !!hasPushSubscription,
        };
      })
    );
    
    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/admin/users/:id - Delete user and their content
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting yourself
    if (id === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Delete user (cascade will handle posts, reactions, etc.)
    await db.delete(users).where(eq(users.id, id));
    
    res.json({ success: true, message: `User ${user.username} deleted` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/admin/users/:id/reset-password - Reset user password
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
    
    res.json({ success: true, message: `Password reset for ${user.username}` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============================================
// INVITE CODE MANAGEMENT
// ============================================

// GET /api/admin/invite-codes - List all invite codes
router.get('/invite-codes', async (_req: Request, res: Response) => {
  try {
    const codes = await db.query.inviteCodes.findMany({
      orderBy: [desc(inviteCodes.createdAt)],
    });
    
    const codesWithDetails = await Promise.all(
      codes.map(async (code) => {
        const createdByUser = code.createdBy 
          ? await db.query.users.findFirst({
              where: eq(users.id, code.createdBy),
              columns: { id: true, username: true, displayName: true },
            })
          : null;
        
        const usedByUser = code.usedBy
          ? await db.query.users.findFirst({
              where: eq(users.id, code.usedBy),
              columns: { id: true, username: true, displayName: true },
            })
          : null;
        
        const isExpired = code.expiresAt ? new Date(code.expiresAt) < new Date() : false;
        
        return {
          ...code,
          createdByUser,
          usedByUser,
          status: code.usedBy ? 'used' : isExpired ? 'expired' : 'active',
        };
      })
    );
    
    res.json({ inviteCodes: codesWithDetails });
  } catch (error) {
    console.error('Invite codes error:', error);
    res.status(500).json({ error: 'Failed to fetch invite codes' });
  }
});

// POST /api/admin/invite-codes - Generate new invite code
router.post('/invite-codes', async (req: Request, res: Response) => {
  try {
    const { expiresInDays = 7 } = req.body;
    
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    await db.insert(inviteCodes).values({
      code,
      createdBy: req.user!.userId,
      expiresAt,
    });
    
    res.json({ 
      code, 
      expiresAt: expiresAt.toISOString(),
      message: `Invite code ${code} created` 
    });
  } catch (error) {
    console.error('Create invite code error:', error);
    res.status(500).json({ error: 'Failed to create invite code' });
  }
});

// DELETE /api/admin/invite-codes/:code - Delete invite code
router.delete('/invite-codes/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const existing = await db.query.inviteCodes.findFirst({
      where: eq(inviteCodes.code, code.toUpperCase()),
    });
    
    if (!existing) {
      res.status(404).json({ error: 'Invite code not found' });
      return;
    }
    
    if (existing.usedBy) {
      res.status(400).json({ error: 'Cannot delete a used invite code' });
      return;
    }
    
    await db.delete(inviteCodes).where(eq(inviteCodes.code, code.toUpperCase()));
    
    res.json({ success: true, message: `Invite code ${code} deleted` });
  } catch (error) {
    console.error('Delete invite code error:', error);
    res.status(500).json({ error: 'Failed to delete invite code' });
  }
});

// ============================================
// TESTING ENDPOINTS
// ============================================

// POST /api/admin/test-notification - Send test notification to self
router.post('/test-notification', async (req: Request, res: Response) => {
  try {
    const { type = 'daily' } = req.body;
    
    // Get admin's push subscription
    const subscription = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.userId, req.user!.userId),
    });
    
    if (!subscription) {
      res.status(400).json({ error: 'No push subscription found. Enable notifications first.' });
      return;
    }
    
    const payload = type === 'friend_post' 
      ? {
          type: 'friend_post',
          title: '(★‿★) Test Friend just posted!',
          body: 'This is a test notification',
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'test-notification',
          data: { url: '/' },
        }
      : {
          type: 'daily',
          title: '(◕‿◕) Test daily reminder!',
          body: 'This is a test notification',
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'test-notification',
          data: { url: '/' },
        };
    
    // Import webpush dynamically
    const webpush = await import('web-push');
    
    await webpush.default.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    
    res.json({ success: true, message: `Test ${type} notification sent` });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// POST /api/admin/test-daily-reminder - Trigger daily reminder for all users
router.post('/test-daily-reminder', async (_req: Request, res: Response) => {
  try {
    const sent = await notificationService.sendDailyReminders();
    res.json({ success: true, message: `Daily reminders sent to ${sent} users` });
  } catch (error) {
    console.error('Test daily reminder error:', error);
    res.status(500).json({ error: 'Failed to send daily reminders' });
  }
});

// POST /api/admin/test-post - Create a test post
router.post('/test-post', async (req: Request, res: Response) => {
  try {
    const { text, location, linkUrl, linkTitle } = req.body;
    
    const postId = generateId();
    
    await db.insert(posts).values({
      id: postId,
      userId: req.user!.userId,
      text: text || '[Test Post] Created from admin panel',
      location: location || null,
      linkUrl: linkUrl || null,
      linkTitle: linkTitle || null,
    });
    
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });
    
    res.json({ success: true, post, message: 'Test post created' });
  } catch (error) {
    console.error('Test post error:', error);
    res.status(500).json({ error: 'Failed to create test post' });
  }
});

// GET /api/admin/system - System info
router.get('/system', async (_req: Request, res: Response) => {
  try {
    const scheduledTime = await notificationService.getTodayNotificationTime();
    
    res.json({
      vapidConfigured: !!(config.vapidPublicKey && config.vapidPrivateKey),
      scheduledNotificationTime: scheduledTime?.toISOString() || null,
      nodeVersion: process.version,
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({ error: 'Failed to fetch system info' });
  }
});

export default router;





