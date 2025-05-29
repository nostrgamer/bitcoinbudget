// Core data types for the Bitcoin Budget application

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
  categoryId: string | null // null for unassigned transactions
  amount: number // in satoshis (positive for income, negative for expenses)
  description: string
  date: Date
  type: TransactionType
  createdAt: Date
  updatedAt: Date
  tags?: string[]
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