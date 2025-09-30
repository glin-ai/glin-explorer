'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { substrateClient, type TransactionInfo, type EventInfo } from '@/lib/substrate/client';
import { useExplorerStore } from '@/store/explorer-store';
import { ArrowLeft, Copy, Check, CheckCircle2, XCircle, FileText, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function TransactionDetailsPage({
  params
}: {
  params: Promise<{ blockHash: string; index: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isConnected, isConnecting } = useExplorerStore();
  const [tx, setTx] = useState<TransactionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true);
      const txData = await substrateClient.getTransaction(
        resolvedParams.blockHash,
        parseInt(resolvedParams.index)
      );
      setTx(txData);
    } catch (error) {
      console.error('Failed to load transaction:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.blockHash, resolvedParams.index]);

  useEffect(() => {
    if (isConnected) {
      loadTransaction();
    }
  }, [isConnected, loadTransaction]);

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
            {isConnecting ? 'Connecting to chain...' : 'Loading transaction...'}
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

  if (!tx) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Transaction Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested transaction does not exist.</p>
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
            Transaction Details
          </h1>
          <p className="text-muted-foreground mt-1">{tx.section}.{tx.method}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-3">
        {tx.success ? (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600/10 text-green-600 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Success</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600/10 text-red-600 rounded-lg">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Failed</span>
          </div>
        )}
      </div>

      {/* Transaction Information Card */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span>Transaction Information</span>
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Transaction Hash */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Transaction Hash</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono break-all">{truncateHash(tx.hash, 16)}</span>
              <button
                onClick={() => copyToClipboard(tx.hash, 'hash')}
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

          {/* Block */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Block</span>
            <Link
              href={`/block/${tx.blockNumber}`}
              className="text-sm font-mono text-purple-600 hover:text-purple-700"
            >
              #{tx.blockNumber}
            </Link>
          </div>

          {/* Method */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Method</span>
            <span className="text-sm font-mono">
              {tx.section}.{tx.method}
            </span>
          </div>

          {/* Signer */}
          {tx.signer && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-3 border-b">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Signer</span>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/account/${tx.signer}`}
                  className="text-sm font-mono text-purple-600 hover:text-purple-700 break-all"
                >
                  {truncateHash(tx.signer, 12)}
                </Link>
                <button
                  onClick={() => copyToClipboard(tx.signer!, 'signer')}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  {copied === 'signer' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Fee */}
          {tx.fee && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
              <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Fee</span>
              <span className="text-sm font-mono">{tx.fee} tGLIN</span>
            </div>
          )}
        </div>
      </div>

      {/* Arguments */}
      {tx.args && tx.args.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Arguments</h2>
          </div>
          <div className="p-6">
            <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(tx.args, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {tx.events && tx.events.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span>Events ({tx.events.length})</span>
            </h2>
          </div>
          <div className="divide-y">
            {tx.events.map((event: EventInfo, index: number) => (
              <div key={index} className="p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-600/10 text-purple-600 px-3 py-1 rounded-lg text-sm font-medium shrink-0">
                    #{index}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium">{event.section}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{event.method}</span>
                    </div>
                    {event.data && Object.keys(event.data).length > 0 && (
                      <div className="bg-secondary/50 rounded p-3 mt-2">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}