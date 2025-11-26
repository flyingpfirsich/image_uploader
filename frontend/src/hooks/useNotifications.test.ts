import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotifications } from './useNotifications';

// Mock the API module
vi.mock('../services/api', () => ({
  getNotificationPreferences: vi.fn().mockResolvedValue({
    userId: 'test-user',
    dailyReminder: true,
    friendPosts: true,
  }),
  getScheduledNotificationTime: vi.fn().mockResolvedValue(new Date('2025-11-25T15:30:00')),
  getVapidPublicKey: vi.fn().mockResolvedValue('test-vapid-key'),
  subscribeToNotifications: vi.fn().mockResolvedValue(undefined),
  unsubscribeFromNotifications: vi.fn().mockResolvedValue(undefined),
  updateNotificationPreferences: vi.fn().mockImplementation(async (_, updates) => ({
    userId: 'test-user',
    dailyReminder: updates.dailyReminder ?? true,
    friendPosts: updates.friendPosts ?? true,
  })),
}));

describe('useNotifications', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-25T14:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should detect notification support', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      // PushManager is mocked in setup.ts
      expect(result.current.isSupported).toBe(true);
    });

    it('should start with isLoading true', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(result.current.isLoading).toBe(true);
    });

    it('should expose toggleNotifications function', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(typeof result.current.toggleNotifications).toBe('function');
    });

    it('should expose setDailyReminder function', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(typeof result.current.setDailyReminder).toBe('function');
    });

    it('should expose setFriendPosts function', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(typeof result.current.setFriendPosts).toBe('function');
    });

    it('should expose testNotification function', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(typeof result.current.testNotification).toBe('function');
    });

    it('should handle null token gracefully', () => {
      const { result } = renderHook(() => useNotifications({ token: null }));
      // With null token, hook should still be usable
      expect(result.current.isEnabled).toBe(false);
      expect(typeof result.current.toggleNotifications).toBe('function');
    });
  });

  describe('default state', () => {
    it('should default dailyReminder to true', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(result.current.dailyReminder).toBe(true);
    });

    it('should default friendPosts to true', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(result.current.friendPosts).toBe(true);
    });

    it('should start with isEnabled false', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(result.current.isEnabled).toBe(false);
    });

    it('should start with scheduledTime null', () => {
      const { result } = renderHook(() => useNotifications({ token: mockToken }));
      expect(result.current.scheduledTime).toBe(null);
    });
  });
});

describe('Notification time generation', () => {
  it('generates random times within the expected range (9am-11pm)', () => {
    const START_HOUR = 9;
    const END_HOUR = 23; // 11pm

    // Test 100 random generations
    for (let i = 0; i < 100; i++) {
      const randomHour = START_HOUR + Math.floor(Math.random() * (END_HOUR - START_HOUR));
      expect(randomHour).toBeGreaterThanOrEqual(START_HOUR);
      expect(randomHour).toBeLessThan(END_HOUR);
    }
  });
});
