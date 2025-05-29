import { useState } from 'react'
import { Bitcoin, Plus, Settings, ArrowLeft, Loader2, ArrowRight, MoreVertical, Trash2, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useBudgetStorageInit, useCategories, useTransactions, useTransfers, useBudgetSummary, useDataManagement } from '../hooks/use-budget-storage'
import { formatSats, formatBTC } from '../lib/bitcoin-utils'
import { createSampleData } from '../lib/sample-data'
import { UNASSIGNED_CATEGORY_ID } from '../lib/storage/budget-storage'
import CategoryFormModal from '../components/category-form-modal'
import TransactionFormModal from '../components/transaction-form-modal'
import TransferFormModal from '../components/transfer-form-modal'
import { TransactionType } from '../types/budget'

const BudgetPage = () => {
  const navigate = useNavigate()
  const [isCreatingSample, setIsCreatingSample] = useState(false)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
  const [showCreateTransactionModal, setShowCreateTransactionModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE)
  
  // Initialize storage and get data
  const { isInitialized, isLoading: storageLoading } = useBudgetStorageInit()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const { transactions, isLoading: transactionsLoading } = useTransactions()
  const { transfers, isLoading: transfersLoading } = useTransfers()
  const { summary, isLoading: summaryLoading } = useBudgetSummary()
  const { clearAllData, exportData } = useDataManagement()

  const isLoading = storageLoading || categoriesLoading || transactionsLoading || summaryLoading || transfersLoading

  // Calculate total available sats
  const totalAvailable = summary?.totalAvailable ?? 0
  const unassignedBalance = summary ? (summary.totalIncome - summary.totalExpenses - summary.totalAvailable) : 0

  // Get recent transactions (last 5) - exclude transfer-related transactions
  const recentTransactions = transactions
    .filter(t => !t.tags?.includes('transfer')) // Filter out transfer-related transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Get active categories (not archived)
  const activeCategories = categories.filter(cat => !cat.isArchived)

  const handleCreateSampleData = async () => {
    setIsCreatingSample(true)
    try {
      await createSampleData()
      // Refresh the page data
      window.location.reload()
    } catch (error) {
      console.error('Failed to create sample data:', error)
    } finally {
      setIsCreatingSample(false)
    }
  }

  const handleAddTransaction = () => {
    setTransactionType(TransactionType.EXPENSE)
    setShowCreateTransactionModal(true)
  }

  const handleTransfer = () => {
    setShowTransferModal(true)
  }

  const handleClearAllData = () => {
    clearAllData()
    toast.success('All data cleared successfully')
  }

  if (!isInitialized && storageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing Bitcoin Budget...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Bitcoin className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Bitcoin Budget</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Available to Assign</div>
                {isLoading ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <div className={`font-mono font-semibold ${unassignedBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatSats(unassignedBalance)} sats
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ₿ {formatBTC(unassignedBalance)}
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Settings Dropdown Menu */}
                {showSettingsMenu && (
                  <div className="absolute right-0 top-12 bg-card border rounded-lg shadow-lg z-10 min-w-[200px]">
                    <button
                      onClick={() => {
                        navigate('/')
                        setShowSettingsMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-muted flex items-center space-x-3 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Budget</span>
                    </button>
                    <button
                      onClick={() => {
                        exportData()
                        setShowSettingsMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-muted flex items-center space-x-3 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Export Data</span>
                    </button>
                    <div className="border-t">
                      <button
                        onClick={() => {
                          setShowClearConfirm(true)
                          setShowSettingsMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted flex items-center space-x-3 text-sm text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Clear All Data</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Budget Summary */}
        {summary && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-sm text-muted-foreground">Total Income</div>
              <div className="font-mono font-semibold text-green-600">
                +{formatSats(summary.totalIncome)} sats
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-sm text-muted-foreground">Total Expenses</div>
              <div className="font-mono font-semibold text-red-600">
                -{formatSats(summary.totalExpenses)} sats
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-sm text-muted-foreground">Available to Assign</div>
              <div className={`font-mono font-semibold ${unassignedBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatSats(unassignedBalance)} sats
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowCreateCategoryModal(true)}
              className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Plus className="h-6 w-6 text-green-600 mb-2" />
              <div className="font-medium">New Category</div>
              <div className="text-sm text-muted-foreground">Create budget envelope</div>
            </button>
            
            <button 
              onClick={handleAddTransaction}
              className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Plus className="h-6 w-6 text-blue-600 mb-2" />
              <div className="font-medium">Add Transaction</div>
              <div className="text-sm text-muted-foreground">Record income or spending</div>
            </button>
            
            <button 
              onClick={handleTransfer}
              className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Plus className="h-6 w-6 text-purple-600 mb-2" />
              <div className="font-medium">Transfer</div>
              <div className="text-sm text-muted-foreground">Move between categories</div>
            </button>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Budget Categories</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="grid gap-4">
            {isLoading ? (
              // Loading skeleton
              <div className="p-6 border rounded-lg bg-card">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                  <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </div>
            ) : activeCategories.length > 0 ? (
              // Show categories
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCategories.map((category) => {
                  const progress = category.targetAmount > 0 
                    ? (category.currentAmount / category.targetAmount) * 100 
                    : 0
                  const isOverBudget = category.currentAmount > category.targetAmount
                  
                  return (
                    <div key={category.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{category.name}</h3>
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current</span>
                          <span className="font-mono">
                            {formatSats(category.currentAmount)} sats
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-mono">
                            {formatSats(category.targetAmount)} sats
                          </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isOverBudget ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {progress.toFixed(1)}% of target
                          {isOverBudget && (
                            <span className="text-red-500 ml-1">(Over budget)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Empty state
              <div className="p-6 border rounded-lg bg-card">
                <div className="text-center text-muted-foreground">
                  <Bitcoin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No budget categories yet</h3>
                  <p className="text-sm mb-4">
                    Create your first budget category to start organizing your sats
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button 
                      onClick={() => setShowCreateCategoryModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </button>
                    <button 
                      onClick={handleCreateSampleData}
                      disabled={isCreatingSample}
                      className="inline-flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {isCreatingSample ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Bitcoin className="h-4 w-4 mr-2" />
                      )}
                      {isCreatingSample ? 'Creating...' : 'Try Sample Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="border rounded-lg bg-card mb-8">
            {isLoading ? (
              // Loading skeleton
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                      <div className="h-4 bg-muted rounded w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ) : recentTransactions.length > 0 ? (
              // Show transactions
              <div className="divide-y">
                {recentTransactions.map((transaction) => {
                  const category = categories.find(cat => cat.id === transaction.categoryId)
                  const isIncome = transaction.amount > 0
                  
                  return (
                    <div key={transaction.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          <Bitcoin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {category ? category.name : 'Unassigned'} • {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-semibold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+' : '-'}{formatSats(Math.abs(transaction.amount))} sats
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Empty state
              <div className="p-6 text-center text-muted-foreground">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Bitcoin className="h-6 w-6" />
                </div>
                <h3 className="font-medium mb-2">No transactions yet</h3>
                <p className="text-sm">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transfers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transfers</h2>
            <button 
              onClick={() => navigate('/transfers')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="border rounded-lg bg-card">
            {isLoading ? (
              // Loading skeleton
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-8 w-8 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                      <div className="h-4 bg-muted rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ) : transfers.length > 0 ? (
              // Show recent transfers (last 3)
              <div className="divide-y">
                {transfers
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map((transfer) => {
                    const fromCategory = categories.find(cat => cat.id === transfer.fromCategoryId)
                    const toCategory = categories.find(cat => cat.id === transfer.toCategoryId)
                    
                    const fromCategoryName = transfer.fromCategoryId === UNASSIGNED_CATEGORY_ID 
                      ? 'Available to Assign' 
                      : (fromCategory?.name || 'Unknown')
                    const toCategoryName = transfer.toCategoryId === UNASSIGNED_CATEGORY_ID 
                      ? 'Available to Assign' 
                      : (toCategory?.name || 'Unknown')
                    
                    return (
                      <div key={transfer.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {fromCategoryName} → {toCategoryName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transfer.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-blue-600">
                          {formatSats(transfer.amount)} sats
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              // Empty state
              <div className="p-6 text-center text-muted-foreground">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <h3 className="font-medium mb-2">No transfers yet</h3>
                <p className="text-sm">
                  Your transfer history will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CategoryFormModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
      />
      
      <TransactionFormModal
        isOpen={showCreateTransactionModal}
        onClose={() => setShowCreateTransactionModal(false)}
        defaultType={transactionType}
      />
      
      <TransferFormModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
      />

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Clear All Data</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to clear all data? This will permanently delete all categories, transactions, and transfers. This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleClearAllData()
                    setShowClearConfirm(false)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close settings menu */}
      {showSettingsMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowSettingsMenu(false)}
        />
      )}
    </div>
  )
}

export default BudgetPage