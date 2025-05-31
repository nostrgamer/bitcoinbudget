import { useState } from 'react';
import { MoreVertical, Edit, Trash2, ArrowRightLeft, Eye, EyeOff } from 'lucide-react';
import { useUpdateAccount, useDeleteAccount } from '../../hooks/use-unified-data';
import { formatSats, formatBTC } from '../../lib/bitcoin-utils';
import type { Account } from '../../types/account';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onTransfer: (accountId: string) => void;
}

export default function AccountCard({ account, onEdit, onTransfer }: AccountCardProps) {
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  
  const [showDropdown, setShowDropdown] = useState(false);

  const getAccountTypeDisplay = (type: string) => {
    switch (type) {
      case 'spending':
        return { label: 'Spending', color: 'bg-blue-100 text-blue-800' };
      case 'savings':
        return { label: 'Savings', color: 'bg-green-100 text-green-800' };
      case 'investment':
        return { label: 'Investment', color: 'bg-purple-100 text-purple-800' };
      case 'debt':
        return { label: 'Debt', color: 'bg-red-100 text-red-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const typeDisplay = getAccountTypeDisplay(account.type);

  const handleToggleOnBudget = async () => {
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        updates: { isOnBudget: !account.isOnBudget }
      });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleToggleClosed = async () => {
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        updates: { isClosed: !account.isClosed }
      });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      try {
        await deleteAccount.mutateAsync(account.id);
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const getBalanceColor = () => {
    if (account.balance > 0) return 'text-green-600';
    if (account.balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`relative p-4 border rounded-lg bg-card hover:shadow-md transition-all ${
      account.isClosed ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium truncate">{account.name}</h3>
              {account.isClosed && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Closed
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${typeDisplay.color}`}>
                {typeDisplay.label}
              </span>
              {account.isOnBudget && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  On Budget
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onEdit(account);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => {
                  onTransfer(account.id);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm opacity-50 cursor-not-allowed"
                disabled={true}
                title="Transfer functionality coming soon"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfer (Coming Soon)</span>
              </button>

              <button
                onClick={() => {
                  handleToggleOnBudget();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
                disabled={updateAccount.isLoading}
              >
                {account.isOnBudget ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{account.isOnBudget ? 'Remove from Budget' : 'Add to Budget'}</span>
              </button>

              <button
                onClick={() => {
                  handleToggleClosed();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm"
              >
                {account.isClosed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>{account.isClosed ? 'Reopen Account' : 'Close Account'}</span>
              </button>

              <hr className="my-1" />
              
              <button
                onClick={() => {
                  handleDelete();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2 text-sm text-red-600"
                disabled={deleteAccount.isLoading}
              >
                <Trash2 className="h-4 w-4" />
                <span>
                  {deleteAccount.isLoading ? (
                    'Deleting...'
                  ) : (
                    'Delete'
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="text-right">
        <div className={`font-mono font-medium text-lg ${getBalanceColor()}`}>
          {formatSats(account.balance)} sats
        </div>
        <div className="text-xs text-muted-foreground">
          ₿ {formatBTC(account.balance)}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 