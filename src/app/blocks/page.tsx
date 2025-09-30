'use client';

import { useExplorerStore } from '@/store/explorer-store';
import Link from 'next/link';
import { formatHash, formatNumber } from '@/lib/utils';
import { Blocks as BlocksIcon, Loader2 } from 'lucide-react';

export default function BlocksPage() {
  const { isConnected, isConnecting, latestBlocks } = useExplorerStore();

  if (isConnecting) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading blocks...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
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

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Height
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
            {latestBlocks.map((block) => (
              <tr key={block.hash} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <Link
                    href={`/block/${block.number}`}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {formatNumber(block.number)}
                  </Link>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}