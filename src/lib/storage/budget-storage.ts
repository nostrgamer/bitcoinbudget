import type { 
  Budget, 
  BudgetCategory, 
  Transaction, 
  Transfer, 
  BudgetSummary,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateTransferInput,
  StorageMetadata,
  EncryptedData
} from '../../types/budget'

import { TransactionType } from '../../types/budget'
import { encryptData, decryptData } from '../crypto/encryption'
import { 
  addData, 
  updateData, 
  getData, 
  getAllData, 
  deleteData, 
  getDataByIndex,
  clearStore,
  STORES 
} from './indexeddb'

// Storage configuration
const STORAGE_VERSION = '1.0.0'
const ENCRYPTION_KEY = 'bitcoin-budget-encryption-key'

// Special category ID for unassigned funds
export const UNASSIGNED_CATEGORY_ID = 'unassigned'

/**
 * Storage service for Bitcoin Budget application
 * Handles encryption, decryption, and data persistence
 */
export class BudgetStorageService {
  private encryptionPassword: string | null = null
  private isEncryptionEnabled: boolean = false

  /**
   * Initialize the storage service
   */
  async initialize(password?: string): Promise<void> {
    try {
      // Check if we have existing metadata
      const metadata = await this.getMetadata()
      
      if (metadata) {
        // Existing database
        this.isEncryptionEnabled = metadata.encryptionEnabled
        if (this.isEncryptionEnabled && password) {
          this.encryptionPassword = password
        }
      } else {
        // New database - set up metadata
        this.isEncryptionEnabled = !!password
        if (password) {
          this.encryptionPassword = password
        }
        
        await this.createMetadata()
      }
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Enable encryption with a password
   */
  async enableEncryption(password: string): Promise<void> {
    if (this.isEncryptionEnabled) {
      throw new Error('Encryption is already enabled')
    }

    this.encryptionPassword = password
    this.isEncryptionEnabled = true
    
    // Update metadata
    await this.updateMetadata({ encryptionEnabled: true })
  }

  /**
   * Disable encryption (decrypt all data)
   */
  async disableEncryption(): Promise<void> {
    if (!this.isEncryptionEnabled) {
      throw new Error('Encryption is not enabled')
    }

    // This would require decrypting and re-storing all data
    // For now, we'll just update the metadata
    this.isEncryptionEnabled = false
    this.encryptionPassword = null
    
    await this.updateMetadata({ encryptionEnabled: false })
  }

  /**
   * Create or update metadata
   */
  private async createMetadata(): Promise<void> {
    const metadata: StorageMetadata = {
      version: STORAGE_VERSION,
      createdAt: new Date(),
      encryptionEnabled: this.isEncryptionEnabled
    }
    
    await addData(STORES.METADATA, metadata)
  }

  /**
   * Update metadata
   */
  private async updateMetadata(updates: Partial<StorageMetadata>): Promise<void> {
    const existing = await this.getMetadata()
    if (!existing) {
      throw new Error('No metadata found')
    }

    const updated = { ...existing, ...updates }
    await updateData(STORES.METADATA, updated)
  }

  /**
   * Get metadata
   */
  private async getMetadata(): Promise<StorageMetadata | undefined> {
    return getData(STORES.METADATA, STORAGE_VERSION)
  }

  /**
   * Encrypt data if encryption is enabled
   */
  private async encryptIfEnabled(data: string): Promise<string | EncryptedData> {
    if (!this.isEncryptionEnabled || !this.encryptionPassword) {
      return data
    }
    
    return encryptData(data, this.encryptionPassword)
  }

  /**
   * Decrypt data if it's encrypted
   */
  private async decryptIfNeeded(data: string | EncryptedData): Promise<string> {
    if (typeof data === 'string') {
      return data
    }
    
    if (!this.encryptionPassword) {
      throw new Error('Encryption password required for decryption')
    }
    
    return decryptData(data, this.encryptionPassword)
  }

  // Budget operations
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await addData(STORES.BUDGETS, newBudget)
    return newBudget
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    return getData(STORES.BUDGETS, id)
  }

  async getAllBudgets(): Promise<Budget[]> {
    return getAllData(STORES.BUDGETS)
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const existing = await this.getBudget(id)
    if (!existing) {
      throw new Error('Budget not found')
    }

    const updated: Budget = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    }

    await updateData(STORES.BUDGETS, updated)
    return updated
  }

