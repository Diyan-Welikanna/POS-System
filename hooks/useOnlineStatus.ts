// Utility hook for checking online/offline status

'use client'

import { useState, useEffect } from 'react'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      console.log('[Network] Back online')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('[Network] Gone offline')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
