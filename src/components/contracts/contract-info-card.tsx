'use client';

import { FileCode2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ContractInfoCardProps {
  codeHash: string;
  address: string;
}

export function ContractInfoCard({ codeHash, address }: ContractInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const copyCodeHash = () => {
    navigator.clipboard.writeText(codeHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <FileCode2 className="h-5 w-5 text-purple-600" />
          <span>Smart Contract</span>
        </h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="rounded-lg bg-purple-600/10 border border-purple-600/20 p-4">
          <p className="text-sm text-purple-600 font-medium mb-2">
            ✓ This address is a smart contract
          </p>
          <p className="text-xs text-muted-foreground">
            This address contains deployed ink! smart contract code
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
          <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Code Hash</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{truncateHash(codeHash)}</span>
            <button
              onClick={copyCodeHash}
              className="p-1 hover:bg-secondary rounded transition-colors"
              title="Copy code hash"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
          <span className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0">Contract Type</span>
          <span className="text-sm font-medium">ink! v4+</span>
        </div>
      </div>
    </div>
  );
}
