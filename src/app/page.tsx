'use client';

import { useExplorerStore } from '@/store/explorer-store';
import { StatsCard } from '@/components/cards/stats-card';
import { LatestBlocks } from '@/components/blocks/latest-blocks';
import { formatNumber } from '@/lib/utils';
import { Blocks, Activity, Users, Hash } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function HomePage() {
  const {
    isConnected,
    isConnecting,
    chainInfo,
    latestBlocks,
    networkStats
  } = useExplorerStore();

  const isLoading = isConnecting || !isConnected;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            GLIN Testnet Explorer
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore blocks, transactions, and network activity on the GLIN incentivized testnet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatsCard
              title="Latest Block"
              value={networkStats?.blockNumber ? formatNumber(networkStats.blockNumber) : '0'}
              description="Current chain height"
              icon={Blocks}
            />
            <StatsCard
              title="Validators"
              value={networkStats?.validatorCount || 0}
              description="Active validators"
              icon={Users}
            />
            <StatsCard
              title="Transactions"
              value={latestBlocks.reduce((acc, block) => acc + (block.extrinsics?.length || 0), 0)}
              description="In last 15 blocks"
              icon={Hash}
            />
            <StatsCard
              title="Network"
              value={chainInfo?.name || 'GLIN'}
              description={`Token: ${chainInfo?.tokenSymbol || 'tGLIN'}`}
              icon={Activity}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatestBlocks blocks={latestBlocks} />

        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span>Network Activity</span>
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Node Version</span>
              <span className="text-sm font-medium">{networkStats?.nodeVersion || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Node Name</span>
              <span className="text-sm font-medium">{networkStats?.nodeName || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Chain</span>
              <span className="text-sm font-medium">{networkStats?.chain || 'GLIN Testnet'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Token Decimals</span>
              <span className="text-sm font-medium">{chainInfo?.tokenDecimals || 18}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">SS58 Format</span>
              <span className="text-sm font-medium">{chainInfo?.ss58Format || 42}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}