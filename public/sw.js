// Service Worker for POS System
const CACHE_NAME = 'pos-system-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/pos',
  '/inventory',
  '/reports',
  '/offline.html',
  '/manifest.json',
]

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets')
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip Supabase API calls (handle offline in app logic)
  if (event.request.url.includes('supabase.co')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      }).catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL)
        }
      })
    })
  )
})

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions())
  }
})

async function syncOfflineTransactions() {
  console.log('[SW] Syncing offline transactions...')
  
  // This will be triggered from the app
  // The actual sync logic is in the offlineQueue
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_TRANSACTIONS',
    })
  })
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
