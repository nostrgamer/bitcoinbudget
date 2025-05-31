import { useState } from 'react'
import { Bitcoin, Plus, Settings, Loader2, Trash2, FileText, XCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'

import {
  useUnifiedData,
  useTransactions,
  useCategories,
  useAccounts,
  useBudgetSummary,
  useCreateTransaction,
  useCreateCategory,
  useCreateAccount,
  useResetAllData,
  useDataManagerDiagnostics,
  useCurrentPeriodTransactions,
  useActiveBudgetPeriod
} from '../hooks/use-unified-data'

import { formatSats, formatBTC } from '../lib/bitcoin-utils'
import { createSampleData } from '../lib/sample-data'
import { TransactionType } from '../types/budget'
import type { BudgetCategory } from '../types/budget'

import BudgetPeriodSelector from '../components/budget-periods/budget-period-selector'
import CategoryCard from '../components/category-card'
import CategoryFormModal from '../components/category-form-modal'
import TransactionFormModal from '../components/transaction-form-modal'
import TransactionCard from '../components/transaction-card'
import { DataStatusIndicator } from '../components/data-status/data-status-indicator'
import { useDataStatus } from '../hooks/use-unified-data'

export default function BudgetPage() {
  const navigate = useNavigate()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: budgetSummary, isLoading: summaryLoading } = useBudgetSummary()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()
  const activePeriod = useActiveBudgetPeriod()
  const resetAllData = useResetAllData()
  const diagnostics = useDataManagerDiagnostics()

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | undefined>()
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)

  const { isInitialized, isHealthy, initError } = useDataStatus()
  
  const { data: currentPeriodTransactions = [] } = useCurrentPeriodTransactions()

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing Bitcoin Budget...</p>
          {initError && (
            <p className="text-red-600 text-sm mt-2">Error: {initError}</p>
          )}
        </div>
      </div>
    )
  }

  const isLoading = categoriesLoading || summaryLoading || transactionsLoading

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category)
    setShowCategoryModal(true)
  }

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false)
    setEditingCategory(undefined)
  }

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await resetAllData.mutateAsync()
        toast.success('All data cleared successfully')
      } catch (error) {
        console.error('Failed to clear data:', error)
        toast.error('Failed to clear data')
      }
    }
  }

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset the entire database? This will delete everything and cannot be undone.')) {
      try {
        await resetAllData.mutateAsync()
        toast.success('Database reset successfully')
      } catch (error) {
        console.error('Failed to reset database:', error)
        toast.error('Failed to reset database')
      }
    }
  }

  const activeCategories = categories.filter(c => !c.isArchived)
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bitcoin className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Bitcoin Budget</h1>
            <p className="text-muted-foreground">Manage your sats with envelope budgeting</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <DataStatusIndicator />
          
          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>

            {showSettingsDropdown && (
              <div className="absolute right-0 top-10 bg-card border rounded-lg shadow-lg z-10 min-w-[200px]">
                <button
                  onClick={() => {
                    createSampleData()
                    setShowSettingsDropdown(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Sample Data</span>
                </button>
                
                <button
                  onClick={() => {
                    // Export functionality would go here
                    setShowSettingsDropdown(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Data</span>
                </button>

                <hr className="my-1" />
                
                <button
                  onClick={() => {
                    handleClearAllData()
                    setShowSettingsDropdown(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Data</span>
                </button>

                <button
                  onClick={async () => {
                    await handleResetDatabase()
                    setShowSettingsDropdown(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm text-red-600"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Database</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Period Selector */}
      <BudgetPeriodSelector />

      {/* Budget Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-card">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground mb-1">Total Available</div>
            <div className="text-2xl font-bold text-green-600">
              {formatSats(budgetSummary?.totalAccountBalance || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              ₿ {formatBTC(budgetSummary?.totalAccountBalance || 0)}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground mb-1">Allocated</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatSats(budgetSummary?.totalAllocated || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              ₿ {formatBTC(budgetSummary?.totalAllocated || 0)}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground mb-1">Unassigned</div>
            <div className={`text-2xl font-bold ${
              (budgetSummary?.unassignedBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatSats(budgetSummary?.unassignedBalance || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              ₿ {formatBTC(budgetSummary?.unassignedBalance || 0)}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground mb-1">Net Worth</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatSats(budgetSummary?.netWorth || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              ₿ {formatBTC(budgetSummary?.netWorth || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowTransactionModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </button>

        <button
          onClick={() => setShowCategoryModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>

        <button
          onClick={() => navigate('/accounts')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Categories</h2>
          {activeCategories.length > 0 && (
            <button
              onClick={() => navigate('/categories')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          )}
        </div>

        {activeCategories.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-card">
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create your first category</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCategories.slice(0, 6).map((category) => {
              const allocation = []
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          {recentTransactions.length > 0 && (
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-card">
            <p className="text-muted-foreground mb-4">No transactions yet</p>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add your first transaction</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={handleCloseCategoryModal}
        category={editingCategory}
      />

      <TransactionFormModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
      />

      {/* Click outside to close settings dropdown */}
      {showSettingsDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowSettingsDropdown(false)}
        />
      )}
    </div>
  )
}