import type { Budget, BudgetCategory, Transaction, Transfer, StorageMetadata, BudgetPeriod, CategoryAllocation } from '../../types/budget'
import type { Account } from '../../types/account'

// Database configuration
const DB_NAME = 'BitcoinBudgetDB'
const DB_VERSION = 3 // Updated for Phase 3

// Object store names
export const STORES = {
  BUDGETS: 'budgets',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  TRANSFERS: 'transfers',
  ACCOUNTS: 'accounts',
  BUDGET_PERIODS: 'budgetPeriods',
  CATEGORY_ALLOCATIONS: 'categoryAllocations',
  METADATA: 'metadata'
} as const

// Database schema
interface DBSchema {
  [STORES.BUDGETS]: Budget
  [STORES.ACCOUNTS]: Account
  [STORES.CATEGORIES]: BudgetCategory
  [STORES.TRANSACTIONS]: Transaction
  [STORES.TRANSFERS]: Transfer
  [STORES.BUDGET_PERIODS]: BudgetPeriod
  [STORES.CATEGORY_ALLOCATIONS]: CategoryAllocation
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
      const transaction = (event.target as IDBOpenDBRequest).transaction!
      const oldVersion = event.oldVersion

      // Version 1: Initial schema
      if (oldVersion < 1) {
        // Create budgets store
        if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
          db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' })
        }

        // Create categories store
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const categoriesStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' })
          categoriesStore.createIndex('budgetId', 'budgetId', { unique: false })
        }

        // Create transactions store
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionsStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' })
          transactionsStore.createIndex('categoryId', 'categoryId', { unique: false })
          transactionsStore.createIndex('date', 'date', { unique: false })
        }

        // Create transfers store
        if (!db.objectStoreNames.contains(STORES.TRANSFERS)) {
          const transfersStore = db.createObjectStore(STORES.TRANSFERS, { keyPath: 'id' })
          transfersStore.createIndex('fromCategoryId', 'fromCategoryId', { unique: false })
          transfersStore.createIndex('toCategoryId', 'toCategoryId', { unique: false })
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'version' })
        }
      }

      // Version 2: Add accounts for Phase 2
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
          const accountsStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' })
          accountsStore.createIndex('budgetId', 'budgetId', { unique: false })
          accountsStore.createIndex('isOnBudget', 'isOnBudget', { unique: false })
          accountsStore.createIndex('isClosed', 'isClosed', { unique: false })
        }

        // Add accountId index to transactions
        if (db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionsStore = transaction.objectStore(STORES.TRANSACTIONS)
          if (!transactionsStore.indexNames.contains('accountId')) {
            transactionsStore.createIndex('accountId', 'accountId', { unique: false })
          }
        }
      }

      // Version 3: Add budget periods and category allocations for Phase 3
      if (oldVersion < 3) {
        // Create budget periods store
        if (!db.objectStoreNames.contains(STORES.BUDGET_PERIODS)) {
          const budgetPeriodsStore = db.createObjectStore(STORES.BUDGET_PERIODS, { keyPath: 'id' })
          budgetPeriodsStore.createIndex('budgetId', 'budgetId', { unique: false })
          budgetPeriodsStore.createIndex('year', 'year', { unique: false })
          budgetPeriodsStore.createIndex('month', 'month', { unique: false })
          budgetPeriodsStore.createIndex('isActive', 'isActive', { unique: false })
          budgetPeriodsStore.createIndex('yearMonth', ['year', 'month'], { unique: false })
        }

        // Create category allocations store
        if (!db.objectStoreNames.contains(STORES.CATEGORY_ALLOCATIONS)) {
          const allocationsStore = db.createObjectStore(STORES.CATEGORY_ALLOCATIONS, { keyPath: 'id' })
          allocationsStore.createIndex('budgetPeriodId', 'budgetPeriodId', { unique: false })
          allocationsStore.createIndex('categoryId', 'categoryId', { unique: false })
          allocationsStore.createIndex('isOverspent', 'isOverspent', { unique: false })
          allocationsStore.createIndex('periodCategory', ['budgetPeriodId', 'categoryId'], { unique: true })
        }

        // Add budgetPeriodId index to transactions for monthly filtering
        if (db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionsStore = transaction.objectStore(STORES.TRANSACTIONS)
          if (!transactionsStore.indexNames.contains('budgetPeriodId')) {
            transactionsStore.createIndex('budgetPeriodId', 'budgetPeriodId', { unique: false })
          }
        }
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