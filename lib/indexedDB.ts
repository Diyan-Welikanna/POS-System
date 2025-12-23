// IndexedDB wrapper for offline data storage

const DB_NAME = 'pos_system_db'
const DB_VERSION = 1

// Object store names
export const STORES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  OFFLINE_TRANSACTIONS: 'offline_transactions',
  SYNC_QUEUE: 'sync_queue',
}

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Products store
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' })
        productStore.createIndex('barcode', 'barcode', { unique: false })
        productStore.createIndex('sku', 'sku', { unique: false })
        productStore.createIndex('category_id', 'category_id', { unique: false })
      }

      // Categories store
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' })
      }

      // Customers store
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' })
        customerStore.createIndex('phone', 'phone', { unique: false })
      }

      // Offline transactions store
      if (!db.objectStoreNames.contains(STORES.OFFLINE_TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.OFFLINE_TRANSACTIONS, {
          keyPath: 'id',
          autoIncrement: true,
        })
        transactionStore.createIndex('created_at', 'created_at', { unique: false })
        transactionStore.createIndex('synced', 'synced', { unique: false })
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        syncStore.createIndex('synced', 'synced', { unique: false })
      }
    }
  })
}

// Generic CRUD operations
export const dbOperations = {
  // Add or update data
  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  // Add multiple items
  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      items.forEach((item) => store.put(item))

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  },

  // Get by ID
  async get<T>(storeName: string, id: string | number): Promise<T | undefined> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  // Get all items
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  // Query by index
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: string | number
  ): Promise<T[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  // Delete by ID
  async delete(storeName: string, id: string | number): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  // Clear all data from store
  async clear(storeName: string): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },
}

// Cache products for offline use
export const cacheProducts = async (products: any[]) => {
  await dbOperations.putMany(STORES.PRODUCTS, products)
  console.log(`[IndexedDB] Cached ${products.length} products`)
}

// Cache categories
export const cacheCategories = async (categories: any[]) => {
  await dbOperations.putMany(STORES.CATEGORIES, categories)
  console.log(`[IndexedDB] Cached ${categories.length} categories`)
}

// Cache customers
export const cacheCustomers = async (customers: any[]) => {
  await dbOperations.putMany(STORES.CUSTOMERS, customers)
  console.log(`[IndexedDB] Cached ${customers.length} customers`)
}

// Get cached products
export const getCachedProducts = async () => {
  return await dbOperations.getAll(STORES.PRODUCTS)
}

// Get cached categories
export const getCachedCategories = async () => {
  return await dbOperations.getAll(STORES.CATEGORIES)
}

// Get cached customers
export const getCachedCustomers = async () => {
  return await dbOperations.getAll(STORES.CUSTOMERS)
}
