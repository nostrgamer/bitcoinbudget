import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock password hook
export const mockPassword = 'test-password-123';

vi.mock('../hooks/use-password', () => ({
  usePassword: () => ({
    password: mockPassword,
    isLoading: false,
    setPassword: vi.fn(),
    hasPassword: true
  })
}));

// Create comprehensive mock data
export const createMockData = () => {
  const mockBudget = {
    id: 'test-budget-1',
    name: 'Test Budget',
    description: 'Test budget for testing',
    isActive: true,
    totalBalance: 1000000, // 1M sats
    unassignedBalance: 500000, // 500k sats
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCategories = [
    {
      id: 'cat-1',
      budgetId: 'test-budget-1',
      name: 'Food',
      description: 'Food expenses',
      color: '#10B981',
      targetAmount: 100000,
      currentAmount: 50000,
      spentAmount: 25000,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cat-2',
      budgetId: 'test-budget-1',
      name: 'Transport',
      description: 'Transportation costs',
      color: '#3B82F6',
      targetAmount: 50000,
      currentAmount: 30000,
      spentAmount: 15000,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockAccounts = [
    {
      id: 'acc-1',
      budgetId: 'test-budget-1',
      name: 'Hardware Wallet',
      type: 'savings' as const,
      balance: 800000,
      isOnBudget: true,
      isClosed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'acc-2',
      budgetId: 'test-budget-1',
      name: 'Mobile Wallet',
      type: 'spending' as const,
      balance: 200000,
      isOnBudget: true,
      isClosed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTransactions = [
    {
      id: 'tx-1',
      budgetId: 'test-budget-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      type: 'expense' as const,
      amount: 25000,
      description: 'Grocery shopping',
      date: new Date(),
      tags: ['food', 'weekly'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'tx-2',
      budgetId: 'test-budget-1',
      accountId: 'acc-2',
      categoryId: null,
      type: 'income' as const,
      amount: 1000000,
      description: 'Bitcoin purchase',
      date: new Date(),
      tags: ['income'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockPeriods = [
    {
      id: 'period-1',
      budgetId: 'test-budget-1',
      year: 2024,
      month: 12,
      name: 'December 2024',
      startDate: new Date(2024, 11, 1),
      endDate: new Date(2024, 11, 31),
      isActive: true,
      totals: {
        income: 1000000,
        expenses: 40000,
        allocated: 150000,
        available: 810000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockAllocations = [
    {
      id: 'alloc-1',
      periodId: 'period-1',
      categoryId: 'cat-1',
      targetAmount: 100000,
      currentAmount: 50000,
      spentAmount: 25000,
      rolloverAmount: 0,
      isOverspent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  return {
    budget: mockBudget,
    categories: mockCategories,
    accounts: mockAccounts,
    transactions: mockTransactions,
    periods: mockPeriods,
    allocations: mockAllocations
  };
};

// Mock unified data manager with proper data consistency
export const createMockDataManager = () => {
  const mockData = createMockData();
  
  // Create mutable copies for testing
  let categories = [...mockData.categories];
  let accounts = [...mockData.accounts];
  let transactions = [...mockData.transactions];
  let periods = [...mockData.periods];
  let allocations = [...mockData.allocations];

  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    getBudget: vi.fn().mockReturnValue(mockData.budget),
    getCategories: vi.fn().mockImplementation(() => [...categories]),
    getTransactions: vi.fn().mockImplementation(() => [...transactions]),
    getAccounts: vi.fn().mockImplementation(() => [...accounts]),
    getPeriods: vi.fn().mockImplementation(() => [...periods]),
    getAllocations: vi.fn().mockImplementation(() => [...allocations]),
    getActivePeriod: vi.fn().mockImplementation(() => periods.find(p => p.isActive) || periods[0]),
    getBudgetId: vi.fn().mockReturnValue('test-budget-1'),
    
    // CRUD operations with proper data management
    createTransaction: vi.fn().mockImplementation((input) => {
      const newTransaction = {
        id: 'new-tx-' + Date.now(),
        budgetId: 'test-budget-1',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      transactions.push(newTransaction);
      return Promise.resolve(newTransaction);
    }),
    updateTransaction: vi.fn().mockImplementation((id, updates) => {
      const index = transactions.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Transaction not found');
      
      const updatedTransaction = { ...transactions[index], ...updates, updatedAt: new Date() };
      transactions[index] = updatedTransaction;
      return Promise.resolve(updatedTransaction);
    }),
    deleteTransaction: vi.fn().mockImplementation((id) => {
      const index = transactions.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Transaction not found');
      
      transactions.splice(index, 1);
      return Promise.resolve(undefined);
    }),
    
    createCategory: vi.fn().mockImplementation((input) => {
      const newCategory = {
        id: 'new-cat-' + Date.now(),
        budgetId: 'test-budget-1',
        currentAmount: 0,
        spentAmount: 0,
        isArchived: false,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      categories.push(newCategory);
      return Promise.resolve(newCategory);
    }),
    updateCategory: vi.fn().mockImplementation((id, updates) => {
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Category not found');
      
      const updatedCategory = { ...categories[index], ...updates, updatedAt: new Date() };
      categories[index] = updatedCategory;
      return Promise.resolve(updatedCategory);
    }),
    deleteCategory: vi.fn().mockImplementation((id) => {
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Category not found');
      
      categories.splice(index, 1);
      return Promise.resolve(undefined);
    }),
    
    createAccount: vi.fn().mockImplementation((input) => {
      const newAccount = {
        id: 'new-acc-' + Date.now(),
        budgetId: 'test-budget-1',
        balance: input.initialBalance || 0,
        isClosed: false,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      accounts.push(newAccount);
      return Promise.resolve(newAccount);
    }),
    updateAccount: vi.fn().mockImplementation((id, updates) => {
      const index = accounts.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Account not found');
      
      const updatedAccount = { ...accounts[index], ...updates, updatedAt: new Date() };
      accounts[index] = updatedAccount;
      return Promise.resolve(updatedAccount);
    }),
    deleteAccount: vi.fn().mockImplementation((id) => {
      const index = accounts.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Account not found');
      
      accounts.splice(index, 1);
      return Promise.resolve(undefined);
    }),
    
    createBudgetPeriod: vi.fn().mockImplementation((input) => {
      const newPeriod = {
        id: 'new-period-' + Date.now(),
        name: `${input.month}/${input.year}`,
        startDate: new Date(input.year, input.month - 1, 1),
        endDate: new Date(input.year, input.month, 0),
        isActive: false,
        totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
        ...input,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      periods.push(newPeriod);
      return Promise.resolve(newPeriod);
    }),
    getCurrentOrCreateBudgetPeriod: vi.fn().mockImplementation(() => {
      const now = new Date();
      const currentPeriod = {
        id: 'current-period-' + Date.now(),
        budgetId: 'test-budget-1',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        name: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        isActive: true,
        totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return Promise.resolve(currentPeriod);
    }),
    setActivePeriod: vi.fn().mockImplementation((periodId) => {
      periods.forEach(p => {
        p.isActive = p.id === periodId;
      });
      return Promise.resolve(undefined);
    }),
    
    allocateFunds: vi.fn().mockResolvedValue(undefined),
    
    // Computed values
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
    
    // Utility methods
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
    resetDatabase: vi.fn().mockResolvedValue(undefined),
    
    // Reset function for tests
    _resetMockData: () => {
      const freshData = createMockData();
      categories = [...freshData.categories];
      accounts = [...freshData.accounts];
      transactions = [...freshData.transactions];
      periods = [...freshData.periods];
      allocations = [...freshData.allocations];
    }
  };
};

// Global mock instance
let mockDataManagerInstance: ReturnType<typeof createMockDataManager> | null = null;

// Mock the unified data manager module
vi.mock('../lib/data-manager/unified-data-manager', () => {
  return {
    getDataManager: vi.fn().mockImplementation(() => {
      if (!mockDataManagerInstance) {
        mockDataManagerInstance = createMockDataManager();
      }
      return mockDataManagerInstance;
    }),
    UnifiedDataManager: vi.fn().mockImplementation(() => {
      if (!mockDataManagerInstance) {
        mockDataManagerInstance = createMockDataManager();
      }
      return mockDataManagerInstance;
    })
  };
});

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as default
export { renderWithProviders as render };

// Test data factories
export const createTestTransaction = (overrides = {}) => ({
  id: 'test-tx-' + Math.random(),
  budgetId: 'test-budget-1',
  accountId: 'acc-1',
  categoryId: 'cat-1',
  type: 'expense' as const,
  amount: 10000,
  description: 'Test transaction',
  date: new Date(),
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestCategory = (overrides = {}) => ({
  id: 'test-cat-' + Math.random(),
  budgetId: 'test-budget-1',
  name: 'Test Category',
  description: 'Test category description',
  color: '#10B981',
  targetAmount: 100000,
  currentAmount: 50000,
  spentAmount: 25000,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestAccount = (overrides = {}) => ({
  id: 'test-acc-' + Math.random(),
  budgetId: 'test-budget-1',
  name: 'Test Account',
  type: 'spending' as const,
  balance: 100000,
  isOnBudget: true,
  isClosed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestBudgetPeriod = (overrides = {}) => ({
  id: 'test-period-' + Math.random(),
  budgetId: 'test-budget-1',
  year: 2024,
  month: 12,
  name: 'December 2024',
  startDate: new Date(2024, 11, 1),
  endDate: new Date(2024, 11, 31),
  isActive: true,
  totals: {
    income: 1000000,
    expenses: 40000,
    allocated: 150000,
    available: 810000
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Helper to reset mock data between tests
export const resetMockData = () => {
  if (mockDataManagerInstance && '_resetMockData' in mockDataManagerInstance) {
    (mockDataManagerInstance as any)._resetMockData();
  }
}; 