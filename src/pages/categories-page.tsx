import { useState } from 'react'
import { Plus, Search, Grid, List } from 'lucide-react'

import { useCategories } from '../hooks/use-unified-data'
import CategoryCard from '../components/category-card'
import CategoryFormModal from '../components/category-form-modal'
import type { BudgetCategory } from '../types/budget'

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories()
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'target' | 'current' | 'created'>('name')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'archived'>('all')

  const handleEdit = (category: BudgetCategory) => {
    setEditingCategory(category)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(undefined)
  }

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'active' && !category.isArchived) ||
                         (filterBy === 'archived' && category.isArchived)
    
    return matchesSearch && matchesFilter
  })

  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'target':
        return b.targetAmount - a.targetAmount
      case 'current':
        return b.currentAmount - a.currentAmount
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  const activeCategories = categories.filter(c => !c.isArchived)
  const archivedCategories = categories.filter(c => c.isArchived)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your budget categories and spending targets
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-blue-600">{activeCategories.length}</div>
          <div className="text-sm text-muted-foreground">Active Categories</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-gray-600">{archivedCategories.length}</div>
          <div className="text-sm text-muted-foreground">Archived Categories</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-green-600">
            {categories.reduce((sum, c) => sum + c.currentAmount, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Allocated (sats)</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as any)}
          className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="target">Sort by Target</option>
          <option value="current">Sort by Current</option>
          <option value="created">Sort by Created</option>
        </select>

        {/* View Mode */}
        <div className="flex border border-input rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-muted' : ''}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Categories Grid/List */}
      {sortedCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || filterBy !== 'all' 
              ? 'No categories match your filters' 
              : 'No categories yet'
            }
          </div>
          {!searchTerm && filterBy === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create your first category</span>
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {sortedCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        category={editingCategory}
      />
    </div>
  )
} 