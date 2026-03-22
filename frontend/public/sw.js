// Service Worker for push notifications and media caching
const CACHE_NAME = 'druzi-v1';
const MEDIA_CACHE_NAME = 'druzi-media-v1';
const MAX_MEDIA_CACHE_ITEMS = 500;

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
    actions:
      data.type === 'daily'
        ? [
            { action: 'open', title: 'Open druzi' },
            { action: 'dismiss', title: 'Later' },
          ]
        : [{ action: 'open', title: 'View' }],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
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
      // Clean up old caches (but keep current media cache)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== MEDIA_CACHE_NAME)
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

  // Allow clearing the media cache from the app
  if (event.data && event.data.type === 'CLEAR_MEDIA_CACHE') {
    console.log('[SW] Clearing media cache');
    caches.delete(MEDIA_CACHE_NAME).then(() => {
      console.log('[SW] Media cache cleared');
    });
  }

  // Invalidate a specific cached item (e.g., when avatar is updated)
  if (event.data && event.data.type === 'INVALIDATE_CACHE') {
    const pathToInvalidate = event.data.path;
    console.log('[SW] Invalidating cache for:', pathToInvalidate);
    caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
      await cache.delete(pathToInvalidate);
      console.log('[SW] Cache invalidated:', pathToInvalidate);
    });
  }
});

// Fetch event - cache media and avatar requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache requests to /uploads/media/ and /uploads/avatars/
  if (
    !url.pathname.startsWith('/uploads/media/') &&
    !url.pathname.startsWith('/uploads/avatars/')
  ) {
    return;
  }

  // Use URL pathname as cache key (ignores auth headers)
  const cacheKey = url.pathname;

  event.respondWith(
    caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
      // Check if we have a cached response (by URL only, ignoring headers)
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        console.log('[SW] Cache hit:', cacheKey);
        // Update access time for LRU tracking
        updateAccessTime(cacheKey);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      console.log('[SW] Cache miss, fetching:', cacheKey);
      try {
        const networkResponse = await fetch(event.request);

        // Only cache successful responses
        if (networkResponse.ok) {
          // Clone the response since we need to use it twice
          const responseToCache = networkResponse.clone();

          // Cache with URL as key (so different auth tokens share the cache)
          cache.put(cacheKey, responseToCache).then(() => {
            updateAccessTime(cacheKey);
            // Trim cache if it gets too large (LRU)
            trimCacheLRU(MEDIA_CACHE_NAME, MAX_MEDIA_CACHE_ITEMS);
          });
        }

        return networkResponse;
      } catch (error) {
        console.error('[SW] Fetch failed:', error);
        throw error;
      }
    })
  );
});

// LRU tracking using IndexedDB
const LRU_DB_NAME = 'druzi-cache-lru';
const LRU_STORE_NAME = 'access-times';

function openLRUDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LRU_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(LRU_STORE_NAME)) {
        db.createObjectStore(LRU_STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

async function updateAccessTime(cacheKey) {
  try {
    const db = await openLRUDb();
    const tx = db.transaction(LRU_STORE_NAME, 'readwrite');
    const store = tx.objectStore(LRU_STORE_NAME);
    store.put({ key: cacheKey, accessTime: Date.now() });
    db.close();
  } catch (e) {
    console.error('[SW] Failed to update access time:', e);
  }
}

async function trimCacheLRU(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length <= maxItems) return;

    console.log(`[SW] Trimming cache from ${keys.length} to ${maxItems} items (LRU)`);

    // Get all access times from IndexedDB
    const db = await openLRUDb();
    const tx = db.transaction(LRU_STORE_NAME, 'readonly');
    const store = tx.objectStore(LRU_STORE_NAME);

    const accessTimes = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();

    // Create a map of cache key -> access time
    const accessTimeMap = new Map(accessTimes.map((item) => [item.key, item.accessTime]));

    // Get cache keys as strings
    const cacheKeys = keys.map((req) => new URL(req.url).pathname);

    // Sort by access time (oldest first), items without access time are oldest
    cacheKeys.sort((a, b) => {
      const timeA = accessTimeMap.get(a) || 0;
      const timeB = accessTimeMap.get(b) || 0;
      return timeA - timeB;
    });

    // Delete oldest entries
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(cacheKeys[i]);
      // Also clean up LRU tracking
      const cleanDb = await openLRUDb();
      const cleanTx = cleanDb.transaction(LRU_STORE_NAME, 'readwrite');
      cleanTx.objectStore(LRU_STORE_NAME).delete(cacheKeys[i]);
      cleanDb.close();
    }
  } catch (e) {
    console.error('[SW] Failed to trim cache:', e);
  }
}
