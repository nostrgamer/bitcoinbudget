import { Account, CreateAccountData, UpdateAccountData } from '../../types/account';
import { encryptData, decryptData } from '../crypto/encryption';
import { openDatabase, STORES } from './indexeddb';

export class AccountStorage {
  private password: string;

  constructor(password: string) {
    this.password = password;
  }

  async createAccount(budgetId: string, data: CreateAccountData): Promise<Account> {
    const db = await openDatabase();
    
    const account: Account = {
      id: crypto.randomUUID(),
      budgetId,
      name: data.name,
      type: data.type,
      description: data.description,
      balance: data.initialBalance || 0,
      isOnBudget: data.isOnBudget,
      isClosed: false,
      sortOrder: await this.getNextSortOrder(budgetId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const encryptedAccount = await encryptData(account, this.password);
    
    const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite');
    const store = transaction.objectStore(STORES.ACCOUNTS);
    
    await store.add({
      id: account.id,
      budgetId,
      data: encryptedAccount,
      updatedAt: account.updatedAt.getTime(),
    });

    return account;
  }

  async getAccounts(budgetId: string): Promise<Account[]> {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.ACCOUNTS], 'readonly');
    const store = transaction.objectStore(STORES.ACCOUNTS);
    const index = store.index('budgetId');
    
    const records = await index.getAll(budgetId);
    
    const accounts: Account[] = [];
    for (const record of records) {
      try {
        const decryptedAccount = await decryptData(record.data, this.password);
        accounts.push(decryptedAccount);
      } catch (error) {
        console.error('Failed to decrypt account:', error);
      }
    }
    
    return accounts.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getAccount(accountId: string): Promise<Account | null> {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.ACCOUNTS], 'readonly');
    const store = transaction.objectStore(STORES.ACCOUNTS);
    
    const record = await store.get(accountId);
    if (!record) return null;
    
    try {
      return await decryptData(record.data, this.password);
    } catch (error) {
      console.error('Failed to decrypt account:', error);
      return null;
    }
  }

  async updateAccount(accountId: string, updates: UpdateAccountData): Promise<Account> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const updatedAccount: Account = {
      ...account,
      ...updates,
      updatedAt: new Date(),
    };

    const encryptedAccount = await encryptData(updatedAccount, this.password);
    
    const db = await openDatabase();
    const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite');
    const store = transaction.objectStore(STORES.ACCOUNTS);
    
    await store.put({
      id: accountId,
      budgetId: account.budgetId,
      data: encryptedAccount,
      updatedAt: updatedAccount.updatedAt.getTime(),
    });

    return updatedAccount;
  }

  async deleteAccount(accountId: string): Promise<void> {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite');
    const store = transaction.objectStore(STORES.ACCOUNTS);
    
    await store.delete(accountId);
  }

  async updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    await this.updateAccount(accountId, { balance: newBalance });
  }

  async recalculateAccountBalance(accountId: string): Promise<number> {
    // This will be implemented when we update transaction storage
    // For now, return the current balance
    const account = await this.getAccount(accountId);
    return account?.balance || 0;
  }

  private async getNextSortOrder(budgetId: string): Promise<number> {
    const accounts = await this.getAccounts(budgetId);
    return accounts.length > 0 ? Math.max(...accounts.map(a => a.sortOrder)) + 1 : 0;
  }

  async reorderAccounts(budgetId: string, accountIds: string[]): Promise<void> {
    const accounts = await this.getAccounts(budgetId);
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    for (let i = 0; i < accountIds.length; i++) {
      const account = accountMap.get(accountIds[i]);
      if (account) {
        await this.updateAccount(account.id, { sortOrder: i });
      }
    }
  }
} 