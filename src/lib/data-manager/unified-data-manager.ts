import { BudgetStorageService } from '../storage/budget-storage';
import { AccountStorage } from '../storage/account-storage';
import { BudgetPeriodStorage } from '../storage/budget-period-storage';
import type { 
  Budget, 
  BudgetCategory, 
  Transaction, 
  Account, 
  BudgetPeriod, 
  CategoryAllocation,
  CreateTransactionInput,
  CreateBudgetCategoryInput,
  CreateAccountInput,
  CreateBudgetPeriodInput
} from '../../types/budget';

/**
 * Unified Data Manager - Single source of truth for all budget data
 * Handles all CRUD operations and maintains data consistency automatically
 */
export class UnifiedDataManager {
  private budgetStorage: BudgetStorageService;
  private accountStorage: AccountStorage;
  private periodStorage: BudgetPeriodStorage;
  private password: string;
  private isInitialized = false;

  // In-memory cache for immediate consistency
  private cache = {
    budget: null as Budget | null,
    categories: [] as BudgetCategory[],
    transactions: [] as Transaction[],
    accounts: [] as Account[],
    periods: [] as BudgetPeriod[],
    allocations: new Map<string, CategoryAllocation[]>(), // periodId -> allocations
    lastSync: 0
  };

  // Event listeners for real-time updates
  private listeners = new Set<(event: DataChangeEvent) => void>();

  constructor(password: string) {
    this.password = password;
    this.budgetStorage = new BudgetStorageService();
    this.accountStorage = new AccountStorage(password);
    this.periodStorage = new BudgetPeriodStorage(password);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.budgetStorage.initialize(this.password);
    await this.loadAllData();
    
    // Ensure we have a current budget period
    await this.ensureCurrentBudgetPeriod();
    
    this.isInitialized = true;
  }

  // ============================================================================
  // DATA LOADING & CACHING
  // ============================================================================

  private async loadAllData(): Promise<void> {
    console.log('📊 Loading all data...');
    
    // Load budgets
    const budgets = await this.budgetStorage.getAllBudgets();
    console.log(`📊 Found ${budgets.length} existing budgets`);
    
    if (budgets.length === 0) {
      // No budgets found - this is a fresh install
      // Don't create anything here; let the component flow handle it
      this.cache.budget = null;
      this.cache.categories = [];
      this.cache.transactions = [];
      this.cache.accounts = [];
      this.cache.periods = [];
      this.cache.allocations = new Map();
      return;
    }

    // Use the first budget
    this.cache.budget = budgets[0];
    console.log(`✅ Using existing budget: ${this.cache.budget.id}`);

    // Load all data for this budget
    const [categories, transactions, accounts, periods] = await Promise.all([
      this.budgetStorage.getAllCategories(),
      this.budgetStorage.getAllTransactions(),
      this.accountStorage.getAccounts(this.cache.budget.id),
      this.periodStorage.getBudgetPeriods(this.cache.budget.id)
    ]);

    // Clean up any duplicate periods first
    console.log('🧹 Cleaning up duplicate periods...');
    await this.periodStorage.cleanupDuplicatePeriods(this.cache.budget.id);
    
    // Reload periods after cleanup
    const cleanedPeriods = await this.periodStorage.getBudgetPeriods(this.cache.budget.id);

    this.cache.categories = categories;
    this.cache.transactions = transactions;
    this.cache.accounts = accounts;
    this.cache.periods = cleanedPeriods;

    // Load allocations for each period
    this.cache.allocations = new Map();
    for (const period of cleanedPeriods) {
      const allocations = await this.periodStorage.getCategoryAllocations(period.id);
      this.cache.allocations.set(period.id, allocations);
    }

    console.log('📊 Loaded data:', {
      categories: this.cache.categories.length,
      transactions: this.cache.transactions.length,
      accounts: this.cache.accounts.length,
      periods: this.cache.periods.length
    });

    // Auto-repair any data inconsistencies
    await this.autoRepairData();

    // Ensure we have a current budget period for Phase 3
    await this.ensureCurrentBudgetPeriod();

    this.cache.lastSync = Date.now();
  }

