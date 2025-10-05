import { create } from 'zustand';
import {
  GlinClient,
  GlinTasks,
  GlinProviders,
  GlinPoints,
  type BlockInfo
} from '@glin-ai/sdk';

export interface ChainInfo {
  name: string;
  tokenSymbol: string;
  tokenDecimals: number;
  ss58Format: number;
}

interface ExplorerState {
  // SDK Modules
  client: GlinClient | null;
  tasks: GlinTasks | null;
  providers: GlinProviders | null;
  points: GlinPoints | null;

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
  client: null,
  tasks: null,
  providers: null,
  points: null,
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
      const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'wss://glin-rpc-production.up.railway.app';

      // Initialize SDK client
      const client = new GlinClient(rpcEndpoint);
      await client.connect();

      // Initialize SDK modules
      const api = client.getApi();
      if (!api) {
        throw new Error('Failed to get API instance');
      }

      const tasks = new GlinTasks(api);
      const providers = new GlinProviders(api);
      const points = new GlinPoints(api);

      // Get chain info
      const properties = api.registry.getChainProperties();
      const tokenSymbolJSON = properties?.tokenSymbol.toJSON();
      const tokenDecimalsJSON = properties?.tokenDecimals.toJSON();
      const ss58FormatJSON = properties?.ss58Format.toJSON();

      const chainInfo: ChainInfo = {
        name: api.runtimeChain.toString(),
        tokenSymbol: (Array.isArray(tokenSymbolJSON) ? tokenSymbolJSON[0] as string : 'tGLIN') || 'tGLIN',
        tokenDecimals: (Array.isArray(tokenDecimalsJSON) ? tokenDecimalsJSON[0] as number : 18) || 18,
        ss58Format: (typeof ss58FormatJSON === 'number' ? ss58FormatJSON : 42) || 42
      };

      set({
        client,
        tasks,
        providers,
        points,
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
    const { client } = get();
    if (client) {
      await client.disconnect();
    }
    set({
      client: null,
      tasks: null,
      providers: null,
      points: null,
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
      const { client } = get();
      if (!client) return;

      const blocks = await client.getLatestBlocks(15);
      set({ latestBlocks: blocks });
    } catch (error) {
      console.error('Failed to load blocks:', error);
    }
  },

  // Load specific block
  loadBlock: async (hashOrNumber: string | number) => {
    if (!get().isConnected) return;

    try {
      const { client } = get();
      if (!client) return;

      const block = await client.getBlock(hashOrNumber);
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
      const { client } = get();
      if (!client) return;

      const api = client.getApi();
      if (!api) return;

      // Get network info
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
      ]);

      const header = await api.rpc.chain.getHeader();

      // Get validators (GLIN uses Aura consensus)
      const authorities = await api.query.aura.authorities();
      const validators = (authorities as unknown as Array<{ toString: () => string }>).map((v) => v.toString());

      set({
        networkStats: {
          chain: chain.toString(),
          nodeName: nodeName.toString(),
          nodeVersion: nodeVersion.toString(),
          blockNumber: header.number.toNumber(),
          blockHash: header.hash.toString(),
          validatorCount: validators.length,
          validators
        },
        validators
      });
    } catch (error) {
      console.error('Failed to load network stats:', error);
    }
  },

  // Subscribe to new blocks
  subscribeToNewBlocks: () => {
    if (!get().isConnected) return () => {};

    const { client } = get();
    if (!client) return () => {};

    let unsubscribe: (() => void) | null = null;

    client.subscribeNewBlocks(async (blockNumber) => {
      try {
        const block = await client.getBlock(blockNumber);
        if (!block) return;

        const latestBlocks = get().latestBlocks;

        // Add new block to the beginning and keep only last 15
        const blockWithFlag = { ...block, isNew: true, receivedAt: Date.now() };
        const updatedBlocks = [blockWithFlag, ...latestBlocks].slice(0, 15);

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
      } catch (error) {
        console.error('Error processing new block:', error);
      }
    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}));
