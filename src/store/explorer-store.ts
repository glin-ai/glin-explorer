import { create } from 'zustand';
import { substrateClient, type BlockInfo, type ChainInfo } from '@/lib/substrate/client';

interface ExplorerState {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  chainInfo: ChainInfo | null;

  // Blocks
  latestBlocks: BlockInfo[];
  currentBlock: BlockInfo | null;

  // Network
  networkStats: {
    chain: string;
    nodeName: string;
    nodeVersion: string;
    blockNumber: number;
    blockHash: string;
    validatorCount: number;
    validators: string[];
  } | null;
  validators: string[];

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loadLatestBlocks: () => Promise<void>;
  loadBlock: (hashOrNumber: string | number) => Promise<void>;
  loadNetworkStats: () => Promise<void>;
  subscribeToNewBlocks: () => () => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  chainInfo: null,
  latestBlocks: [],
  currentBlock: null,
  networkStats: null,
  validators: [],

  // Connect to chain
  connect: async () => {
    set({ isConnecting: true });
    try {
      await substrateClient.connect();
      const chainInfo = await substrateClient.getChainInfo();
      set({
        isConnected: true,
        isConnecting: false,
        chainInfo
      });

      // Load initial data
      await get().loadLatestBlocks();
      await get().loadNetworkStats();
    } catch (error) {
      console.error('Failed to connect:', error);
      set({ isConnecting: false, isConnected: false });
      throw error;
    }
  },

  // Disconnect from chain
  disconnect: async () => {
    await substrateClient.disconnect();
    set({
      isConnected: false,
      chainInfo: null,
      latestBlocks: [],
      networkStats: null
    });
  },

  // Load latest blocks
  loadLatestBlocks: async () => {
    if (!get().isConnected) return;

    try {
      const blocks = await substrateClient.getLatestBlocks(15);
      set({ latestBlocks: blocks });
    } catch (error) {
      console.error('Failed to load blocks:', error);
    }
  },

  // Load specific block
  loadBlock: async (hashOrNumber: string | number) => {
    if (!get().isConnected) return;

    try {
      const block = await substrateClient.getBlock(hashOrNumber);
      set({ currentBlock: block });
    } catch (error) {
      console.error('Failed to load block:', error);
      set({ currentBlock: null });
    }
  },

  // Load network stats
  loadNetworkStats: async () => {
    if (!get().isConnected) return;

    try {
      const stats = await substrateClient.getNetworkStats();
      set({
        networkStats: stats,
        validators: stats.validators
      });
    } catch (error) {
      console.error('Failed to load network stats:', error);
    }
  },

  // Subscribe to new blocks
  subscribeToNewBlocks: () => {
    if (!get().isConnected) return () => {};

    return substrateClient.subscribeNewBlocks((block) => {
      const latestBlocks = get().latestBlocks;

      // Add new block to the beginning and keep only last 15
      const updatedBlocks = [block, ...latestBlocks].slice(0, 15);

      set({ latestBlocks: updatedBlocks });

      // Update network stats block number
      const currentStats = get().networkStats;
      if (currentStats) {
        set({
          networkStats: {
            ...currentStats,
            blockNumber: block.number,
            blockHash: block.hash
          }
        });
      }

      // Clear the "isNew" flag after 10 seconds for animation purposes
      setTimeout(() => {
        const currentBlocks = get().latestBlocks;
        const updatedBlocksWithoutNew = currentBlocks.map(b =>
          b.hash === block.hash ? { ...b, isNew: false } : b
        );
        set({ latestBlocks: updatedBlocksWithoutNew });
      }, 10000);
    });
  }
}));