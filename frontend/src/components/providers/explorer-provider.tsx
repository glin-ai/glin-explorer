'use client';

import { useEffect } from 'react';
import { useExplorerStore } from '@/store/explorer-store';

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const { connect, subscribeToNewBlocks, isConnected } = useExplorerStore();

  // Connect on mount
  useEffect(() => {
    connect().catch(console.error);
  }, [connect]);

  // Subscribe to new blocks only after connection is established
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToNewBlocks();
    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribeToNewBlocks]);

  return <>{children}</>;
}