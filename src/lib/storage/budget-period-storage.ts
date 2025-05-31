import { 
  BudgetPeriod, 
  CategoryAllocation, 
  CreateBudgetPeriodInput, 
  CreateCategoryAllocationInput,
  UpdateCategoryAllocationInput,
  MonthlyBudgetSummary
} from '../../types/budget';
import { encryptData, decryptData } from '../crypto/encryption';
import { openDatabase, STORES } from './indexeddb';

export class BudgetPeriodStorage {
  private password: string;

  constructor(password: string) {
    this.password = password;
  }

  // Budget Period Operations
  async createBudgetPeriod(input: CreateBudgetPeriodInput): Promise<BudgetPeriod> {
    // Check if a period already exists for this budget, year, and month
    const existingPeriods = await this.getBudgetPeriods(input.budgetId);
    const existingPeriod = existingPeriods.find(p => p.year === input.year && p.month === input.month);
    
    if (existingPeriod) {
      // Return the existing period instead of creating a duplicate
      return existingPeriod;
    }

    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0); // Last day of month
    
    console.log(`📅 Creating budget period for ${input.month}/${input.year}:`, {
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
      startDateISO: startDate.toISOString(),
      endDateISO: endDate.toISOString()
    });
    
    const budgetPeriod: BudgetPeriod = {
      id: crypto.randomUUID(),
      budgetId: input.budgetId,
      year: input.year,
      month: input.month,
      name: `${this.getMonthName(input.month)} ${input.year}`,
      startDate,
      endDate,
      isActive: false, // Will be set when activated
      totalIncome: 0,
      totalExpenses: 0,
      totalAllocated: 0,
      totalAvailable: 0,
      createdAt: new Date(),
      updatedAt: new Date()};

