// Core data types for the Bitcoin Budget application

// Re-export account types for unified access
export type { Account, AccountType, CreateAccountData, UpdateAccountData } from './account'
export { ACCOUNT_TYPES, DEFAULT_ACCOUNT_COLORS } from './account'

// Create alias for consistency with other input types
export type CreateAccountInput = import('./account').CreateAccountData

export interface BudgetCategory {
  id: string
  name: string
  description?: string
  targetAmount: number // in satoshis
  currentAmount: number // in satoshis
  color: string // hex color for UI
  icon?: string // icon name from lucide-react
  createdAt: Date
  updatedAt: Date
  isArchived: boolean
}

export interface Transaction {
  id: string
  accountId: string // Required - all transactions tied to accounts
  categoryId: string | null // null for unassigned transactions
  amount: number // in satoshis (positive for income, negative for expenses)
  description: string
  date: Date
  type: TransactionType
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  cleared?: boolean // for reconciliation
  transferAccountId?: string // for account-to-account transfers
  transferTransactionId?: string // linked transfer transaction
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface Transfer {
  id: string
  fromCategoryId: string
  toCategoryId: string
  amount: number // in satoshis
  description?: string
  date: Date
  createdAt: Date
}

export interface Budget {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  totalBalance: number // in satoshis
  unassignedBalance: number // in satoshis
  categories: BudgetCategory[]
}

export interface BudgetSummary {
  totalIncome: number // in satoshis
  totalExpenses: number // in satoshis
  totalAllocated: number // in satoshis
  totalAvailable: number // in satoshis
  categoryCount: number
  transactionCount: number
}

// Utility types for forms and API
export type CreateBudgetCategoryInput = Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>
export type UpdateBudgetCategoryInput = Partial<Omit<BudgetCategory, 'id' | 'createdAt'>>
export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'createdAt'>>
export type CreateTransferInput = Omit<Transfer, 'id' | 'createdAt'>

// Storage-related types
export interface EncryptedData {
  data: string // base64 encoded encrypted data
  iv: string // base64 encoded initialization vector
  salt: string // base64 encoded salt for key derivation
}

export interface StorageMetadata {
  version: string
  createdAt: Date
  lastBackup?: Date
  encryptionEnabled: boolean
}

export interface BudgetPeriod {
  id: string
  budgetId: string
  year: number
  month: number // 1-12
  name: string // e.g., "January 2024"
  startDate: Date
  endDate: Date
  isActive: boolean
  totalIncome: number
  totalExpenses: number
  totalAllocated: number
  totalAvailable: number
  createdAt: Date
  updatedAt: Date
}

export interface CategoryAllocation {
  id: string
  budgetPeriodId: string
  categoryId: string
  targetAmount: number // How much was allocated for this month
  currentAmount: number // How much is currently available (includes rollover)
  spentAmount: number // How much was spent this month
  rolloverAmount: number // Amount rolled over from previous month
  isOverspent: boolean
  createdAt: Date
  updatedAt: Date
}

// Input types for creating budget periods and allocations
export interface CreateBudgetPeriodInput {
  budgetId: string
  year: number
  month: number
}

export interface CreateCategoryAllocationInput {
  budgetPeriodId: string
  categoryId: string
  targetAmount: number
}

export interface UpdateCategoryAllocationInput {
  targetAmount?: number
  currentAmount?: number
  spentAmount?: number
  rolloverAmount?: number
  isOverspent?: boolean
}

// Enhanced budget summary for monthly view
export interface MonthlyBudgetSummary extends BudgetSummary {
  budgetPeriodId: string
  periodName: string
  totalRollover: number
  totalOverspent: number
  unallocatedFunds: number
  previousMonthCarryover: number
} 