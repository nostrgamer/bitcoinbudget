import { useState, useEffect } from 'react'
import { X, Save, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useTransactions, useCategories } from '../hooks/use-budget-storage'
import { parseToSats, isValidSatsInput, formatDate } from '../lib/bitcoin-utils'
import { TransactionType, type Transaction, type CreateTransactionInput, type UpdateTransactionInput } from '../types/budget'

// Form validation schema
const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description must be 200 characters or less'),
  amount: z.string().min(1, 'Amount is required').refine(isValidSatsInput, 'Invalid amount format'),
  categoryId: z.string().nullable(),
  type: z.nativeEnum(TransactionType),
  date: z.string().min(1, 'Date is required'),
  tags: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

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
  
  const [selectedType, setSelectedType] = useState<TransactionType>(
    transaction?.type || defaultType
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: transaction?.description || '',
      amount: transaction ? Math.abs(transaction.amount).toString() : '',
      categoryId: transaction?.categoryId || defaultCategoryId,
      type: transaction?.type || defaultType,
      date: transaction ? transaction.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: transaction?.tags?.join(', ') || '',
    }
  })

  const watchedType = watch('type')

  // Update form when transaction changes (for editing)
  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description,
        amount: Math.abs(transaction.amount).toString(),
        categoryId: transaction.categoryId,
        type: transaction.type,
        date: transaction.date.toISOString().split('T')[0],
        tags: transaction.tags?.join(', ') || '',
      })
      setSelectedType(transaction.type)
    } else {
      reset({
        description: '',
        amount: '',
        categoryId: defaultCategoryId,
        type: defaultType,
        date: new Date().toISOString().split('T')[0],
        tags: '',
      })
      setSelectedType(defaultType)
    }
  }, [transaction, reset, defaultCategoryId, defaultType])

  // Update type in form when selectedType changes
  useEffect(() => {
    setValue('type', selectedType)
  }, [selectedType, setValue])

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const amount = parseToSats(data.amount)
      const finalAmount = data.type === TransactionType.INCOME ? amount : -amount
      const transactionDate = new Date(data.date)
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      
      if (transaction) {
        // Editing existing transaction
        const updates: UpdateTransactionInput = {
          description: data.description,
          amount: finalAmount,
          categoryId: data.categoryId || null,
          type: data.type,
          date: transactionDate,
          tags,
        }
        await updateTransactionAsync({ id: transaction.id, updates })
      } else {
        // Creating new transaction
        const newTransaction: CreateTransactionInput = {
          description: data.description,
          amount: finalAmount,
          categoryId: data.categoryId || null,
          type: data.type,
          date: transactionDate,
          tags,
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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
            <input {...register('type')} type="hidden" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <input
              {...register('description')}
              type="text"
              id="description"
              placeholder={selectedType === TransactionType.INCOME ? 'e.g., Freelance payment' : 'e.g., Coffee shop'}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <input
              {...register('amount')}
              type="text"
              id="amount"
              placeholder="e.g., 50000 sats or 0.0005 BTC"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
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
              {...register('categoryId')}
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

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date *
            </label>
            <div className="relative">
              <input
                {...register('date')}
                type="date"
                id="date"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags
            </label>
            <input
              {...register('tags')}
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
              disabled={!isValid || isCreating || isUpdating}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating || isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {transaction ? 'Updating...' : 'Adding...'}
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