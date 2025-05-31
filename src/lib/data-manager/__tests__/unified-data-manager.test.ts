import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedDataManager } from '../unified-data-manager';
import type { CreateTransactionInput, CreateBudgetCategoryInput, CreateAccountInput } from '../../../types/budget';

// Create comprehensive mocks for storage classes
const mockBudgetStorage = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getAllBudgets: vi.fn().mockResolvedValue([]),
  createBudget: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'test-budget-1',
    name: 'My Bitcoin Budget',
    description: 'Default budget',
    isActive: true,
    totalBalance: 0,
    unassignedBalance: 0,
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  })),
  getBudget: vi.fn().mockResolvedValue(null),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  getAllCategories: vi.fn().mockResolvedValue([]),
  createCategory: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'cat-' + Date.now(),
    budgetId: 'test-budget-1',
    currentAmount: 0,
    spentAmount: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  })),
  getCategory: vi.fn(),
  updateCategory: vi.fn().mockImplementation((id, updates) => Promise.resolve({
    id,
    budgetId: 'test-budget-1',
    currentAmount: 0,
    spentAmount: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...updates
  })),
  deleteCategory: vi.fn(),
  getAllTransactions: vi.fn().mockResolvedValue([]),
  createTransaction: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'tx-' + Date.now(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  })),
  getTransaction: vi.fn(),
  updateTransaction: vi.fn().mockImplementation((id, updates) => Promise.resolve({
    id,
    budgetId: 'test-budget-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    type: 'expense',
    amount: 10000,
    description: 'Test transaction',
    date: new Date(),
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...updates
  })),
  deleteTransaction: vi.fn(),
  getTransactionsByCategory: vi.fn().mockResolvedValue([]),
  getTransactionsByAccount: vi.fn().mockResolvedValue([]),
  getTransactionsByDateRange: vi.fn().mockResolvedValue([]),
  clearAllData: vi.fn().mockResolvedValue(undefined)
};

const mockAccountStorage = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getAllAccounts: vi.fn().mockResolvedValue([]),
  getAccounts: vi.fn().mockResolvedValue([]),
  createAccount: vi.fn().mockImplementation((budgetId, input) => Promise.resolve({
    id: 'acc-' + Date.now(),
    budgetId,
    balance: input.initialBalance || 0,
    isClosed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  })),
  getAccount: vi.fn(),
  updateAccount: vi.fn().mockImplementation((id, updates) => Promise.resolve({
    id,
    budgetId: 'test-budget-1',
    balance: 100000,
    isClosed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...updates
  })),
  deleteAccount: vi.fn(),
  updateAccountBalance: vi.fn().mockResolvedValue(undefined),
  getAccountBalance: vi.fn().mockResolvedValue(0),
  getAccountTransactions: vi.fn().mockResolvedValue([]),
  clearAllAccounts: vi.fn().mockResolvedValue(undefined)
};

const mockBudgetPeriodStorage = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getAllBudgetPeriods: vi.fn().mockResolvedValue([]),
  getBudgetPeriods: vi.fn().mockResolvedValue([]),
  createBudgetPeriod: vi.fn().mockImplementation((input) => Promise.resolve({
    id: 'period-' + Date.now(),
    name: new Date(input.year, input.month - 1).toLocaleString('default', { month: 'long' }) + ' ' + input.year,
    startDate: new Date(input.year, input.month - 1, 1),
    endDate: new Date(input.year, input.month, 0),
    isActive: false,
    totals: { income: 0, expenses: 0, allocated: 0, available: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  })),
  getBudgetPeriod: vi.fn(),
  updateBudgetPeriod: vi.fn(),
  deleteBudgetPeriod: vi.fn(),
  getCurrentOrCreateBudgetPeriod: vi.fn().mockImplementation(() => {
    const now = new Date();
    return Promise.resolve({
      id: 'current-period',
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
    });
  }),
  setActiveBudgetPeriod: vi.fn().mockResolvedValue(undefined),
  getAllCategoryAllocations: vi.fn().mockResolvedValue([]),
  getCategoryAllocations: vi.fn().mockResolvedValue([]),
  createCategoryAllocation: vi.fn(),
  updateCategoryAllocation: vi.fn(),
  deleteCategoryAllocation: vi.fn(),
  allocateFundsToCategory: vi.fn().mockResolvedValue(undefined),
  getAvailableToAssign: vi.fn().mockResolvedValue(0),
  calculatePeriodTotals: vi.fn().mockResolvedValue({
    income: 0,
    expenses: 0,
    allocated: 0,
    available: 0
  }),
  updateAllocationSpending: vi.fn().mockResolvedValue(undefined),
  clearAllData: vi.fn().mockResolvedValue(undefined)
};