  async deleteBudget(id: string): Promise<void> {
    await deleteData(STORES.BUDGETS, id)
  }

  // Category operations
  async createCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategory> {
    const category: BudgetCategory = {
      ...input,
      id: crypto.randomUUID(),
      currentAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await addData(STORES.CATEGORIES, category)
    return category
  }

  async getCategory(id: string): Promise<BudgetCategory | undefined> {
    return getData(STORES.CATEGORIES, id)
  }

  async getAllCategories(): Promise<BudgetCategory[]> {
    return getAllData(STORES.CATEGORIES)
  }

  async updateCategory(id: string, updates: UpdateBudgetCategoryInput): Promise<BudgetCategory> {
    const existing = await this.getCategory(id)
    if (!existing) {
      throw new Error('Category not found')
    }

    const updated: BudgetCategory = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    }

    await updateData(STORES.CATEGORIES, updated)
    return updated
  }

  async deleteCategory(id: string): Promise<void> {
    await deleteData(STORES.CATEGORIES, id)
  }

  // Transaction operations
  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const transaction: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Update category balance if transaction has a categoryId (and it's not a transfer)
    if (transaction.categoryId && transaction.categoryId !== UNASSIGNED_CATEGORY_ID && !transaction.tags?.includes('transfer')) {
      const category = await this.getCategory(transaction.categoryId)
      if (category) {
        // Add the transaction amount to the category balance (negative for expenses, positive for income)
        await this.updateCategory(transaction.categoryId, {
          currentAmount: category.currentAmount + transaction.amount
        })
      }
    }

    // Update account balance if transaction has an accountId (and it's not a transfer)
    if (transaction.accountId && !transaction.tags?.includes('transfer') && !transaction.tags?.includes('account-transfer')) {
      try {
        // Import AccountStorage dynamically to avoid circular dependency
        const { AccountStorage } = await import('./account-storage')
        const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')
        
        const account = await accountStorage.getAccount(transaction.accountId)
        if (account) {
          // Add the transaction amount to the account balance (negative for expenses, positive for income)
          await accountStorage.updateAccountBalance(transaction.accountId, account.balance + transaction.amount)
        }
      } catch (error) {
        console.warn('Could not update account balance for transaction:', error)
      }
    }
    
    await addData(STORES.TRANSACTIONS, transaction)
    return transaction
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return getData(STORES.TRANSACTIONS, id)
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return getAllData(STORES.TRANSACTIONS)
  }

