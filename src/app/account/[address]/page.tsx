'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  type AccountInfo,
  type ProviderStake,
  type TestnetPoints,
  formatGLIN
} from '@glin-ai/sdk';
import { backendClient } from '@/lib/api/backend-client';
import { useExplorerStore } from '@/store/explorer-store';
import { useContractInfo } from '@/hooks/useContractInfo';
import { ContractInfoCard } from '@/components/contracts/contract-info-card';
import { ContractInteraction } from '@/components/contracts/contract-interaction';
import { ArrowLeft, Copy, Check, Wallet, TrendingUp, Award, Cpu, Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function AccountDetailsPage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isConnected, isConnecting, client, providers: providersModule, points: pointsModule } = useExplorerStore();
  const contractInfo = useContractInfo(resolvedParams.address);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [providerStake, setProviderStake] = useState<ProviderStake | null>(null);
  const [testnetPoints, setTestnetPoints] = useState<TestnetPoints | null>(null);
  const [backendPoints, setBackendPoints] = useState<{ address: string; points: number; rank: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadAccountData = useCallback(async () => {
    if (!client || !providersModule || !pointsModule) return;

    try {
      setLoading(true);

      // Load blockchain data
      const [accountData, providerData, pointsData] = await Promise.all([
        client.getAccountInfo(resolvedParams.address),
        providersModule.getProviderStake(resolvedParams.address),
        pointsModule.getTestnetPoints(resolvedParams.address)
      ]);

      setAccount(accountData);
      setProviderStake(providerData);
      setTestnetPoints(pointsData);

      // Load backend data
      try {
        const backendPointsData = await backendClient.getUserPoints(resolvedParams.address);
        setBackendPoints(backendPointsData);
      } catch (error) {
        console.log('Backend points not available:', error);
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.address, client, providersModule, pointsModule]);

  useEffect(() => {
    if (isConnected) {
      loadAccountData();
    }
  }, [isConnected, loadAccountData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resolvedParams.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBalance = (balance: string) => {
    const formatted = formatGLIN(BigInt(balance));
    return formatNumber(parseFloat(formatted));
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  if (isConnecting || (loading && !isConnected)) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">
            {isConnecting ? 'Connecting to chain...' : 'Loading account...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connection Failed</h2>
          <p className="text-muted-foreground">Unable to connect to the blockchain</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Account Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested account does not exist.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const totalPoints = Math.max(
    testnetPoints?.points || 0,
    backendPoints?.points || 0
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Account Details
          </h1>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-muted-foreground font-mono text-sm">{truncateAddress(account.address)}</p>
            <button
              onClick={copyToClipboard}
              className="p-1 hover:bg-secondary rounded transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Balance */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-600/10 rounded-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Free Balance</h3>
          </div>
          <p className="text-2xl font-bold">{formatBalance(account.balance.free)} tGLIN</p>
        </div>

        {/* Reserved Balance */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Reserved</h3>
          </div>
          <p className="text-2xl font-bold">{formatBalance(account.balance.reserved)} tGLIN</p>
        </div>

        {/* Testnet Points */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Testnet Points</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(totalPoints)}</p>
          {backendPoints?.rank && (
            <p className="text-sm text-muted-foreground mt-1">Rank #{backendPoints.rank}</p>
          )}
        </div>

        {/* Provider Status */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-600/10 rounded-lg">
              <Cpu className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Provider Status</h3>
          </div>
          <p className="text-2xl font-bold">{providerStake?.isActive ? 'Active' : 'Inactive'}</p>
          {providerStake && (
            <p className="text-sm text-muted-foreground mt-1">
              {providerStake.tasksCompleted} tasks completed
            </p>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Account Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Address</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono break-all">{account.address}</span>
              <button
                onClick={copyToClipboard}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Nonce</span>
            <span className="text-sm font-mono">{account.nonce}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Free Balance</span>
            <span className="text-sm font-mono">{formatBalance(account.balance.free)} tGLIN</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Reserved Balance</span>
            <span className="text-sm font-mono">{formatBalance(account.balance.reserved)} tGLIN</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Frozen Balance</span>
            <span className="text-sm font-mono">{formatBalance(account.balance.frozen)} tGLIN</span>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      {contractInfo.isContract && contractInfo.codeHash && (
        <>
          <ContractInfoCard codeHash={contractInfo.codeHash} address={account.address} />
          <ContractInteraction address={account.address} />
        </>
      )}

      {/* Provider Information */}
      {providerStake && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-orange-600" />
              <span>Provider Information</span>
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Status</span>
              <span className={`text-sm font-medium ${providerStake.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {providerStake.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Stake</span>
              <span className="text-sm font-mono">{formatBalance(providerStake.stake)} tGLIN</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Reputation</span>
              <span className="text-sm font-mono">{providerStake.reputation}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Tasks Completed</span>
              <span className="text-sm font-mono">{providerStake.tasksCompleted}</span>
            </div>
          </div>
        </div>
      )}

      {/* Testnet Points Details */}
      {(testnetPoints || backendPoints) && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <span>Testnet Participation</span>
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Total Points</span>
              <span className="text-sm font-mono">{formatNumber(totalPoints)}</span>
            </div>

            {backendPoints?.rank && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
                <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Leaderboard Rank</span>
                <span className="text-sm font-mono">#{backendPoints.rank}</span>
              </div>
            )}

            {testnetPoints?.lastUpdated && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
                <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Last Updated</span>
                <span className="text-sm font-mono">
                  {new Date(testnetPoints.lastUpdated * 1000).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}