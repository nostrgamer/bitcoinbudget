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
      ...(data.description && { description: data.description }),
      balance: data.initialBalance || 0,
      isOnBudget: data.isOnBudget,
      isClosed: false,
      sortOrder: await this.getNextSortOrder(budgetId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const encryptedAccount = await encryptData(JSON.stringify(account), this.password);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite');
      const store = transaction.objectStore(STORES.ACCOUNTS);
      
      const request = store.add({
        id: account.id,
        budgetId,
        data: encryptedAccount,
        updatedAt: account.updatedAt.getTime(),
      });

      request.onsuccess = () => resolve(account);
      request.onerror = () => reject(new Error('Failed to create account'));
      transaction.oncomplete = () => db.close();
    });
  }

  async getAccounts(budgetId: string): Promise<Account[]> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readonly');
      const store = transaction.objectStore(STORES.ACCOUNTS);
      const index = store.index('budgetId');
      
      const request = index.getAll(budgetId);
      
      request.onsuccess = async () => {
        const records = request.result;
        const accounts: Account[] = [];
        
        for (const record of records) {
          try {
            const decryptedData = await decryptData(record.data, this.password);
            const account = JSON.parse(decryptedData) as Account;
            // Convert date strings back to Date objects
            account.createdAt = new Date(account.createdAt);
            account.updatedAt = new Date(account.updatedAt);
            accounts.push(account);
          } catch (error) {
            console.error('Failed to decrypt account:', error);
          }
        }
        
        resolve(accounts.sort((a, b) => a.sortOrder - b.sortOrder));
      };
      
      request.onerror = () => reject(new Error('Failed to get accounts'));
      transaction.oncomplete = () => db.close();
    });
  }

  async getAccount(accountId: string): Promise<Account | null> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readonly');
      const store = transaction.objectStore(STORES.ACCOUNTS);
      
      const request = store.get(accountId);
      
      request.onsuccess = async () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }
        
        try {
          const decryptedData = await decryptData(record.data, this.password);
          const account = JSON.parse(decryptedData) as Account;
          // Convert date strings back to Date objects
          account.createdAt = new Date(account.createdAt);
          account.updatedAt = new Date(account.updatedAt);
          resolve(account);
        } catch (error) {
          console.error('Failed to decrypt account:', error);
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get account'));
      transaction.oncomplete = () => db.close();
    });
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

    const encryptedAccount = await encryptData(JSON.stringify(updatedAccount), this.password);
    
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite');
      const store = transaction.objectStore(STORES.ACCOUNTS);
      
      const request = store.put({
        id: accountId,
        budgetId: account.budgetId,
        data: encryptedAccount,
        updatedAt: updatedAccount.updatedAt.getTime(),
      });

      request.onsuccess = () => resolve(updatedAccount);
      request.onerror = () => reject(new Error('Failed to update account'));
      transaction.oncomplete = () => db.close();
    });
  }

  async deleteAccount(accountId: string): Promise<void> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ACCOUNTS], 'readwrite');
      const store = transaction.objectStore(STORES.ACCOUNTS);
      
      const request = store.delete(accountId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete account'));
      transaction.oncomplete = () => db.close();
    });
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
      const accountId = accountIds[i];
      if (accountId) {
        const account = accountMap.get(accountId);
        if (account) {
          await this.updateAccount(account.id, { sortOrder: i });
        }
      }
    }
  }
} 