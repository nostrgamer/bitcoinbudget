import { useEffect } from 'react'
import { X, ArrowRight, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useCategories, useTransfers, useUnassignedBalance } from '../hooks/use-budget-storage'
import { parseToSats, isValidSatsInput, formatSats } from '../lib/bitcoin-utils'
import { UNASSIGNED_CATEGORY_ID } from '../lib/storage/budget-storage'
import type { CreateTransferInput } from '../types/budget'

// Form validation schema
const transferSchema = z.object({
  fromCategoryId: z.string().min(1, 'Source category is required'),
  toCategoryId: z.string().min(1, 'Destination category is required'),
  amount: z.string().min(1, 'Amount is required').refine(isValidSatsInput, 'Invalid amount format'),
  description: z.string().optional(),
}).refine((data) => data.fromCategoryId !== data.toCategoryId, {
  message: "Source and destination categories must be different",
  path: ["toCategoryId"],
})

type TransferFormData = z.infer<typeof transferSchema>

interface TransferFormModalProps {
  isOpen: boolean
  onClose: () => void
  defaultFromCategoryId?: string
  defaultToCategoryId?: string
}

export default function TransferFormModal({ 
  isOpen, 
  onClose, 
  defaultFromCategoryId,
  defaultToCategoryId 
}: TransferFormModalProps) {
  const { categories } = useCategories()
  const { createTransferAsync, isCreating } = useTransfers()
  const { unassignedBalance } = useUnassignedBalance()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromCategoryId: defaultFromCategoryId || '',
      toCategoryId: defaultToCategoryId || '',
      amount: '',
      description: '',
    }
  })

  const watchedFromCategoryId = watch('fromCategoryId')
  const watchedAmount = watch('amount')

  // Get active categories (not archived)
  const activeCategories = categories.filter(cat => !cat.isArchived)
  
  // Get source category details or unassigned balance
  const fromCategory = activeCategories.find(cat => cat.id === watchedFromCategoryId)
  const availableAmount = watchedFromCategoryId === UNASSIGNED_CATEGORY_ID 
    ? unassignedBalance 
    : (fromCategory?.currentAmount || 0)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        fromCategoryId: defaultFromCategoryId || '',
        toCategoryId: defaultToCategoryId || '',
        amount: '',
        description: '',
      })
    }
  }, [isOpen, reset, defaultFromCategoryId, defaultToCategoryId])

  const onSubmit = async (data: TransferFormData) => {
    try {
      const amount = parseToSats(data.amount)
      
      const fromCategoryName = data.fromCategoryId === UNASSIGNED_CATEGORY_ID 
        ? 'Unassigned' 
        : activeCategories.find(c => c.id === data.fromCategoryId)?.name || 'Unknown'
      const toCategoryName = data.toCategoryId === UNASSIGNED_CATEGORY_ID 
        ? 'Unassigned' 
        : activeCategories.find(c => c.id === data.toCategoryId)?.name || 'Unknown'

      const transferData: CreateTransferInput = {
        fromCategoryId: data.fromCategoryId,
        toCategoryId: data.toCategoryId,
        amount,
        description: data.description || `Transfer from ${fromCategoryName} to ${toCategoryName}`,
        date: new Date(),
      }

      await createTransferAsync(transferData)
      onClose()
    } catch (error) {
      console.error('Failed to transfer:', error)
    }
  }

  const handleQuickAmount = (percentage: number) => {
    const amount = Math.floor(availableAmount * percentage)
    setValue('amount', amount.toString())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Transfer Between Categories</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* From Category */}
          <div>
            <label htmlFor="fromCategoryId" className="block text-sm font-medium mb-2">
              From Category *
            </label>
            <select
              {...register('fromCategoryId')}
              id="fromCategoryId"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select source category</option>
              <option value={UNASSIGNED_CATEGORY_ID}>
                Unassigned ({formatSats(unassignedBalance)} sats available)
              </option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({formatSats(category.currentAmount)} sats available)
                </option>
              ))}
            </select>
            {errors.fromCategoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.fromCategoryId.message}</p>
            )}
          </div>

          {/* Transfer Direction Indicator */}
          {watchedFromCategoryId && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <ArrowRight className="h-5 w-5" />
                <span className="text-sm">Transfer to</span>
              </div>
            </div>
          )}

          {/* To Category */}
          <div>
            <label htmlFor="toCategoryId" className="block text-sm font-medium mb-2">
              To Category *
            </label>
            <select
              {...register('toCategoryId')}
              id="toCategoryId"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select destination category</option>
              {watchedFromCategoryId !== UNASSIGNED_CATEGORY_ID && (
                <option value={UNASSIGNED_CATEGORY_ID}>
                  Unassigned
                </option>
              )}
              {activeCategories
                .filter(cat => cat.id !== watchedFromCategoryId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            {errors.toCategoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.toCategoryId.message}</p>
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
            
            {/* Available balance info */}
            {(fromCategory || watchedFromCategoryId === UNASSIGNED_CATEGORY_ID) && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <div className="flex justify-between">
                  <span>Available in {watchedFromCategoryId === UNASSIGNED_CATEGORY_ID ? 'Unassigned' : fromCategory?.name}:</span>
                  <span className="font-mono">{formatSats(availableAmount)} sats</span>
                </div>
                {watchedAmount && isValidSatsInput(watchedAmount) && (
                  <div className="flex justify-between mt-1">
                    <span>After transfer:</span>
                    <span className="font-mono">
                      {formatSats(availableAmount - parseToSats(watchedAmount))} sats
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Quick amount buttons */}
            {(fromCategory || watchedFromCategoryId === UNASSIGNED_CATEGORY_ID) && availableAmount > 0 && (
              <div className="flex space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.25)}
                  className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.5)}
                  className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.75)}
                  className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(1)}
                  className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
                >
                  All
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <input
              {...register('description')}
              type="text"
              id="description"
              placeholder="e.g., Moving emergency fund to vacation"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank for automatic description
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
              disabled={!isValid || isCreating}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Transferring...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Transfer Funds
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 