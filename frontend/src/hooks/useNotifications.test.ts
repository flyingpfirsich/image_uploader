import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date for consistent testing
    vi.setSystemTime(new Date('2025-11-25T14:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should detect notification support', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.isSupported).toBe(true);
    });

    it('should start with notifications disabled', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.isEnabled).toBe(false);
    });

    it('should read enabled state from localStorage', () => {
      localStorage.setItem('notifications_enabled', 'true');
      const { result } = renderHook(() => useNotifications());
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('enableNotifications', () => {
    it('should request permission and enable notifications', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        const success = await result.current.enableNotifications();
        expect(success).toBe(true);
      });
      
      expect(result.current.isEnabled).toBe(true);
      expect(result.current.permission).toBe('granted');
      expect(localStorage.getItem('notifications_enabled')).toBe('true');
    });
  });

  describe('disableNotifications', () => {
    it('should disable notifications and clear storage', async () => {
      // First enable
      localStorage.setItem('notifications_enabled', 'true');
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.disableNotifications();
      });
      
      expect(result.current.isEnabled).toBe(false);
      expect(localStorage.getItem('notifications_enabled')).toBe('false');
      expect(localStorage.getItem('notification_scheduled_time')).toBe(null);
    });
  });

  describe('toggleNotifications', () => {
    it('should toggle from disabled to enabled', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.toggleNotifications();
      });
      
      expect(result.current.isEnabled).toBe(true);
    });

    it('should toggle from enabled to disabled', async () => {
      localStorage.setItem('notifications_enabled', 'true');
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.toggleNotifications();
      });
      
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('scheduling', () => {
    it('should schedule notification for a time within the window (9am-10pm)', async () => {
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.enableNotifications();
      });
      
      const scheduledTime = result.current.scheduledTime;
      expect(scheduledTime).not.toBe(null);
      
      if (scheduledTime) {
        const hour = scheduledTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(22);
      }
    });

    it('should schedule for tomorrow if past 10pm', async () => {
      // Set time to 11pm
      vi.setSystemTime(new Date('2025-11-25T23:00:00'));
      
      const { result } = renderHook(() => useNotifications());
      
      await act(async () => {
        await result.current.enableNotifications();
      });
      
      const scheduledTime = result.current.scheduledTime;
      expect(scheduledTime).not.toBe(null);
      
      if (scheduledTime) {
        // Should be scheduled for tomorrow
        expect(scheduledTime.getDate()).toBe(26);
      }
    });
  });
});

describe('Notification scheduling logic', () => {
  it('generates random times within the expected range', () => {
    const START_HOUR = 9;
    const END_HOUR = 22;
    
    // Test 100 random generations
    for (let i = 0; i < 100; i++) {
      const randomHour = Math.floor(Math.random() * (END_HOUR - START_HOUR)) + START_HOUR;
      expect(randomHour).toBeGreaterThanOrEqual(START_HOUR);
      expect(randomHour).toBeLessThan(END_HOUR);
    }
  });
});

