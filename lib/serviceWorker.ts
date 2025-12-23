// Service Worker registration and management

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // In development, disable service worker to avoid caching issues
      if (process.env.NODE_ENV === 'development') {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
        console.log('[SW] Service Worker DISABLED in development mode (no caching)')
        return null
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('[SW] Service Worker registered:', registration.scope)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New service worker available')
              
              // Show update notification
              if (confirm('A new version is available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
    }
  }
}

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      console.log('[SW] Service Worker unregistered')
    }
  }
}

// Request background sync
export const requestBackgroundSync = async (tag: string) => {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(tag)
      console.log(`[SW] Background sync registered: ${tag}`)
    } catch (error) {
      console.error('[SW] Background sync failed:', error)
    }
  }
}
