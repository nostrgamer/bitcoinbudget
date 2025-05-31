import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Grid, List, ArrowLeft, Filter } from 'lucide-react';
import { useAccounts } from '../hooks/use-unified-data';
import AccountCard from '../components/accounts/account-card';
import AccountFormModal from '../components/accounts/account-form-modal';
import type { Account } from '../types/account';

export default function AccountsPage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useAccounts();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClosed, setFilterClosed] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'type' | 'created'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
  };

  const handleTransfer = (accountId: string) => {
    // Transfer functionality temporarily disabled
    console.log('Transfer functionality not yet implemented for account:', accountId);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setEditingAccount(null);
  };

  // Filter and sort accounts
  const filteredAccounts = accounts
    .filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClosed = filterClosed ? account.isClosed : !account.isClosed;
      return matchesSearch && matchesClosed;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return b.balance - a.balance;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const onBudgetAccounts = accounts.filter(a => a.isOnBudget && !a.isClosed);
  const totalBalance = onBudgetAccounts.reduce((sum, a) => sum + a.balance, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Budget</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Accounts</h1>
            <p className="text-muted-foreground">
              Manage your Bitcoin accounts and wallets
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Account</span>
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Closed Filter */}
          <button
            onClick={() => setFilterClosed(!filterClosed)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              filterClosed 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'border-input hover:bg-muted'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>{filterClosed ? 'Closed' : 'Active'}</span>
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="balance">Sort by Balance</option>
            <option value="type">Sort by Type</option>
            <option value="created">Sort by Created</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-input rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted'} rounded-l-lg transition-colors`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted'} rounded-r-lg transition-colors`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Accounts</div>
          <div className="text-2xl font-bold">{accounts.length}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">On Budget</div>
          <div className="text-2xl font-bold">{onBudgetAccounts.length}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Total Balance</div>
          <div className="text-2xl font-bold">
            {totalBalance.toLocaleString()} sats
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Net Worth</div>
          <div className="text-2xl font-bold">
            ₿ {(totalBalance / 100000000).toFixed(8)}
          </div>
        </div>
      </div>

      {/* Accounts Grid/List */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm ? 'No accounts match your search.' : 'No accounts found.'}
          </div>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first account
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEditAccount}
              onTransfer={handleTransfer}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AccountFormModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        budgetId="default"
      />

      <AccountFormModal
        isOpen={!!editingAccount}
        onClose={handleCloseModals}
        budgetId="default"
        account={editingAccount || undefined}
      />
    </div>
  );
} 