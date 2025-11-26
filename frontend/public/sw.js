// Service Worker for push notifications
const CACHE_NAME = 'druzi-v1';

// Handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    type: 'unknown',
    title: '(◕‿◕) druzi',
    body: 'You have a notification!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'default',
    data: { url: '/' },
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'default',
    requireInteraction: data.type === 'daily',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    actions: data.type === 'daily' ? [
      { action: 'open', title: 'Open druzi' },
      { action: 'dismiss', title: 'Later' }
    ] : [
      { action: 'open', title: 'View' }
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Get URL from notification data
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Listen for messages from the main app (for testing)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    console.log('[SW] Test notification requested');
    self.registration.showNotification('(◕‿◕) Test Notification!', {
      body: 'If you see this, notifications are working!',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'test',
    });
  }
});
