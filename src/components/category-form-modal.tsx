import { useState, useEffect } from 'react'
import { X, Save, Palette } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useCategories } from '../hooks/use-budget-storage'
import { parseToSats, isValidSatsInput, generateCategoryColor } from '../lib/bitcoin-utils'
import type { BudgetCategory, CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from '../types/budget'

// Form validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name must be 50 characters or less'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
  targetAmount: z.string().min(1, 'Target amount is required').refine(isValidSatsInput, 'Invalid amount format'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  icon: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category?: BudgetCategory | undefined // If provided, we're editing; otherwise creating
}

const PREDEFINED_COLORS = [
  '#f7931a', // Bitcoin orange
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#64748b', // Slate
  '#78716c', // Stone
]

export default function CategoryFormModal({ isOpen, onClose, category }: CategoryFormModalProps) {
  const { createCategoryAsync, updateCategoryAsync, isCreating, isUpdating } = useCategories()
  const [selectedColor, setSelectedColor] = useState(category?.color || generateCategoryColor())

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      targetAmount: category ? category.targetAmount.toString() : '',
      color: category?.color || selectedColor,
      icon: category?.icon || '',
    }
  })

  const watchedColor = watch('color')

  // Update form when category changes (for editing)
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        targetAmount: category.targetAmount.toString(),
        color: category.color,
        icon: category.icon || '',
      })
      setSelectedColor(category.color)
    } else {
      reset({
        name: '',
        description: '',
        targetAmount: '',
        color: selectedColor,
        icon: '',
      })
    }
  }, [category, reset, selectedColor])

  // Update color in form when selectedColor changes
  useEffect(() => {
    setValue('color', selectedColor)
  }, [selectedColor, setValue])

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const targetAmount = parseToSats(data.targetAmount)
      
      if (category) {
        // Editing existing category
        const updates: UpdateBudgetCategoryInput = {
          name: data.name,
          targetAmount,
          color: data.color,
        }
        
        // Only include optional fields if they have values
        if (data.description && data.description.trim()) {
          updates.description = data.description
        }
        if (data.icon && data.icon.trim()) {
          updates.icon = data.icon
        }
        
        await updateCategoryAsync({ id: category.id, updates })
      } else {
        // Creating new category
        const newCategory: CreateBudgetCategoryInput = {
          name: data.name,
          targetAmount,
          color: data.color,
          isArchived: false,
        }
        
        // Only include optional fields if they have values
        if (data.description && data.description.trim()) {
          newCategory.description = data.description
        }
        if (data.icon && data.icon.trim()) {
          newCategory.icon = data.icon
        }
        
        await createCategoryAsync(newCategory)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const handleRandomColor = () => {
    const randomColor = generateCategoryColor()
    setSelectedColor(randomColor)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {category ? 'Edit Category' : 'Create Category'}
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
          {/* Category Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Category Name *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="e.g., Food & Dining"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={2}
              placeholder="Optional description..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium mb-2">
              Target Amount *
            </label>
            <input
              {...register('targetAmount')}
              type="text"
              id="targetAmount"
              placeholder="e.g., 100000 sats or 0.001 BTC"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.targetAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.targetAmount.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              You can enter amounts in sats (e.g., 100000) or BTC (e.g., 0.001)
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category Color *
            </label>
            <div className="space-y-3">
              {/* Color Preview */}
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: watchedColor || selectedColor }}
                />
                <input
                  {...register('color')}
                  type="text"
                  placeholder="#f7931a"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={handleRandomColor}
                  className="p-2 border rounded-lg hover:bg-muted transition-colors"
                  title="Random color"
                >
                  <Palette className="h-4 w-4" />
                </button>
              </div>

              {/* Predefined Colors */}
              <div className="grid grid-cols-6 gap-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color 
                        ? 'border-primary scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            {errors.color && (
              <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
            )}
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
                  {category ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {category ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 