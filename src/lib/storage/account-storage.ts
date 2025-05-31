import type { Account, AccountType, CreateAccountData, UpdateAccountData } from '../../types/account'
import { TransactionType } from '../../types/budget'
import { openDB, type IDBPDatabase } from 'idb'
import { encryptData, decryptData } from '../crypto/encryption'
import { openDatabase, STORES } from './indexeddb'

export class AccountStorage {
  private password: string

  constructor(password: string) {
    this.password = password
  }

  async createAccount(budgetId: string, data: CreateAccountData): Promise<Account> {
    const db = await openDatabase()
    
    const account: Account = {
      id: crypto.randomUUID(),
      budgetId,
      name: data.name,
      type: data.type,
      ...(data.description && { description: data.description }),
      balance: data.initialBalance || 0,
      isOnBudget: data.isOnBudget,
      isClosed: false,
      sortOrder: await this.getNextSortOrder(budgetId),
      createdAt: new Date(),
      updatedAt: new Date()}

    const encryptedAccount = await encryptData(JSON.stringify(account), this.password)
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite')
      const store = transaction.objectStore(STORES.ACCOUNTS)
      
      const request = store.add({
        id: account.id,
        budgetId,
        data: encryptedAccount,
        updatedAt: account.updatedAt.getTime()})

      request.onsuccess = () => resolve(account)
      request.onerror = () => reject(new Error('Failed to create account'))
      transaction.oncomplete = () => db.close()
    })
  }

  async getAccounts(budgetId: string): Promise<Account[]> {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readonly')
      const store = transaction.objectStore(STORES.ACCOUNTS)
      const index = store.index('budgetId')
      
      const request = index.getAll(budgetId)
      
      request.onsuccess = async () => {
        const records = request.result
        const accounts: Account[] = []
        
        for (const record of records) {
          try {
            const decryptedData = await decryptData(record.data, this.password)
            const account = JSON.parse(decryptedData) as Account
            // Convert date strings back to Date objects
            account.createdAt = new Date(account.createdAt)
            account.updatedAt = new Date(account.updatedAt)
            accounts.push(account)
          } catch (error) {
            console.error('Failed to decrypt account:', error)
          }
        }
        
        resolve(accounts.sort((a, b) => a.sortOrder - b.sortOrder))
      }
      
      request.onerror = () => reject(new Error('Failed to get accounts'))
      transaction.oncomplete = () => db.close()
    })
  }

  async getAccount(accountId: string): Promise<Account | null> {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readonly')
      const store = transaction.objectStore(STORES.ACCOUNTS)
      
      const request = store.get(accountId)
      
      request.onsuccess = async () => {
        const record = request.result
        if (!record) {
          resolve(null)
          return
        }
        
        try {
          const decryptedData = await decryptData(record.data, this.password)
          const account = JSON.parse(decryptedData) as Account
          // Convert date strings back to Date objects
          account.createdAt = new Date(account.createdAt)
          account.updatedAt = new Date(account.updatedAt)
          resolve(account)
        } catch (error) {
          console.error('Failed to decrypt account:', error)
          resolve(null)
        }
      }
      
      request.onerror = () => reject(new Error('Failed to get account'))
      transaction.oncomplete = () => db.close()
    })
  }

  async updateAccount(accountId: string, updates: UpdateAccountData): Promise<Account> {
    const account = await this.getAccount(accountId)
    if (!account) {
      throw new Error('Account not found')
    }

    const updatedAccount: Account = {
      ...account,
      ...updates,
      updatedAt: new Date()}

    const encryptedAccount = await encryptData(JSON.stringify(updatedAccount), this.password)
    
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite')
      const store = transaction.objectStore(STORES.ACCOUNTS)
      
      const request = store.put({
        id: accountId,
        budgetId: account.budgetId,
        data: encryptedAccount,
        updatedAt: updatedAccount.updatedAt.getTime()})

      request.onsuccess = () => resolve(updatedAccount)
      request.onerror = () => reject(new Error('Failed to update account'))
      transaction.oncomplete = () => db.close()
    })
  }

  async deleteAccount(accountId: string): Promise<void> {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite')
      const store = transaction.objectStore(STORES.ACCOUNTS)
      
      const request = store.delete(accountId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete account'))
      transaction.oncomplete = () => db.close()
    })
  }

  /**
   * Clear all accounts from the database
   */
  async clearAllAccounts(): Promise<void> {
    const { clearStore } = await import('./indexeddb')
    await clearStore(STORES.ACCOUNTS)
  }

  async updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
    const account = await this.getAccount(accountId)
    if (!account) {
      throw new Error('Account not found')
    }

    await this.updateAccount(accountId, { balance: newBalance })
  }

  async recalculateAccountBalance(accountId: string): Promise<number> {
    // This will be implemented when we update transaction storage
    // For now, return the current balance
    const account = await this.getAccount(accountId)
    return account?.balance || 0
  }

  private async getNextSortOrder(budgetId: string): Promise<number> {
    const accounts = await this.getAccounts(budgetId)
    return accounts.length > 0 ? Math.max(...accounts.map(a => a.sortOrder)) + 1 : 0
  }

  async reorderAccounts(budgetId: string, accountIds: string[]): Promise<void> {
    const accounts = await this.getAccounts(budgetId)
    const accountMap = new Map(accounts.map(a => [a.id, a]))

    for (let i = 0; i < accountIds.length; i++) {
      const accountId = accountIds[i]
      if (accountId) {
        const account = accountMap.get(accountId)
        if (account) {
          await this.updateAccount(account.id, { sortOrder: i })
        }
      }
    }
  }

  async transferBetweenAccounts(data: {
    fromAccountId: string
    toAccountId: string
    amount: number
    description?: string
    date: Date
  }): Promise<{ fromTransaction: any; toTransaction: any }> {
    const [fromAccount, toAccount] = await Promise.all([
      this.getAccount(data.fromAccountId),
      this.getAccount(data.toAccountId)
    ])

    if (!fromAccount) {
      throw new Error('Source account not found')
    }
    if (!toAccount) {
      throw new Error('Destination account not found')
    }

    // Check if source account has sufficient funds
    if (fromAccount.balance < data.amount) {
      throw new Error('Insufficient funds in source account')
    }

    // Update account balances
    await Promise.all([
      this.updateAccountBalance(data.fromAccountId, fromAccount.balance - data.amount),
      this.updateAccountBalance(data.toAccountId, toAccount.balance + data.amount)
    ])

    // Create linked transactions for the transfer
    // We'll need to import the budget storage to create transactions
    try {
      const { budgetStorage } = await import('./budget-storage')
      
      const transferId = crypto.randomUUID()
      const description = data.description || `Transfer from ${fromAccount.name} to ${toAccount.name}`

      // Create outgoing transaction (from source account)
      const fromTransaction = await budgetStorage.createTransaction({
        amount: -data.amount,
        description: `${description} (Outgoing)`,
        date: data.date,
        type: TransactionType.EXPENSE as any,
        accountId: data.fromAccountId,
        categoryId: null, // Account transfers don't affect categories
        tags: ['account-transfer', `transfer-${transferId}`]
      })

      // Create incoming transaction (to destination account)
      const toTransaction = await budgetStorage.createTransaction({
        amount: data.amount,
        description: `${description} (Incoming)`,
        date: data.date,
        type: TransactionType.INCOME as any,
        accountId: data.toAccountId,
        categoryId: null, // Account transfers don't affect categories
        tags: ['account-transfer', `transfer-${transferId}`]
      })

      return { fromTransaction, toTransaction }
    } catch (error) {
      // If transaction creation fails, reverse the account balance changes
      await Promise.all([
        this.updateAccountBalance(data.fromAccountId, fromAccount.balance),
        this.updateAccountBalance(data.toAccountId, toAccount.balance)
      ])
      throw new Error(`Failed to create transfer transactions: ${(error as Error).message}`)
    }
  }
} 