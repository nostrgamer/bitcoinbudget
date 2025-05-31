import { useState } from 'react'
import { Plus, Search, Grid, List, Calendar } from 'lucide-react'

import { useTransactions, useCategories, useAccounts } from '../hooks/use-unified-data'
import TransactionCard from '../components/transaction-card'
import TransactionFormModal from '../components/transaction-form-modal'
import type { Transaction, TransactionType } from '../types/budget'

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleCloseModals = () => {
    setShowCreateModal(false)
    setEditingTransaction(null)
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || transaction.type === filterType
      const matchesCategory = filterCategory === 'all' || transaction.categoryId === filterCategory
      const matchesAccount = filterAccount === 'all' || transaction.accountId === filterAccount
      
      let matchesDate = true
      if (dateFrom || dateTo) {
        const transactionDate = new Date(transaction.date)
        if (dateFrom) {
          matchesDate = matchesDate && transactionDate >= new Date(dateFrom)
        }
        if (dateTo) {
          matchesDate = matchesDate && transactionDate <= new Date(dateTo)
        }
      }
      
      return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDate
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'amount':
          return Math.abs(b.amount) - Math.abs(a.amount)
        case 'description':
          return a.description.localeCompare(b.description)
        default:
          return 0
      }
    })

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            Track all your Bitcoin transactions and spending
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="space-y-4">
        {/* Search and Type Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-input rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted'} rounded-l-lg transition-colors`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted'} rounded-r-lg transition-colors`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="">Unassigned</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From date"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To date"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="description">Sort by Description</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Transactions</div>
          <div className="text-2xl font-bold">{transactions.length}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Income</div>
          <div className="text-2xl font-bold text-green-600">
            {totalIncome.toLocaleString()} sats
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {totalExpenses.toLocaleString()} sats
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Net</div>
          <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(totalIncome - totalExpenses).toLocaleString()} sats
          </div>
        </div>
      </div>

      {/* Transactions Grid/List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all' || dateFrom || dateTo
              ? 'No transactions match your filters.'
              : 'No transactions found.'
            }
          </div>
          {!searchTerm && filterType === 'all' && filterCategory === 'all' && filterAccount === 'all' && !dateFrom && !dateTo && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first transaction
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onEdit={handleEditTransaction}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TransactionFormModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
      />

      <TransactionFormModal
        isOpen={!!editingTransaction}
        onClose={handleCloseModals}
        transaction={editingTransaction || undefined}
      />
    </div>
  )
} 