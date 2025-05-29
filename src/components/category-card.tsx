import { useState } from 'react'
import { MoreVertical, Edit, Trash2, Archive, ArchiveRestore, Plus } from 'lucide-react'

import { useCategories } from '../hooks/use-budget-storage'
import { formatSats, formatBTC } from '../lib/bitcoin-utils'
import type { BudgetCategory } from '../types/budget'

interface CategoryCardProps {
  category: BudgetCategory
  onEdit: (category: BudgetCategory) => void
  onAddTransaction?: (categoryId: string) => void
}

export default function CategoryCard({ category, onEdit, onAddTransaction }: CategoryCardProps) {
  const { deleteCategoryAsync, updateCategoryAsync, isDeleting, isUpdating } = useCategories()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const progress = category.targetAmount > 0 
    ? (category.currentAmount / category.targetAmount) * 100 
    : 0
  const isOverBudget = category.currentAmount > category.targetAmount
  const remaining = category.targetAmount - category.currentAmount

  const handleDelete = async () => {
    try {
      await deleteCategoryAsync(category.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const handleArchive = async () => {
    try {
      await updateCategoryAsync({ 
        id: category.id, 
        updates: { isArchived: !category.isArchived } 
      })
      setShowMenu(false)
    } catch (error) {
      console.error('Failed to archive category:', error)
    }
  }

  const handleAddTransaction = () => {
    if (onAddTransaction) {
      onAddTransaction(category.id)
    }
  }

  return (
    <div className={`relative p-4 border rounded-lg bg-card hover:shadow-md transition-all ${
      category.isArchived ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0" 
            style={{ backgroundColor: category.color }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-muted-foreground truncate">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onEdit(category)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={handleAddTransaction}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Transaction</span>
              </button>

              <button
                onClick={handleArchive}
                disabled={isUpdating}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm disabled:opacity-50"
              >
                {category.isArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    <span>Unarchive</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </>
                )}
              </button>

              <hr className="my-1" />
              
              <button
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
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

      {/* Amounts */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current</span>
          <div className="text-right">
            <div className="font-mono font-medium">
              {formatSats(category.currentAmount)} sats
            </div>
            <div className="text-xs text-muted-foreground">
              ₿ {formatBTC(category.currentAmount)}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <div className="text-right">
            <div className="font-mono font-medium">
              {formatSats(category.targetAmount)} sats
            </div>
            <div className="text-xs text-muted-foreground">
              ₿ {formatBTC(category.targetAmount)}
            </div>
          </div>
        </div>

        {remaining !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {remaining > 0 ? 'Remaining' : 'Over budget'}
            </span>
            <div className={`text-right font-mono font-medium ${
              remaining > 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {remaining > 0 ? '+' : ''}{formatSats(remaining)} sats
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isOverBudget ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.toFixed(1)}% of target</span>
          {isOverBudget && (
            <span className="text-red-500 font-medium">Over budget</span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Delete Category</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete "{category.name}"? This action cannot be undone.
                All transactions in this category will become unassigned.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
} 