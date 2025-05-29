import { useState } from 'react'
import { ArrowRight, Trash2, MoreVertical } from 'lucide-react'

import { useTransfers, useCategories } from '../hooks/use-budget-storage'
import { formatSats, formatDate } from '../lib/bitcoin-utils'
import { UNASSIGNED_CATEGORY_ID } from '../lib/storage/budget-storage'
import type { Transfer } from '../types/budget'

interface TransferCardProps {
  transfer: Transfer
}

export default function TransferCard({ transfer }: TransferCardProps) {
  const { deleteTransferAsync, isDeleting } = useTransfers()
  const { categories } = useCategories()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fromCategory = categories.find(cat => cat.id === transfer.fromCategoryId)
  const toCategory = categories.find(cat => cat.id === transfer.toCategoryId)

  const fromCategoryName = transfer.fromCategoryId === UNASSIGNED_CATEGORY_ID 
    ? 'Unassigned' 
    : (fromCategory?.name || 'Unknown')
  const toCategoryName = transfer.toCategoryId === UNASSIGNED_CATEGORY_ID 
    ? 'Unassigned' 
    : (toCategory?.name || 'Unknown')
  const fromCategoryColor = transfer.fromCategoryId === UNASSIGNED_CATEGORY_ID 
    ? '#6b7280' 
    : (fromCategory?.color || '#6b7280')
  const toCategoryColor = transfer.toCategoryId === UNASSIGNED_CATEGORY_ID 
    ? '#6b7280' 
    : (toCategory?.color || '#6b7280')

  const handleDelete = async () => {
    try {
      await deleteTransferAsync(transfer.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete transfer:', error)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* From Category */}
          <div className="flex items-center space-x-2 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: fromCategoryColor }}
            />
            <span className="text-sm font-medium truncate">
              {fromCategoryName}
            </span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          {/* To Category */}
          <div className="flex items-center space-x-2 min-w-0">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: toCategoryColor }}
            />
            <span className="text-sm font-medium truncate">
              {toCategoryName}
            </span>
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
            <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg z-10 min-w-[120px]">
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

      {/* Amount and Description */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-mono font-semibold text-blue-600">
            {formatSats(transfer.amount)} sats
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Date</span>
          <span className="text-sm">
            {formatDate(transfer.date)}
          </span>
        </div>

        {transfer.description && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">{transfer.description}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Delete Transfer</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this transfer? This will reverse the balance changes and cannot be undone.
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