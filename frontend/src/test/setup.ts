import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Notification API
class MockNotification {
  static permission: NotificationPermission = 'default';

  static requestPermission(): Promise<NotificationPermission> {
    MockNotification.permission = 'granted';
    return Promise.resolve('granted');
  }

  title: string;
  options?: NotificationOptions;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }
}

Object.defineProperty(window, 'Notification', {
  value: MockNotification,
  writable: true,
});

// Mock PushManager
class MockPushManager {
  async getSubscription() {
    return null;
  }

  async subscribe() {
    return {
      endpoint: 'https://push.example.com/test',
      toJSON: () => ({
        endpoint: 'https://push.example.com/test',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      }),
      unsubscribe: async () => true,
    };
  }
}

Object.defineProperty(window, 'PushManager', {
  value: MockPushManager,
  writable: true,
});

// Mock ServiceWorker
const mockServiceWorker = {
  register: () =>
    Promise.resolve({
      scope: '/',
      active: {
        postMessage: () => {},
      },
      pushManager: new MockPushManager(),
    }),
  ready: Promise.resolve({
    active: {
      postMessage: () => {},
    },
    showNotification: () => Promise.resolve(),
    pushManager: new MockPushManager(),
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
});

// Reset mocks between tests
beforeEach(() => {
  localStorageMock.clear();
  MockNotification.permission = 'default';
});
