export interface Account {
  id: string;
  budgetId: string;
  name: string;
  type: AccountType;
  description?: string;
  balance: number; // current balance in sats (calculated from transactions)
  isOnBudget: boolean; // whether transactions affect budget categories
  isClosed: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AccountType = 'spending' | 'savings' | 'physical' | 'investments';

export interface CreateAccountData {
  name: string;
  type: AccountType;
  description?: string;
  isOnBudget: boolean;
  initialBalance?: number; // optional starting balance
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  description?: string;
  isOnBudget?: boolean;
  isClosed?: boolean;
  balance?: number;
  sortOrder?: number;
}

export const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
  {
    value: 'spending',
    label: 'Spending',
    description: 'Primary accounts for daily transactions and expenses'
  },
  {
    value: 'savings',
    label: 'Savings',
    description: 'Long-term savings and emergency funds'
  },
  {
    value: 'physical',
    label: 'Physical',
    description: 'Physical cash, hardware wallets, and tangible assets'
  },
  {
    value: 'investments',
    label: 'Investments',
    description: 'Investment accounts, trading wallets, and portfolios'
  }
];

export const DEFAULT_ACCOUNT_COLORS: Record<AccountType, string> = {
  spending: '#3b82f6', // blue
  savings: '#10b981', // emerald
  physical: '#f59e0b', // amber
  investments: '#8b5cf6', // violet
}; 