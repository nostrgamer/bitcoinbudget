import type { Budget, BudgetCategory, Transaction, Transfer, StorageMetadata } from '../../types/budget'
import type { Account } from '../../types/account'

// Database configuration
const DB_NAME = 'BitcoinBudgetDB'
const DB_VERSION = 2 // Incremented for Phase 2 accounts

// Object store names
export const STORES = {
  BUDGETS: 'budgets',
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories', 
  TRANSACTIONS: 'transactions',
  TRANSFERS: 'transfers',
  METADATA: 'metadata'
} as const

// Database schema
interface DBSchema {
  [STORES.BUDGETS]: Budget
  [STORES.ACCOUNTS]: Account
  [STORES.CATEGORIES]: BudgetCategory
  [STORES.TRANSACTIONS]: Transaction
  [STORES.TRANSFERS]: Transfer
  [STORES.METADATA]: StorageMetadata
}

/**
 * Opens the IndexedDB database and ensures proper schema
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Create budgets store
      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        const budgetStore = db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' })
        budgetStore.createIndex('isActive', 'isActive', { unique: false })
        budgetStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      
      // Create accounts store
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        const accountStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' })
        accountStore.createIndex('budgetId', 'budgetId', { unique: false })
        accountStore.createIndex('type', 'type', { unique: false })
        accountStore.createIndex('isOnBudget', 'isOnBudget', { unique: false })
        accountStore.createIndex('isClosed', 'isClosed', { unique: false })
        accountStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      
      // Create categories store
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' })
        categoryStore.createIndex('budgetId', 'budgetId', { unique: false })
        categoryStore.createIndex('isArchived', 'isArchived', { unique: false })
        categoryStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      
      // Create transactions store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' })
        transactionStore.createIndex('categoryId', 'categoryId', { unique: false })
        transactionStore.createIndex('type', 'type', { unique: false })
        transactionStore.createIndex('date', 'date', { unique: false })
        transactionStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      
      // Create transfers store
      if (!db.objectStoreNames.contains(STORES.TRANSFERS)) {
        const transferStore = db.createObjectStore(STORES.TRANSFERS, { keyPath: 'id' })
        transferStore.createIndex('fromCategoryId', 'fromCategoryId', { unique: false })
        transferStore.createIndex('toCategoryId', 'toCategoryId', { unique: false })
        transferStore.createIndex('date', 'date', { unique: false })
        transferStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      
      // Create metadata store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'version' })
      }
    }
  })
}

/**
 * Generic function to add data to a store
 */
export async function addData<T extends keyof DBSchema>(
  storeName: T,
  data: DBSchema[T]
): Promise<void> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.add(data)
    
    request.onerror = () => {
      reject(new Error(`Failed to add data to ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve()
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Generic function to update data in a store
 */
export async function updateData<T extends keyof DBSchema>(
  storeName: T,
  data: DBSchema[T]
): Promise<void> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)
    
    request.onerror = () => {
      reject(new Error(`Failed to update data in ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve()
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Generic function to get data by ID from a store
 */
export async function getData<T extends keyof DBSchema>(
  storeName: T,
  id: string
): Promise<DBSchema[T] | undefined> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)
    
    request.onerror = () => {
      reject(new Error(`Failed to get data from ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Generic function to get all data from a store
 */
export async function getAllData<T extends keyof DBSchema>(
  storeName: T
): Promise<DBSchema[T][]> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onerror = () => {
      reject(new Error(`Failed to get all data from ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Generic function to delete data by ID from a store
 */
export async function deleteData<T extends keyof DBSchema>(
  storeName: T,
  id: string
): Promise<void> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)
    
    request.onerror = () => {
      reject(new Error(`Failed to delete data from ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve()
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Get data by index
 */
export async function getDataByIndex<T extends keyof DBSchema>(
  storeName: T,
  indexName: string,
  value: string | number | boolean
): Promise<DBSchema[T][]> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    
    // Convert boolean to string for IndexedDB compatibility
    const indexValue = typeof value === 'boolean' ? value.toString() : value
    const request = index.getAll(indexValue)
    
    request.onerror = () => {
      reject(new Error(`Failed to get data by index from ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Clear all data from a store
 */
export async function clearStore<T extends keyof DBSchema>(storeName: T): Promise<void> {
  const db = await openDatabase()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()
    
    request.onerror = () => {
      reject(new Error(`Failed to clear store ${storeName}: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve()
    }
    
    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Delete the entire database
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    
    request.onerror = () => {
      reject(new Error(`Failed to delete database: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve()
    }
  })
} 