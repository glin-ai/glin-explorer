'use client';

import Link from 'next/link';
import { formatHash, formatTimestamp } from '@/lib/utils';
import { Blocks } from 'lucide-react';
import type { BlockInfo } from '@glin-ai/sdk';

interface LatestBlocksProps {
  blocks: BlockInfo[];
}

export function LatestBlocks({ blocks }: LatestBlocksProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <Blocks className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Latest Blocks</h2>
        </div>
        <Link
          href="/blocks"
          className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="divide-y">
        {blocks.map((block) => (
          <div key={block.hash} className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Block #{block.number}</span>
                  {block.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(block.timestamp)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/blocks/${block.hash}`}
                  className="text-sm text-muted-foreground hover:text-purple-600 transition-colors font-mono"
                >
                  {formatHash(block.hash)}
                </Link>
              </div>

              <div className="text-right space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Extrinsics: </span>
                  <span className="font-medium">{block.extrinsics?.length || 0}</span>
                </div>
                {block.author && (
                  <div className="text-xs text-muted-foreground">
                    by {formatHash(block.author, 4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}