  async getTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
    return getDataByIndex(STORES.TRANSACTIONS, 'categoryId', categoryId)
  }

  async updateTransaction(id: string, updates: UpdateTransactionInput): Promise<Transaction> {
    const existing = await this.getTransaction(id)
    if (!existing) {
      throw new Error('Transaction not found')
    }

    const updated: Transaction = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    }

    // Handle category balance changes
    if (existing.categoryId !== updated.categoryId || existing.amount !== updated.amount) {
      // Reverse old category balance change (if not a transfer)
      if (existing.categoryId && existing.categoryId !== UNASSIGNED_CATEGORY_ID && !existing.tags?.includes('transfer')) {
        const oldCategory = await this.getCategory(existing.categoryId)
        if (oldCategory) {
          await this.updateCategory(existing.categoryId, {
            currentAmount: oldCategory.currentAmount - existing.amount
          })
        }
      }

      // Apply new category balance change (if not a transfer)
      if (updated.categoryId && updated.categoryId !== UNASSIGNED_CATEGORY_ID && !updated.tags?.includes('transfer')) {
        const newCategory = await this.getCategory(updated.categoryId)
        if (newCategory) {
          await this.updateCategory(updated.categoryId, {
            currentAmount: newCategory.currentAmount + updated.amount
          })
        }
      }
    }

    // Handle account balance changes
    if (existing.accountId !== updated.accountId || existing.amount !== updated.amount) {
      try {
        // Import AccountStorage dynamically to avoid circular dependency
        const { AccountStorage } = await import('./account-storage')
        const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')

        // Reverse old account balance change (if not a transfer)
        if (existing.accountId && !existing.tags?.includes('transfer') && !existing.tags?.includes('account-transfer')) {
          const oldAccount = await accountStorage.getAccount(existing.accountId)
          if (oldAccount) {
            await accountStorage.updateAccountBalance(existing.accountId, oldAccount.balance - existing.amount)
          }
        }

        // Apply new account balance change (if not a transfer)
        if (updated.accountId && !updated.tags?.includes('transfer') && !updated.tags?.includes('account-transfer')) {
          const newAccount = await accountStorage.getAccount(updated.accountId)
          if (newAccount) {
            await accountStorage.updateAccountBalance(updated.accountId, newAccount.balance + updated.amount)
          }
        }
      } catch (error) {
        console.warn('Could not update account balances for transaction update:', error)
      }
    }

    await updateData(STORES.TRANSACTIONS, updated)
    return updated
  }

  async deleteTransaction(id: string): Promise<void> {
    // Get the transaction to reverse any category balance changes
    const transaction = await this.getTransaction(id)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Reverse category balance if transaction has a categoryId (and it's not a transfer)
    if (transaction.categoryId && transaction.categoryId !== UNASSIGNED_CATEGORY_ID && !transaction.tags?.includes('transfer')) {
      const category = await this.getCategory(transaction.categoryId)
      if (category) {
        // Subtract the transaction amount from the category balance (reverse the original change)
        await this.updateCategory(transaction.categoryId, {
          currentAmount: category.currentAmount - transaction.amount
        })
      }
    }

    // Reverse account balance for account-transfer transactions OR regular transactions
    if (transaction.accountId) {
      // For account-transfer transactions, we need to reverse the balance change
      if (transaction.tags?.includes('account-transfer')) {
        try {
          // Import AccountStorage dynamically to avoid circular dependency
          const { AccountStorage } = await import('./account-storage')
          const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')
          
          const account = await accountStorage.getAccount(transaction.accountId)
          if (account) {
            // Subtract the transaction amount from the account balance (reverse the original change)
            await accountStorage.updateAccountBalance(transaction.accountId, account.balance - transaction.amount)
          }
        } catch (error) {
          console.warn('Could not update account balance for account-transfer deletion:', error)
        }
      }
      // For regular transactions (not transfers), also reverse the balance change
      else if (!transaction.tags?.includes('transfer')) {
        try {
          // Import AccountStorage dynamically to avoid circular dependency
          const { AccountStorage } = await import('./account-storage')
          const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')
          
          const account = await accountStorage.getAccount(transaction.accountId)
          if (account) {
            // Subtract the transaction amount from the account balance (reverse the original change)
            await accountStorage.updateAccountBalance(transaction.accountId, account.balance - transaction.amount)
          }
        } catch (error) {
          console.warn('Could not update account balance for transaction deletion:', error)
        }
      }
    }

    await deleteData(STORES.TRANSACTIONS, id)
  }

  // Transfer operations
  async createTransfer(input: CreateTransferInput): Promise<Transfer> {
    const transfer: Transfer = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    
    // Handle transfers involving unassigned funds
    if (input.fromCategoryId === UNASSIGNED_CATEGORY_ID) {
      // Transfer from unassigned to category
      const toCategory = await this.getCategory(input.toCategoryId)
      if (!toCategory) {
        throw new Error('Destination category not found')
      }

      // Create outgoing transaction (from source category)
      await this.createTransaction({
        amount: -input.amount,
        description: input.description || 'Transfer',
        date: input.date,
        type: TransactionType.EXPENSE,
        categoryId: input.fromCategoryId,
        accountId: 'default-account-id', // Required for Phase 2
        tags: ['transfer']
      })

      // Update destination category balance
      await this.updateCategory(input.toCategoryId, {
        currentAmount: toCategory.currentAmount + input.amount
      })
    } else if (input.toCategoryId === UNASSIGNED_CATEGORY_ID) {
      // Transfer from category to unassigned
      const fromCategory = await this.getCategory(input.fromCategoryId)
      if (!fromCategory) {
        throw new Error('Source category not found')
      }

      // Create incoming transaction (to destination category)
      await this.createTransaction({
        amount: input.amount,
        description: input.description || 'Transfer',
        date: input.date,
        type: TransactionType.INCOME,
        categoryId: input.toCategoryId,
        accountId: 'default-account-id', // Required for Phase 2
        tags: ['transfer']
      })

      // Update source category balance
      if (input.fromCategoryId !== UNASSIGNED_CATEGORY_ID) {
        const sourceCategory = await this.getCategory(input.fromCategoryId)
        if (sourceCategory) {
          await this.updateCategory(input.fromCategoryId, {
            currentAmount: sourceCategory.currentAmount - input.amount
          })
        }
      }
    } else {
      // Regular transfer between categories
      const [fromCategory, toCategory] = await Promise.all([
        this.getCategory(input.fromCategoryId),
        this.getCategory(input.toCategoryId)
      ])

      if (!fromCategory) {
        throw new Error('Source category not found')
      }
      if (!toCategory) {
        throw new Error('Destination category not found')
      }

      // Update category balances (allow negative balances)
      await Promise.all([
        this.updateCategory(input.fromCategoryId, {
          currentAmount: fromCategory.currentAmount - input.amount
        }),
        this.updateCategory(input.toCategoryId, {
          currentAmount: toCategory.currentAmount + input.amount
        })
      ])
    }
    
    // Save the transfer record
    await addData(STORES.TRANSFERS, transfer)
    return transfer
  }

  async getTransfer(id: string): Promise<Transfer | undefined> {
    return getData(STORES.TRANSFERS, id)
  }

  async getAllTransfers(): Promise<Transfer[]> {
    return getAllData(STORES.TRANSFERS)
  }

  async deleteTransfer(id: string): Promise<void> {
    // Get the transfer to reverse the balance changes
    const transfer = await this.getTransfer(id)
    if (!transfer) {
      throw new Error('Transfer not found')
    }

    // Handle transfers involving unassigned funds
    if (transfer.fromCategoryId === UNASSIGNED_CATEGORY_ID) {
      // Reverse transfer from unassigned to category
      const toCategory = await this.getCategory(transfer.toCategoryId)
      if (!toCategory) {
        throw new Error('Destination category not found')
      }

      // Find and delete the negative transaction that was created
      const transactions = await this.getAllTransactions()
      const transferTransaction = transactions.find(t => 
        t.amount === -transfer.amount &&
        t.description === `Transfer to ${toCategory.name}` &&
        t.tags?.includes('transfer')
      )
      
      if (transferTransaction) {
        await this.deleteTransaction(transferTransaction.id)
      }

      // Reverse destination category balance
      await this.updateCategory(transfer.toCategoryId, {
        currentAmount: toCategory.currentAmount - transfer.amount
      })
    } else if (transfer.toCategoryId === UNASSIGNED_CATEGORY_ID) {
      // Reverse transfer from category to unassigned
      const fromCategory = await this.getCategory(transfer.fromCategoryId)
      if (!fromCategory) {
        throw new Error('Source category not found')
      }

      // Find and delete the positive transaction that was created
      const transactions = await this.getAllTransactions()
      const transferTransaction = transactions.find(t => 
        t.amount === transfer.amount &&
        t.description === `Transfer from ${fromCategory.name}` &&
        t.tags?.includes('transfer')
      )
      
      if (transferTransaction) {
        await this.deleteTransaction(transferTransaction.id)
      }

      // Reverse source category balance
      await this.updateCategory(transfer.fromCategoryId, {
        currentAmount: fromCategory.currentAmount + transfer.amount
      })
    } else {
      // Regular transfer between categories
      const [fromCategory, toCategory] = await Promise.all([
        this.getCategory(transfer.fromCategoryId),
        this.getCategory(transfer.toCategoryId)
      ])

      if (!fromCategory) {
        throw new Error('Source category not found')
      }
      if (!toCategory) {
        throw new Error('Destination category not found')
      }

      // Reverse the category balance changes (allow negative balances)
      await Promise.all([
        this.updateCategory(transfer.fromCategoryId, {
          currentAmount: fromCategory.currentAmount + transfer.amount
        }),
        this.updateCategory(transfer.toCategoryId, {
          currentAmount: toCategory.currentAmount - transfer.amount
        })
      ])
    }

    // Delete the transfer record
    await deleteData(STORES.TRANSFERS, id)
  }

  // Summary and analytics
  async getBudgetSummary(): Promise<BudgetSummary> {
    const [categories, transactions] = await Promise.all([
      this.getAllCategories(),
      this.getAllTransactions()
    ])

    const totalAllocated = categories.reduce((sum, cat) => sum + cat.targetAmount, 0)
    const totalAvailable = categories.reduce((sum, cat) => sum + cat.currentAmount, 0)
    
    // Only count actual income transactions (exclude transfer-related transactions)
    const transactionIncome = transactions
      .filter(t => t.amount > 0 && !t.tags?.includes('transfer') && !t.tags?.includes('account-transfer'))
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Get on-budget account balances and include them as available income
    // This is a temporary solution for Phase 2 - in Phase 3 we'll have proper account integration
    let accountIncome = 0
    try {
      // Import AccountStorage dynamically to avoid circular dependency
      const { AccountStorage } = await import('./account-storage')
      const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')
      
      // Get all budgets to find the current budget ID
      const budgets = await this.getAllBudgets()
      const currentBudget = budgets[0] // For Phase 2, we use the first budget
      
      if (currentBudget) {
        const accounts = await accountStorage.getAccounts(currentBudget.id)
        // Only include on-budget accounts
        accountIncome = accounts
          .filter(account => account.isOnBudget && !account.isClosed)
          .reduce((sum, account) => sum + account.balance, 0)
      }
    } catch (error) {
      console.warn('Could not load account balances for budget summary:', error)
    }
    
    const totalIncome = transactionIncome + accountIncome
    
    // Only count actual expense transactions (exclude transfer-related transactions)
    const expenses = transactions
      .filter(t => t.amount < 0 && !t.tags?.includes('transfer') && !t.tags?.includes('account-transfer'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      totalIncome,
      totalExpenses: expenses,
      totalAllocated,
      totalAvailable,
      categoryCount: categories.length,
      transactionCount: transactions.length
    }
  }

  /**
   * Get the unassigned balance (transactions without a category + on-budget account balances - money transferred to categories)
   */
  async getUnassignedBalance(): Promise<number> {
    const [transactions, categories] = await Promise.all([
      this.getAllTransactions(),
      this.getAllCategories()
    ])
    
    // Get transactions without a categoryId (unassigned) and exclude account transfers
    const unassignedTransactions = transactions.filter(t => 
      !t.categoryId && !t.tags?.includes('transfer') && !t.tags?.includes('account-transfer')
    )
    const transactionBalance = unassignedTransactions.reduce((sum, t) => sum + t.amount, 0)
    
    // Get on-budget account balances and include them as unassigned funds
    // This is a temporary solution for Phase 2 - in Phase 3 we'll have proper account integration
    let accountBalance = 0
    try {
      // Import AccountStorage dynamically to avoid circular dependency
      const { AccountStorage } = await import('./account-storage')
      const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')
      
      // Get all budgets to find the current budget ID
      const budgets = await this.getAllBudgets()
      const currentBudget = budgets[0] // For Phase 2, we use the first budget
      
      if (currentBudget) {
        const accounts = await accountStorage.getAccounts(currentBudget.id)
        // Only include on-budget accounts
        accountBalance = accounts
          .filter(account => account.isOnBudget && !account.isClosed)
          .reduce((sum, account) => sum + account.balance, 0)
      }
    } catch (error) {
      console.warn('Could not load account balances for unassigned calculation:', error)
    }
    
    // Calculate total money allocated to categories (this reduces unassigned balance)
    const totalAllocatedToCategories = categories.reduce((sum, cat) => sum + cat.currentAmount, 0)
    
    // Unassigned = Account Balance + Unassigned Transactions - Money Allocated to Categories
    return accountBalance + transactionBalance - totalAllocatedToCategories
  }

  // Utility operations
  async recalculateCategoryBalances(): Promise<void> {
    const [categories, transactions, transfers] = await Promise.all([
      this.getAllCategories(),
      this.getAllTransactions(),
      this.getAllTransfers()
    ])

    // Calculate balances for each category
    for (const category of categories) {
      let balance = 0

      // Add money from transfers TO this category
      const transfersTo = transfers.filter(t => t.toCategoryId === category.id)
      balance += transfersTo.reduce((sum, t) => sum + t.amount, 0)

      // Subtract money from transfers FROM this category
      const transfersFrom = transfers.filter(t => t.fromCategoryId === category.id)
      balance -= transfersFrom.reduce((sum, t) => sum + t.amount, 0)

      // Add/subtract regular transactions (not transfer-related)
      const categoryTransactions = transactions.filter(t => 
        t.categoryId === category.id && !t.tags?.includes('transfer') && !t.tags?.includes('account-transfer')
      )
      balance += categoryTransactions.reduce((sum, t) => sum + t.amount, 0)

      // Update category if balance is different
      if (category.currentAmount !== balance) {
        await this.updateCategory(category.id, { currentAmount: balance })
      }
    }
  }

  async recalculateAccountBalances(): Promise<void> {
    try {
      // Import AccountStorage dynamically to avoid circular dependency
      const { AccountStorage } = await import('./account-storage')
      const accountStorage = new AccountStorage(this.encryptionPassword || 'bitcoin-budget-default-password-2024')
      
      // Get all budgets to find accounts
      const budgets = await this.getAllBudgets()
      const transactions = await this.getAllTransactions()
      
      for (const budget of budgets) {
        const accounts = await accountStorage.getAccounts(budget.id)
        
        for (const account of accounts) {
          // Calculate balance from all transactions for this account (including account transfers)
          const accountTransactions = transactions.filter(t => 
            t.accountId === account.id && !t.tags?.includes('transfer')
          )
          const calculatedBalance = accountTransactions.reduce((sum, t) => sum + t.amount, 0)
          
          // Update account if balance is different
          if (account.balance !== calculatedBalance) {
            await accountStorage.updateAccountBalance(account.id, calculatedBalance)
          }
        }
      }
    } catch (error) {
      console.warn('Could not recalculate account balances:', error)
    }
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      clearStore(STORES.BUDGETS),
      clearStore(STORES.CATEGORIES),
      clearStore(STORES.TRANSACTIONS),
      clearStore(STORES.TRANSFERS),
      clearStore(STORES.METADATA)
    ])
  }

  async exportData(): Promise<string> {
    const [budgets, categories, transactions, transfers, metadata] = await Promise.all([
      this.getAllBudgets(),
      this.getAllCategories(),
      this.getAllTransactions(),
      this.getAllTransfers(),
      this.getMetadata()
    ])

    const exportData = {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      budgets,
      categories,
      transactions,
      transfers,
      metadata
    }

    return JSON.stringify(exportData, null, 2)
  }
}

// Singleton instance
export const budgetStorage = new BudgetStorageService() 