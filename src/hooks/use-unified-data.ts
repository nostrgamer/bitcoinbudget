import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDataManager, 
  resetDataManager, 
  getDataManagerDiagnostics 
} from '../lib/data-manager/data-manager-factory';
import { usePassword } from './use-password';
import type { 
  Transaction, 
  BudgetCategory, 
  Account, 
  BudgetPeriod,
  CreateTransactionInput,
  CreateBudgetCategoryInput,
  CreateAccountInput,
  CreateBudgetPeriodInput
} from '../types/budget';
import type { 
  UnifiedDataManager 
} from '../lib/data-manager/unified-data-manager';

// ============================================================================
// CORE DATA HOOKS
// ============================================================================

/**
 * Main hook for accessing unified data manager
 * Now uses factory pattern for better instance management
 */
export function useUnifiedData() {
  const { password } = usePassword();
  const [initError, setInitError] = useState<string | null>(null);
  const isInitializingRef = useRef(false);

  const dataManagerQuery = useQuery({
    queryKey: ['unified-data-manager', password],
    queryFn: async () => {
      if (!password) {
        throw new Error('Password is required');
      }

      // Prevent multiple simultaneous initializations
      if (isInitializingRef.current) {
        throw new Error('Data manager initialization already in progress');
      }

      isInitializingRef.current = true;
      setInitError(null);

      try {
        console.log('🔄 Initializing data manager with factory...');
        const manager = await getDataManager(password);
        console.log('✅ Data manager initialized successfully');
        return manager;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('❌ Data manager initialization failed:', errorMessage);
        setInitError(errorMessage);
        throw error;
      } finally {
        isInitializingRef.current = false;
      }
    },
    enabled: !!password,
    retry: (failureCount, error) => {
      // Don't retry if it's a password error
      if (error instanceof Error && error.message.includes('password')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: Infinity, // Keep data manager instance fresh until explicitly invalidated
    gcTime: Infinity, // Don't garbage collect data manager
  });

  return {
    dataManager: dataManagerQuery.data,
    isLoading: dataManagerQuery.isLoading,
    error: dataManagerQuery.error || initError,
    isReady: !!dataManagerQuery.data && !dataManagerQuery.isLoading,
  };
}

// ============================================================================
// TRANSACTION HOOKS
// ============================================================================

export function useTransactions() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'transactions'],
    queryFn: () => dataManager?.getTransactions() || [],
    enabled: isReady && !!dataManager,
    staleTime: 0, // Always fresh since we have real-time updates
  });
}

export function useCreateTransaction() {
  const { dataManager } = useUnifiedData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.createTransaction(input);
    },
    onSuccess: () => {
      // Cache will be invalidated automatically via event system
    }});
}

export function useUpdateTransaction() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.updateTransaction(id, updates);
    }});
}

export function useDeleteTransaction() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.deleteTransaction(id);
    }});
}

// ============================================================================
// CATEGORY HOOKS
// ============================================================================

export function useCategories() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'categories'],
    queryFn: () => dataManager?.getCategories() || [],
    enabled: isReady && !!dataManager,
    staleTime: 0});
}

export function useCreateCategory() {
  const { dataManager } = useUnifiedData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetCategoryInput) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.createCategory(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-data', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['unified-data', 'budget-summary'] });
    }
  });
}

export function useUpdateCategory() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BudgetCategory> }) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.updateCategory(id, updates);
    }});
}

export function useDeleteCategory() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.deleteCategory(id);
    }});
}

// ============================================================================
// ACCOUNT HOOKS
// ============================================================================

export function useAccounts() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'accounts'],
    queryFn: () => dataManager?.getAccounts() || [],
    enabled: isReady && !!dataManager,
    staleTime: 0});
}

export function useCreateAccount() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.createAccount(input);
    }});
}

export function useUpdateAccount() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.updateAccount(id, updates);
    }});
}

export function useDeleteAccount() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.deleteAccount(id);
    }});
}

// ============================================================================
// BUDGET PERIOD HOOKS
// ============================================================================

export function useBudgetPeriods() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'periods'],
    queryFn: () => dataManager?.getPeriods() || [],
    enabled: isReady && !!dataManager,
    staleTime: 0});
}

export function useActiveBudgetPeriod() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'active-period'],
    queryFn: () => dataManager?.getActivePeriod() || null,
    enabled: isReady && !!dataManager,
    staleTime: 0});
}

export function useSetActiveBudgetPeriod() {
  const { dataManager } = useUnifiedData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (periodId: string) => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.setActivePeriod(periodId);
    },
    onSuccess: () => {
      // Invalidate period-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['unified-data', 'budget-periods'] });
      queryClient.invalidateQueries({ queryKey: ['unified-data', 'active-budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['unified-data', 'budget-summary'] });
    }
  });
}

export function useCreateBudgetPeriod() {
  const { dataManager } = useUnifiedData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetPeriodInput) => {
      const budgetId = dataManager.getBudgetId();
      return dataManager.createBudgetPeriod({ ...input, budgetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-periods'] });
      queryClient.invalidateQueries({ queryKey: ['active-budget-period'] });
    }});
}

export function useGetOrCreateCurrentBudgetPeriod() {
  const { dataManager } = useUnifiedData();

  return useMutation({
    mutationFn: async () => {
      if (!dataManager) throw new Error('Data manager not initialized');
      return dataManager.getCurrentOrCreateBudgetPeriod();
    }});
}

export function useCategoryAllocations(periodId: string) {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'allocations', periodId],
    queryFn: () => dataManager?.getAllocations(periodId) || [],
    enabled: isReady && !!dataManager && !!periodId,
    staleTime: 0});
}

