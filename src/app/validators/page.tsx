'use client';

import { useExplorerStore } from '@/store/explorer-store';
import { formatAddress } from '@/lib/utils';
import { Users, Shield, Loader2 } from 'lucide-react';

export default function ValidatorsPage() {
  const { isConnected, isConnecting, validators } = useExplorerStore();

  if (isConnecting) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading validators...</p>
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
            <Users className="h-8 w-8 text-purple-600" />
            <span>Validators</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Active validators securing the GLIN testnet
          </p>
        </div>
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
          <span className="font-medium">{validators.length}</span> Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validators.map((validator, index) => (
          <div
            key={validator}
            className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Validator #{index + 1}</span>
                </div>
                <div className="font-mono text-sm text-muted-foreground break-all">
                  {formatAddress(validator, 12)}
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}