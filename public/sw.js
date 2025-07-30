// Enhanced Service Worker for CLSI Platform Mobile
const CACHE_NAME = 'clsi-mobile-v2.0';
const STATIC_CACHE = 'clsi-static-v2.0';
const DYNAMIC_CACHE = 'clsi-dynamic-v2.0';

// Static resources to cache
const STATIC_ASSETS = [
  // Mobile Pages
  '/mobile/',
  '/mobile/dashboard.html',
  '/mobile/samples.html',
  '/mobile/lab-results.html',
  '/mobile/users.html',
  '/mobile/reports.html',
  '/mobile/login.html',
  
  // Mobile CSS
  '/css/mobile-base.css',
  '/css/dashboard-mobile.css',
  '/css/samples-mobile.css',
  '/css/lab-results-mobile.css',
  '/css/users-mobile.css',
  '/css/reports-mobile.css',
  '/css/login-mobile.css',
  
  // Mobile JavaScript
  '/js/mobile-base.js',
  '/js/mobile-navigation.js',
  '/js/dashboard-mobile.js',
  '/js/samples-mobile.js',
  '/js/lab-results-mobile.js',
  '/js/users-mobile.js',
  '/js/reports-mobile.js',
  '/js/login-mobile.js',
  
  // PWA Assets
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  
  // Fallback pages
  '/offline.html'
];

// API endpoints to cache dynamically
const API_CACHE_PATTERNS = [
  /\/api\/samples/,
  /\/api\/lab-results/,
  /\/api\/users/,
  /\/api\/reports/,
  /\/api\/auth/
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - serve cached content with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Handle static assets - cache first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle API requests - network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'sw-cache');
      return response;
    }
    
    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline',
      offline: true
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'sw-offline'
      }
    });
  }
}

// Handle navigation requests - network first with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving cached page:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve appropriate offline page based on URL
    const url = new URL(request.url);
    if (url.pathname.startsWith('/mobile/')) {
      return caches.match('/mobile/dashboard.html') || caches.match('/offline.html');
    }
    
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Not available offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-samples') {
    event.waitUntil(syncSamples());
  } else if (event.tag === 'sync-results') {
    event.waitUntil(syncLabResults());
  }
});

// Sync samples when back online
async function syncSamples() {
  try {
    const pendingActions = await getStoredActions('samples');
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from storage
        await removeStoredAction('samples', action.id);
      } catch (error) {
        console.log('[SW] Failed to sync sample action:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Sample sync failed:', error);
  }
}

// Sync lab results when back online
async function syncLabResults() {
  try {
    const pendingActions = await getStoredActions('lab-results');
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        await removeStoredAction('lab-results', action.id);
      } catch (error) {
        console.log('[SW] Failed to sync lab result action:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Lab results sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getStoredActions(type) {
  // This would integrate with IndexedDB to store offline actions
  // For now, return empty array
  return [];
}

async function removeStoredAction(type, id) {
  // This would remove the action from IndexedDB
  console.log(`[SW] Removing stored action: ${type}/${id}`);
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from CLSI Platform',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CLSI Platform', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/mobile/dashboard.html')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  }
});

// Update cached data periodically
async function updateCachedData() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Update frequently accessed data
    const urlsToUpdate = [
      '/api/samples?recent=true',
      '/api/lab-results?pending=true',
      '/api/notifications'
    ];
    
    for (const url of urlsToUpdate) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.log(`[SW] Failed to update ${url}:`, error);
      }
    }
  } catch (error) {
    console.log('[SW] Periodic data update failed:', error);
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker script loaded');