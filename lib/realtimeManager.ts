// Supabase Realtime subscription manager

import { supabase } from './supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeCallback = (payload: any) => void

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()

  // Subscribe to product changes
  subscribeToProducts(callback: RealtimeCallback): () => void {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('[Realtime] Product change:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set('products', channel)

    return () => this.unsubscribe('products')
  }

  // Subscribe to category changes
  subscribeToCategories(callback: RealtimeCallback): () => void {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        (payload) => {
          console.log('[Realtime] Category change:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set('categories', channel)

    return () => this.unsubscribe('categories')
  }

  // Subscribe to transaction changes
  subscribeToTransactions(callback: RealtimeCallback): () => void {
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('[Realtime] New transaction:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set('transactions', channel)

    return () => this.unsubscribe('transactions')
  }

  // Subscribe to stock movements
  subscribeToStockMovements(callback: RealtimeCallback): () => void {
    const channel = supabase
      .channel('stock-movements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements',
        },
        (payload) => {
          console.log('[Realtime] Stock movement:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set('stock-movements', channel)

    return () => this.unsubscribe('stock-movements')
  }

  // Subscribe to low stock alerts
  subscribeToLowStock(callback: RealtimeCallback): () => void {
    const channel = supabase
      .channel('low-stock-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: 'stock_quantity=lte.low_stock_threshold',
        },
        (payload) => {
          console.log('[Realtime] Low stock alert:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set('low-stock', channel)

    return () => this.unsubscribe('low-stock')
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`[Realtime] Unsubscribed from ${channelName}`)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel)
      console.log(`[Realtime] Unsubscribed from ${name}`)
    })
    this.channels.clear()
  }

  // Get channel status
  getChannelStatus(channelName: string): string | undefined {
    const channel = this.channels.get(channelName)
    return channel?.state
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager()
