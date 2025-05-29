import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { budgetStorage } from '../lib/storage/budget-storage'
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
  CreateTransferInput
} from '../types/budget'

// Query keys for React Query
export const QUERY_KEYS = {
  budgets: ['budgets'] as const,
  budget: (id: string) => ['budgets', id] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  transfers: ['transfers'] as const,
  summary: ['summary'] as const,
  unassignedBalance: ['unassigned-balance'] as const,
} as const

/**
 * Hook for managing budget storage initialization
 */
export function useBudgetStorageInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialize = useCallback(async (password?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await budgetStorage.initialize(password)
      setIsInitialized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize storage'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    isInitialized,
    isLoading,
    error,
    initialize
  }
}

/**
 * Hook for budget operations
 */
export function useBudgets() {
  const queryClient = useQueryClient()

  const budgetsQuery = useQuery({
    queryKey: QUERY_KEYS.budgets,
    queryFn: () => budgetStorage.getAllBudgets(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const createBudgetMutation = useMutation({
    mutationFn: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) =>
      budgetStorage.createBudget(budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      toast.success('Budget created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create budget: ${error.message}`)
    },
  })

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Budget> }) =>
      budgetStorage.updateBudget(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      toast.success('Budget updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update budget: ${error.message}`)
    },
  })

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetStorage.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      toast.success('Budget deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete budget: ${error.message}`)
    },
  })

  return {
    budgets: budgetsQuery.data ?? [],
    isLoading: budgetsQuery.isLoading,
    error: budgetsQuery.error,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
  }
}

/**
 * Hook for category operations
 */
export function useCategories() {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => budgetStorage.getAllCategories(),
    staleTime: 1000 * 60 * 5,
  })

  const createCategoryMutation = useMutation({
    mutationFn: (category: CreateBudgetCategoryInput) =>
      budgetStorage.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      toast.success('Category created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`)
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateBudgetCategoryInput }) =>
      budgetStorage.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      toast.success('Category updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => budgetStorage.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`)
    },
  })

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory: createCategoryMutation.mutate,
    createCategoryAsync: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutate,
    updateCategoryAsync: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutate,
    deleteCategoryAsync: deleteCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  }
}

/**
 * Hook for transaction operations
 */
export function useTransactions() {
  const queryClient = useQueryClient()

  const transactionsQuery = useQuery({
    queryKey: QUERY_KEYS.transactions,
    queryFn: () => budgetStorage.getAllTransactions(),
    staleTime: 1000 * 60 * 5,
  })

  const createTransactionMutation = useMutation({
    mutationFn: (transaction: CreateTransactionInput) =>
      budgetStorage.createTransaction(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unassignedBalance })
      toast.success('Transaction created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create transaction: ${error.message}`)
    },
  })

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTransactionInput }) =>
      budgetStorage.updateTransaction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unassignedBalance })
      toast.success('Transaction updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update transaction: ${error.message}`)
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => budgetStorage.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unassignedBalance })
      toast.success('Transaction deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete transaction: ${error.message}`)
    },
  })

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction: createTransactionMutation.mutate,
    createTransactionAsync: createTransactionMutation.mutateAsync,
    updateTransaction: updateTransactionMutation.mutate,
    updateTransactionAsync: updateTransactionMutation.mutateAsync,
    deleteTransaction: deleteTransactionMutation.mutate,
    deleteTransactionAsync: deleteTransactionMutation.mutateAsync,
    isCreating: createTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
  }
}

/**
 * Hook for budget summary and analytics
 */
export function useBudgetSummary() {
  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.summary,
    queryFn: () => budgetStorage.getBudgetSummary(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  return {
    summary: summaryQuery.data,
    isLoading: summaryQuery.isLoading,
    error: summaryQuery.error,
  }
}

/**
 * Hook for unassigned balance
 */
export function useUnassignedBalance() {
  const unassignedQuery = useQuery({
    queryKey: QUERY_KEYS.unassignedBalance,
    queryFn: () => budgetStorage.getUnassignedBalance(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  return {
    unassignedBalance: unassignedQuery.data ?? 0,
    isLoading: unassignedQuery.isLoading,
    error: unassignedQuery.error,
  }
}

/**
 * Hook for data export/import operations
 */
export function useDataManagement() {
  const queryClient = useQueryClient()

  const exportDataMutation = useMutation({
    mutationFn: () => budgetStorage.exportData(),
    onSuccess: (data) => {
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bitcoin-budget-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Data exported successfully')
    },
    onError: (error) => {
      toast.error(`Failed to export data: ${error.message}`)
    },
  })

  const clearDataMutation = useMutation({
    mutationFn: () => budgetStorage.clearAllData(),
    onSuccess: () => {
      queryClient.clear()
      toast.success('All data cleared successfully')
    },
    onError: (error) => {
      toast.error(`Failed to clear data: ${error.message}`)
    },
  })

  return {
    exportData: exportDataMutation.mutate,
    clearAllData: clearDataMutation.mutate,
    isExporting: exportDataMutation.isPending,
    isClearing: clearDataMutation.isPending,
  }
}

/**
 * Hook for transfer operations
 */
export function useTransfers() {
  const queryClient = useQueryClient()

  const transfersQuery = useQuery({
    queryKey: QUERY_KEYS.transfers,
    queryFn: () => budgetStorage.getAllTransfers(),
    staleTime: 1000 * 60 * 5,
  })

  const createTransferMutation = useMutation({
    mutationFn: (transfer: CreateTransferInput) =>
      budgetStorage.createTransfer(transfer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transfers })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unassignedBalance })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions })
      toast.success('Transfer completed successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create transfer: ${error.message}`)
    },
  })

  const deleteTransferMutation = useMutation({
    mutationFn: (id: string) => budgetStorage.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transfers })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unassignedBalance })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions })
      toast.success('Transfer deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete transfer: ${error.message}`)
    },
  })

  return {
    transfers: transfersQuery.data ?? [],
    isLoading: transfersQuery.isLoading,
    error: transfersQuery.error,
    createTransfer: createTransferMutation.mutate,
    createTransferAsync: createTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutate,
    deleteTransferAsync: deleteTransferMutation.mutateAsync,
    isCreating: createTransferMutation.isPending,
    isDeleting: deleteTransferMutation.isPending,
  }
} 