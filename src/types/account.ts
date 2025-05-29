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

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash';

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
}

export const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
  {
    value: 'checking',
    label: 'Checking',
    description: 'Primary spending account for daily transactions'
  },
  {
    value: 'savings',
    label: 'Savings',
    description: 'Long-term savings and emergency funds'
  },
  {
    value: 'investment',
    label: 'Investment',
    description: 'Investment accounts and trading wallets'
  },
  {
    value: 'cash',
    label: 'Cash',
    description: 'Physical cash and petty cash funds'
  }
];

export const DEFAULT_ACCOUNT_COLORS: Record<AccountType, string> = {
  checking: '#3b82f6', // blue
  savings: '#10b981', // emerald
  investment: '#8b5cf6', // violet
  cash: '#f59e0b', // amber
}; 