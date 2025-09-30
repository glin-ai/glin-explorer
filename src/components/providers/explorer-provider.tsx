'use client';

import { useEffect } from 'react';
import { useExplorerStore } from '@/store/explorer-store';

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const { connect, subscribeToNewBlocks } = useExplorerStore();

  useEffect(() => {
    connect().catch(console.error);
  }, [connect]);

  useEffect(() => {
    const unsubscribe = subscribeToNewBlocks();
    return unsubscribe;
  }, [subscribeToNewBlocks]);

  return <>{children}</>;
}