'use client';

import { useExplorerStore } from '@/store/explorer-store';
import Link from 'next/link';
import { formatHash, formatNumber } from '@/lib/utils';
import { Blocks as BlocksIcon } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RelativeTime } from '@/components/ui/relative-time';

export default function BlocksPage() {
  const { isConnected, isConnecting, latestBlocks } = useExplorerStore();

  // Show loading while connecting OR when connected but no blocks yet
  const isLoading = isConnecting || (isConnected && latestBlocks.length === 0);

  // Only show error if not connecting and definitely failed
  if (!isConnected && !isConnecting) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-muted-foreground">
          Not connected to chain
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BlocksIcon className="h-8 w-8 text-purple-600" />
            <span>Blocks</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse recent blocks on the GLIN testnet
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={15} columns={6} />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Height
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Age
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Hash
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Parent Hash
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Extrinsics
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  State Root
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {latestBlocks.map((block) => {
                const isNew = block.isNew && block.receivedAt && (Date.now() - block.receivedAt < 10000);
                return (
                  <tr
                    key={block.hash}
                    className={`hover:bg-muted/30 transition-all duration-300 ${
                      isNew ? 'bg-green-50 dark:bg-green-900/10 animate-fade-in-slide' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/block/${block.number}`}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {formatNumber(block.number)}
                        </Link>
                        {isNew && <Badge variant="new">NEW</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RelativeTime timestamp={block.timestamp} receivedAt={block.receivedAt} />
                    </td>
                    <td className="px-6 py-4">
                    <Link
                      href={`/block/${block.hash}`}
                      className="text-sm font-mono text-muted-foreground hover:text-purple-600 transition-colors"
                    >
                      {formatHash(block.hash, 10)}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatHash(block.parentHash, 10)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {block.extrinsics?.length || 0}
                    </span>
                  </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatHash(block.stateRoot, 10)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}