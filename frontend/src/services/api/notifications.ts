/**
 * Notifications API functions
 */
import { apiGet, apiPost, apiPatch, apiDelete, authHeaders, jsonHeaders, API_URL } from './client';
import type { NotificationPreferences } from './types';

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/api/notifications/vapid-public-key`);

  if (!res.ok) {
    throw new Error('Failed to get VAPID key');
  }

  const data = await res.json();
  return data.key;
}

export async function subscribeToNotifications(
  token: string,
  subscription: PushSubscription
): Promise<void> {
  await apiPost('/api/notifications/subscribe', {
    headers: jsonHeaders(token),
    body: { subscription: subscription.toJSON() },
    errorMessage: 'Failed to subscribe',
  });
}

export async function unsubscribeFromNotifications(token: string): Promise<void> {
  return apiDelete('/api/notifications/subscribe', {
    headers: authHeaders(token),
    errorMessage: 'Failed to unsubscribe',
  });
}

export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>('/api/notifications/preferences', {
    headers: authHeaders(token),
    errorMessage: 'Failed to get preferences',
  });
}

export async function updateNotificationPreferences(
  token: string,
  updates: { dailyReminder?: boolean; friendPosts?: boolean }
): Promise<NotificationPreferences> {
  return apiPatch<NotificationPreferences>('/api/notifications/preferences', {
    headers: jsonHeaders(token),
    body: updates,
    errorMessage: 'Failed to update preferences',
  });
}

export async function getScheduledNotificationTime(token: string): Promise<Date | null> {
  const data = await apiGet<{ scheduledTime: string | null }>('/api/notifications/scheduled-time', {
    headers: authHeaders(token),
    errorMessage: 'Failed to get scheduled time',
  });
  return data.scheduledTime ? new Date(data.scheduledTime) : null;
}

// Re-export type
export type { NotificationPreferences };
