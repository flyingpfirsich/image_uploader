// Service Worker for daily notification scheduling
const CACHE_NAME = 'uploader-v1';

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(event.data.scheduledTime);
  }
  if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
    cancelScheduledNotification();
  }
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    console.log('[SW] Test notification requested');
    showNotification();
  }
});

let notificationTimeout = null;

function scheduleNotification(scheduledTime) {
  // Clear any existing timeout
  cancelScheduledNotification();
  
  const now = Date.now();
  const delay = scheduledTime - now;
  
  if (delay > 0) {
    console.log(`[SW] Notification scheduled for ${new Date(scheduledTime).toLocaleTimeString()}`);
    
    notificationTimeout = setTimeout(() => {
      showNotification();
    }, delay);
  }
}

function cancelScheduledNotification() {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
    console.log('[SW] Notification cancelled');
  }
}

async function showNotification() {
  const kaomojis = ['(｡◕‿◕｡)', '(✿◠‿◠)', '(◕ᴗ◕✿)', '٩(◕‿◕｡)۶', '(づ｡◕‿‿◕｡)づ', '(っ◔◡◔)っ'];
  const randomKaomoji = kaomojis[Math.floor(Math.random() * kaomojis.length)];
  
  const titles = [
    'Що робиш? / Was machst du?',
    'Час для фото! / Zeit für ein Foto!',
    'Покажи момент! / Zeig den Moment!',
    'ЗАВАНТАЖИТИ зараз! / Jetzt HOCHLADEN!',
    'Лови момент! / Fang den Moment!'
  ];
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  
  const bodies = [
    'Сфотографуй що ти зараз робиш! / Fotografiere was du gerade machst!',
    'Час поділитися моментом! / Zeit den Moment zu teilen!',
    'Відкрий камеру! / Öffne die Kamera!',
    'Покажи свій день! / Zeig deinen Tag!'
  ];
  const randomBody = bodies[Math.floor(Math.random() * bodies.length)];

  try {
    await self.registration.showNotification(`${randomKaomoji} ${randomTitle}`, {
      body: randomBody,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'daily-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'ВІДКРИТИ / ÖFFNEN' },
        { action: 'dismiss', title: 'ПІЗНІШЕ / SPÄTER' }
      ],
      data: {
        dateOfArrival: Date.now(),
        url: self.registration.scope
      }
    });
    
    console.log('[SW] Notification shown!');
    
    // Tell the main app to schedule the next day's notification
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'NOTIFICATION_SHOWN' });
    });
  } catch (error) {
    console.error('[SW] Failed to show notification:', error);
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

