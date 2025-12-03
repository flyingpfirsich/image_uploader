import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

interface NotificationState {
  isEnabled: boolean;
  permission: NotificationPermission | 'unsupported';
  isSupported: boolean;
  dailyReminder: boolean;
  friendPosts: boolean;
  scheduledTime: Date | null;
  isLoading: boolean;
}

interface UseNotificationsOptions {
  token: string | null;
}

// Convert VAPID key to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function useNotifications({ token }: UseNotificationsOptions) {
  const [state, setState] = useState<NotificationState>({
    isEnabled: false,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    isSupported:
      'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window,
    dailyReminder: true,
    friendPosts: true,
    scheduledTime: null,
    isLoading: true,
  });

  // Load preferences from backend
  useEffect(() => {
    if (!token || !state.isSupported) {
      // Use setTimeout to avoid synchronous setState in effect body
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, isLoading: false }));
      }, 0);
      return () => clearTimeout(timer);
    }

    const loadPreferences = async () => {
      try {
        const [prefs, scheduledTime] = await Promise.all([
          api.getNotificationPreferences(token),
          api.getScheduledNotificationTime(token),
        ]);

        // Check if user has an active subscription
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState((prev) => ({
          ...prev,
          isEnabled: !!subscription,
          dailyReminder: prefs.dailyReminder,
          friendPosts: prefs.friendPosts,
          scheduledTime,
          isLoading: false,
        }));
      } catch (error) {
        console.error('[Notifications] Failed to load preferences:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadPreferences();
  }, [token, state.isSupported]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!token || !state.isSupported) return false;

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== 'granted') {
        return false;
      }

      // Get VAPID key
      const vapidKey = await api.getVapidPublicKey();
      if (!vapidKey) {
        console.error('[Notifications] No VAPID key configured');
        return false;
      }

      // Subscribe with service worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to backend
      await api.subscribeToNotifications(token, subscription);

      // Load scheduled time
      const scheduledTime = await api.getScheduledNotificationTime(token);

      setState((prev) => ({
        ...prev,
        isEnabled: true,
        scheduledTime,
      }));

      console.log('[Notifications] Subscribed to push');
      return true;
    } catch (error) {
      console.error('[Notifications] Subscribe failed:', error);
      return false;
    }
  }, [token, state.isSupported]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<void> => {
    if (!token || !state.isSupported) return;

    try {
      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Unsubscribe from backend
      await api.unsubscribeFromNotifications(token);

      setState((prev) => ({
        ...prev,
        isEnabled: false,
        scheduledTime: null,
      }));

      console.log('[Notifications] Unsubscribed from push');
    } catch (error) {
      console.error('[Notifications] Unsubscribe failed:', error);
    }
  }, [token, state.isSupported]);

  // Toggle notifications on/off
  const toggleNotifications = useCallback(async (): Promise<boolean> => {
    if (state.isEnabled) {
      await unsubscribeFromPush();
      return false;
    } else {
      return await subscribeToPush();
    }
  }, [state.isEnabled, subscribeToPush, unsubscribeFromPush]);

  // Update daily reminder preference
  const setDailyReminder = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!token) return;

      try {
        const prefs = await api.updateNotificationPreferences(token, { dailyReminder: enabled });
        setState((prev) => ({ ...prev, dailyReminder: prefs.dailyReminder }));
      } catch (error) {
        console.error('[Notifications] Failed to update daily reminder:', error);
      }
    },
    [token]
  );

  // Update friend posts preference
  const setFriendPosts = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!token) return;

      try {
        const prefs = await api.updateNotificationPreferences(token, { friendPosts: enabled });
        setState((prev) => ({ ...prev, friendPosts: prefs.friendPosts }));
      } catch (error) {
        console.error('[Notifications] Failed to update friend posts:', error);
      }
    },
    [token]
  );

  // Test notification (dev only)
  const testNotification = useCallback(async () => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.warn('[Notifications] Cannot test: permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('(◕‿◕) Test Notification!', {
      body: 'If you see this, notifications are working!',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'test',
    });
  }, [state.isSupported, state.permission]);

  return {
    isEnabled: state.isEnabled,
    isSupported: state.isSupported,
    isLoading: state.isLoading,
    permission: state.permission,
    dailyReminder: state.dailyReminder,
    friendPosts: state.friendPosts,
    scheduledTime: state.scheduledTime,
    toggleNotifications,
    setDailyReminder,
    setFriendPosts,
    testNotification,
  };
}