    const encryptedPeriod = await encryptData(JSON.stringify(budgetPeriod), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BUDGET_PERIODS], 'readwrite');
      const store = transaction.objectStore(STORES.BUDGET_PERIODS);
      
      const request = store.add({
        id: budgetPeriod.id,
        budgetId: input.budgetId,
        year: input.year,
        month: input.month,
        isActive: budgetPeriod.isActive,
        data: encryptedPeriod,
        updatedAt: budgetPeriod.updatedAt.getTime()});

      request.onsuccess = () => resolve(budgetPeriod);
      request.onerror = () => reject(new Error('Failed to create budget period'));
      transaction.oncomplete = () => db.close();
    });
  }

  async getBudgetPeriod(id: string): Promise<BudgetPeriod | null> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BUDGET_PERIODS], 'readonly');
      const store = transaction.objectStore(STORES.BUDGET_PERIODS);
      
      const request = store.get(id);
      
      request.onsuccess = async () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }
        
        try {
          const decryptedData = await decryptData(record.data, this.password);
          const budgetPeriod = JSON.parse(decryptedData) as BudgetPeriod;
          // Convert date strings back to Date objects
          budgetPeriod.startDate = new Date(budgetPeriod.startDate);
          budgetPeriod.endDate = new Date(budgetPeriod.endDate);
          budgetPeriod.createdAt = new Date(budgetPeriod.createdAt);
          budgetPeriod.updatedAt = new Date(budgetPeriod.updatedAt);
          resolve(budgetPeriod);
        } catch (error) {
          console.error('Failed to decrypt budget period:', error);
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get budget period'));
      transaction.oncomplete = () => db.close();
    });
  }

  async getBudgetPeriods(budgetId: string): Promise<BudgetPeriod[]> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BUDGET_PERIODS], 'readonly');
      const store = transaction.objectStore(STORES.BUDGET_PERIODS);
      const index = store.index('budgetId');
      
      const request = index.getAll(budgetId);
      
      request.onsuccess = async () => {
        const records = request.result;
        const budgetPeriods: BudgetPeriod[] = [];
        
        for (const record of records) {
          try {
            const decryptedData = await decryptData(record.data, this.password);
            const budgetPeriod = JSON.parse(decryptedData) as BudgetPeriod;
            // Convert date strings back to Date objects
            budgetPeriod.startDate = new Date(budgetPeriod.startDate);
            budgetPeriod.endDate = new Date(budgetPeriod.endDate);
            budgetPeriod.createdAt = new Date(budgetPeriod.createdAt);
            budgetPeriod.updatedAt = new Date(budgetPeriod.updatedAt);
            budgetPeriods.push(budgetPeriod);
          } catch (error) {
            console.error('Failed to decrypt budget period:', error);
          }
        }
        
        // Sort by year and month (newest first)
        resolve(budgetPeriods.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        }));
      };
      
      request.onerror = () => reject(new Error('Failed to get budget periods'));
      transaction.oncomplete = () => db.close();
    });
  }

  async getActiveBudgetPeriod(budgetId: string): Promise<BudgetPeriod | null> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BUDGET_PERIODS], 'readonly');
      const store = transaction.objectStore(STORES.BUDGET_PERIODS);
      const index = store.index('budgetId');
      
      const request = index.getAll(budgetId);
      
      request.onsuccess = async () => {
        const records = request.result;
        
        for (const record of records) {
          if (record.isActive) {
            try {
              const decryptedData = await decryptData(record.data, this.password);
              const budgetPeriod = JSON.parse(decryptedData) as BudgetPeriod;
              // Convert date strings back to Date objects
              budgetPeriod.startDate = new Date(budgetPeriod.startDate);
              budgetPeriod.endDate = new Date(budgetPeriod.endDate);
              budgetPeriod.createdAt = new Date(budgetPeriod.createdAt);
              budgetPeriod.updatedAt = new Date(budgetPeriod.updatedAt);
              resolve(budgetPeriod);
              return;
            } catch (error) {
              console.error('Failed to decrypt active budget period:', error);
            }
          }
        }
        
        resolve(null);
      };
      
      request.onerror = () => reject(new Error('Failed to get active budget period'));
      transaction.oncomplete = () => db.close();
    });
  }

  async setActiveBudgetPeriod(budgetId: string, periodId: string): Promise<void> {
    const periods = await this.getBudgetPeriods(budgetId);
    
    // Deactivate all periods and activate the selected one
    for (const period of periods) {
      const isActive = period.id === periodId;
      if (period.isActive !== isActive) {
        await this.updateBudgetPeriod(period.id, { isActive });
      }
    }
  }

  async updateBudgetPeriod(id: string, updates: Partial<BudgetPeriod>): Promise<BudgetPeriod> {
    const budgetPeriod = await this.getBudgetPeriod(id);
    if (!budgetPeriod) {
      throw new Error('Budget period not found');
    }

    const updatedPeriod: BudgetPeriod = {
      ...budgetPeriod,
      ...updates,
      updatedAt: new Date()};

    const encryptedPeriod = await encryptData(JSON.stringify(updatedPeriod), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BUDGET_PERIODS], 'readwrite');
      const store = transaction.objectStore(STORES.BUDGET_PERIODS);
      
      const request = store.put({
        id,
        budgetId: budgetPeriod.budgetId,
        year: updatedPeriod.year,
        month: updatedPeriod.month,
        isActive: updatedPeriod.isActive,
        data: encryptedPeriod,
        updatedAt: updatedPeriod.updatedAt.getTime()});

      request.onsuccess = () => resolve(updatedPeriod);
      request.onerror = () => reject(new Error('Failed to update budget period'));
      transaction.oncomplete = () => db.close();
    });
  }

  // Category Allocation Operations
  async createCategoryAllocation(input: CreateCategoryAllocationInput): Promise<CategoryAllocation> {
    const allocation: CategoryAllocation = {
      id: crypto.randomUUID(),
      budgetPeriodId: input.budgetPeriodId,
      categoryId: input.categoryId,
      targetAmount: input.targetAmount,
      currentAmount: input.targetAmount, // Initially equals target
      spentAmount: 0,
      rolloverAmount: 0,
      isOverspent: false,
      createdAt: new Date(),
      updatedAt: new Date()};

    const encryptedAllocation = await encryptData(JSON.stringify(allocation), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      
      const request = store.add({
        id: allocation.id,
        budgetPeriodId: input.budgetPeriodId,
        categoryId: input.categoryId,
        isOverspent: allocation.isOverspent,
        data: encryptedAllocation,
        updatedAt: allocation.updatedAt.getTime()});

      request.onsuccess = () => resolve(allocation);
      request.onerror = () => reject(new Error('Failed to create category allocation'));
      transaction.oncomplete = () => db.close();
    });
  }

  async getCategoryAllocations(budgetPeriodId: string): Promise<CategoryAllocation[]> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readonly');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      const index = store.index('budgetPeriodId');
      
      const request = index.getAll(budgetPeriodId);
      
      request.onsuccess = async () => {
        const records = request.result;
        const allocations: CategoryAllocation[] = [];
        
        for (const record of records) {
          try {
            const decryptedData = await decryptData(record.data, this.password);
            const allocation = JSON.parse(decryptedData) as CategoryAllocation;
            // Convert date strings back to Date objects
            allocation.createdAt = new Date(allocation.createdAt);
            allocation.updatedAt = new Date(allocation.updatedAt);
            allocations.push(allocation);
          } catch (error) {
            console.error('Failed to decrypt category allocation:', error);
          }
        }
        
        resolve(allocations);
      };
      
      request.onerror = () => reject(new Error('Failed to get category allocations'));
      transaction.oncomplete = () => db.close();
    });
  }

  async updateCategoryAllocation(id: string, updates: UpdateCategoryAllocationInput): Promise<CategoryAllocation> {
    // Get the current allocation
    const db = await openDatabase();
    
    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = async () => {
        const record = getRequest.result;
        if (!record) {
          reject(new Error('Category allocation not found'));
          return;
        }
        
        try {
          const decryptedData = await decryptData(record.data, this.password);
          const allocation = JSON.parse(decryptedData) as CategoryAllocation;
          
          // Convert date strings back to Date objects
          allocation.createdAt = new Date(allocation.createdAt);
          allocation.updatedAt = new Date(allocation.updatedAt);
          
          const updatedAllocation: CategoryAllocation = {
            ...allocation,
            ...updates,
            updatedAt: new Date()};

          const encryptedAllocation = await encryptData(JSON.stringify(updatedAllocation), this.password);
          
          const putRequest = store.put({
            id,
            budgetPeriodId: updatedAllocation.budgetPeriodId,
            categoryId: updatedAllocation.categoryId,
            isOverspent: updatedAllocation.isOverspent,
            data: encryptedAllocation,
            updatedAt: updatedAllocation.updatedAt.getTime()});

          putRequest.onsuccess = () => resolve(updatedAllocation);
          putRequest.onerror = () => reject(new Error('Failed to update category allocation'));
        } catch (error) {
          reject(new Error('Failed to decrypt category allocation'));
        }
      };
      
      getRequest.onerror = () => reject(new Error('Failed to get category allocation'));
      transaction.oncomplete = () => db.close();
    });
  }

  async deleteCategoryAllocation(id: string): Promise<void> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete category allocation'));
      transaction.oncomplete = () => db.close();
    });
  }

  // Utility methods
  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  async findOrCreateBudgetPeriod(budgetId: string, year: number, month: number): Promise<BudgetPeriod> {
    // Try to find existing period first
    const periods = await this.getBudgetPeriods(budgetId);
    const existingPeriod = periods.find(p => p.year === year && p.month === month);
    
    if (existingPeriod) {
      return existingPeriod;
    }

    // Create new period if it doesn't exist
    const newPeriod = await this.createBudgetPeriod({
      budgetId,
      year,
      month});

    // Initialize rollovers from the previous month
    await this.initializeRolloversForNewPeriod(newPeriod, periods);

    return newPeriod;
  }

  private async initializeRolloversForNewPeriod(
    newPeriod: BudgetPeriod,
    existingPeriods: BudgetPeriod[]
  ): Promise<void> {
    // Find the previous month's period
    let previousYear = newPeriod.year;
    let previousMonth = newPeriod.month - 1;
    
    if (previousMonth < 1) {
      previousMonth = 12;
      previousYear--;
    }

    const previousPeriod = existingPeriods.find(p => 
      p.year === previousYear && p.month === previousMonth
    );

    if (previousPeriod) {
      console.log('Found previous period for rollover:', {
        newPeriod: `${newPeriod.year}-${newPeriod.month}`,
        previousPeriod: `${previousPeriod.year}-${previousPeriod.month}`
      });

      // Initialize rollovers from the previous period
      await this.initializeNewPeriodWithRollovers(newPeriod.id, previousPeriod.id);
    } else {
      console.log('No previous period found, starting fresh:', {
        newPeriod: `${newPeriod.year}-${newPeriod.month}`,
        searchedFor: `${previousYear}-${previousMonth}`
      });
    }
  }

  async getCurrentOrCreateBudgetPeriod(budgetId: string): Promise<BudgetPeriod> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Use the findOrCreateBudgetPeriod method to avoid duplicates
    const currentPeriod = await this.findOrCreateBudgetPeriod(budgetId, currentYear, currentMonth);

    // Set as active if no other active period exists
    const activePeriod = await this.getActiveBudgetPeriod(budgetId);
    if (!activePeriod) {
      await this.setActiveBudgetPeriod(budgetId, currentPeriod.id);
      currentPeriod.isActive = true;
    }

    return currentPeriod;
  }

  async cleanupDuplicatePeriods(budgetId: string): Promise<void> {
    const periods = await this.getBudgetPeriods(budgetId);
    const seen = new Map<string, BudgetPeriod>();
    const duplicates: string[] = [];

    // Find duplicates by year-month combination
    for (const period of periods) {
      const key = `${period.year}-${period.month}`;
      
      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        duplicates.push(period.id);
      } else {
        // First occurrence - keep it
        seen.set(key, period);
      }
    }

    // Delete duplicates
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BUDGET_PERIODS], 'readwrite');
      const store = transaction.objectStore(STORES.BUDGET_PERIODS);
      
      let completed = 0;
      const total = duplicates.length;
      
      if (total === 0) {
        resolve();
        return;
      }

      for (const duplicateId of duplicates) {
        const request = store.delete(duplicateId);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to delete duplicate period: ${duplicateId}`));
        };
      }
      
      transaction.oncomplete = () => db.close();
    });
  }

  /**
   * Clear all budget periods and category allocations from the database
   */
  async clearAllData(): Promise<void> {
    const { clearStore } = await import('./indexeddb');
    await Promise.all([
      clearStore(STORES.BUDGET_PERIODS),
      clearStore(STORES.CATEGORY_ALLOCATIONS)
    ]);
  }

  // Monthly Allocation Methods
  async allocateFundsToCategory(
    budgetPeriodId: string, 
    categoryId: string, 
    amount: number
  ): Promise<CategoryAllocation> {
    console.log('🎯 allocateFundsToCategory called with:', { budgetPeriodId, categoryId, amount });
    
    if (!budgetPeriodId) {
      throw new Error('Budget period ID is required');
    }
    
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    try {
      // Get or create category allocation for this period
      const allocations = await this.getCategoryAllocations(budgetPeriodId);
      let allocation = allocations.find(a => a.categoryId === categoryId);

      console.log('💡 Found existing allocation:', allocation);

      if (allocation) {
        // Try to update existing allocation with enhanced error handling
        try {
          const updatedAllocation = await this.updateCategoryAllocation(allocation.id, {
            targetAmount: allocation.targetAmount + amount,
            currentAmount: allocation.currentAmount + amount
          });
          console.log('✅ Updated existing allocation:', updatedAllocation);
          return updatedAllocation;
        } catch (updateError) {
          console.warn('⚠️ Failed to update existing allocation, attempting recovery:', updateError);
          
          // If update fails, try to handle gracefully without causing a crash
          try {
            // Attempt to delete the corrupted record first
            await this.deleteCategoryAllocation(allocation.id);
            console.log('🗑️ Deleted corrupted allocation');
            
            // Wait a bit to ensure deletion is processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create a new allocation with the total amount (existing + new)
            const totalAmount = allocation.targetAmount + amount;
            const newAllocation = await this.createCategoryAllocation({
              budgetPeriodId,
              categoryId,
              targetAmount: totalAmount
            });
            console.log('✨ Created new allocation after corruption recovery:', newAllocation);
            return newAllocation;
          } catch (recoveryError) {
            console.error('❌ Recovery attempt failed:', recoveryError);
            
            // Last resort: create a new allocation with just the new amount
            // This might result in some data loss but prevents the app from crashing
            console.warn('⚠️ Creating allocation with new amount only due to recovery failure');
            const fallbackAllocation = await this.createCategoryAllocation({
              budgetPeriodId,
              categoryId,
              targetAmount: amount
            });
            console.log('🆘 Created fallback allocation:', fallbackAllocation);
            return fallbackAllocation;
          }
        }
      } else {
        // Create new allocation - this path should be more reliable
        try {
          const newAllocation = await this.createCategoryAllocation({
            budgetPeriodId,
            categoryId,
            targetAmount: amount
          });
          console.log('✨ Created new allocation:', newAllocation);
          return newAllocation;
        } catch (createError) {
          console.error('❌ Failed to create new allocation:', createError);
          throw new Error(`Failed to create allocation: ${createError.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Critical error in allocateFundsToCategory:', error);
      // Re-throw with more context but don't let it crash the page
      throw new Error(`Allocation failed: ${error.message}`);
    }
  }

  async getAvailableToAssign(budgetPeriodId: string): Promise<number> {
    const period = await this.getBudgetPeriod(budgetPeriodId);
    if (!period) {
      throw new Error('Budget period not found');
    }

    const allocations = await this.getCategoryAllocations(budgetPeriodId);
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.targetAmount, 0);
    
    // Calculate period-specific income from transactions
    const { budgetStorage } = await import('./budget-storage');
    const allTransactions = await budgetStorage.getAllTransactions();
    
    // Filter transactions to only include income within this budget period
    const periodIncomeTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= period.startDate && 
             transactionDate <= period.endDate &&
             t.amount > 0 && 
             !t.tags?.includes('transfer') && 
             !t.tags?.includes('account-transfer');
    });

    const periodIncome = periodIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Available = Period Income - Money Allocated in this Period
    // Note: Rollover money is already reflected in category currentAmount, not in Available to Assign
    return periodIncome - totalAllocated;
  }

  async calculatePeriodTotals(budgetPeriodId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalAllocated: number;
    totalAvailable: number;
  }> {
    // This would integrate with transaction storage to get actual income/expenses for the period
    // For now, we'll return basic calculations
    const allocations = await this.getCategoryAllocations(budgetPeriodId);
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.targetAmount, 0);
    
    const period = await this.getBudgetPeriod(budgetPeriodId);
    if (!period) {
      throw new Error('Budget period not found');
    }

    return {
      totalIncome: period.totalIncome,
      totalExpenses: period.totalExpenses,
      totalAllocated,
      totalAvailable: period.totalIncome - totalAllocated};
  }

  async setAllocationTarget(
    budgetPeriodId: string,
    categoryId: string,
    targetAmount: number
  ): Promise<CategoryAllocation> {
    const allocations = await this.getCategoryAllocations(budgetPeriodId);
    let allocation = allocations.find(a => a.categoryId === categoryId);

    if (allocation) {
      // Update existing allocation target
      return this.updateCategoryAllocation(allocation.id, {
        targetAmount,
        currentAmount: targetAmount, // Reset current to match target
      });
    } else {
      // Create new allocation
      return this.createCategoryAllocation({
        budgetPeriodId,
        categoryId,
        targetAmount});
    }
  }

  async getAllocationForCategory(
    budgetPeriodId: string,
    categoryId: string
  ): Promise<CategoryAllocation | null> {
    const allocations = await this.getCategoryAllocations(budgetPeriodId);
    return allocations.find(a => a.categoryId === categoryId) || null;
  }

  // Rollover Logic Methods
  async calculateRolloverAmount(
    previousPeriodId: string,
    categoryId: string
  ): Promise<number> {
    const previousAllocation = await this.getAllocationForCategory(previousPeriodId, categoryId);
    
    if (!previousAllocation) {
      console.log('No previous allocation found for rollover:', { previousPeriodId, categoryId });
      return 0; // No previous allocation means no rollover
    }

    // Calculate remaining amount: currentAmount - spent
    // Use currentAmount (which includes any previous rollovers) instead of targetAmount
    const remaining = previousAllocation.currentAmount - previousAllocation.spentAmount;
    
    console.log('Calculating rollover for category:', {
      categoryId,
      previousPeriodId,
      targetAmount: previousAllocation.targetAmount,
      currentAmount: previousAllocation.currentAmount,
      spent: previousAllocation.spentAmount,
      remaining,
      rollover: remaining
    });

    return remaining;
  }

  async createAllocationWithRollover(
    budgetPeriodId: string,
    categoryId: string,
    targetAmount: number,
    previousPeriodId?: string
  ): Promise<CategoryAllocation> {
    let rolloverAmount = 0;
    
    // Calculate rollover from previous period if provided
    if (previousPeriodId) {
      rolloverAmount = await this.calculateRolloverAmount(previousPeriodId, categoryId);
    }

    // Current amount = new allocation + rollover
    const currentAmount = targetAmount + rolloverAmount;
    
    const allocation: CategoryAllocation = {
      id: crypto.randomUUID(),
      budgetPeriodId,
      categoryId,
      targetAmount,
      currentAmount,
      spentAmount: 0, // New period starts with no spending
      rolloverAmount,
      isOverspent: rolloverAmount < 0, // Mark as overspent if negative rollover
      createdAt: new Date(),
      updatedAt: new Date()};

    console.log('Creating allocation with rollover:', allocation);

    const encryptedAllocation = await encryptData(JSON.stringify(allocation), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      
      const request = store.add({
        id: allocation.id,
        budgetPeriodId,
        categoryId,
        isOverspent: allocation.isOverspent,
        data: encryptedAllocation,
        updatedAt: allocation.updatedAt.getTime()});

      request.onsuccess = () => resolve(allocation);
      request.onerror = () => reject(new Error('Failed to create category allocation with rollover'));
      transaction.oncomplete = () => db.close();
    });
  }

  async initializeNewPeriodWithRollovers(
    newBudgetPeriodId: string,
    previousBudgetPeriodId: string
  ): Promise<CategoryAllocation[]> {
    // Get all allocations from the previous period
    const previousAllocations = await this.getCategoryAllocations(previousBudgetPeriodId);
    const newAllocations: CategoryAllocation[] = [];

    console.log('🔄 Initializing new period with rollovers:', {
      newBudgetPeriodId,
      previousBudgetPeriodId,
      previousAllocationsCount: previousAllocations.length
    });

    // Create new allocations for each category that had allocations in the previous period
    for (const prevAllocation of previousAllocations) {
      const rolloverAmount = await this.calculateRolloverAmount(previousBudgetPeriodId, prevAllocation.categoryId);
      
      console.log(`💰 Category ${prevAllocation.categoryId} rollover calculation:`, {
        previousTarget: prevAllocation.targetAmount,
        previousCurrent: prevAllocation.currentAmount,
        previousSpent: prevAllocation.spentAmount,
        calculatedRollover: rolloverAmount
      });
      
      // Only create new allocation if there's a rollover (positive or negative)
      // Categories with zero rollover can be allocated fresh if needed
      if (rolloverAmount !== 0) {
        console.log(`✅ Creating rollover allocation for category ${prevAllocation.categoryId} with ${rolloverAmount} sats`);
        const newAllocation = await this.createAllocationWithRollover(
          newBudgetPeriodId,
          prevAllocation.categoryId,
          0, // Start with 0 new allocation, just rollover
          previousBudgetPeriodId
        );
        newAllocations.push(newAllocation);
      } else {
        console.log(`⏭️ Skipping rollover allocation for category ${prevAllocation.categoryId} (zero rollover)`);
      }
    }

    console.log('✅ Rollover initialization complete:', {
      newAllocationsCreated: newAllocations.length,
      allocations: newAllocations.map(a => ({
        categoryId: a.categoryId,
        target: a.targetAmount,
        current: a.currentAmount,
        rollover: a.rolloverAmount
      }))
    });
    
    return newAllocations;
  }

  // Period-aware spending tracking
  async updateAllocationSpending(
    budgetPeriodId: string,
    categoryId: string,
    spentAmount: number
  ): Promise<CategoryAllocation | null> {
    const allocation = await this.getAllocationForCategory(budgetPeriodId, categoryId);
    
    if (!allocation) {
      console.warn('No allocation found for category in period:', { budgetPeriodId, categoryId });
      return null;
    }

    try {
      const updatedAllocation = await this.updateCategoryAllocation(allocation.id, {
        spentAmount,
        isOverspent: spentAmount > allocation.currentAmount});

      console.log('Updated allocation spending:', {
        categoryId,
        budgetPeriodId,
        spentAmount,
        currentAmount: allocation.currentAmount,
        isOverspent: spentAmount > allocation.currentAmount
      });

      return updatedAllocation;
    } catch (error) {
      console.warn('Failed to update allocation spending due to decryption error, using direct database update:', error);
      
      try {
        // Direct database update to bypass encryption issues
        const updatedAllocation = await this.directUpdateAllocationSpending(allocation, spentAmount);
        console.log('Successfully updated allocation via direct database access:', updatedAllocation);
        return updatedAllocation;
      } catch (directError) {
        console.error('Failed to update allocation via direct database access:', directError);
        return null;
      }
    }
  }

  private async directUpdateAllocationSpending(
    allocation: CategoryAllocation,
    spentAmount: number
  ): Promise<CategoryAllocation> {
    // Update the allocation object directly
    const updatedAllocation: CategoryAllocation = {
      ...allocation,
      spentAmount,
      isOverspent: spentAmount > allocation.currentAmount,
      updatedAt: new Date()};

    // Encrypt the updated allocation
    const encryptedAllocation = await encryptData(JSON.stringify(updatedAllocation), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      
      const request = store.put({
        id: allocation.id,
        budgetPeriodId: allocation.budgetPeriodId,
        categoryId: allocation.categoryId,
        isOverspent: updatedAllocation.isOverspent,
        data: encryptedAllocation,
        updatedAt: updatedAllocation.updatedAt.getTime()});

      request.onsuccess = () => resolve(updatedAllocation);
      request.onerror = () => reject(new Error('Failed to update allocation spending directly'));
      transaction.oncomplete = () => db.close();
    });
  }

  async calculatePeriodSpendingForCategory(
    budgetPeriodId: string,
    categoryId: string,
    transactions: any[]
  ): Promise<number> {
    const period = await this.getBudgetPeriod(budgetPeriodId);
    if (!period) {
      return 0;
    }

    console.log(`🔍 Calculating spending for category ${categoryId} in period ${period.name}:`);
    console.log(`📅 Period range: ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`);
    console.log(`📊 Total transactions to check: ${transactions.length}`);

    // Filter transactions for this category within the budget period
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isInPeriod = transactionDate >= period.startDate && transactionDate <= period.endDate;
      const isCorrectCategory = t.categoryId === categoryId;
      const isExpense = t.amount < 0;
      const isNotTransfer = !t.tags?.includes('transfer');
      
      console.log(`  📝 Transaction: ${t.description} (${transactionDate.toLocaleDateString()})`, {
        amount: t.amount,
        categoryId: t.categoryId,
        date: t.date,
        periodStart: period.startDate.toLocaleDateString(),
        periodEnd: period.endDate.toLocaleDateString(),
        isInPeriod,
        isCorrectCategory,
        isExpense,
        isNotTransfer,
        included: isInPeriod && isCorrectCategory && isExpense && isNotTransfer
      });
      
      return isInPeriod && isCorrectCategory && isExpense && isNotTransfer;
    });

    const totalSpent = periodTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    console.log(`💸 Period spending result for ${period.name}:`, {
      categoryId,
      budgetPeriodId,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      transactionCount: periodTransactions.length,
      totalSpent,
      includedTransactions: periodTransactions.map(t => ({
        description: t.description,
        amount: t.amount,
        date: t.date
      }))
    });

    return totalSpent;
  }

  async syncAllocationSpendingFromTransactions(
    budgetPeriodId: string,
    transactions: any[]
  ): Promise<void> {
    const allocations = await this.getCategoryAllocations(budgetPeriodId);
    
    console.log('🔄 Syncing allocation spending for period:', budgetPeriodId);
    console.log('📊 Found allocations:', allocations.length);
    console.log('📊 Total transactions:', transactions.length);
    
    // If there are no allocations for this period, skip syncing
    if (allocations.length === 0) {
      console.log('⏭️ No allocations found for period, skipping spending sync');
      return;
    }
    
    for (const allocation of allocations) {
      const spentAmount = await this.calculatePeriodSpendingForCategory(
        budgetPeriodId,
        allocation.categoryId,
        transactions
      );
      
      console.log(`💰 Category ${allocation.categoryId}:`, {
        currentSpent: allocation.spentAmount,
        calculatedSpent: spentAmount,
        needsUpdate: spentAmount !== allocation.spentAmount
      });
      
      if (spentAmount !== allocation.spentAmount) {
        console.log(`🔄 Updating spending for category ${allocation.categoryId}: ${allocation.spentAmount} → ${spentAmount}`);
        await this.updateAllocationSpending(budgetPeriodId, allocation.categoryId, spentAmount);
      }
    }
  }

  /**
   * Calculate period-aware budget summary that only includes transactions within the budget period
   */
  async getPeriodBudgetSummary(budgetPeriodId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalAllocated: number;
    totalAvailable: number;
    unassignedBalance: number;
    totalBalance: number;
  }> {
    const period = await this.getBudgetPeriod(budgetPeriodId);
    if (!period) {
      throw new Error('Budget period not found');
    }

    // Get all transactions and filter by period dates
    const { budgetStorage } = await import('./budget-storage');
    const allTransactions = await budgetStorage.getAllTransactions();
    
    // Filter transactions to only include those within this budget period
    const periodTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= period.startDate && transactionDate <= period.endDate;
    });

    // Calculate period income (positive transactions, excluding transfers)
    const totalIncome = periodTransactions
      .filter(t => t.amount > 0 && !t.tags?.includes('transfer') && !t.tags?.includes('account-transfer'))
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate period expenses (negative transactions, excluding transfers)
    const totalExpenses = periodTransactions
      .filter(t => t.amount < 0 && !t.tags?.includes('transfer') && !t.tags?.includes('account-transfer'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get allocations for this period
    const allocations = await this.getCategoryAllocations(budgetPeriodId);
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.targetAmount, 0);

    // Get available to assign for this period
    const availableToAssign = await this.getAvailableToAssign(budgetPeriodId);

    // Get total balance from on-budget accounts (this is not period-specific)
    let totalBalance = 0;
    try {
      const { AccountStorage } = await import('./account-storage');
      const accountStorage = new AccountStorage(this.password);
      
      const budgets = await budgetStorage.getAllBudgets();
      const currentBudget = budgets[0];
      
      if (currentBudget) {
        const accounts = await accountStorage.getAccounts(currentBudget.id);
        const onBudgetAccounts = accounts.filter(account => account.isOnBudget && !account.isClosed);
        totalBalance = onBudgetAccounts.reduce((sum, account) => sum + account.balance, 0);
      }
    } catch (error) {
      console.warn('Could not load account balances for period summary:', error);
      totalBalance = totalIncome;
    }

    return {
      totalIncome,
      totalExpenses,
      totalAllocated,
      totalAvailable: totalIncome - totalExpenses,
      unassignedBalance: availableToAssign,
      totalBalance
    };
  }

  /**
   * Recalculate rollover amounts for all periods after a previous period's spending is updated
   */
  async recalculateRolloversForAllPeriods(budgetId: string): Promise<void> {
    const periods = await this.getBudgetPeriods(budgetId);
    console.log('🔄 Recalculating rollovers for all periods...');
    
    // Sort periods chronologically (oldest first)
    const sortedPeriods = periods.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Skip the first period (no previous period to roll from)
    for (let i = 1; i < sortedPeriods.length; i++) {
      const currentPeriod = sortedPeriods[i];
      const previousPeriod = sortedPeriods[i - 1];
      
      console.log(`🔄 Recalculating rollovers for ${currentPeriod.name} from ${previousPeriod.name}`);
      await this.recalculateRolloversForPeriod(currentPeriod.id, previousPeriod.id);
    }
    
    console.log('✅ All rollover recalculations complete');
  }

  /**
   * Recalculate rollover amounts for a specific period based on updated previous period data
   */
  async recalculateRolloversForPeriod(
    currentPeriodId: string,
    previousPeriodId: string
  ): Promise<void> {
    const currentAllocations = await this.getCategoryAllocations(currentPeriodId);
    
    for (const allocation of currentAllocations) {
      // Recalculate rollover from previous period
      const newRolloverAmount = await this.calculateRolloverAmount(previousPeriodId, allocation.categoryId);
      
      if (newRolloverAmount !== allocation.rolloverAmount) {
        console.log(`🔄 Updating rollover for category ${allocation.categoryId}: ${allocation.rolloverAmount} → ${newRolloverAmount}`);
        
        // Update the allocation with new rollover and current amounts
        const newCurrentAmount = allocation.targetAmount + newRolloverAmount;
        
        try {
          await this.updateCategoryAllocation(allocation.id, {
            rolloverAmount: newRolloverAmount,
            currentAmount: newCurrentAmount,
            isOverspent: allocation.spentAmount > newCurrentAmount});
        } catch (error) {
          console.warn('Failed to update rollover via normal method, using direct update:', error);
          
          // Use direct update if normal update fails
          const updatedAllocation: CategoryAllocation = {
            ...allocation,
            rolloverAmount: newRolloverAmount,
            currentAmount: newCurrentAmount,
            isOverspent: allocation.spentAmount > newCurrentAmount,
            updatedAt: new Date()};
          
          await this.directUpdateAllocation(updatedAllocation);
        }
      }
    }
  }

  private async directUpdateAllocation(allocation: CategoryAllocation): Promise<CategoryAllocation> {
    // Encrypt the updated allocation
    const encryptedAllocation = await encryptData(JSON.stringify(allocation), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORY_ALLOCATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORY_ALLOCATIONS);
      
      const request = store.put({
        id: allocation.id,
        budgetPeriodId: allocation.budgetPeriodId,
        categoryId: allocation.categoryId,
        isOverspent: allocation.isOverspent,
        data: encryptedAllocation,
        updatedAt: allocation.updatedAt.getTime()});

      request.onsuccess = () => resolve(allocation);
      request.onerror = () => reject(new Error('Failed to update allocation directly'));
      transaction.oncomplete = () => db.close();
    });
  }
} 