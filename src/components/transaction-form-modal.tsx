import { useState, useEffect } from 'react'
import { X, Save, Plus, DollarSign, Minus, ArrowRightLeft, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useCreateTransaction, useUpdateTransaction, useCategories, useAccounts } from '../hooks/use-unified-data'
import { formatSats, parseSatsInput } from '../lib/bitcoin-utils'
import type { Transaction } from '../types/budget'
import { TransactionType } from '../types/budget'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  transaction?: Transaction
  defaultCategoryId?: string
  defaultAccountId?: string
}

export default function TransactionFormModal({ 
  isOpen, 
  onClose, 
  transaction, 
  defaultCategoryId,
  defaultAccountId 
}: TransactionFormModalProps) {
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  
  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE as TransactionType,
    accountId: '',
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    tagInput: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!transaction

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || '',
        amount: formatSats(Math.abs(transaction.amount)),
        description: transaction.description,
        date: new Date(transaction.date).toISOString().split('T')[0],
        tags: transaction.tags || [],
        tagInput: ''
      })
    } else {
      setFormData({
        type: TransactionType.EXPENSE,
        accountId: defaultAccountId || '',
        categoryId: defaultCategoryId || '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        tagInput: ''
      })
    }
    setErrors({})
  }, [transaction, isOpen, defaultCategoryId, defaultAccountId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.amount || isNaN(parseSatsInput(formData.amount))) {
      newErrors.amount = 'Valid amount is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const amount = parseSatsInput(formData.amount)
      const finalAmount = formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)

      const transactionData = {
        accountId: formData.accountId,
        categoryId: formData.categoryId || null,
        amount: finalAmount,
        description: formData.description.trim(),
        date: new Date(formData.date),
        type: formData.type,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      }

      if (isEditing && transaction) {
        await updateTransaction.mutateAsync({
          id: transaction.id,
          updates: transactionData
        })
      } else {
        await createTransaction.mutateAsync(transactionData)
      }

      onClose()
    } catch (error) {
      console.error('Failed to save transaction:', error)
      setErrors({ submit: 'Failed to save transaction. Please try again.' })
    }
  }

  const handleAddTag = () => {
    const tag = formData.tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleClose = () => {
    if (createTransaction.isLoading || updateTransaction.isLoading) return
    onClose()
  }

  if (!isOpen) return null

  const isLoading = createTransaction.isLoading || updateTransaction.isLoading
  const activeCategories = categories.filter(c => !c.isArchived)
  const onBudgetAccounts = accounts.filter(a => a.isOnBudget && !a.isClosed)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.INCOME }))}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-1 transition-colors ${
                  formData.type === 'income' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-input hover:bg-muted'
                }`}
                disabled={isLoading}
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Income</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.EXPENSE }))}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-1 transition-colors ${
                  formData.type === 'expense' 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-input hover:bg-muted'
                }`}
                disabled={isLoading}
              >
                <Minus className="h-5 w-5" />
                <span className="text-sm">Expense</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.TRANSFER }))}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-1 transition-colors ${
                  formData.type === 'transfer' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-input hover:bg-muted'
                }`}
                disabled={isLoading}
              >
                <ArrowRightLeft className="h-5 w-5" />
                <span className="text-sm">Transfer</span>
              </button>
            </div>
          </div>

          {/* Account */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium mb-2">
              Account *
            </label>
            <select
              id="accountId"
              value={formData.accountId}
              onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.accountId ? 'border-red-500' : 'border-input'
              }`}
              disabled={isLoading}
            >
              <option value="">Select account...</option>
              {onBudgetAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatSats(account.balance)} sats)
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-red-500 text-sm mt-1">{errors.accountId}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Unassigned</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount (sats) *
            </label>
            <input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                errors.amount ? 'border-red-500' : 'border-input'
              }`}
              placeholder="e.g., 100000 or 100,000"
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
            {formData.amount && !errors.amount && (
              <p className="text-muted-foreground text-sm mt-1">
                ₿ {(parseSatsInput(formData.amount) / 100000000).toFixed(8)}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-input'
              }`}
              placeholder="What was this transaction for?"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date *
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : 'border-input'
              }`}
              disabled={isLoading}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.tagInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag..."
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!formData.tagInput.trim() || isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-muted rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 