// Mock the storage classes
vi.mock('../../storage/budget-storage', () => ({
  BudgetStorageService: vi.fn().mockImplementation(() => mockBudgetStorage)
}));

vi.mock('../../storage/account-storage', () => ({
  AccountStorage: vi.fn().mockImplementation(() => mockAccountStorage)
}));

vi.mock('../../storage/budget-period-storage', () => ({
  BudgetPeriodStorage: vi.fn().mockImplementation(() => mockBudgetPeriodStorage)
}));

describe('UnifiedDataManager', () => {
  let dataManager: UnifiedDataManager;
  const testPassword = 'test-password-123';

  beforeEach(() => {
    vi.clearAllMocks();
    dataManager = new UnifiedDataManager(testPassword);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(dataManager.initialize()).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      await dataManager.initialize();
      await dataManager.initialize(); // Should not throw or cause issues
    });

    it('should create default budget if none exists', async () => {
      await dataManager.initialize();
      const budget = dataManager.getBudget();
      expect(budget).toBeTruthy();
      expect(budget?.name).toBe('My Bitcoin Budget');
    });

    it('should ensure current budget period exists', async () => {
      await dataManager.initialize();
      const periods = dataManager.getPeriods();
      expect(periods.length).toBeGreaterThan(0);
      
      const activePeriod = dataManager.getActivePeriod();
      expect(activePeriod).toBeTruthy();
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should create transaction and update account balance', async () => {
      const transactionInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      const transaction = await dataManager.createTransaction(transactionInput);
      
      expect(transaction).toBeTruthy();
      expect(transaction.amount).toBe(50000);
      expect(transaction.type).toBe('expense');
      
      // Check that transaction is in cache
      const transactions = dataManager.getTransactions();
      expect(transactions).toContain(transaction);
    });

    it('should update transaction and recalculate balances', async () => {
      // First create a transaction
      const transactionInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      const transaction = await dataManager.createTransaction(transactionInput);
      
      // Then update it
      const updatedTransaction = await dataManager.updateTransaction(transaction.id, {
        amount: 75000,
        description: 'Updated expense'
      });

      expect(updatedTransaction.amount).toBe(75000);
      expect(updatedTransaction.description).toBe('Updated expense');
    });

    it('should delete transaction and update balances', async () => {
      const transactionInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      const transaction = await dataManager.createTransaction(transactionInput);
      await dataManager.deleteTransaction(transaction.id);
      
      const transactions = dataManager.getTransactions();
      expect(transactions.find(t => t.id === transaction.id)).toBeUndefined();
    });
  });

  describe('Category Operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should create category', async () => {
      const categoryInput: CreateBudgetCategoryInput = {
        budgetId: dataManager.getBudgetId(),
        name: 'Test Category',
        description: 'Test category description',
        color: '#10B981',
        targetAmount: 100000
      };

      const category = await dataManager.createCategory(categoryInput);
      
      expect(category).toBeTruthy();
      expect(category.name).toBe('Test Category');
      expect(category.targetAmount).toBe(100000);
      
      const categories = dataManager.getCategories();
      expect(categories).toContain(category);
    });

    it('should update category', async () => {
      const categoryInput: CreateBudgetCategoryInput = {
        budgetId: dataManager.getBudgetId(),
        name: 'Test Category',
        description: 'Test category description',
        color: '#10B981',
        targetAmount: 100000
      };

      const category = await dataManager.createCategory(categoryInput);
      const updatedCategory = await dataManager.updateCategory(category.id, {
        name: 'Updated Category',
        targetAmount: 150000
      });

      expect(updatedCategory.name).toBe('Updated Category');
      expect(updatedCategory.targetAmount).toBe(150000);
    });

    it('should delete category', async () => {
      const categoryInput: CreateBudgetCategoryInput = {
        budgetId: dataManager.getBudgetId(),
        name: 'Test Category',
        description: 'Test category description',
        color: '#10B981',
        targetAmount: 100000
      };

      const category = await dataManager.createCategory(categoryInput);
      await dataManager.deleteCategory(category.id);
      
      const categories = dataManager.getCategories();
      expect(categories.find(c => c.id === category.id)).toBeUndefined();
    });
  });

  describe('Account Operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should create account', async () => {
      const accountInput: CreateAccountInput = {
        name: 'Test Account',
        type: 'spending',
        isOnBudget: true,
        initialBalance: 100000
      };

      const account = await dataManager.createAccount(accountInput);
      
      expect(account).toBeTruthy();
      expect(account.name).toBe('Test Account');
      expect(account.type).toBe('spending');
      expect(account.balance).toBe(100000);
      
      const accounts = dataManager.getAccounts();
      expect(accounts).toContain(account);
    });

    it('should update account', async () => {
      const accountInput: CreateAccountInput = {
        name: 'Test Account',
        type: 'spending',
        isOnBudget: true,
        initialBalance: 100000
      };

      const account = await dataManager.createAccount(accountInput);
      const updatedAccount = await dataManager.updateAccount(account.id, {
        name: 'Updated Account',
        type: 'savings'
      });

      expect(updatedAccount.name).toBe('Updated Account');
      expect(updatedAccount.type).toBe('savings');
    });

    it('should delete account', async () => {
      const accountInput: CreateAccountInput = {
        name: 'Test Account',
        type: 'spending',
        isOnBudget: true,
        initialBalance: 100000
      };

      const account = await dataManager.createAccount(accountInput);
      await dataManager.deleteAccount(account.id);
      
      const accounts = dataManager.getAccounts();
      expect(accounts.find(a => a.id === account.id)).toBeUndefined();
    });
  });

  describe('Budget Period Operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should create budget period', async () => {
      const periodInput = {
        budgetId: dataManager.getBudgetId(),
        year: 2024,
        month: 11
      };

      const period = await dataManager.createBudgetPeriod(periodInput);
      
      expect(period).toBeTruthy();
      expect(period.year).toBe(2024);
      expect(period.month).toBe(11);
      expect(period.name).toBe('November 2024');
      
      const periods = dataManager.getPeriods();
      expect(periods).toContain(period);
    });

    it('should get or create current budget period', async () => {
      const currentPeriod = await dataManager.getCurrentOrCreateBudgetPeriod();
      
      expect(currentPeriod).toBeTruthy();
      expect(currentPeriod.year).toBe(new Date().getFullYear());
      expect(currentPeriod.month).toBe(new Date().getMonth() + 1);
    });

    it('should set active period', async () => {
      const periodInput = {
        budgetId: dataManager.getBudgetId(),
        year: 2024,
        month: 11
      };

      const period = await dataManager.createBudgetPeriod(periodInput);
      await dataManager.setActivePeriod(period.id);
      
      const activePeriod = dataManager.getActivePeriod();
      expect(activePeriod?.id).toBe(period.id);
    });
  });

  describe('Data Consistency', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should maintain account balance consistency', async () => {
      // Create account
      const accountInput: CreateAccountInput = {
        name: 'Test Account',
        type: 'spending',
        isOnBudget: true,
        initialBalance: 100000
      };
      const account = await dataManager.createAccount(accountInput);

      // Create income transaction
      const incomeInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: account.id,
        categoryId: null,
        type: 'income',
        amount: 50000,
        description: 'Test income',
        date: new Date(),
        tags: []
      };
      await dataManager.createTransaction(incomeInput);

      // Create expense transaction
      const expenseInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: account.id,
        categoryId: 'cat-1',
        type: 'expense',
        amount: 25000,
        description: 'Test expense',
        date: new Date(),
        tags: []
      };
      await dataManager.createTransaction(expenseInput);

      // Check account balance
      const accounts = dataManager.getAccounts();
      const updatedAccount = accounts.find(a => a.id === account.id);
      expect(updatedAccount?.balance).toBe(125000); // 100000 + 50000 - 25000
    });

    it('should provide accurate budget summary', async () => {
      const summary = dataManager.getBudgetSummary();
      
      expect(summary).toBeTruthy();
      expect(typeof summary.totalIncome).toBe('number');
      expect(typeof summary.totalExpenses).toBe('number');
      expect(typeof summary.totalAccountBalance).toBe('number');
      expect(typeof summary.unassignedBalance).toBe('number');
      expect(typeof summary.netWorth).toBe('number');
    });

    it('should calculate available to assign correctly', async () => {
      const activePeriod = dataManager.getActivePeriod();
      if (activePeriod) {
        const available = dataManager.getAvailableToAssign(activePeriod.id);
        expect(typeof available).toBe('number');
        // Available to assign can be negative if over-allocated
        expect(available).toBeDefined();
      }
    });

    it('should provide healthy data integrity report', async () => {
      const report = dataManager.getDataIntegrityReport();
      
      expect(report).toBeTruthy();
      expect(report.isHealthy).toBe(true);
      expect(report.orphanedTransactions).toBe(0);
      expect(report.accountBalanceErrors).toBe(0);
      expect(typeof report.totalTransactions).toBe('number');
      expect(typeof report.totalAccounts).toBe('number');
      expect(report.lastSync).toBeInstanceOf(Date);
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should notify listeners of data changes', async () => {
      const listener = vi.fn();
      const unsubscribe = dataManager.subscribe(listener);

      // Create a transaction to trigger event
      const transactionInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      await dataManager.createTransaction(transactionInput);

      expect(listener).toHaveBeenCalledWith({
        type: 'transaction-created',
        data: expect.any(Object)
      });

      unsubscribe();
    });

    it('should handle listener errors gracefully', async () => {
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      dataManager.subscribe(badListener);

      // This should not throw even though listener throws
      const transactionInput: CreateTransactionInput = {
        budgetId: dataManager.getBudgetId(),
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: 50000,
        description: 'Test expense',
        date: new Date(),
        tags: ['test']
      };

      await expect(dataManager.createTransaction(transactionInput)).resolves.not.toThrow();
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should clear all data', async () => {
      // Create some data first
      const categoryInput: CreateBudgetCategoryInput = {
        budgetId: dataManager.getBudgetId(),
        name: 'Test Category',
        description: 'Test category description',
        color: '#10B981',
        targetAmount: 100000
      };
      await dataManager.createCategory(categoryInput);

      // Clear all data
      await dataManager.clearAllData();

      // Check that data is cleared
      expect(dataManager.getBudget()).toBeNull();
      expect(dataManager.getCategories()).toEqual([]);
      expect(dataManager.getTransactions()).toEqual([]);
      expect(dataManager.getAccounts()).toEqual([]);
      expect(dataManager.getPeriods()).toEqual([]);
    });

    it('should refresh data', async () => {
      await expect(dataManager.refresh()).resolves.not.toThrow();
    });

    it('should reset database', async () => {
      await expect(dataManager.resetDatabase()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Create a new manager with mocks that throw errors
      const errorBudgetStorage = {
        ...mockBudgetStorage,
        initialize: vi.fn().mockRejectedValue(new Error('Storage initialization failed'))
      };
      
      // Mock the storage constructor to return our error storage
      const { BudgetStorageService } = await import('../../storage/budget-storage');
      vi.mocked(BudgetStorageService).mockImplementation(() => errorBudgetStorage as any);
      
      const errorManager = new UnifiedDataManager('bad-password');
      
      // Should handle errors without crashing
      await expect(errorManager.initialize()).rejects.toThrow('Storage initialization failed');
    });

    it('should throw error when accessing data before initialization', () => {
      const uninitializedManager = new UnifiedDataManager(testPassword);
      
      expect(() => uninitializedManager.getBudgetId()).toThrow('No budget loaded');
    });

    it('should handle missing transactions gracefully', async () => {
      await dataManager.initialize();
      
      await expect(dataManager.updateTransaction('non-existent-id', {})).rejects.toThrow('Transaction not found');
      await expect(dataManager.deleteTransaction('non-existent-id')).rejects.toThrow('Transaction not found');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should handle multiple operations efficiently', async () => {
      const startTime = Date.now();

      // Create multiple categories
      const categoryPromises = Array.from({ length: 10 }, (_, i) => 
        dataManager.createCategory({
          budgetId: dataManager.getBudgetId(),
          name: `Category ${i}`,
          description: `Test category ${i}`,
          color: '#10B981',
          targetAmount: 10000 * (i + 1)
        })
      );

      await Promise.all(categoryPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should maintain cache consistency under concurrent operations', async () => {
      // Create account first
      const account = await dataManager.createAccount({
        name: 'Test Account',
        type: 'spending',
        isOnBudget: true,
        initialBalance: 1000000
      });

      // Create multiple transactions concurrently
      const transactionPromises = Array.from({ length: 5 }, (_, i) => 
        dataManager.createTransaction({
          budgetId: dataManager.getBudgetId(),
          accountId: account.id,
          categoryId: null,
          type: 'expense',
          amount: 10000,
          description: `Transaction ${i}`,
          date: new Date(),
          tags: []
        })
      );

      await Promise.all(transactionPromises);

      // Check that all transactions are in cache
      const transactions = dataManager.getTransactions();
      const testTransactions = transactions.filter(t => t.accountId === account.id);
      expect(testTransactions).toHaveLength(5);

      // Check account balance consistency
      const accounts = dataManager.getAccounts();
      const updatedAccount = accounts.find(a => a.id === account.id);
      expect(updatedAccount?.balance).toBe(950000); // 1000000 - (5 * 10000)
    });
  });
}); 