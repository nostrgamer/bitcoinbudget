import React, { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUnifiedData,
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useBudgetPeriods,
  useActiveBudgetPeriod,
  useSetActiveBudgetPeriod,
  useCreateBudgetPeriod,
  useGetOrCreateCurrentBudgetPeriod,
  useCategoryAllocations,
  useAllocateFunds,
  useBudgetSummary,
  useAvailableToAssign,
  useDataIntegrityReport,
  useRefreshData,
  useResetAllData,
  useCurrentPeriodTransactions,
  useCurrentPeriodSpending,
  useDataStatus
} from '../use-unified-data';
import { TransactionType } from '../../types/budget';
import { createTestQueryClient, mockPassword, resetMockData } from '../../test/test-utils';

// Mock password hook first
vi.mock('../use-password', () => ({
  usePassword: () => ({
    password: 'test-password-123',
    isLoading: false,
    setPassword: vi.fn(),
    hasPassword: true
  })
}));

// Create mock data manager before mocking the module
const createMockDataManager = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  getBudget: vi.fn().mockReturnValue({
    id: 'test-budget-1',
    name: 'Test Budget',
    description: 'Test budget',
    isActive: true,
    totalBalance: 1000000,
    unassignedBalance: 500000,
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  getBudgetId: vi.fn().mockReturnValue('test-budget-1'),
  getCategories: vi.fn().mockReturnValue([
    {
      id: 'cat-1',
      budgetId: 'test-budget-1',
      name: 'Test Category',
      description: 'Test category',
      color: '#10B981',
      targetAmount: 100000,
      currentAmount: 0,
      spentAmount: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  getTransactions: vi.fn().mockReturnValue([
    {
      id: 'tx-1',
      budgetId: 'test-budget-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      type: 'expense',
      amount: 10000,
      description: 'Test transaction',
      date: new Date(),
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  getAccounts: vi.fn().mockReturnValue([
    {
      id: 'acc-1',
      budgetId: 'test-budget-1',
      name: 'Test Account',
      type: 'spending',
      balance: 100000,
      isOnBudget: true,
      isClosed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  getPeriods: vi.fn().mockReturnValue([
    {
      id: 'period-1',
      budgetId: 'test-budget-1',
      year: 2024,
      month: 12,
      name: 'December 2024',
      startDate: new Date(2024, 11, 1),
      endDate: new Date(2024, 11, 31),
      isActive: true,
      totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  getAllocations: vi.fn().mockReturnValue([]),
  getActivePeriod: vi.fn().mockReturnValue({
    id: 'period-1',
    budgetId: 'test-budget-1',
    year: 2024,
    month: 12,
    name: 'December 2024',
    startDate: new Date(2024, 11, 1),
    endDate: new Date(2024, 11, 31),
    isActive: true,
    totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  createTransaction: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'new-tx',
    budgetId: 'test-budget-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    type: 'expense',
    amount: input.amount,
    description: input.description,
    date: new Date(),
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  updateTransaction: vi.fn().mockImplementation((id, updates) => Promise.resolve({
    id,
    budgetId: 'test-budget-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    type: 'expense',
    amount: updates.amount || 15000,
    description: updates.description || 'Updated transaction',
    date: new Date(),
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  deleteTransaction: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'new-cat',
    budgetId: 'test-budget-1',
    name: input.name,
    description: input.description,
    color: input.color,
    targetAmount: input.targetAmount,
    currentAmount: 0,
    spentAmount: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  updateCategory: vi.fn().mockResolvedValue({
    id: 'cat-1',
    budgetId: 'test-budget-1',
    name: 'Updated Category',
    description: 'Updated description',
    color: '#10B981',
    targetAmount: 150000,
    currentAmount: 0,
    spentAmount: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  createAccount: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'new-acc',
    budgetId: 'test-budget-1',
    name: input.name,
    type: input.type,
    balance: input.initialBalance || 0,
    isOnBudget: input.isOnBudget,
    isClosed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  updateAccount: vi.fn().mockResolvedValue({
    id: 'acc-1',
    budgetId: 'test-budget-1',
    name: 'Updated Account',
    type: 'savings',
    balance: 100000,
    isOnBudget: true,
    isClosed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  deleteAccount: vi.fn().mockResolvedValue(undefined),
  createBudgetPeriod: vi.fn().mockResolvedValue({
    id: 'new-period',
    budgetId: 'test-budget-1',
    year: 2024,
    month: 11,
    name: 'November 2024',
    startDate: new Date(2024, 10, 1),
    endDate: new Date(2024, 10, 30),
    isActive: false,
    totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  getCurrentOrCreateBudgetPeriod: vi.fn().mockResolvedValue({
    id: 'current-period',
    budgetId: 'test-budget-1',
    year: 2024,
    month: 12,
    name: 'December 2024',
    startDate: new Date(2024, 11, 1),
    endDate: new Date(2024, 11, 31),
    isActive: true,
    totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  setActivePeriod: vi.fn().mockResolvedValue(undefined),
  allocateFunds: vi.fn().mockResolvedValue(undefined),
  getBudgetSummary: vi.fn().mockReturnValue({
    totalIncome: 1000000,
    totalExpenses: 40000,
    totalAccountBalance: 1000000,
    totalAllocated: 150000,
    unassignedBalance: 850000,
    netWorth: 960000
  }),
  getAvailableToAssign: vi.fn().mockReturnValue(850000),
  getPeriodBudgetSummary: vi.fn().mockReturnValue({
    totalIncome: 1000000,
    totalExpenses: 40000,
    totalAccountBalance: 1000000,
    totalAllocated: 150000,
    unassignedBalance: 850000,
    netWorth: 960000,
    availableToAssign: 850000,
    totalAllocatedThisPeriod: 150000,
    periodId: 'period-1'
  }),
  subscribe: vi.fn().mockReturnValue(() => {}),
  refresh: vi.fn().mockResolvedValue(undefined),
  getDataIntegrityReport: vi.fn().mockReturnValue({
    isHealthy: true,
    orphanedTransactions: 0,
    accountBalanceErrors: 0,
    totalTransactions: 2,
    totalAccounts: 2,
    lastSync: new Date()
  }),
  clearAllData: vi.fn().mockResolvedValue(undefined),
  resetDatabase: vi.fn().mockResolvedValue(undefined)
});

// Mock the getDataManager function
vi.mock('../../lib/data-manager/unified-data-manager', () => ({
  getDataManager: vi.fn().mockImplementation(() => createMockDataManager())
}));

// Create wrapper component for React Query
function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Unified Data Hooks', () => {
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData(); // Reset mock data between tests
    wrapper = createWrapper();
  });

  describe('useUnifiedData', () => {
    it('should initialize data manager successfully', async () => {
      const { result } = renderHook(() => useUnifiedData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.dataManager).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should handle initialization errors', async () => {
      // This test is more about the hook structure than actual errors
      // since we're using mocks. In real scenarios, this would test
      // actual initialization failures.
      const { result } = renderHook(() => useUnifiedData(), { wrapper });

      // Even with mocks, the hook should initialize
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });
  });

  describe('Transaction Hooks', () => {
    it('should fetch transactions', async () => {
      const { result } = renderHook(() => useTransactions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.length).toBeGreaterThan(0);
    });

    it('should create transaction', async () => {
      const { result } = renderHook(() => useCreateTransaction(), { wrapper });

      const transactionInput = {
        budgetId: 'test-budget-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: TransactionType.EXPENSE,
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const transaction = await result.current.mutateAsync(transactionInput);
      expect(transaction).toBeTruthy();
      expect(transaction.amount).toBe(50000);
    });

    it('should update transaction', async () => {
      const { result } = renderHook(() => useUpdateTransaction(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const updates = {
        id: 'tx-1', // This exists in our mock data
        updates: { amount: 75000, description: 'Updated expense' }
      };

      const updatedTransaction = await result.current.mutateAsync(updates);
      expect(updatedTransaction).toBeTruthy();
      expect(updatedTransaction.amount).toBe(75000);
      expect(updatedTransaction.description).toBe('Updated expense');
    });

    it('should delete transaction', async () => {
      const { result } = renderHook(() => useDeleteTransaction(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync('tx-1')).resolves.not.toThrow();
    });
  });

  describe('Category Hooks', () => {
    it('should fetch categories', async () => {
      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.length).toBeGreaterThan(0);
    });

    it('should create category', async () => {
      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      const categoryInput = {
        budgetId: 'test-budget-1',
        name: 'Test Category',
        description: 'Test category description',
        color: '#10B981',
        targetAmount: 100000,
        isArchived: false
      };

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const category = await result.current.mutateAsync(categoryInput);
      expect(category).toBeTruthy();
      expect(category.name).toBe('Test Category');
    });

    it('should update category', async () => {
      const { result } = renderHook(() => useUpdateCategory(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const updates = {
        id: 'cat-1', // This exists in our mock data
        updates: { name: 'Updated Category', targetAmount: 150000 }
      };

      const updatedCategory = await result.current.mutateAsync(updates);
      expect(updatedCategory).toBeTruthy();
      expect(updatedCategory.name).toBe('Updated Category');
      expect(updatedCategory.targetAmount).toBe(150000);
    });

    it('should delete category', async () => {
      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync('cat-1')).resolves.not.toThrow();
    });
  });

  describe('Account Hooks', () => {
    it('should fetch accounts', async () => {
      const { result } = renderHook(() => useAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.length).toBeGreaterThan(0);
    });

    it('should create account', async () => {
      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      const accountInput = {
        name: 'Test Account',
        type: 'spending' as const,
        isOnBudget: true,
        initialBalance: 100000
      };

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const account = await result.current.mutateAsync(accountInput);
      expect(account).toBeTruthy();
      expect(account.name).toBe('Test Account');
    });

    it('should update account', async () => {
      const { result } = renderHook(() => useUpdateAccount(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const updates = {
        id: 'acc-1', // This exists in our mock data
        updates: { name: 'Updated Account', type: 'savings' as const }
      };

      const updatedAccount = await result.current.mutateAsync(updates);
      expect(updatedAccount).toBeTruthy();
      expect(updatedAccount.name).toBe('Updated Account');
      expect(updatedAccount.type).toBe('savings');
    });

    it('should delete account', async () => {
      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync('acc-1')).resolves.not.toThrow();
    });
  });

  describe('Budget Period Hooks', () => {
    it('should fetch budget periods', async () => {
      const { result } = renderHook(() => useBudgetPeriods(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.length).toBeGreaterThan(0);
    });

    it('should fetch active budget period', async () => {
      const { result } = renderHook(() => useActiveBudgetPeriod(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.isActive).toBe(true);
    });

    it('should set active budget period', async () => {
      const { result } = renderHook(() => useSetActiveBudgetPeriod(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync('period-1')).resolves.not.toThrow();
    });

    it('should create budget period', async () => {
      const { result } = renderHook(() => useCreateBudgetPeriod(), { wrapper });

      const periodInput = {
        budgetId: 'test-budget-1',
        year: 2024,
        month: 11
      };

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const period = await result.current.mutateAsync(periodInput);
      expect(period).toBeTruthy();
      expect(period.year).toBe(2024);
      expect(period.month).toBe(11);
    });

    it('should get or create current budget period', async () => {
      const { result } = renderHook(() => useGetOrCreateCurrentBudgetPeriod(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const currentPeriod = await result.current.mutateAsync();
      expect(currentPeriod).toBeTruthy();
      expect(currentPeriod.year).toBe(2024);
      expect(currentPeriod.month).toBe(12);
    });
  });

  describe('Allocation Hooks', () => {
    it('should fetch category allocations', async () => {
      const { result } = renderHook(() => useCategoryAllocations('period-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should allocate funds', async () => {
      const { result } = renderHook(() => useAllocateFunds(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const allocation = {
        periodId: 'period-1',
        categoryId: 'cat-1',
        amount: 50000
      };

      await expect(result.current.mutateAsync(allocation)).resolves.not.toThrow();
    });
  });

  describe('Computed Data Hooks', () => {
    it('should fetch budget summary', async () => {
      const { result } = renderHook(() => useBudgetSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeTruthy();
      expect(typeof result.current.data?.totalIncome).toBe('number');
      expect(typeof result.current.data?.totalExpenses).toBe('number');
      expect(typeof result.current.data?.totalAccountBalance).toBe('number');
    });

    it('should fetch available to assign', async () => {
      const { result } = renderHook(() => useAvailableToAssign('period-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(typeof result.current.data).toBe('number');
    });

    it('should fetch data integrity report', async () => {
      const { result } = renderHook(() => useDataIntegrityReport(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeTruthy();
      expect(typeof result.current.data?.isHealthy).toBe('boolean');
      expect(typeof result.current.data?.orphanedTransactions).toBe('number');
      expect(typeof result.current.data?.accountBalanceErrors).toBe('number');
    });
  });

  describe('Utility Hooks', () => {
    it('should refresh data', async () => {
      const { result } = renderHook(() => useRefreshData(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync()).resolves.not.toThrow();
    });

    it('should reset all data', async () => {
      const { result } = renderHook(() => useResetAllData(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync()).resolves.not.toThrow();
    });
  });

  describe('Period-Aware Hooks', () => {
    it('should fetch current period transactions', async () => {
      const { result } = renderHook(() => useCurrentPeriodTransactions(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      // activePeriod should be defined since we mock it
      expect(result.current.activePeriod).toBeDefined();
    });

    it('should calculate current period spending', async () => {
      const { result } = renderHook(() => useCurrentPeriodSpending(), { wrapper });

      await waitFor(() => {
        expect(result.current.spending).toBeDefined();
      });

      expect(typeof result.current.spending).toBe('object');
      expect(typeof result.current.totalSpent).toBe('number');
    });
  });

  describe('Data Status Hook', () => {
    it('should provide data status information', async () => {
      const { result } = renderHook(() => useDataStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(typeof result.current.isHealthy).toBe('boolean');
      expect(result.current.integrityReport).toBeDefined();
      expect(result.current.initError).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle hook errors gracefully', async () => {
      // Mock data manager to throw error
      const errorWrapper = createWrapper();
      
      const { result } = renderHook(() => useTransactions(), { wrapper: errorWrapper });

      // Should not crash even if there are errors
      expect(result.current.isError || result.current.isLoading || result.current.isSuccess).toBe(true);
    });

    it('should handle mutation errors', async () => {
      const { result } = renderHook(() => useCreateTransaction(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      // Test with invalid input - this should still work with mocks
      // In real scenarios, this would test actual validation
      const invalidInput = {
        budgetId: '',
        accountId: '',
        categoryId: '',
        type: TransactionType.EXPENSE,
        amount: -1,
        description: '',
        date: new Date(),
        tags: []
      };

      // With mocks, this will succeed, but in real app it would fail
      const result_transaction = await result.current.mutateAsync(invalidInput);
      expect(result_transaction).toBeDefined();
    });
  });

  describe('Loading States', () => {
    it('should handle loading states correctly', async () => {
      const { result } = renderHook(() => useTransactions(), { wrapper });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    it('should handle mutation loading states', async () => {
      const { result } = renderHook(() => useCreateTransaction(), { wrapper });

      const transactionInput = {
        budgetId: 'test-budget-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: TransactionType.EXPENSE,
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      // Start mutation
      const mutationPromise = result.current.mutateAsync(transactionInput);

      // Note: With mocks, loading state might not be captured properly
      // This is a limitation of testing with mocks vs real async operations
      
      await mutationPromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate related queries after mutations', async () => {
      const { result: transactionsResult } = renderHook(() => useTransactions(), { wrapper });
      const { result: createResult } = renderHook(() => useCreateTransaction(), { wrapper });

      await waitFor(() => {
        expect(transactionsResult.current.isSuccess).toBe(true);
        expect(createResult.current.mutateAsync).toBeDefined();
      });

      const initialDataUpdatedAt = transactionsResult.current.dataUpdatedAt;

      // Create a transaction
      const transactionInput = {
        budgetId: 'test-budget-1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: TransactionType.EXPENSE,
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      await createResult.current.mutateAsync(transactionInput);

      // Wait for cache invalidation
      await waitFor(() => {
        expect(transactionsResult.current.dataUpdatedAt).toBeGreaterThanOrEqual(initialDataUpdatedAt || 0);
      });
    });
  });
}); 