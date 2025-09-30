'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { substrateClient, type BlockInfo } from '@/lib/substrate/client';
import { useExplorerStore } from '@/store/explorer-store';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Copy, Check, Clock, Hash, Box, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BlockDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isConnected, isConnecting } = useExplorerStore();
  const [block, setBlock] = useState<BlockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadBlock();
    }
  }, [resolvedParams.id, isConnected]);

  const loadBlock = async () => {
    try {
      setLoading(true);
      const blockData = /^\d+$/.test(resolvedParams.id)
        ? await substrateClient.getBlock(parseInt(resolvedParams.id))
        : await substrateClient.getBlock(resolvedParams.id);
      setBlock(blockData);
    } catch (error) {
      console.error('Failed to load block:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateHash = (hash: string, chars: number = 10) => {
    return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
  };

  if (isConnecting || (loading && !isConnected)) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">
            {isConnecting ? 'Connecting to chain...' : 'Loading block...'}
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

  if (!block) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Block Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested block does not exist.</p>
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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Block #{block.number}
          </h1>
          <p className="text-muted-foreground mt-1">Block Details</p>
        </div>
      </div>

      {/* Block Information Card */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Box className="h-5 w-5 text-purple-600" />
            <span>Block Information</span>
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Block Number */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Block Height</span>
            <span className="text-sm font-mono">{block.number}</span>
          </div>

          {/* Block Hash */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Block Hash</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono break-all">{truncateHash(block.hash, 16)}</span>
              <button
                onClick={() => copyToClipboard(block.hash, 'hash')}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied === 'hash' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Parent Hash */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Parent Hash</span>
            <div className="flex items-center space-x-2">
              <Link
                href={`/block/${block.parentHash}`}
                className="text-sm font-mono text-purple-600 hover:text-purple-700 break-all"
              >
                {truncateHash(block.parentHash, 16)}
              </Link>
              <button
                onClick={() => copyToClipboard(block.parentHash, 'parent')}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied === 'parent' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* State Root */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">State Root</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono break-all">{truncateHash(block.stateRoot, 16)}</span>
              <button
                onClick={() => copyToClipboard(block.stateRoot, 'state')}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied === 'state' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Extrinsics Root */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Extrinsics Root</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono break-all">{truncateHash(block.extrinsicsRoot, 16)}</span>
              <button
                onClick={() => copyToClipboard(block.extrinsicsRoot, 'extrinsics')}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied === 'extrinsics' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Extrinsics Count */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Extrinsics</span>
            <span className="text-sm font-mono">{block.extrinsics?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Extrinsics List */}
      {block.extrinsics && block.extrinsics.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Extrinsics ({block.extrinsics.length})</span>
            </h2>
          </div>
          <div className="divide-y">
            {block.extrinsics.map((ext: any, index: number) => (
              <div key={index} className="p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-600/10 text-purple-600 px-3 py-1 rounded-lg text-sm font-medium">
                      #{index}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{ext.section}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{ext.method}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        {truncateHash(ext.hash, 12)}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/tx/${block.hash}/${index}`}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {block.number > 0 && (
          <Link
            href={`/block/${block.number - 1}`}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous Block</span>
          </Link>
        )}
        <div className="flex-1" />
        <Link
          href={`/block/${block.number + 1}`}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
        >
          <span>Next Block</span>
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  );
}