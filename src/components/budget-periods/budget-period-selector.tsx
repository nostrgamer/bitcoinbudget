import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Bitcoin, X } from 'lucide-react';
import { 
  useBudgetPeriods, 
  useActiveBudgetPeriod, 
  useSetActiveBudgetPeriod,
  useCreateBudgetPeriod,
  useGetOrCreateCurrentBudgetPeriod,
  useDataStatus,
  useCategories,
  useAllocateFunds,
  useCategoryAllocations,
  useAvailableToAssign,
  useCreateCategory
} from '../../hooks/use-unified-data';

export default function BudgetPeriodSelector() {
  const { data: periods = [], isLoading: periodsLoading } = useBudgetPeriods();
  const { data: activePeriod, isLoading: activePeriodLoading } = useActiveBudgetPeriod();
  const { data: categories = [] } = useCategories();
  const setActivePeriod = useSetActiveBudgetPeriod();
  const createPeriod = useCreateBudgetPeriod();
  const getOrCreateCurrentPeriod = useGetOrCreateCurrentBudgetPeriod();
  const { isInitialized, isHealthy } = useDataStatus();
  const allocateFunds = useAllocateFunds();
  const createCategory = useCreateCategory();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationAmount, setAllocationAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Get current period allocations and available funds
  const { data: allocations = [] } = useCategoryAllocations(activePeriod?.id || '');
  const { data: availableToAssign = 0 } = useAvailableToAssign(activePeriod?.id || '');

  // Debug logging - only log when state changes significantly
  const prevStateRef = useRef<any>();
  const currentState = {
    periodsCount: periods.length,
    activePeriodId: activePeriod?.id,
    isLoading: periodsLoading || activePeriodLoading,
    isInitialized,
    isHealthy
  };
  
  if (!prevStateRef.current || JSON.stringify(prevStateRef.current) !== JSON.stringify(currentState)) {
    console.log('🔍 BudgetPeriodSelector state change:', {
      periodsCount: periods.length,
      periods: periods.map(p => ({ id: p.id, name: p.name, isActive: p.isActive })),
      activePeriod: activePeriod ? { id: activePeriod.id, name: activePeriod.name, isActive: activePeriod.isActive } : null,
      isLoading: periodsLoading || activePeriodLoading,
      isInitialized,
      isHealthy
    });
    prevStateRef.current = currentState;
  }

  const handlePreviousMonth = () => {
    if (!activePeriod) return;
    
    const currentIndex = periods.findIndex(p => p.id === activePeriod.id);
    if (currentIndex > 0) {
      setActivePeriod.mutate(periods[currentIndex - 1].id);
    }
  };

  const handleNextMonth = () => {
    if (!activePeriod) return;
    
    const currentIndex = periods.findIndex(p => p.id === activePeriod.id);
    if (currentIndex < periods.length - 1) {
      setActivePeriod.mutate(periods[currentIndex + 1].id);
    }
  };

  const handleCreateNewPeriod = async () => {
    try {
      // Find the next available month to create
      const now = new Date();
      let targetYear = now.getFullYear();
      let targetMonth = now.getMonth() + 1;

      // Check if current month already exists, if so, create next month
      const currentPeriodExists = periods.some(p => p.year === targetYear && p.month === targetMonth);
      
      if (currentPeriodExists) {
        // Create next month
        targetMonth += 1;
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear += 1;
        }
      }

      // Double-check that this month doesn't already exist
      const targetPeriodExists = periods.some(p => p.year === targetYear && p.month === targetMonth);
      if (targetPeriodExists) {
        console.warn('Period already exists for', targetMonth, targetYear);
        return;
      }

      console.log('Creating period for:', targetMonth, targetYear);
      
      const newPeriod = await createPeriod.mutateAsync({
        year: targetYear,
        month: targetMonth,
        budgetId: '' // This will be filled by the hook
      });
      
      // Set the newly created period as active
      await setActivePeriod.mutateAsync(newPeriod.id);
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to create new period:', error);
    }
  };

  const handleSelectPeriod = (periodId: string) => {
    setActivePeriod.mutate(periodId);
    setShowDropdown(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        description: `Category for ${newCategoryName.trim()}`,
        targetAmount: 0,
        color: '#3B82F6', // Default blue color
        isArchived: false
      });
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleAllocateFunds = async () => {
    // Create a safe execution wrapper to prevent crashes
    const safeAllocationWrapper = async () => {
      if (!activePeriod || !selectedCategoryId || !allocationAmount) {
        console.warn('⚠️ Allocation attempted with missing data:', {
          activePeriod: !!activePeriod,
          selectedCategoryId: !!selectedCategoryId,
          allocationAmount: !!allocationAmount
        });
        return;
      }
      
      const amount = parseInt(allocationAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      if (amount > availableToAssign) {
        alert(`Cannot allocate ${amount} sats. Only ${availableToAssign} sats available.`);
        return;
      }

      console.log('🎯 Starting allocation process:', {
        periodId: activePeriod.id,
        categoryId: selectedCategoryId,
        amount,
        availableToAssign
      });

      // Prevent multiple simultaneous allocations
      if (allocateFunds.isLoading) {
        console.warn('⚠️ Allocation already in progress, ignoring duplicate request');
        return;
      }

      try {
        // Create allocation data
        const allocationData = {
          periodId: activePeriod.id,
          categoryId: selectedCategoryId,
          amount
        };
        
        console.log('💰 Calling allocateFunds.mutateAsync...');
        
        // Use a timeout to prevent infinite hanging
        const allocationPromise = allocateFunds.mutateAsync(allocationData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Allocation timeout after 30 seconds')), 30000)
        );
        
        await Promise.race([allocationPromise, timeoutPromise]);
        
        console.log('✅ Allocation completed successfully');
        
        // Reset form only after successful allocation
        setAllocationAmount('');
        setSelectedCategoryId('');
        setShowAllocationModal(false);
        
        console.log(`✅ Successfully allocated ${amount} sats to category in ${activePeriod.name}`);
        
      } catch (error) {
        console.error('❌ Allocation failed in component:', error);
        
        // Provide user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Force stop any pending mutations to prevent cascading errors
        try {
          // Reset React Query state for this mutation to prevent stuck states
          allocateFunds.reset();
        } catch (resetError) {
          console.warn('⚠️ Failed to reset mutation state:', resetError);
        }
        
        // Use setTimeout to prevent immediate UI crashes
        setTimeout(() => {
          alert(`Failed to allocate funds: ${errorMessage}\n\nPlease try again.`);
        }, 100);
        
        // Log additional context for debugging
        console.error('Allocation context:', {
          periodId: activePeriod.id,
          categoryId: selectedCategoryId,
          amount,
          availableToAssign,
          errorDetails: errorMessage,
          mutationState: {
            isLoading: allocateFunds.isLoading,
            isError: allocateFunds.isError,
            error: allocateFunds.error instanceof Error ? allocateFunds.error.message : allocateFunds.error
          }
        });
        
        // Prevent any potential cascading effects by stopping execution
        return;
      }
    };

    // Execute the safe wrapper with additional crash protection
    try {
      await safeAllocationWrapper();
    } catch (outerError) {
      console.error('🔥 Outer allocation wrapper caught error:', outerError);
      
      // Emergency fallback - don't let anything crash the page
      setTimeout(() => {
        alert('Allocation system encountered an error. Please refresh the page and try again.');
      }, 100);
    }
  };

  const sortedPeriods = [...periods].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const currentIndex = activePeriod ? periods.findIndex(p => p.id === activePeriod.id) : -1;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < periods.length - 1;

  // Show loading state while initializing or if data is not ready
  if (periodsLoading || activePeriodLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">
            {!isInitialized ? 'Initializing data...' : 'Loading budget periods...'}
          </p>
        </div>
      </div>
    );
  }

  // Show create button if no periods exist (manual creation only)
  if (!activePeriod && periods.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No budget period found</p>
          <button
            onClick={() => getOrCreateCurrentPeriod.mutate()}
            disabled={getOrCreateCurrentPeriod.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {getOrCreateCurrentPeriod.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create Current Period</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousMonth}
            disabled={!canGoPrevious || setActivePeriod.isLoading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Period Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{activePeriod?.name || 'No Period'}</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-[200px]">
                <div className="p-2">
                  <button
                    onClick={handleCreateNewPeriod}
                    disabled={createPeriod.isLoading}
                    className="w-full px-3 py-2 text-left hover:bg-muted rounded flex items-center space-x-2 text-sm disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Period</span>
                  </button>
                  
                  <hr className="my-2" />
                  
                  {sortedPeriods.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => handleSelectPeriod(period.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-muted rounded text-sm ${
                        period.id === activePeriod?.id ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      {period.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            disabled={!canGoNext || setActivePeriod.isLoading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Allocate Button */}
        <button
          onClick={() => setShowAllocationModal(true)}
          disabled={!activePeriod}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <Bitcoin className="h-4 w-4" />
          <span>Allocate sats</span>
        </button>

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Allocate Funds - {activePeriod?.name}</h2>
              <button
                onClick={() => setShowAllocationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Available to allocate: <span className="font-semibold text-green-600">{availableToAssign.toLocaleString()} sats</span>
              </p>
              {allocateFunds.isLoading && (
                <p className="text-sm text-blue-600 mb-2">
                  <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                  Processing allocation...
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              {categories.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">No categories yet. Create one first:</p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name (e.g., Groceries)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim() || createCategory.isLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {createCategory.isLoading ? '...' : 'Create'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((category) => {
                      const allocation = allocations.find(a => a.categoryId === category.id);
                      return (
                        <option key={category.id} value={category.id}>
                          {category.name} {allocation ? `(${allocation.currentAmount.toLocaleString()} sats allocated)` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="mt-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Or create new category..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <button
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim() || createCategory.isLoading}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {createCategory.isLoading ? '...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount (sats)</label>
              <input
                type="number"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(e.target.value)}
                placeholder="Enter amount in sats"
                min="1"
                max={availableToAssign}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-1 flex space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAllocationAmount(Math.floor(availableToAssign * 0.25).toString())}
                  className="text-blue-600 hover:underline"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationAmount(Math.floor(availableToAssign * 0.5).toString())}
                  className="text-blue-600 hover:underline"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationAmount(Math.floor(availableToAssign * 0.75).toString())}
                  className="text-blue-600 hover:underline"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationAmount(availableToAssign.toString())}
                  className="text-blue-600 hover:underline"
                >
                  All
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAllocationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateFunds}
                disabled={!selectedCategoryId || !allocationAmount || allocateFunds.isLoading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {allocateFunds.isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Allocating...</span>
                  </>
                ) : (
                  'Allocate Funds'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 