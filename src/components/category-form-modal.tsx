import { useState, useEffect } from 'react'
import { X, Save, Plus } from 'lucide-react'

import { useCreateCategory, useUpdateCategory } from '../hooks/use-unified-data'
import { formatSats, parseSatsInput } from '../lib/bitcoin-utils'
import type { BudgetCategory } from '../types/budget'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category?: BudgetCategory
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
]

export default function CategoryFormModal({ isOpen, onClose, category }: CategoryFormModalProps) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    color: CATEGORY_COLORS[0]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        targetAmount: formatSats(category.targetAmount),
        color: category.color
      })
    } else {
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        color: CATEGORY_COLORS[0]
      })
    }
    setErrors({})
  }, [category, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }

    if (formData.targetAmount && isNaN(parseSatsInput(formData.targetAmount))) {
      newErrors.targetAmount = 'Invalid amount format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const targetAmount = formData.targetAmount ? parseSatsInput(formData.targetAmount) : 0

      if (isEditing && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          updates: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            targetAmount,
            color: formData.color
          }
        })
      } else {
        await createCategory.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          targetAmount,
          color: formData.color,
          isArchived: false
        })
      }

      onClose()
    } catch (error) {
      console.error('Failed to save category:', error)
      setErrors({ submit: 'Failed to save category. Please try again.' })
    }
  }

  const handleClose = () => {
    if (createCategory.isLoading || updateCategory.isLoading) return
    onClose()
  }

  if (!isOpen) return null

  const isLoading = createCategory.isLoading || updateCategory.isLoading

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Category' : 'Create Category'}
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-input'
              }`}
              placeholder="e.g., Groceries, Rent, Entertainment"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional description..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Target Amount */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium mb-2">
              Target Amount (sats)
            </label>
            <input
              id="targetAmount"
              type="text"
              value={formData.targetAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                errors.targetAmount ? 'border-red-500' : 'border-input'
              }`}
              placeholder="e.g., 100000 or 100,000"
              disabled={isLoading}
            />
            {errors.targetAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.targetAmount}</p>
            )}
            {formData.targetAmount && !errors.targetAmount && (
              <p className="text-muted-foreground text-sm mt-1">
                ₿ {(parseSatsInput(formData.targetAmount) / 100000000).toFixed(8)}
              </p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="grid grid-cols-10 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color 
                      ? 'border-foreground scale-110' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isLoading}
                />
              ))}
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
                      Create
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