  /**
   * Ensure we have a current budget period and it's active
   */
  private async ensureCurrentBudgetPeriod(): Promise<void> {
    // CRITICAL FIX: Ensure we have basic budget infrastructure before creating periods
    if (!this.cache.budget) {
      console.log('📅 No budget found, ensuring basic infrastructure before creating period...');
      await this.ensureBasicBudgetInfrastructure();
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`📅 Ensuring current budget period exists for ${currentMonth}/${currentYear}`);

    // Check if we have a period for the current month
    let currentPeriod = this.cache.periods.find(p => 
      p.year === currentYear && p.month === currentMonth
    );

    if (!currentPeriod) {
      console.log('📅 Creating current budget period...');
      currentPeriod = await this.createBudgetPeriod({
        budgetId: this.getBudgetId(),
        year: currentYear,
        month: currentMonth
      });
      console.log(`✅ Created current period: ${currentPeriod.name}`);
    }

    // Ensure there's an active period
    const activePeriod = this.cache.periods.find(p => p.isActive);
    if (!activePeriod) {
      console.log('📅 Setting current period as active...');
      await this.setActivePeriod(currentPeriod.id);
      console.log(`✅ Set ${currentPeriod.name} as active period`);
    }
  }

  // ============================================================================
  // AUTO-REPAIR SYSTEM
  // ============================================================================

  private async autoRepairData(): Promise<void> {
    console.log('🔧 Running auto-repair...');
    
    let repairsMade = 0;

    // 1. Fix orphaned transactions - add null safety
    const orphanedTransactions = this.cache.transactions.filter(t => 
      t && t.accountId && !this.cache.accounts.some(a => a && a.id === t.accountId)
    );

    if (orphanedTransactions.length > 0) {
      console.log(`🔧 Fixing ${orphanedTransactions.length} orphaned transactions`);
      
      // Create a default account if none exist
      if (this.cache.accounts.length === 0) {
        const defaultAccount = await this.accountStorage.createAccount(this.getBudgetId(), {
          name: 'Default Account',
          type: 'spending',
          isOnBudget: true,
          initialBalance: 0});
        this.cache.accounts.push(defaultAccount);
      }

      // Assign orphaned transactions to the first account
      const targetAccount = this.cache.accounts[0];
      for (const transaction of orphanedTransactions) {
        if (transaction && transaction.id) {
          await this.budgetStorage.updateTransaction(transaction.id, {
            accountId: targetAccount.id
          });
          transaction.accountId = targetAccount.id;
        }
      }
      repairsMade += orphanedTransactions.length;
    }

    // 2. Recalculate account balances - add null safety
    for (const account of this.cache.accounts) {
      if (!account || !account.id) continue;
      
      const accountTransactions = this.cache.transactions.filter(t => 
        t && t.accountId === account.id && t.amount !== undefined && t.type
      );
      const calculatedBalance = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0); // Account doesn't have initialBalance, start from 0

      if (account.balance !== calculatedBalance) {
        console.log(`🔧 Fixing balance for ${account.name}: ${account.balance} -> ${calculatedBalance}`);
        await this.accountStorage.updateAccountBalance(account.id, calculatedBalance);
        account.balance = calculatedBalance;
        repairsMade++;
      }
    }

    // 3. Sync period spending - add null safety
    for (const period of this.cache.periods) {
      if (period && period.id) {
        await this.syncPeriodSpending(period.id);
      }
    }

