import { useState, useEffect, useCallback } from 'react';

const NOTIFICATION_ENABLED_KEY = 'notifications_enabled';
const SCHEDULED_TIME_KEY = 'notification_scheduled_time';

// Notification window: 9am - 10pm (9:00 - 22:00)
const START_HOUR = 9;
const END_HOUR = 22;

interface NotificationState {
  isEnabled: boolean;
  permission: NotificationPermission | 'unsupported';
  scheduledTime: Date | null;
  isSupported: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    isEnabled: localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true',
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    scheduledTime: null,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  });

  // Generate a random time between START_HOUR and END_HOUR for today or tomorrow
  const generateRandomTime = useCallback((forTomorrow = false): Date => {
    const now = new Date();
    const targetDate = new Date(now);
    
    if (forTomorrow) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    // Random hour between START_HOUR and END_HOUR
    const randomHour = Math.floor(Math.random() * (END_HOUR - START_HOUR)) + START_HOUR;
    // Random minute
    const randomMinute = Math.floor(Math.random() * 60);
    // Random second
    const randomSecond = Math.floor(Math.random() * 60);
    
    targetDate.setHours(randomHour, randomMinute, randomSecond, 0);
    
    return targetDate;
  }, []);

  // Get or create today's scheduled time
  const getScheduledTime = useCallback((): Date => {
    const stored = localStorage.getItem(SCHEDULED_TIME_KEY);
    
    if (stored) {
      const storedDate = new Date(stored);
      const now = new Date();
      
      // If stored time is in the past and it's a different day, generate new time
      if (storedDate < now) {
        // Check if we're in the notification window today
        const currentHour = now.getHours();
        if (currentHour < END_HOUR) {
          // Still time today, generate time for later today if possible
          if (currentHour < START_HOUR) {
            // Before window starts, generate for today
            const newTime = generateRandomTime(false);
            localStorage.setItem(SCHEDULED_TIME_KEY, newTime.toISOString());
            return newTime;
          } else {
            // In window but past stored time, generate for later today
            const newTime = new Date();
            const remainingHours = END_HOUR - currentHour;
            const randomHour = currentHour + Math.floor(Math.random() * remainingHours) + 1;
            newTime.setHours(
              Math.min(randomHour, END_HOUR - 1),
              Math.floor(Math.random() * 60),
              Math.floor(Math.random() * 60),
              0
            );
            
            // If generated time is still past, schedule for tomorrow
            if (newTime <= now) {
              const tomorrowTime = generateRandomTime(true);
              localStorage.setItem(SCHEDULED_TIME_KEY, tomorrowTime.toISOString());
              return tomorrowTime;
            }
            
            localStorage.setItem(SCHEDULED_TIME_KEY, newTime.toISOString());
            return newTime;
          }
        } else {
          // Past today's window, schedule for tomorrow
          const newTime = generateRandomTime(true);
          localStorage.setItem(SCHEDULED_TIME_KEY, newTime.toISOString());
          return newTime;
        }
      }
      
      return storedDate;
    }
    
    // No stored time, generate new one
    const now = new Date();
    const currentHour = now.getHours();
    
    let newTime: Date;
    if (currentHour >= END_HOUR) {
      // Past today's window, schedule for tomorrow
      newTime = generateRandomTime(true);
    } else if (currentHour < START_HOUR) {
      // Before today's window, schedule for today
      newTime = generateRandomTime(false);
    } else {
      // In today's window, schedule for later today or tomorrow
      const tempTime = new Date();
      const remainingHours = END_HOUR - currentHour - 1;
      
      if (remainingHours > 0) {
        const randomHour = currentHour + 1 + Math.floor(Math.random() * remainingHours);
        tempTime.setHours(randomHour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
        newTime = tempTime;
      } else {
        newTime = generateRandomTime(true);
      }
    }
    
    localStorage.setItem(SCHEDULED_TIME_KEY, newTime.toISOString());
    return newTime;
  }, [generateRandomTime]);

  // Schedule notification with service worker
  const scheduleNotification = useCallback(async () => {
    if (!state.isSupported) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const scheduledTime = getScheduledTime();
      
      // Send message to service worker
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        scheduledTime: scheduledTime.getTime(),
      });
      
      setState(prev => ({ ...prev, scheduledTime }));
      console.log('[Notifications] Scheduled for:', scheduledTime.toLocaleString());
    } catch (error) {
      console.error('[Notifications] Failed to schedule:', error);
    }
  }, [state.isSupported, getScheduledTime]);

  // Cancel scheduled notification
  const cancelNotification = useCallback(async () => {
    if (!state.isSupported) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'CANCEL_NOTIFICATION' });
      setState(prev => ({ ...prev, scheduledTime: null }));
      console.log('[Notifications] Cancelled');
    } catch (error) {
      console.error('[Notifications] Failed to cancel:', error);
    }
  }, [state.isSupported]);

  // Request permission and enable notifications
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
        setState(prev => ({ ...prev, isEnabled: true }));
        await scheduleNotification();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }, [state.isSupported, scheduleNotification]);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    localStorage.removeItem(SCHEDULED_TIME_KEY);
    setState(prev => ({ ...prev, isEnabled: false, scheduledTime: null }));
    await cancelNotification();
  }, [cancelNotification]);

  // Toggle notifications
  const toggleNotifications = useCallback(async (): Promise<boolean> => {
    if (state.isEnabled) {
      await disableNotifications();
      return false;
    } else {
      return await enableNotifications();
    }
  }, [state.isEnabled, enableNotifications, disableNotifications]);

  // Schedule next day's notification
  const scheduleNextDay = useCallback(async () => {
    const newTime = generateRandomTime(true);
    localStorage.setItem(SCHEDULED_TIME_KEY, newTime.toISOString());
    await scheduleNotification();
  }, [generateRandomTime, scheduleNotification]);

  // Test notification immediately (dev only)
  const testNotification = useCallback(async () => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.warn('[Notifications] Cannot test: permission not granted');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'TEST_NOTIFICATION' });
      console.log('[Notifications] Test notification triggered');
    } catch (error) {
      console.error('[Notifications] Test failed:', error);
    }
  }, [state.isSupported, state.permission]);

  // Listen for messages from service worker
  useEffect(() => {
    if (!state.isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_SHOWN') {
        // Schedule next day's notification
        scheduleNextDay();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [state.isSupported, scheduleNextDay]);

  // Initialize scheduled time on mount
  useEffect(() => {
    if (state.isEnabled && state.permission === 'granted') {
      const scheduled = getScheduledTime();
      setState(prev => ({ ...prev, scheduledTime: scheduled }));
      scheduleNotification();
    }
  }, []); // Only on mount

  return {
    isEnabled: state.isEnabled,
    isSupported: state.isSupported,
    permission: state.permission,
    scheduledTime: state.scheduledTime,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
    scheduleNextDay,
    testNotification,
  };
}

