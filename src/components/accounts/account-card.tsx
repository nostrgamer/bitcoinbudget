import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Account, DEFAULT_ACCOUNT_COLORS } from '../../types/account';
import { formatSats } from '../../lib/bitcoin-utils';
import { useAccountMutations } from '../../hooks/use-accounts';
import { AccountFormModal } from './account-form-modal';

interface AccountCardProps {
  account: Account;
  budgetId: string;
}

export function AccountCard({ account, budgetId }: AccountCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateAccountAsync, deleteAccountAsync, isUpdating, isDeleting } = useAccountMutations();

  const handleToggleClosed = async () => {
    try {
      await updateAccountAsync({
        accountId: account.id,
        updates: { isClosed: !account.isClosed }
      });
    } catch (error) {
      console.error('Failed to toggle account status:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      try {
        await deleteAccountAsync(account.id);
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const accountTypeColor = DEFAULT_ACCOUNT_COLORS[account.type];
  const isLoading = isUpdating || isDeleting;

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${account.isClosed ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: accountTypeColor }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate">{account.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {account.type}
                  </Badge>
                  {account.isOnBudget && (
                    <Badge variant="outline" className="text-xs">
                      On Budget
                    </Badge>
                  )}
                  {account.isClosed && (
                    <Badge variant="destructive" className="text-xs">
                      Closed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLoading}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleClosed}>
                  {account.isClosed ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Reopen Account
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Close Account
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {account.description && (
              <p className="text-sm text-muted-foreground">{account.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Balance:</span>
              <span className={`font-mono text-lg font-semibold ${
                account.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatSats(account.balance)}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              Created {account.createdAt.toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        budgetId={budgetId}
        account={account}
      />
    </>
  );
} 