    if (repairsMade > 0) {
      console.log(`✅ Auto-repair completed: ${repairsMade} fixes applied`);
      this.notifyListeners({ type: 'data-repaired', count: repairsMade });
    }
  }

  private async syncPeriodSpending(periodId: string): Promise<void> {
    const period = this.cache.periods.find(p => p.id === periodId);
    if (!period) return;

    const allocations = this.cache.allocations.get(periodId) || [];
    
    for (const allocation of allocations) {
      const periodTransactions = this.cache.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= period.startDate && 
               transactionDate <= period.endDate &&
               t.categoryId === allocation.categoryId &&
               t.type === 'expense';
      });

      const correctSpent = periodTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      if (allocation.spentAmount !== correctSpent) {
        await this.periodStorage.updateAllocationSpending(periodId, allocation.categoryId, correctSpent);
        allocation.spentAmount = correctSpent;
      }
    }
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const transaction = await this.budgetStorage.createTransaction(input);
    this.cache.transactions.push(transaction);

    // Update account balance - add null safety
    const account = this.cache.accounts.find(a => a && a.id === input.accountId);
    if (account) {
      const balanceChange = input.type === 'income' ? input.amount : -input.amount;
      account.balance += balanceChange;
      await this.accountStorage.updateAccountBalance(account.id, account.balance);
    }

    // Update period spending for expenses - add null safety
    if (transaction) {
      await this.updatePeriodSpendingForTransaction(transaction);
    }

    this.notifyListeners({ type: 'transaction-created', data: transaction });
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<CreateTransactionInput>): Promise<Transaction> {
    const existingTransaction = this.cache.transactions.find(t => t && t.id === id);
    if (!existingTransaction) throw new Error('Transaction not found');

    // Reverse old transaction effects
    const account = this.cache.accounts.find(a => a && a.id === existingTransaction.accountId);
    if (account) {
      const oldBalanceChange = existingTransaction.type === 'income' ? existingTransaction.amount : -existingTransaction.amount;
      account.balance -= oldBalanceChange;
    }

    await this.updatePeriodSpendingForTransaction(existingTransaction, true);

    // Apply updates
    const updatedTransaction = await this.budgetStorage.updateTransaction(id, updates);
    const index = this.cache.transactions.findIndex(t => t && t.id === id);
    if (index !== -1) {
      this.cache.transactions[index] = updatedTransaction;
    }

    // Apply new transaction effects
    const newAccount = this.cache.accounts.find(a => a && a.id === updatedTransaction.accountId);
    if (newAccount) {
      const newBalanceChange = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
      newAccount.balance += newBalanceChange;
      await this.accountStorage.updateAccountBalance(newAccount.id, newAccount.balance);
    }

    await this.updatePeriodSpendingForTransaction(updatedTransaction);

    this.notifyListeners({ type: 'transaction-updated', data: updatedTransaction });
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = this.cache.transactions.find(t => t && t.id === id);
    if (!transaction) throw new Error('Transaction not found');

    // Reverse transaction effects
    const account = this.cache.accounts.find(a => a && a.id === transaction.accountId);
    if (account) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      account.balance -= balanceChange;
      await this.accountStorage.updateAccountBalance(account.id, account.balance);
    }

    await this.updatePeriodSpendingForTransaction(transaction, true);

    await this.budgetStorage.deleteTransaction(id);
    this.cache.transactions = this.cache.transactions.filter(t => t && t.id !== id);
    this.notifyListeners({ type: 'transaction-deleted', data: { id } });
  }

  private async recalculateAccountBalance(accountId: string): Promise<void> {
    const account = this.cache.accounts.find(a => a.id === accountId);
    if (!account) return;

    const accountTransactions = this.cache.transactions.filter(t => t.accountId === accountId);
    const calculatedBalance = accountTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0); // Account doesn't have initialBalance, start from 0

    account.balance = calculatedBalance;
    await this.accountStorage.updateAccountBalance(accountId, calculatedBalance);
  }

  private async updatePeriodSpendingForTransaction(transaction: Transaction, isRemoval = false): Promise<void> {
    if (!transaction || transaction.type !== 'expense' || !transaction.categoryId) return;

    const transactionDate = new Date(transaction.date);
    const period = this.cache.periods.find(p => {
      if (!p || !p.startDate || !p.endDate) return false;
      return transactionDate >= p.startDate && transactionDate <= p.endDate;
    });

    if (!period) return;

    const allocations = this.cache.allocations.get(period.id) || [];
    const allocation = allocations.find(a => a && a.categoryId === transaction.categoryId);

    if (allocation) {
      const change = isRemoval ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
      allocation.spentAmount = Math.max(0, allocation.spentAmount + change);
      await this.periodStorage.updateAllocationSpending(period.id, transaction.categoryId, allocation.spentAmount);
    }
  }

  // ============================================================================
  // CATEGORY OPERATIONS
  // ============================================================================

  async createCategory(input: CreateBudgetCategoryInput): Promise<BudgetCategory> {
    const category = await this.budgetStorage.createCategory(input);
    this.cache.categories.push(category);
    this.notifyListeners({ type: 'category-created', data: category });
    return category;
  }

  async updateCategory(id: string, updates: Partial<BudgetCategory>): Promise<BudgetCategory> {
    const category = await this.budgetStorage.updateCategory(id, updates);
    const index = this.cache.categories.findIndex(c => c.id === id);
    this.cache.categories[index] = category;
    this.notifyListeners({ type: 'category-updated', data: category });
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.budgetStorage.deleteCategory(id);
    this.cache.categories = this.cache.categories.filter(c => c && c.id !== id);
    this.notifyListeners({ type: 'category-deleted', data: { id } });
  }

  // ============================================================================
  // ACCOUNT OPERATIONS
  // ============================================================================

  async createAccount(input: CreateAccountInput): Promise<Account> {
    const account = await this.accountStorage.createAccount(this.getBudgetId(), input);
    this.cache.accounts.push(account);
    this.notifyListeners({ type: 'account-created', data: account });
    return account;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const updatedAccount = await this.accountStorage.updateAccount(id, updates);
    const index = this.cache.accounts.findIndex(a => a && a.id === id);
    if (index !== -1) {
      this.cache.accounts[index] = updatedAccount;
    }
    this.notifyListeners({ type: 'account-updated', data: updatedAccount });
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.accountStorage.deleteAccount(id);
    this.cache.accounts = this.cache.accounts.filter(a => a && a.id !== id);
    this.notifyListeners({ type: 'account-deleted', data: { id } });
  }

  // ============================================================================
  // PERIOD & ALLOCATION OPERATIONS
  // ============================================================================

  async createBudgetPeriod(input: CreateBudgetPeriodInput): Promise<BudgetPeriod> {
    // Use findOrCreateBudgetPeriod to prevent duplicates
    const period = await this.periodStorage.findOrCreateBudgetPeriod(input.budgetId, input.year, input.month);
    
    // Check if this period is already in cache
    const existingInCache = this.cache.periods.find(p => p.id === period.id);
    if (!existingInCache) {
      this.cache.periods.push(period);
      this.cache.allocations.set(period.id, []);
    }
    
    this.notifyListeners({ type: 'period-created', data: period });
    return period;
  }

  /**
   * Get or create the current budget period (for current month/year)
   */
  async getCurrentOrCreateBudgetPeriod(): Promise<BudgetPeriod> {
    // Ensure we have a budget first - this is critical for Phase 3
    if (!this.cache.budget) {
      console.log('📅 No budget found, ensuring basic budget infrastructure...');
      await this.ensureBasicBudgetInfrastructure();
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Check if we have a period for the current month
    let currentPeriod = this.cache.periods.find(p => 
      p.year === currentYear && p.month === currentMonth
    );

    if (!currentPeriod) {
      console.log('📅 Creating current budget period via public method...');
      currentPeriod = await this.createBudgetPeriod({
        budgetId: this.getBudgetId(),
        year: currentYear,
        month: currentMonth
      });
      
      // Set as active if no other active period exists
      const activePeriod = this.cache.periods.find(p => p.isActive);
      if (!activePeriod) {
        await this.setActivePeriod(currentPeriod.id);
      }
    }

    return currentPeriod;
  }

  /**
   * Ensure basic budget infrastructure exists (Phase 1 foundation)
   * This must be called before any Phase 3 operations
   */
  private async ensureBasicBudgetInfrastructure(): Promise<void> {
    console.log('🔧 Ensuring basic budget infrastructure...');
    
    // Check if we have any budgets
    const budgets = await this.budgetStorage.getAllBudgets();
    
    if (budgets.length === 0) {
      console.log('🔧 No budget found, creating default budget...');
      const defaultBudget = await this.budgetStorage.createBudget({
        name: 'My Bitcoin Budget',
        description: 'Default budget created automatically',
        isActive: true,
        totalBalance: 0,
        unassignedBalance: 0,
        categories: []
      });
      this.cache.budget = defaultBudget;
      console.log(`✅ Created default budget: ${defaultBudget.id}`);
    } else {
      this.cache.budget = budgets[0];
      console.log(`✅ Using existing budget: ${this.cache.budget.id}`);
    }

    // Ensure we have at least one account
    const accounts = await this.accountStorage.getAccounts(this.cache.budget.id);
    if (accounts.length === 0) {
      console.log('🔧 No accounts found, creating default account...');
      const defaultAccount = await this.accountStorage.createAccount(this.cache.budget.id, {
        name: 'Default Account',
        type: 'spending',
        isOnBudget: true,
        initialBalance: 0
      });
      this.cache.accounts.push(defaultAccount);
      console.log(`✅ Created default account: ${defaultAccount.id}`);
    } else {
      this.cache.accounts = accounts;
    }
  }

  async allocateFunds(periodId: string, categoryId: string, amount: number): Promise<void> {
    console.log('🎯 Allocating funds:', { periodId, categoryId, amount });
    
    // Call the storage layer to persist the allocation
    const allocation = await this.periodStorage.allocateFundsToCategory(periodId, categoryId, amount);
    
    // Update cache - get or create allocations array for this period
    let allocations = this.cache.allocations.get(periodId) || [];
    
    // Find existing allocation for this category
    const existingIndex = allocations.findIndex(a => a.categoryId === categoryId);
    
    if (existingIndex >= 0) {
      // Update existing allocation
      allocations[existingIndex] = allocation;
    } else {
      // Add new allocation
      allocations.push(allocation);
    }
    
    // Update the cache
    this.cache.allocations.set(periodId, allocations);
    
    console.log('✅ Updated allocation cache:', {
      periodId,
      categoryId,
      allocationsCount: allocations.length,
      allocation
    });

    this.notifyListeners({ type: 'allocation-updated', data: { periodId, categoryId, amount } });
  }

  // ============================================================================
  // DATA ACCESS METHODS
  // ============================================================================

  getBudget(): Budget | null {
    return this.cache.budget;
  }

  getCategories(): BudgetCategory[] {
    return [...this.cache.categories];
  }

  getTransactions(): Transaction[] {
    return [...this.cache.transactions];
  }

  getAccounts(): Account[] {
    return [...this.cache.accounts];
  }

  getPeriods(): BudgetPeriod[] {
    return [...this.cache.periods];
  }

  getAllocations(periodId: string): CategoryAllocation[] {
    return [...(this.cache.allocations.get(periodId) || [])];
  }

  getActivePeriod(): BudgetPeriod | null {
    return this.cache.periods.find(p => p.isActive) || null;
  }

  getBudgetId(): string {
    if (!this.cache.budget) {
      throw new Error('No budget loaded - call ensureBasicBudgetInfrastructure() first');
    }
    return this.cache.budget.id;
  }

  async setActivePeriod(periodId: string): Promise<void> {
    await this.periodStorage.setActiveBudgetPeriod(this.getBudgetId(), periodId);
    
    // Update cache
    this.cache.periods.forEach(p => {
      p.isActive = p.id === periodId;
    });
    
    this.notifyListeners({ type: 'period-activated', data: { periodId } });
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  getBudgetSummary() {
    const totalIncome = this.cache.transactions
      .filter(t => t && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.cache.transactions
      .filter(t => t && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalAccountBalance = this.cache.accounts
      .filter(a => a && a.isOnBudget)
      .reduce((sum, a) => sum + a.balance, 0);

    const totalAllocated = this.cache.categories
      .filter(c => c && !c.isArchived)
      .reduce((sum, c) => sum + c.currentAmount, 0);

    const unassignedBalance = totalAccountBalance - totalAllocated;
    const netWorth = totalAccountBalance;

    return {
      totalIncome,
      totalExpenses,
      totalAccountBalance,
      totalAllocated,
      unassignedBalance,
      netWorth
    };
  }

  /**
   * Get available to assign for a specific period
   * This is period-specific and separate from legacy "unassigned" balance
   */
  getAvailableToAssign(periodId: string): number {
    // Get actual account balances (not legacy category system)
    const onBudgetAccounts = this.cache.accounts.filter(a => a && a.isOnBudget);
    const totalAccountBalance = onBudgetAccounts.reduce((sum, a) => sum + a.balance, 0);
    
    // Get allocations for this specific period
    const allocations = this.cache.allocations.get(periodId) || [];
    const totalAllocatedThisPeriod = allocations.reduce((sum, a) => sum + a.currentAmount, 0);
    
    // Available to Assign = Actual Account Balance - Money Already Allocated This Period
    const available = totalAccountBalance - totalAllocatedThisPeriod;
    
    console.log('💰 getAvailableToAssign calculation:', {
      periodId,
      totalAccountBalance,
      totalAllocatedThisPeriod,
      available,
      accountCount: onBudgetAccounts.length,
      allocationCount: allocations.length
    });
    
    return Math.max(0, available); // Never return negative available
  }

  /**
   * Get period-specific budget summary
   */
  getPeriodBudgetSummary(periodId: string) {
    const baseSummary = this.getBudgetSummary();
    const availableToAssign = this.getAvailableToAssign(periodId);
    const allocations = this.cache.allocations.get(periodId) || [];
    const totalAllocatedThisPeriod = allocations.reduce((sum, a) => sum + a.currentAmount, 0);

    return {
      ...baseSummary,
      availableToAssign, // Period-specific available funds
      totalAllocatedThisPeriod, // Period-specific allocations
      periodId
    };
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  subscribe(listener: (event: DataChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: DataChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async refresh(): Promise<void> {
    await this.loadAllData();
    this.notifyListeners({ type: 'data-refreshed' });
  }

  getDataIntegrityReport() {
    const orphanedTransactions = this.cache.transactions.filter(t =>
      t && t.accountId && !this.cache.accounts.some(a => a && a.id === t.accountId)
    );

    const accountBalanceErrors = this.cache.accounts.filter(a => {
      if (!a || !a.id) return false;
      const accountTransactions = this.cache.transactions.filter(t => 
        t && t.accountId === a.id && t.amount !== undefined && t.type
      );
      const calculatedBalance = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);
      return Math.abs(a.balance - calculatedBalance) > 1; // Allow for rounding
    }).length;

    return {
      isHealthy: orphanedTransactions.length === 0 && accountBalanceErrors === 0,
      orphanedTransactions: orphanedTransactions.length,
      accountBalanceErrors,
      totalTransactions: this.cache.transactions.filter(t => t).length,
      totalAccounts: this.cache.accounts.filter(a => a).length,
      lastSync: new Date()
    };
  }

  // ============================================================================
  // DATABASE MANAGEMENT
  // ============================================================================

  /**
   * Clear all data from the database and reset cache
   */
  async clearAllData(): Promise<void> {
    try {
      console.log('🗑️ Clearing all database data...');
      
      // Clear all storage layers
      await Promise.all([
        this.budgetStorage.clearAllData(),
        this.accountStorage.clearAllAccounts(),
        this.periodStorage.clearAllData()
      ]);

      // Reset cache completely
      this.cache = {
        budget: null,
        categories: [],
        transactions: [],
        accounts: [],
        periods: [],
        allocations: new Map(),
        lastSync: 0
      };

      // Reset initialization state so the system can be re-initialized
      this.isInitialized = false;

      // Notify listeners that data was cleared
      this.notifyListeners({ type: 'data-cleared', data: {} });
      
      console.log('✅ All data cleared successfully - system ready for re-initialization');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Reset database by deleting and recreating it
   */
  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database...');
      
      // Import deleteDatabase function
      const { deleteDatabase } = await import('../storage/indexeddb');
      
      // Delete the entire database
      await deleteDatabase();
      
      // Reset initialization state
      this.isInitialized = false;
      
      // Reset cache
      this.cache = {
        budget: null,
        categories: [],
        transactions: [],
        accounts: [],
        periods: [],
        allocations: new Map(),
        lastSync: 0
      };

      // Reinitialize
      await this.initialize();
      
      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      throw error;
    }
  }

  /**
   * Properly dispose of this manager instance
   * Cleans up all resources, listeners, and connections
   */
  async dispose(): Promise<void> {
    try {
      console.log('🗑️ Disposing UnifiedDataManager instance...');
      
      // Clear all event listeners first to prevent notifications during cleanup
      this.listeners.clear();
      
      // Clear in-memory cache
      this.cache = {
        budget: null,
        categories: [],
        transactions: [],
        accounts: [],
        periods: [],
        allocations: new Map(),
        lastSync: 0
      };
      
      // Reset initialization state
      this.isInitialized = false;
      
      // Note: We don't clear the database here since that should be a separate operation
      // The dispose method just cleans up this instance's resources
      
      console.log('✅ UnifiedDataManager disposed successfully');
      
    } catch (error) {
      console.error('❌ Error disposing UnifiedDataManager:', error);
      throw error;
    }
  }
}

// Event types for the unified data manager
export type DataChangeEvent = 
  | { type: 'transaction-created'; data: Transaction }
  | { type: 'transaction-updated'; data: Transaction }
  | { type: 'transaction-deleted'; data: Transaction }
  | { type: 'category-created'; data: BudgetCategory }
  | { type: 'category-updated'; data: BudgetCategory }
  | { type: 'category-deleted'; data: { id: string } }
  | { type: 'account-created'; data: Account }
  | { type: 'account-updated'; data: Account }
  | { type: 'account-deleted'; data: { id: string } }
  | { type: 'period-created'; data: BudgetPeriod }
  | { type: 'allocation-updated'; data: { periodId: string; categoryId: string; amount: number } }
  | { type: 'data-repaired'; count: number }
  | { type: 'data-refreshed' }
  | { type: 'period-activated'; data: { periodId: string } }
  | { type: 'data-cleared'; data: {} };

// Singleton instance
let dataManagerInstance: UnifiedDataManager | null = null;

export function getDataManager(password?: string): UnifiedDataManager {
  if (!dataManagerInstance && password) {
    dataManagerInstance = new UnifiedDataManager(password);
  }
  if (!dataManagerInstance) {
    throw new Error('Data manager not initialized. Provide password on first call.');
  }
  return dataManagerInstance;
} 