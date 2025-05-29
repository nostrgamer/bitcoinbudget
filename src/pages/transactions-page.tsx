import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, Filter, Calendar, TrendingUp, TrendingDown, Grid, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useTransactions, useCategories } from '../hooks/use-budget-storage'
import TransactionCard from '../components/transaction-card'
import TransactionFormModal from '../components/transaction-form-modal'
import { TransactionType, type Transaction } from '../types/budget'
import { formatSats } from '../lib/bitcoin-utils'

type ViewMode = 'grid' | 'list'
type FilterMode = 'all' | 'income' | 'expense'
type SortMode = 'date' | 'amount' | 'description' | 'category'

export default function TransactionsPage() {
  const navigate = useNavigate()
  const { transactions, isLoading } = useTransactions()
  const { categories } = useCategories()
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions

    // Apply type filter
    switch (filterMode) {
      case 'income':
        filtered = transactions.filter(t => t.type === TransactionType.INCOME)
        break
      case 'expense':
        filtered = transactions.filter(t => t.type === TransactionType.EXPENSE)
        break
      case 'all':
      default:
        // Show all transactions
        break
    }

    // Apply category filter
    if (selectedCategoryId) {
      if (selectedCategoryId === 'unassigned') {
        filtered = filtered.filter(t => !t.categoryId)
      } else {
        filtered = filtered.filter(t => t.categoryId === selectedCategoryId)
      }
    }

    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      filtered = filtered.filter(t => new Date(t.date) >= startDate)
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(t => new Date(t.date) <= endDate)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'amount':
          return Math.abs(b.amount) - Math.abs(a.amount)
        case 'description':
          return a.description.localeCompare(b.description)
        case 'category':
          const aCat = categories.find(c => c.id === a.categoryId)?.name || 'Unassigned'
          const bCat = categories.find(c => c.id === b.categoryId)?.name || 'Unassigned'
          return aCat.localeCompare(bCat)
        default:
          return 0
      }
    })

    return sorted
  }, [transactions, filterMode, selectedCategoryId, dateRange, searchQuery, sortMode, categories])

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingTransaction(undefined)
  }

  // Stats
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = Math.abs(transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0))
  
  const netAmount = totalIncome - totalExpenses

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/budget')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Transactions</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your income and expenses
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-sm text-muted-foreground">Total Income</div>
            </div>
            <div className="text-lg font-mono font-semibold text-green-600">
              +{formatSats(totalIncome)} sats
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div className="text-sm text-muted-foreground">Total Expenses</div>
            </div>
            <div className="text-lg font-mono font-semibold text-red-600">
              -{formatSats(totalExpenses)} sats
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Net Amount</div>
            <div className={`text-lg font-mono font-semibold ${
              netAmount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {netAmount >= 0 ? '+' : ''}{formatSats(netAmount)} sats
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Total Transactions</div>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="unassigned">Unassigned</option>
              {categories.filter(cat => !cat.isArchived).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="description">Sort by Description</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-4 mt-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={() => setDateRange({ start: '', end: '' })}
                className="text-sm text-primary hover:text-primary/80"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
            </div>
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        {isLoading ? (
          // Loading skeleton
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg bg-card">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-2/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedTransactions.length > 0 ? (
          // Show transactions
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredAndSortedTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEditTransaction}
                showCategory={true}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategoryId || dateRange.start || dateRange.end 
                ? 'No transactions found' 
                : 'No transactions yet'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategoryId || dateRange.start || dateRange.end
                ? 'Try adjusting your filters to see more results'
                : 'Start tracking your Bitcoin income and expenses'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Transaction
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <TransactionFormModal
        isOpen={showCreateModal || !!editingTransaction}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />
    </div>
  )
} 