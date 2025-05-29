import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Search, Filter, Archive, Grid, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCategories } from '../hooks/use-budget-storage'
import CategoryCard from '../components/category-card'
import CategoryFormModal from '../components/category-form-modal'
import TransactionFormModal from '../components/transaction-form-modal'
import type { BudgetCategory } from '../types/budget'
import { TransactionType } from '../types/budget'

type ViewMode = 'grid' | 'list'
type FilterMode = 'all' | 'active' | 'archived'
type SortMode = 'name' | 'target' | 'current' | 'progress'

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { categories, isLoading } = useCategories()
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterMode, setFilterMode] = useState<FilterMode>('active')
  const [sortMode, setSortMode] = useState<SortMode>('name')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | undefined>()
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories

    // Apply filter
    switch (filterMode) {
      case 'active':
        filtered = categories.filter(cat => !cat.isArchived)
        break
      case 'archived':
        filtered = categories.filter(cat => cat.isArchived)
        break
      case 'all':
      default:
        // Show all categories
        break
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
      )
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'target':
          return b.targetAmount - a.targetAmount
        case 'current':
          return b.currentAmount - a.currentAmount
        case 'progress':
          const progressA = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0
          const progressB = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0
          return progressB - progressA
        default:
          return 0
      }
    })

    return sorted
  }, [categories, filterMode, searchQuery, sortMode])

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingCategory(undefined)
    setShowTransactionModal(false)
    setSelectedCategoryId(undefined)
  }

  const handleAddTransaction = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setShowTransactionModal(true)
  }

  // Stats
  const activeCategories = categories.filter(cat => !cat.isArchived)
  const archivedCategories = categories.filter(cat => cat.isArchived)
  const totalTarget = activeCategories.reduce((sum, cat) => sum + cat.targetAmount, 0)
  const totalCurrent = activeCategories.reduce((sum, cat) => sum + cat.currentAmount, 0)

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
                <h1 className="text-xl font-semibold">Categories</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your budget categories
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Active Categories</div>
            <div className="text-2xl font-bold">{activeCategories.length}</div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Archived</div>
            <div className="text-2xl font-bold">{archivedCategories.length}</div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Total Target</div>
            <div className="text-lg font-mono font-semibold">
              {(totalTarget / 100000000).toFixed(8)} BTC
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground">Total Current</div>
            <div className="text-lg font-mono font-semibold">
              {(totalCurrent / 100000000).toFixed(8)} BTC
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="target">Sort by Target</option>
            <option value="current">Sort by Current</option>
            <option value="progress">Sort by Progress</option>
          </select>

          {/* View Mode */}
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

        {/* Categories */}
        {isLoading ? (
          // Loading skeleton
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg bg-card">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-2/3 mb-4" />
                  <div className="h-2 bg-muted rounded w-full mb-2" />
                  <div className="h-2 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedCategories.length > 0 ? (
          // Show categories
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredAndSortedCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEditCategory}
                onAddTransaction={handleAddTransaction}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No categories match "${searchQuery}"`
                : 'Create your first budget category to get started'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CategoryFormModal
        isOpen={showCreateModal || !!editingCategory}
        onClose={handleCloseModal}
        category={editingCategory}
      />
      
      <TransactionFormModal
        isOpen={showTransactionModal}
        onClose={handleCloseModal}
        defaultCategoryId={selectedCategoryId || null}
        defaultType={TransactionType.EXPENSE}
      />
    </div>
  )
} 