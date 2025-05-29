import { useState, useEffect } from 'react'
import { X, Save, TrendingUp, TrendingDown, Calendar, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useTransactions, useCategories, useBudget } from '../hooks/use-budget-storage'
import { useAccounts } from '../hooks/use-accounts'
import { parseToSats, isValidSatsInput, formatSats } from '../lib/bitcoin-utils'
import { TransactionType, type Transaction, type CreateTransactionInput, type UpdateTransactionInput } from '../types/budget'

interface TransactionFormData {
  type: TransactionType
  description: string
  categoryId: string | null
  accountId: string
  amount: string
  date: string
  tags?: string
}

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  transaction?: Transaction | undefined
  defaultCategoryId?: string | null
  defaultType?: TransactionType
}

export default function TransactionFormModal({ 
  isOpen, 
  onClose, 
  transaction, 
  defaultCategoryId = null,
  defaultType = TransactionType.EXPENSE 
}: TransactionFormModalProps) {
  const { createTransactionAsync, updateTransactionAsync, isCreating, isUpdating } = useTransactions()
  const { categories } = useCategories()
  const { data: budget } = useBudget()
  const { data: accounts = [] } = useAccounts(budget?.id || '')
  
  const [selectedType, setSelectedType] = useState<TransactionType>(
    transaction?.type || defaultType
  )

  const form = useForm<TransactionFormData>({
    defaultValues: {
      type: transaction?.type || defaultType,
      description: transaction?.description || '',
      amount: transaction ? formatSats(Math.abs(transaction.amount)) : '',
      categoryId: transaction?.categoryId || defaultCategoryId || null,
      date: transaction?.date ? transaction.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: transaction?.tags?.join(', ') || '',
      accountId: transaction?.accountId || (accounts.length > 0 ? accounts[0].id : ''),
    },
  })

  // Update form when transaction changes (for editing)
  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: formatSats(Math.abs(transaction.amount)),
        categoryId: transaction.categoryId,
        type: transaction.type,
        date: transaction.date.toISOString().split('T')[0],
        tags: transaction.tags?.join(', ') || '',
        accountId: transaction.accountId || (accounts.length > 0 ? accounts[0].id : ''),
      })
      setSelectedType(transaction.type)
    } else {
      form.reset({
        description: '',
        amount: '',
        categoryId: defaultCategoryId,
        type: defaultType,
        date: new Date().toISOString().split('T')[0],
        tags: '',
        accountId: accounts.length > 0 ? accounts[0].id : '',
      })
      setSelectedType(defaultType)
    }
  }, [transaction, form, defaultCategoryId, defaultType, accounts])

  // Update type in form when selectedType changes
  useEffect(() => {
    form.setValue('type', selectedType)
  }, [selectedType, form])

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const amount = parseToSats(data.amount)
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

      if (transaction) {
        const updates: UpdateTransactionInput = {
          description: data.description,
          amount: data.type === TransactionType.EXPENSE ? -Math.abs(amount) : Math.abs(amount),
          categoryId: data.categoryId,
          type: data.type,
          date: new Date(data.date),
          accountId: data.accountId,
          ...(tags.length > 0 && { tags }),
        }
        await updateTransactionAsync({ id: transaction.id, updates })
      } else {
        const newTransaction: CreateTransactionInput = {
          description: data.description,
          amount: data.type === TransactionType.EXPENSE ? -Math.abs(amount) : Math.abs(amount),
          categoryId: data.categoryId,
          type: data.type,
          date: new Date(data.date),
          accountId: data.accountId,
          ...(tags.length > 0 && { tags }),
        }
        await createTransactionAsync(newTransaction)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    }
  }

  const handleTypeChange = (type: TransactionType) => {
    setSelectedType(type)
  }

  // Get active categories for dropdown
  const activeCategories = categories.filter(cat => !cat.isArchived)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange(TransactionType.INCOME)}
                className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedType === TransactionType.INCOME
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'hover:bg-muted'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Income</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedType === TransactionType.EXPENSE
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'hover:bg-muted'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                <span>Expense</span>
              </button>
            </div>
            <input {...form.register('type')} type="hidden" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <input
              {...form.register('description')}
              type="text"
              id="description"
              placeholder={selectedType === TransactionType.INCOME ? 'e.g., Freelance payment' : 'e.g., Coffee shop'}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <input
              {...form.register('amount')}
              type="text"
              id="amount"
              placeholder="e.g., 50000 sats or 0.0005 BTC"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {form.formState.errors.amount && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.amount.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter amount in sats (e.g., 50000) or BTC (e.g., 0.0005)
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              {...form.register('categoryId')}
              id="categoryId"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Assign to a budget category
            </p>
          </div>

          {/* Account */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium mb-2">
              Account *
            </label>
            {accounts.length > 0 ? (
              <select
                {...form.register('accountId')}
                id="accountId"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type}) - {formatSats(account.balance)} sats
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border rounded-lg bg-muted text-muted-foreground">
                No accounts available. Please create an account first.
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Select which account this transaction belongs to
            </p>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date *
            </label>
            <div className="relative">
              <input
                {...form.register('date')}
                type="date"
                id="date"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {form.formState.errors.date && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags
            </label>
            <input
              {...form.register('tags')}
              type="text"
              id="tags"
              placeholder="e.g., food, entertainment, work"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Comma-separated tags for organization
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.formState.isValid || isCreating || isUpdating || accounts.length === 0}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating || isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {transaction ? 'Updating...' : 'Adding...'}
                </>
              ) : accounts.length === 0 ? (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Create Account First
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {transaction ? 'Update Transaction' : 'Add Transaction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 