'use client';

import { useEffect, useState } from 'react';
import { substrateClient, type ProviderStake } from '@/lib/substrate/client';
import { backendClient, type ProviderInfo } from '@/lib/api/backend-client';
import { useExplorerStore } from '@/store/explorer-store';
import { Cpu, Loader2, TrendingUp, Award, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

export default function ProvidersPage() {
  const { isConnected, isConnecting } = useExplorerStore();
  const [providers, setProviders] = useState<ProviderStake[]>([]);
  const [backendProviders, setBackendProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isConnected) {
      loadProviders();
    }
  }, [isConnected]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      // Load from blockchain
      const chainProviders = await substrateClient.getAllProviders();
      setProviders(chainProviders);

      // Load from backend (enhanced data)
      try {
        const apiProviders = await backendClient.getProviders();
        setBackendProviders(apiProviders);
      } catch (error) {
        console.log('Backend providers not available:', error);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const decimals = 18;
    const value = Number(BigInt(balance) / BigInt(10 ** decimals));
    return formatNumber(value);
  };

  const filteredProviders = providers.filter((provider) => {
    if (filter === 'all') return true;
    if (filter === 'active') return provider.isActive;
    if (filter === 'inactive') return !provider.isActive;
    return true;
  });

  const totalStake = providers.reduce((sum, p) => {
    return sum + Number(BigInt(p.stake) / BigInt(10 ** 18));
  }, 0);

  const activeCount = providers.filter(p => p.isActive).length;

  if (isConnecting || (loading && !isConnected)) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">
            {isConnecting ? 'Connecting to chain...' : 'Loading providers...'}
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          GPU Providers
        </h1>
        <p className="text-muted-foreground mt-2">
          Registered GPU providers contributing compute to the GLIN network
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Providers</div>
          <div className="text-2xl font-bold mt-1">{providers.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active Providers</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{activeCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Staked</div>
          <div className="text-2xl font-bold mt-1">{formatNumber(totalStake)} tGLIN</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Avg Tasks/Provider</div>
          <div className="text-2xl font-bold mt-1">
            {providers.length > 0 ? Math.round(providers.reduce((sum, p) => sum + p.tasksCompleted, 0) / providers.length) : 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          All Providers
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'inactive'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Inactive
        </button>
      </div>

      {/* Providers List */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-orange-600" />
            <span>Providers ({filteredProviders.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Provider</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Stake</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Reputation</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Tasks Completed</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No providers found
                  </td>
                </tr>
              ) : (
                filteredProviders.map((provider) => {
                  const backendProvider = backendProviders.find(
                    (bp) => bp.address === provider.address
                  );

                  return (
                    <tr key={provider.address} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        {provider.isActive ? (
                          <div className="inline-flex items-center space-x-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Active</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1 text-gray-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Inactive</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/account/${provider.address}`}
                          className="font-mono text-sm text-purple-600 hover:text-purple-700"
                        >
                          {provider.address.slice(0, 12)}...{provider.address.slice(-8)}
                        </Link>
                        {backendProvider?.gpuSpecs && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {backendProvider.gpuSpecs.model || 'GPU Info Available'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-sm">{formatBalance(provider.stake)} tGLIN</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <Award className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-sm">{provider.reputation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">{provider.tasksCompleted}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/account/${provider.address}`}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}