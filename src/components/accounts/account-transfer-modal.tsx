import { useState, useEffect } from 'react'
import { X, Save, ArrowRight, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useAccounts, useAccountMutations } from '../../hooks/use-accounts'
import { useBudget } from '../../hooks/use-budget-storage'
import { parseToSats, formatSats } from '../../lib/bitcoin-utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface AccountTransferFormData {
  fromAccountId: string
  toAccountId: string
  amount: string
  description: string
  date: string
}

interface AccountTransferModalProps {
  isOpen: boolean
  onClose: () => void
  defaultFromAccountId?: string
  defaultToAccountId?: string
}

export function AccountTransferModal({ 
  isOpen, 
  onClose, 
  defaultFromAccountId,
  defaultToAccountId 
}: AccountTransferModalProps) {
  const { data: budget } = useBudget()
  const { data: accounts = [] } = useAccounts(budget?.id || '')
  const { transferBetweenAccountsAsync, isTransferring } = useAccountMutations()

  const form = useForm<AccountTransferFormData>({
    defaultValues: {
      fromAccountId: defaultFromAccountId || '',
      toAccountId: defaultToAccountId || '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        fromAccountId: defaultFromAccountId || '',
        toAccountId: defaultToAccountId || '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [isOpen, form, defaultFromAccountId, defaultToAccountId])

  // Also reset when accounts change (to handle the case where accounts load after modal opens)
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      const currentFromId = form.getValues('fromAccountId')
      const currentToId = form.getValues('toAccountId')
      
      // If no accounts are selected and we have accounts available, don't auto-select
      // Let the user choose manually
      if (!currentFromId && !defaultFromAccountId) {
        form.setValue('fromAccountId', '')
      }
      if (!currentToId && !defaultToAccountId) {
        form.setValue('toAccountId', '')
      }
    }
  }, [isOpen, accounts, form, defaultFromAccountId, defaultToAccountId])

  const onSubmit = async (data: AccountTransferFormData) => {
    try {
      const amount = parseToSats(data.amount)
      
      await transferBetweenAccountsAsync({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount,
        description: data.description || `Transfer from ${getAccountName(data.fromAccountId)} to ${getAccountName(data.toAccountId)}`,
        date: new Date(data.date),
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to transfer between accounts:', error)
    }
  }

  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Unknown Account'
  }

  const getAccountBalance = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.balance || 0
  }

  const fromAccountId = form.watch('fromAccountId')
  const toAccountId = form.watch('toAccountId')
  const amount = form.watch('amount')

  // Filter accounts for dropdowns
  const availableToAccounts = accounts.filter(acc => acc.id !== fromAccountId)
  const availableFromAccounts = accounts.filter(acc => acc.id !== toAccountId)

  // Calculate remaining balance after transfer
  const transferAmount = amount ? (() => {
    try {
      return parseToSats(amount)
    } catch {
      return 0
    }
  })() : 0
  const fromAccountBalance = getAccountBalance(fromAccountId)
  const remainingBalance = fromAccountBalance - transferAmount

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Transfer Between Accounts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* From Account */}
          <div>
            <label className="block text-sm font-medium mb-2">
              From Account *
            </label>
            <select
              {...form.register('fromAccountId')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select source account</option>
              {availableFromAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type}) - {formatSats(account.balance)} sats
                </option>
              ))}
            </select>
            {fromAccountId && (
              <p className="text-xs text-muted-foreground mt-1">
                Current balance: {formatSats(getAccountBalance(fromAccountId))} sats
              </p>
            )}
          </div>

          {/* Transfer Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-muted rounded-full">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* To Account */}
          <div>
            <label className="block text-sm font-medium mb-2">
              To Account *
            </label>
            <select
              {...form.register('toAccountId')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select destination account</option>
              {availableToAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type}) - {formatSats(account.balance)} sats
                </option>
              ))}
            </select>
            {toAccountId && (
              <p className="text-xs text-muted-foreground mt-1">
                Current balance: {formatSats(getAccountBalance(toAccountId))} sats
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <Input
              {...form.register('amount')}
              type="text"
              id="amount"
              placeholder="e.g., 100000 sats or 0.001 BTC"
            />
            {fromAccountId && amount && (
              <p className={`text-xs mt-1 ${remainingBalance < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                Remaining balance: {formatSats(remainingBalance)} sats
                {remainingBalance < 0 && ' (Insufficient funds)'}
              </p>
            )}
            
            {/* Quick Amount Buttons */}
            {fromAccountId && fromAccountBalance > 0 && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('amount', formatSats(Math.floor(fromAccountBalance * 0.25)))}
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('amount', formatSats(Math.floor(fromAccountBalance * 0.5)))}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('amount', formatSats(Math.floor(fromAccountBalance * 0.75)))}
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('amount', formatSats(fromAccountBalance))}
                >
                  All
                </Button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <Input
              {...form.register('description')}
              type="text"
              id="description"
              placeholder="Optional: Reason for transfer"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date *
            </label>
            <Input
              {...form.register('date')}
              type="date"
              id="date"
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !fromAccountId || 
                !toAccountId || 
                !amount || 
                transferAmount <= 0 ||
                remainingBalance < 0 || 
                isTransferring ||
                fromAccountId === toAccountId
              }
              className="flex-1"
            >
              {isTransferring ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Transfer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 