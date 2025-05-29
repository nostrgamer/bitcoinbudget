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
      await storage.reorderAccounts(budgetId, accountIds);
      return budgetId;
    },
    onSuccess: (budgetId) => {
      // Invalidate accounts list to refetch with new order
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts(budgetId) });
    },
  });
}

// Async versions for use in event handlers
export function useAccountMutations() {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const reorderAccounts = useReorderAccounts();

  return {
    createAccountAsync: createAccount.mutateAsync,
    updateAccountAsync: updateAccount.mutateAsync,
    deleteAccountAsync: deleteAccount.mutateAsync,
    reorderAccountsAsync: reorderAccounts.mutateAsync,
    isCreating: createAccount.isPending,
    isUpdating: updateAccount.isPending,
    isDeleting: deleteAccount.isPending,
    isReordering: reorderAccounts.isPending,
  };
} 