import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Wallet } from 'lucide-react';
import { useAccounts } from '../hooks/use-accounts';
import { useBudget } from '../hooks/use-budget-storage';
import { AccountCard } from '../components/accounts/account-card';
import { AccountFormModal } from '../components/accounts/account-form-modal';
import { Account, ACCOUNT_TYPES } from '../types/account';
import { formatSats } from '../lib/bitcoin-utils';

export function AccountsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const { data: budget } = useBudget();
  const { data: accounts = [], isLoading } = useAccounts(budget?.id || '');

  // Filter and sort accounts
  const filteredAndSortedAccounts = accounts
    .filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || account.type === filterType;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'open' && !account.isClosed) ||
                           (filterStatus === 'closed' && account.isClosed) ||
                           (filterStatus === 'on-budget' && account.isOnBudget) ||
                           (filterStatus === 'off-budget' && !account.isOnBudget);
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'balance':
          return b.balance - a.balance;
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return a.sortOrder - b.sortOrder;
      }
    });

  // Calculate summary stats
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const onBudgetBalance = accounts
    .filter(account => account.isOnBudget && !account.isClosed)
    .reduce((sum, account) => sum + account.balance, 0);
  const openAccounts = accounts.filter(account => !account.isClosed).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Bitcoin accounts and wallets
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
          </div>
          <p className="text-2xl font-bold">{formatSats(totalBalance)}</p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">On-Budget Balance</span>
          </div>
          <p className="text-2xl font-bold">{formatSats(onBudgetBalance)}</p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Open Accounts</span>
          </div>
          <p className="text-2xl font-bold">{openAccounts}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="on-budget">On Budget</SelectItem>
            <SelectItem value="off-budget">Off Budget</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="balance">Balance</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Showing {filteredAndSortedAccounts.length} of {accounts.length} accounts
          </span>
          {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Accounts Grid */}
      {filteredAndSortedAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {accounts.length === 0 ? 'No accounts yet' : 'No accounts match your filters'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {accounts.length === 0 
              ? 'Create your first Bitcoin account to start tracking your funds'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {accounts.length === 0 && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Account
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              budgetId={budget?.id || ''}
            />
          ))}
        </div>
      )}

      {/* Create Account Modal */}
      <AccountFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        budgetId={budget?.id || ''}
      />
    </div>
  );
} 