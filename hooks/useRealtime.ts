// Hook for using Supabase Realtime

'use client'

import { useEffect } from 'react'
import { realtimeManager } from '@/lib/realtimeManager'

export const useRealtimeProducts = (callback: (payload: any) => void) => {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToProducts(callback)
    return unsubscribe
  }, [callback])
}

export const useRealtimeCategories = (callback: (payload: any) => void) => {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToCategories(callback)
    return unsubscribe
  }, [callback])
}

export const useRealtimeTransactions = (callback: (payload: any) => void) => {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToTransactions(callback)
    return unsubscribe
  }, [callback])
}

export const useRealtimeStockMovements = (callback: (payload: any) => void) => {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToStockMovements(callback)
    return unsubscribe
  }, [callback])
}

export const useRealtimeLowStock = (callback: (payload: any) => void) => {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToLowStock(callback)
    return unsubscribe
  }, [callback])
}
