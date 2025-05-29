import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Account, CreateAccountData, UpdateAccountData } from '../types/account';
import { AccountStorage } from '../lib/storage/account-storage';
import { usePassword } from './use-password';

const QUERY_KEYS = {
  accounts: (budgetId: string) => ['accounts', budgetId],
  account: (accountId: string) => ['account', accountId],
} as const;

export function useAccounts(budgetId: string) {
  const { password } = usePassword();
  
  return useQuery({
    queryKey: QUERY_KEYS.accounts(budgetId),
    queryFn: async () => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      return storage.getAccounts(budgetId);
    },
    enabled: !!password && !!budgetId,
  });
}

export function useAccount(accountId: string) {
  const { password } = usePassword();
  
  return useQuery({
    queryKey: QUERY_KEYS.account(accountId),
    queryFn: async () => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      return storage.getAccount(accountId);
    },
    enabled: !!password && !!accountId,
  });
}

export function useCreateAccount() {
  const { password } = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: string; data: CreateAccountData }) => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      return storage.createAccount(budgetId, data);
    },
    onSuccess: (account) => {
      // Invalidate accounts list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(account.budgetId) });
      // Set the new account in cache
      queryClient.setQueryData(QUERY_KEYS.account(account.id), account);
    },
  });
}

export function useUpdateAccount() {
  const { password } = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, updates }: { accountId: string; updates: UpdateAccountData }) => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      return storage.updateAccount(accountId, updates);
    },
    onSuccess: (account) => {
      // Update account in cache
      queryClient.setQueryData(QUERY_KEYS.account(account.id), account);
      // Invalidate accounts list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(account.budgetId) });
    },
  });
}

export function useDeleteAccount() {
  const { password } = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      
      // Get account before deletion to know which budget to invalidate
      const account = await storage.getAccount(accountId);
      if (!account) throw new Error('Account not found');
      
      await storage.deleteAccount(accountId);
      return { accountId, budgetId: account.budgetId };
    },
    onSuccess: ({ accountId, budgetId }) => {
      // Remove account from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.account(accountId) });
      // Invalidate accounts list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(budgetId) });
    },
  });
}

export function useReorderAccounts() {
  const { password } = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budgetId, accountIds }: { budgetId: string; accountIds: string[] }) => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      return storage.reorderAccounts(budgetId, accountIds);
    },
    onSuccess: (_, { budgetId }) => {
      // Invalidate accounts list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(budgetId) });
    },
  });
}

export function useTransferBetweenAccounts() {
  const { password } = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
      date: Date;
    }) => {
      if (!password) throw new Error('Password required');
      const storage = new AccountStorage(password);
      return storage.transferBetweenAccounts(data);
    },
    onSuccess: (result, variables) => {
      // Invalidate accounts queries for both accounts
      const fromAccount = queryClient.getQueryData<Account[]>(QUERY_KEYS.accounts(''))?.find(a => a.id === variables.fromAccountId);
      const toAccount = queryClient.getQueryData<Account[]>(QUERY_KEYS.accounts(''))?.find(a => a.id === variables.toAccountId);
      
      if (fromAccount) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(fromAccount.budgetId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.account(fromAccount.id) });
      }
      if (toAccount) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(toAccount.budgetId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.account(toAccount.id) });
      }
      
      // Also invalidate transaction queries since we created new transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

// Async versions for use in event handlers
export function useAccountMutations() {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const reorderAccounts = useReorderAccounts();
  const transferBetweenAccounts = useTransferBetweenAccounts();

  return {
    createAccountAsync: createAccount.mutateAsync,
    updateAccountAsync: updateAccount.mutateAsync,
    deleteAccountAsync: deleteAccount.mutateAsync,
    reorderAccountsAsync: reorderAccounts.mutateAsync,
    transferBetweenAccountsAsync: transferBetweenAccounts.mutateAsync,
    isCreating: createAccount.isPending,
    isUpdating: updateAccount.isPending,
    isDeleting: deleteAccount.isPending,
    isReordering: reorderAccounts.isPending,
    isTransferring: transferBetweenAccounts.isPending,
  };
} 