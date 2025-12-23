'use client'

import { useEffect } from 'react'
// import { registerServiceWorker } from '@/lib/serviceWorker'
// import { initDB } from '@/lib/indexedDB'

export default function ServiceWorkerInit() {
  useEffect(() => {
    console.log('[DEV MODE] Offline features disabled for development')
    // Service Worker and IndexedDB disabled - enable in production
    // registerServiceWorker()
    // initDB().then(() => {
    //   console.log('[IndexedDB] Database initialized')
    // }).catch((error) => {
    //   console.error('[IndexedDB] Initialization failed:', error)
    // })
  }, [])

  return null
}
