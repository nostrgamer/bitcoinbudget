import { budgetStorage } from './storage/budget-storage'
import { generateCategoryColor } from './bitcoin-utils'
import { TransactionType, type BudgetCategory } from '../types/budget'

/**
 * Creates sample data for testing the application
 */
export async function createSampleData(): Promise<void> {
  try {
    // Check if we already have data
    const existingCategories = await budgetStorage.getAllCategories()
    if (existingCategories.length > 0) {
      console.log('Sample data already exists, skipping creation')
      return
    }

    console.log('Creating sample data...')

    // Create sample categories
    const categories = [
      {
        name: 'Food & Dining',
        description: 'Groceries, restaurants, and food delivery',
        targetAmount: 500000, // 500k sats
        color: generateCategoryColor(),
        icon: 'UtensilsCrossed',
        isArchived: false
      },
      {
        name: 'Transportation',
        description: 'Gas, public transport, rideshare',
        targetAmount: 300000, // 300k sats
        color: generateCategoryColor(),
        icon: 'Car',
        isArchived: false
      },
      {
        name: 'Entertainment',
        description: 'Movies, games, subscriptions',
        targetAmount: 200000, // 200k sats
        color: generateCategoryColor(),
        icon: 'Gamepad2',
        isArchived: false
      },
      {
        name: 'Emergency Fund',
        description: 'Emergency savings in sats',
        targetAmount: 1000000, // 1M sats
        color: generateCategoryColor(),
        icon: 'Shield',
        isArchived: false
      }
    ]

    // Create categories
    const createdCategories: BudgetCategory[] = []
    for (const categoryData of categories) {
      const category = await budgetStorage.createCategory(categoryData)
      createdCategories.push(category)
    }

    // Ensure we have all categories before creating transactions
    if (createdCategories.length !== categories.length) {
      throw new Error('Failed to create all categories')
    }

    // Create sample transactions
    const transactions = [
      {
        categoryId: createdCategories[0]!.id, // Food
        amount: 50000, // 50k sats income
        description: 'Bitcoin payment received',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        type: TransactionType.INCOME
      },
      {
        categoryId: createdCategories[0]!.id, // Food
        amount: -25000, // 25k sats expense
        description: 'Grocery shopping',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        type: TransactionType.EXPENSE
      },
      {
        categoryId: createdCategories[1]!.id, // Transportation
        amount: -15000, // 15k sats expense
        description: 'Gas station',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        type: TransactionType.EXPENSE
      },
      {
        categoryId: createdCategories[2]!.id, // Entertainment
        amount: -8000, // 8k sats expense
        description: 'Netflix subscription',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        type: TransactionType.EXPENSE
      },
      {
        categoryId: null, // Unassigned
        amount: 100000, // 100k sats income
        description: 'Freelance work payment',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        type: TransactionType.INCOME
      }
    ]

    // Create transactions
    for (const transactionData of transactions) {
      await budgetStorage.createTransaction(transactionData)
    }

    // Update category current amounts based on transactions
    for (const category of createdCategories) {
      const categoryTransactions = await budgetStorage.getTransactionsByCategory(category.id)
      const currentAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      await budgetStorage.updateCategory(category.id, { currentAmount })
    }

    console.log('Sample data created successfully!')
  } catch (error) {
    console.error('Failed to create sample data:', error)
  }
}

/**
 * Clears all sample data
 */
export async function clearSampleData(): Promise<void> {
  try {
    await budgetStorage.clearAllData()
    console.log('Sample data cleared successfully!')
  } catch (error) {
    console.error('Failed to clear sample data:', error)
  }
} 