export function useAllocateFunds() {
  const { dataManager } = useUnifiedData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ periodId, categoryId, amount }: { 
      periodId: string; 
      categoryId: string; 
      amount: number; 
    }) => {
      if (!dataManager) {
        throw new Error('Data manager not initialized');
      }
      
      try {
        console.log('🎯 Starting allocation mutation:', { periodId, categoryId, amount });
        const result = await dataManager.allocateFunds(periodId, categoryId, amount);
        console.log('✅ Allocation completed successfully');
        return result;
      } catch (error) {
        console.error('❌ Allocation error in hook:', error);
        // Re-throw with better error context
        const errorMessage = error instanceof Error ? error.message : 'Unknown allocation error';
        throw new Error(`Allocation failed: ${errorMessage}`);
      }
    },
    onSuccess: (data, variables) => {
      try {
        // Invalidate all related queries to ensure UI updates
        console.log('🔄 Invalidating cache after successful allocation:', variables);
        queryClient.invalidateQueries({ queryKey: ['unified-data', 'allocations', variables.periodId] });
        queryClient.invalidateQueries({ queryKey: ['unified-data', 'available-to-assign', variables.periodId] });
        queryClient.invalidateQueries({ queryKey: ['unified-data', 'budget-summary'] });
        queryClient.invalidateQueries({ queryKey: ['unified-data', 'categories'] });
        console.log('✅ Cache invalidation completed');
      } catch (invalidationError) {
        console.error('⚠️ Cache invalidation failed (non-critical):', invalidationError);
        // Don't throw here - allocation was successful, cache issues are non-critical
      }
    },
    onError: (error, variables, context) => {
      console.error('❌ Allocation mutation failed:', {
        error: error.message,
        variables,
        context,
        timestamp: new Date().toISOString()
      });
      
      // Don't throw here - let the UI handle the error gracefully
      // The error will be available in the mutation result
    },
    // Add retry configuration for transient failures
    retry: (failureCount, error) => {
      // Don't retry validation errors (they won't succeed on retry)
      if (error.message.includes('required') || error.message.includes('greater than 0')) {
        return false;
      }
      
      // Retry up to 2 times for other errors (like network issues)
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000) // Exponential backoff
  });
}

// ============================================================================
// COMPUTED DATA HOOKS
// ============================================================================

export function useBudgetSummary() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'budget-summary'],
    queryFn: () => dataManager?.getBudgetSummary() || null,
    enabled: isReady && !!dataManager,
    staleTime: 0});
}

export function useAvailableToAssign(periodId: string) {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'available-to-assign', periodId],
    queryFn: () => dataManager?.getAvailableToAssign(periodId) || 0,
    enabled: isReady && !!dataManager && !!periodId,
    staleTime: 0});
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useDataIntegrityReport() {
  const { dataManager, isReady } = useUnifiedData();

  return useQuery({
    queryKey: ['unified-data', 'integrity-report'],
    queryFn: () => dataManager?.getDataIntegrityReport() || null,
    enabled: isReady && !!dataManager,
    staleTime: 5000, // Check every 5 seconds
    refetchInterval: 5000});
}

export function useRefreshData() {
  const { dataManager } = useUnifiedData();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!dataManager) throw new Error('Data manager not initialized');
      await dataManager.refresh();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }});
}

/**
 * Hook for resetting all data (replaces problematic clearAllData)
 * Uses factory pattern for clean reset
 */
export function useResetAllData() {
  const { password } = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!password) throw new Error('Password is required');
      
      console.log('🔄 Starting complete data reset...');
      
      // Use factory reset instead of clearAllData
      const newManager = await resetDataManager(password);
      
      console.log('✅ Data reset completed, new instance created');
      return newManager;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating all cached data after reset...');
      
      // Clear all React Query cache
      queryClient.clear();
      
      // Invalidate the data manager query to force re-fetch
      queryClient.invalidateQueries({ queryKey: ['unified-data-manager'] });
      
      console.log('✅ All cached data invalidated');
    },
    onError: (error) => {
      console.error('❌ Data reset failed:', error);
    }
  });
}

/**
 * Hook for getting factory diagnostics
 */
export function useDataManagerDiagnostics() {
  return useQuery({
    queryKey: ['data-manager-diagnostics'],
    queryFn: () => getDataManagerDiagnostics(),
    refetchInterval: 5000, // Update every 5 seconds for monitoring
  });
}

// ============================================================================
// PERIOD-AWARE HOOKS (for current active period)
// ============================================================================

export function useCurrentPeriodTransactions() {
  const { data: transactions = [] } = useTransactions();
  const { data: activePeriod } = useActiveBudgetPeriod();

  const currentPeriodTransactions = transactions.filter(transaction => {
    if (!activePeriod) return false;
    const transactionDate = new Date(transaction.date);
    return transactionDate >= activePeriod.startDate && transactionDate <= activePeriod.endDate;
  });

  return { data: currentPeriodTransactions, activePeriod };
}

export function useCurrentPeriodSpending() {
  const { data: transactions = [] } = useCurrentPeriodTransactions();

  const spending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const categoryId = transaction.categoryId || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalSpent = Object.values(spending).reduce((sum, amount) => sum + amount, 0);

  return { spending, totalSpent };
}

// ============================================================================
// REAL-TIME STATUS HOOK
// ============================================================================

export function useDataStatus() {
  const { dataManager, isReady, error } = useUnifiedData();
  const { data: integrityReport } = useDataIntegrityReport();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!dataManager) return;

    const unsubscribe = dataManager.subscribe((event) => {
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [dataManager]);

  return {
    isInitialized: isReady,
    isHealthy: !error && (integrityReport?.isHealthy ?? true),
    lastUpdate,
    integrityReport,
    initError: error};
} 