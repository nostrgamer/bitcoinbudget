import { useState } from 'react'
import { MoreVertical, Edit, Trash2, Plus } from 'lucide-react'

import { useUpdateCategory, useDeleteCategory } from '../hooks/use-unified-data'
import { formatSats, formatBTC } from '../lib/bitcoin-utils'
import type { BudgetCategory } from '../types/budget'

interface CategoryCardProps {
  category: BudgetCategory
  onEdit: (category: BudgetCategory) => void
}

export default function CategoryCard({ category, onEdit }: CategoryCardProps) {
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleArchive = async () => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        updates: { isArchived: !category.isArchived }
      })
    } catch (error) {
      console.error('Failed to archive category:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategory.mutateAsync(category.id)
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  const progress = category.targetAmount > 0 ? (category.currentAmount / category.targetAmount) * 100 : 0
  const isOverBudget = category.currentAmount > category.targetAmount

  return (
    <div className={`relative p-4 border rounded-lg bg-card hover:shadow-md transition-all ${
      category.isArchived ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: category.color }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-muted-foreground truncate">{category.description}</p>
            )}
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onEdit(category)
                  setShowDropdown(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => {
                  handleArchive()
                  setShowDropdown(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>{category.isArchived ? 'Unarchive' : 'Archive'}</span>
              </button>

              <hr className="my-1" />
              
              <button
                onClick={() => {
                  handleDelete()
                  setShowDropdown(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current</span>
          <span className="text-muted-foreground">Target</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="font-mono text-sm">
            {formatSats(category.currentAmount)}
          </div>
          <div className="font-mono text-sm text-muted-foreground">
            {formatSats(category.targetAmount)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isOverBudget ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className={isOverBudget ? 'text-red-600' : 'text-muted-foreground'}>
            {progress.toFixed(1)}% {isOverBudget ? 'over budget' : 'of target'}
          </span>
          <span className="text-muted-foreground">
            ₿ {formatBTC(category.currentAmount)}
          </span>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
} 