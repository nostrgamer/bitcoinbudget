import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useTransfers, useCategories } from '../hooks/use-budget-storage'
import TransferCard from '../components/transfer-card'
import TransferFormModal from '../components/transfer-form-modal'
import { formatSats } from '../lib/bitcoin-utils'

export default function TransfersPage() {
  const navigate = useNavigate()
  const { transfers, isLoading } = useTransfers()
  const { categories } = useCategories()
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    let filtered = transfers

    // Apply category filter
    if (selectedCategoryId) {
      filtered = transfers.filter(t => 
        t.fromCategoryId === selectedCategoryId || 
        t.toCategoryId === selectedCategoryId
      )
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => {
        const fromCategory = categories.find(c => c.id === t.fromCategoryId)
        const toCategory = categories.find(c => c.id === t.toCategoryId)
        return (
          t.description?.toLowerCase().includes(query) ||
          fromCategory?.name.toLowerCase().includes(query) ||
          toCategory?.name.toLowerCase().includes(query)
        )
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transfers, selectedCategoryId, searchQuery, categories])

  // Stats
  const totalTransferAmount = transfers.reduce((sum, t) => sum + t.amount, 0)
  const activeCategories = categories.filter(cat => !cat.isArchived)

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
                <h1 className="text-xl font-semibold">Transfer History</h1>
                <p className="text-sm text-muted-foreground">
                  View and manage transfers between categories
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-muted-foreground">Total Transfers</div>
            </div>
            <div className="text-2xl font-bold">{transfers.length}</div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Total Amount Moved</div>
            <div className="text-lg font-mono font-semibold text-blue-600">
              {formatSats(totalTransferAmount)} sats
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Active Categories</div>
            <div className="text-2xl font-bold">{activeCategories.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredTransfers.length} of {transfers.length} transfers
            </div>
          </div>
        </div>

        {/* Transfers */}
        {isLoading ? (
          // Loading skeleton
          <div className="grid gap-4">
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
        ) : filteredTransfers.length > 0 ? (
          // Show transfers
          <div className="grid gap-4">
            {filteredTransfers.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <ArrowRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategoryId 
                ? 'No transfers found' 
                : 'No transfers yet'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategoryId
                ? 'Try adjusting your filters to see more results'
                : 'Start moving money between your budget categories'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Transfer
            </button>
          </div>
        )}
      </main>

      {/* Modal */}
      <TransferFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
} 