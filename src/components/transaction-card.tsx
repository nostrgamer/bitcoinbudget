import { useState } from 'react'
import { MoreVertical, Edit, Trash2, TrendingUp, TrendingDown, Tag, Calendar } from 'lucide-react'

import { useTransactions, useCategories } from '../hooks/use-budget-storage'
import { formatSats, formatDate } from '../lib/bitcoin-utils'
import { TransactionType, type Transaction } from '../types/budget'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  showCategory?: boolean
}

export default function TransactionCard({ transaction, onEdit, showCategory = true }: TransactionCardProps) {
  const { deleteTransactionAsync, isDeleting } = useTransactions()
  const { categories } = useCategories()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isIncome = transaction.amount > 0
  const category = categories.find(cat => cat.id === transaction.categoryId)
  const absoluteAmount = Math.abs(transaction.amount)

  const handleDelete = async () => {
    try {
      await deleteTransactionAsync(transaction.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  const getTypeIcon = () => {
    if (transaction.type === TransactionType.INCOME) {
      return <TrendingUp className="h-4 w-4" />
    }
    return <TrendingDown className="h-4 w-4" />
  }

  const getTypeColor = () => {
    if (transaction.type === TransactionType.INCOME) {
      return 'text-green-600 bg-green-50'
    }
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{transaction.description}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(transaction.date)}</span>
              {showCategory && category && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate">{category.name}</span>
                  </div>
                </>
              )}
              {!category && showCategory && (
                <>
                  <span>•</span>
                  <span className="text-muted-foreground">Unassigned</span>
                </>
              )}
            </div>
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
                  onEdit(transaction)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
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

      {/* Amount */}
      <div className="mb-3">
        <div className={`text-lg font-mono font-semibold ${
          isIncome ? 'text-green-600' : 'text-red-600'
        }`}>
          {isIncome ? '+' : '-'}{formatSats(absoluteAmount)} sats
        </div>
        <div className="text-xs text-muted-foreground">
          ₿ {(absoluteAmount / 100000000).toFixed(8)}
        </div>
      </div>

      {/* Tags */}
      {transaction.tags && transaction.tags.length > 0 && (
        <div className="flex items-center space-x-1 flex-wrap">
          <Tag className="h-3 w-3 text-muted-foreground" />
          {transaction.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Delete Transaction</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete "{transaction.description}"? This action cannot be undone.
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