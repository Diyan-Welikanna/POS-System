// Offline transaction queue manager

import { dbOperations, STORES } from './indexedDB'
import { supabase } from './supabaseClient'

export interface OfflineTransaction {
  id?: number
  transaction_data: {
    items: Array<{
      product_id: string
      quantity: number
      price: number
      total: number
    }>
    subtotal: number
    tax: number
    discount: number
    total: number
    payment_method: string
    customer_id?: string
    cashier_id: string
  }
  created_at: string
  synced: boolean
  sync_attempts: number
  error_message?: string
}

// Add transaction to offline queue
export const addOfflineTransaction = async (
  transactionData: OfflineTransaction['transaction_data']
): Promise<number> => {
  const offlineTransaction: OfflineTransaction = {
    transaction_data: transactionData,
    created_at: new Date().toISOString(),
    synced: false,
    sync_attempts: 0,
  }

  const db = await dbOperations.put(STORES.OFFLINE_TRANSACTIONS, offlineTransaction)
  console.log('[OfflineQueue] Transaction added to offline queue')

  // Try to sync immediately if online
  if (navigator.onLine) {
    setTimeout(() => syncOfflineTransactions(), 1000)
  }

  return offlineTransaction.id || 0
}

// Get all unsynced transactions
export const getUnsyncedTransactions = async (): Promise<OfflineTransaction[]> => {
  const allTransactions = await dbOperations.getAll<OfflineTransaction>(
    STORES.OFFLINE_TRANSACTIONS
  )
  return allTransactions.filter((t) => !t.synced)
}

// Sync offline transactions to Supabase
export const syncOfflineTransactions = async (): Promise<{
  success: number
  failed: number
}> => {
  console.log('[OfflineQueue] Starting sync...')

  const unsyncedTransactions = await getUnsyncedTransactions()
  
  if (unsyncedTransactions.length === 0) {
    console.log('[OfflineQueue] No transactions to sync')
    return { success: 0, failed: 0 }
  }

  let successCount = 0
  let failedCount = 0

  for (const offlineTransaction of unsyncedTransactions) {
    try {
      // Create transaction in Supabase
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          cashier_id: offlineTransaction.transaction_data.cashier_id,
          customer_id: offlineTransaction.transaction_data.customer_id,
          subtotal: offlineTransaction.transaction_data.subtotal,
          tax: offlineTransaction.transaction_data.tax,
          discount: offlineTransaction.transaction_data.discount,
          total: offlineTransaction.transaction_data.total,
          payment_method: offlineTransaction.transaction_data.payment_method,
          status: 'completed',
          created_at: offlineTransaction.created_at,
        } as any)
        .select()
        .single()

      if (transactionError) throw transactionError

      // Create transaction items
      const items = offlineTransaction.transaction_data.items.map((item) => ({
        transaction_id: (transaction as any).id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }))

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(items as any)

      if (itemsError) throw itemsError

      // Mark as synced
      if (offlineTransaction.id) {
        await dbOperations.put(STORES.OFFLINE_TRANSACTIONS, {
          ...offlineTransaction,
          synced: true,
          sync_attempts: offlineTransaction.sync_attempts + 1,
        })
      }

      successCount++
      console.log(`[OfflineQueue] Synced transaction ${offlineTransaction.id}`)
    } catch (error: any) {
      console.error('[OfflineQueue] Sync failed:', error)
      
      // Update sync attempts
      if (offlineTransaction.id) {
        await dbOperations.put(STORES.OFFLINE_TRANSACTIONS, {
          ...offlineTransaction,
          sync_attempts: offlineTransaction.sync_attempts + 1,
          error_message: error.message,
        })
      }

      failedCount++
    }
  }

  console.log(`[OfflineQueue] Sync complete: ${successCount} success, ${failedCount} failed`)
  return { success: successCount, failed: failedCount }
}

// Get sync status
export const getSyncStatus = async () => {
  const allTransactions = await dbOperations.getAll<OfflineTransaction>(
    STORES.OFFLINE_TRANSACTIONS
  )
  
  const unsynced = allTransactions.filter((t) => !t.synced).length
  const synced = allTransactions.filter((t) => t.synced).length
  const failed = allTransactions.filter((t) => t.sync_attempts > 3 && !t.synced).length

  return {
    total: allTransactions.length,
    unsynced,
    synced,
    failed,
  }
}

// Clear synced transactions (cleanup)
export const clearSyncedTransactions = async () => {
  const allTransactions = await dbOperations.getAll<OfflineTransaction>(
    STORES.OFFLINE_TRANSACTIONS
  )
  
  for (const transaction of allTransactions) {
    if (transaction.synced && transaction.id) {
      await dbOperations.delete(STORES.OFFLINE_TRANSACTIONS, transaction.id)
    }
  }
  
  console.log('[OfflineQueue] Cleared synced transactions')
}

// Listen for online event and sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Back online - syncing transactions...')
    syncOfflineTransactions()
  })

  // Listen for service worker messages
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_TRANSACTIONS') {
      syncOfflineTransactions()
    }
  })
}
