import { budgetStorage } from './storage/budget-storage'
import { generateCategoryColor } from './bitcoin-utils'
import { TransactionType, type BudgetCategory } from '../types/budget'
import { AccountStorage } from './storage/account-storage'

/**
 * Creates sample data for testing the application
 */
export async function createSampleData(): Promise<void> {
  try {
    // Check if we already have data
    const existingBudgets = await budgetStorage.getAllBudgets()
    const existingCategories = await budgetStorage.getAllCategories()
    if (existingBudgets.length > 0 || existingCategories.length > 0) {
      console.log('Sample data already exists, skipping creation')
      return
    }

    console.log('Creating sample data...')

    // Create a default budget first
    const budget = await budgetStorage.createBudget({
      name: 'My Bitcoin Budget',
      description: 'Personal Bitcoin budget using envelope methodology',
      isActive: true,
      totalBalance: 0,
      unassignedBalance: 0,
      categories: []
    })

    console.log('Created budget:', budget.id)

    // Create a default account
    const accountStorage = new AccountStorage('bitcoin-budget-default-password-2024')
    const defaultAccount = await accountStorage.createAccount(budget.id, {
      name: 'Main Bitcoin Wallet',
      type: 'spending',
      description: 'Primary Bitcoin wallet for daily transactions',
      isOnBudget: true,
      initialBalance: 5000000, // 5M sats starting balance
    })

    console.log('Created default account:', defaultAccount.id)

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

    // Sample transactions
    const sampleTransactions = [
      {
        categoryId: createdCategories[0]?.id || null, // Groceries
        amount: -25000, // 25,000 sats expense
        description: 'Weekly grocery shopping',
        date: new Date(2024, 0, 15),
        type: TransactionType.EXPENSE,
        accountId: defaultAccount.id,
      },
      {
        categoryId: createdCategories[1]?.id || null, // Transportation
        amount: -8000, // 8,000 sats expense
        description: 'Bus fare',
        date: new Date(2024, 0, 16),
        type: TransactionType.EXPENSE,
        accountId: defaultAccount.id,
      },
      {
        categoryId: createdCategories[2]?.id || null, // Entertainment
        amount: -15000, // 15,000 sats expense
        description: 'Movie tickets',
        date: new Date(2024, 0, 17),
        type: TransactionType.EXPENSE,
        accountId: defaultAccount.id,
      },
      {
        categoryId: null, // Unassigned income
        amount: 500000, // 500,000 sats income
        description: 'Freelance payment',
        date: new Date(2024, 0, 10),
        type: TransactionType.INCOME,
        accountId: defaultAccount.id,
      },
      {
        categoryId: null, // Unassigned income
        amount: 200000, // 200,000 sats income
        description: 'Side project payment',
        date: new Date(2024, 0, 12),
        type: TransactionType.INCOME,
        accountId: defaultAccount.id,
      },
    ]

    // Create transactions
    for (const transactionData of sampleTransactions) {
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