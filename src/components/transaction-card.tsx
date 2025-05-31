import { useState } from 'react'
import { MoreVertical, Edit, Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react'

import { useTransactions, useDeleteTransaction, useCategories, useAccounts } from '../hooks/use-unified-data'
import { formatSats, formatBTC } from '../lib/bitcoin-utils'
import type { Transaction, TransactionType } from '../types/budget'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
}

export default function TransactionCard({ transaction, onEdit }: TransactionCardProps) {
  const deleteTransaction = useDeleteTransaction()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const category = categories.find(c => c.id === transaction.categoryId)
  const account = accounts.find(a => a.id === transaction.accountId)
  const transferAccount = transaction.transferAccountId 
    ? accounts.find(a => a.id === transaction.transferAccountId)
    : null

  const handleDelete = async () => {
    try {
      await deleteTransaction.mutateAsync(transaction.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'expense':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />
      default:
        return <ArrowRightLeft className="h-4 w-4 text-gray-600" />
    }
  }

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return 'text-green-600'
      case 'expense':
        return 'text-red-600'
      case 'transfer':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTransactionDescription = () => {
    if (transaction.type === 'transfer' && transferAccount) {
      const isOutgoing = transaction.amount < 0
      return `Transfer ${isOutgoing ? 'to' : 'from'} ${transferAccount.name}`
    }
    return transaction.description
  }

  return (
    <div className="relative p-4 border rounded-lg bg-card hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getTransactionIcon()}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{getTransactionDescription()}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{new Date(transaction.date).toLocaleDateString()}</span>
              {account && (
                <>
                  <span>•</span>
                  <span>{account.name}</span>
                </>
              )}
              {category && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
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
      <div className="text-right">
        <div className={`font-mono font-medium text-lg ${getAmountColor()}`}>
          {transaction.amount > 0 ? '+' : ''}{formatSats(Math.abs(transaction.amount))} sats
        </div>
        <div className="text-xs text-muted-foreground">
          ₿ {formatBTC(Math.abs(transaction.amount))}
        </div>
      </div>

      {/* Tags */}
      {transaction.tags && transaction.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {transaction.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-muted text-xs rounded-full"
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
                Are you sure you want to delete this transaction? This action cannot be undone.
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
                  disabled={deleteTransaction.isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deleteTransaction.isLoading ? (
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