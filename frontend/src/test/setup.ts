import '@testing-library/jest-dom';

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
  
  constructor(public title: string, public options?: NotificationOptions) {}
}

Object.defineProperty(window, 'Notification', {
  value: MockNotification,
  writable: true,
});

// Mock ServiceWorker
const mockServiceWorker = {
  register: () => Promise.resolve({
    scope: '/',
    active: {
      postMessage: () => {},
    },
  }),
  ready: Promise.resolve({
    active: {
      postMessage: () => {},
    },
    showNotification: () => Promise.resolve(),
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

