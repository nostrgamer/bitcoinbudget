import { useState } from 'react';
import { CheckCircle, XCircle, Wrench, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { useDataStatus, useRefreshData } from '../../hooks/use-unified-data';
import { formatSats } from '../../lib/bitcoin-utils';
import toast from 'react-hot-toast';

export function DataStatusIndicator() {
  const { isInitialized, isHealthy, lastUpdate, integrityReport, initError } = useDataStatus();
  const refreshData = useRefreshData();
  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = async () => {
    try {
      await refreshData.mutateAsync();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error('Refresh error:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span>{initError ? 'Initialization failed' : 'Initializing data...'}</span>
        {initError && (
          <div className="text-red-600 text-xs">
            {initError}
          </div>
        )}
      </div>
    );
  }

  const getStatusIcon = () => {
    if (initError || !isHealthy) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (integrityReport && (integrityReport.orphanedTransactions > 0 || integrityReport.accountBalanceErrors > 0)) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (initError) return 'Initialization Error';
    if (!isHealthy) return 'Data Issues Detected';
    if (integrityReport && (integrityReport.orphanedTransactions > 0 || integrityReport.accountBalanceErrors > 0)) {
      return 'Minor Issues';
    }
    return 'Data Healthy';
  };

  const getStatusColor = () => {
    if (initError || !isHealthy) return 'text-red-600';
    if (integrityReport && (integrityReport.orphanedTransactions > 0 || integrityReport.accountBalanceErrors > 0)) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Status Indicator */}
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Refresh Button */}
      <Button
        onClick={handleRefresh}
        disabled={refreshData.isLoading}
        size="sm"
        variant="outline"
        className="h-8"
      >
        {refreshData.isLoading ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
      </Button>

      {/* Details Panel */}
      {showDetails && integrityReport && (
        <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-50 min-w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Data Status Report</h4>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Transactions:</span>
                <div className="text-gray-600">{integrityReport.totalTransactions}</div>
              </div>
              <div>
                <span className="font-medium">Accounts:</span>
                <div className="text-gray-600">{integrityReport.totalAccounts}</div>
              </div>
              <div>
                <span className="font-medium">Orphaned:</span>
                <div className={integrityReport.orphanedTransactions > 0 ? 'text-red-600' : 'text-green-600'}>
                  {integrityReport.orphanedTransactions}
                </div>
              </div>
              <div>
                <span className="font-medium">Balance Errors:</span>
                <div className={integrityReport.accountBalanceErrors > 0 ? 'text-red-600' : 'text-green-600'}>
                  {integrityReport.accountBalanceErrors}
                </div>
              </div>
            </div>

            {lastUpdate && (
              <div className="text-xs text-gray-500 border-t pt-2">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}

            {(integrityReport.orphanedTransactions > 0 || integrityReport.accountBalanceErrors > 0) && (
              <div className="border-t pt-3">
                <Button
                  onClick={() => {
                    // This would trigger the auto-repair system
                    handleRefresh();
                  }}
                  size="sm"
                  className="w-full"
                >
                  <Wrench className="h-3 w-3 mr-2" />
                  Auto-Repair Issues
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 