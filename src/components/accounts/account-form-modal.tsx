import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Loader2 } from 'lucide-react';
import { Account, CreateAccountData, UpdateAccountData, ACCOUNT_TYPES, AccountType } from '../../types/account';
import { useAccountMutations } from '../../hooks/use-accounts';
import { formatSats, parseSatsInput } from '../../lib/bitcoin-utils';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  account?: Account; // If provided, we're editing
}

export function AccountFormModal({ isOpen, onClose, budgetId, account }: AccountFormModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    type: AccountType;
    description: string;
    isOnBudget: boolean;
    initialBalance: string;
  }>({
    name: '',
    type: 'spending',
    description: '',
    isOnBudget: true,
    initialBalance: '',
  });

  const { createAccountAsync, updateAccountAsync, isCreating, isUpdating } = useAccountMutations();
  const isEditing = !!account;
  const isLoading = isCreating || isUpdating;

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (isOpen) {
      if (account) {
        // Editing existing account
        setFormData({
          name: account.name,
          type: account.type,
          description: account.description || '',
          isOnBudget: account.isOnBudget,
          initialBalance: account.balance > 0 ? formatSats(account.balance) : '',
        });
      } else {
        // Creating new account - ensure form is completely reset
        setFormData({
          name: '',
          type: 'spending',
          description: '',
          isOnBudget: true,
          initialBalance: '',
        });
      }
    } else {
      // Modal is closed - reset form to prevent stale data
      setFormData({
        name: '',
        type: 'spending',
        description: '',
        isOnBudget: true,
        initialBalance: '',
      });
    }
  }, [isOpen, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Account form submitted:', { formData, budgetId, isEditing });
    
    try {
      if (isEditing && account) {
        const updates: UpdateAccountData = {
          name: formData.name,
          type: formData.type,
          ...(formData.description.trim() && { description: formData.description.trim() }),
          isOnBudget: formData.isOnBudget,
        };
        console.log('Updating account:', updates);
        await updateAccountAsync({ accountId: account.id, updates });
      } else {
        const data: CreateAccountData = {
          name: formData.name,
          type: formData.type,
          ...(formData.description.trim() && { description: formData.description.trim() }),
          isOnBudget: formData.isOnBudget,
          initialBalance: formData.initialBalance ? parseSatsInput(formData.initialBalance) : 0,
        };
        console.log('Creating account:', data);
        await createAccountAsync({ budgetId, data });
      }
      console.log('Account operation successful');
      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | AccountType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Account' : 'Create New Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Hardware Wallet, Exchange Account"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional details about this account"
              rows={2}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance (Optional)</Label>
              <Input
                id="initialBalance"
                value={formData.initialBalance}
                onChange={(e) => handleInputChange('initialBalance', e.target.value)}
                placeholder="0 sats"
              />
              <p className="text-sm text-muted-foreground">
                Enter the current balance in this account (in sats or BTC)
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isOnBudget"
              checked={formData.isOnBudget}
              onCheckedChange={(checked) => handleInputChange('isOnBudget', checked)}
            />
            <Label htmlFor="isOnBudget" className="text-sm">
              Include in budget
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, transactions in this account will affect your budget categories
          </p>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 