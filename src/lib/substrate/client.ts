import { ApiPromise, WsProvider } from '@polkadot/api';
import type { Header } from '@polkadot/types/interfaces';

export interface ChainInfo {
  name: string;
  tokenSymbol: string;
  tokenDecimals: number;
  ss58Format: number;
}

export interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  author?: string;
  timestamp?: number;
  extrinsics?: any[];
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  blockHash: string;
  method: string;
  section: string;
  args: any[];
  signer?: string;
  success: boolean;
  fee?: string;
  events?: any[];
}

export interface AccountInfo {
  address: string;
  nonce: number;
  balance: {
    free: string;
    reserved: string;
    frozen: string;
  };
}

export interface Task {
  id: string;
  creator: string;
  bounty: string;
  status: string;
  modelType: string;
  providers: string[];
}

export interface ProviderStake {
  address: string;
  stake: string;
  reputation: number;
  tasksCompleted: number;
  isActive: boolean;
}

export interface RewardInfo {
  taskId: string;
  provider: string;
  amount: string;
  timestamp: number;
}

export interface TestnetPoints {
  address: string;
  points: number;
  lastUpdated: number;
}

export class SubstrateClient {
  private api: ApiPromise | null = null;
  private provider: WsProvider | null = null;

  constructor(private endpoint: string = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'wss://glin-rpc-production.up.railway.app') {}

  async connect(): Promise<void> {
    if (this.api?.isConnected) return;

    this.provider = new WsProvider(this.endpoint);
    this.api = await ApiPromise.create({ provider: this.provider });
    await this.api.isReady;

    console.log('Connected to chain:', this.api.runtimeChain.toString());
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
      this.provider = null;
    }
  }

  getApi(): ApiPromise {
    if (!this.api) {
      throw new Error('Not connected to chain');
    }
    return this.api;
  }

  async getChainInfo(): Promise<ChainInfo> {
    const api = this.getApi();
    const properties = api.registry.getChainProperties();

    return {
      name: api.runtimeChain.toString(),
      tokenSymbol: properties?.tokenSymbol.toJSON()?.[0] as string || 'tGLIN',
      tokenDecimals: properties?.tokenDecimals.toJSON()?.[0] as number || 18,
      ss58Format: properties?.ss58Format.toJSON() as number || 42
    };
  }

  async getLatestBlocks(count: number = 10): Promise<BlockInfo[]> {
    const api = this.getApi();
    const latestHeader = await api.rpc.chain.getHeader();
    const latestNumber = latestHeader.number.toNumber();

    const blocks: BlockInfo[] = [];

    for (let i = 0; i < count && latestNumber - i >= 0; i++) {
      const blockHash = await api.rpc.chain.getBlockHash(latestNumber - i);
      const signedBlock = await api.rpc.chain.getBlock(blockHash);
      const header = signedBlock.block.header;

      blocks.push({
        number: header.number.toNumber(),
        hash: blockHash.toString(),
        parentHash: header.parentHash.toString(),
        stateRoot: header.stateRoot.toString(),
        extrinsicsRoot: header.extrinsicsRoot.toString(),
        extrinsics: signedBlock.block.extrinsics.map(ext => ({
          hash: ext.hash.toString(),
          method: ext.method.method,
          section: ext.method.section
        }))
      });
    }

    return blocks;
  }

  async getBlock(hashOrNumber: string | number): Promise<BlockInfo | null> {
    const api = this.getApi();

    const blockHash = typeof hashOrNumber === 'number'
      ? await api.rpc.chain.getBlockHash(hashOrNumber)
      : hashOrNumber;

    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    const header = signedBlock.block.header;

    return {
      number: header.number.toNumber(),
      hash: blockHash.toString(),
      parentHash: header.parentHash.toString(),
      stateRoot: header.stateRoot.toString(),
      extrinsicsRoot: header.extrinsicsRoot.toString(),
      extrinsics: signedBlock.block.extrinsics.map(ext => ({
        hash: ext.hash.toString(),
        method: ext.method.method,
        section: ext.method.section,
        args: ext.args.map(arg => arg.toString())
      }))
    };
  }

  async getAccountBalance(address: string): Promise<any> {
    const api = this.getApi();
    const { data } = await api.query.system.account(address);

    return {
      free: data.free.toString(),
      reserved: data.reserved.toString(),
      frozen: data.frozen.toString()
    };
  }

  subscribeNewBlocks(callback: (block: BlockInfo) => void): () => void {
    const api = this.getApi();
    let unsubscribe: (() => void) | null = null;

    api.rpc.chain.subscribeNewHeads(async (header: Header) => {
      const block: BlockInfo = {
        number: header.number.toNumber(),
        hash: header.hash.toString(),
        parentHash: header.parentHash.toString(),
        stateRoot: header.stateRoot.toString(),
        extrinsicsRoot: header.extrinsicsRoot.toString()
      };
      callback(block);
    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  async getValidators(): Promise<string[]> {
    const api = this.getApi();
    // GLIN chain uses Aura consensus, not Session pallet
    const authorities = await api.query.aura.authorities();
    return authorities.map((v: any) => v.toString());
  }

  async getNetworkStats(): Promise<any> {
    const api = this.getApi();
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);

    const header = await api.rpc.chain.getHeader();
    const validators = await this.getValidators();

    return {
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString(),
      blockNumber: header.number.toNumber(),
      blockHash: header.hash.toString(),
      validatorCount: validators.length,
      validators
    };
  }

  // ========== Custom Pallet Queries ==========

  /**
   * TaskRegistry Pallet
   */
  async getTask(taskId: string): Promise<Task | null> {
    const api = this.getApi();
    try {
      const task = await api.query.taskRegistry.tasks(taskId);
      if (task.isEmpty) return null;

      const taskData = task.toJSON() as any;
      return {
        id: taskId,
        creator: taskData.creator,
        bounty: taskData.bounty,
        status: taskData.status,
        modelType: taskData.modelType || 'Unknown',
        providers: taskData.providers || []
      };
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }
  }

  async getAllTasks(): Promise<Task[]> {
    const api = this.getApi();
    try {
      const entries = await api.query.taskRegistry.tasks.entries();
      return entries.map(([key, value]) => {
        const taskId = key.args[0].toString();
        const taskData = value.toJSON() as any;
        return {
          id: taskId,
          creator: taskData.creator,
          bounty: taskData.bounty,
          status: taskData.status,
          modelType: taskData.modelType || 'Unknown',
          providers: taskData.providers || []
        };
      });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  /**
   * ProviderStaking Pallet
   */
  async getProviderStake(address: string): Promise<ProviderStake | null> {
    const api = this.getApi();
    try {
      const provider = await api.query.providerStaking.providers(address);
      if (provider.isEmpty) return null;

      const providerData = provider.toJSON() as any;
      return {
        address,
        stake: providerData.stake,
        reputation: providerData.reputation || 0,
        tasksCompleted: providerData.tasksCompleted || 0,
        isActive: providerData.isActive || false
      };
    } catch (error) {
      console.error('Failed to fetch provider stake:', error);
      return null;
    }
  }

  async getAllProviders(): Promise<ProviderStake[]> {
    const api = this.getApi();
    try {
      const entries = await api.query.providerStaking.providers.entries();
      return entries.map(([key, value]) => {
        const address = key.args[0].toString();
        const providerData = value.toJSON() as any;
        return {
          address,
          stake: providerData.stake,
          reputation: providerData.reputation || 0,
          tasksCompleted: providerData.tasksCompleted || 0,
          isActive: providerData.isActive || false
        };
      });
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      return [];
    }
  }

  /**
   * RewardDistribution Pallet
   */
  async getRewardHistory(taskId?: string): Promise<RewardInfo[]> {
    const api = this.getApi();
    try {
      // This would require event querying or storage mapping
      // For now, we'll return empty array and rely on backend
      return [];
    } catch (error) {
      console.error('Failed to fetch reward history:', error);
      return [];
    }
  }

  /**
   * TestnetPoints Pallet
   */
  async getTestnetPoints(address: string): Promise<TestnetPoints | null> {
    const api = this.getApi();
    try {
      const points = await api.query.testnetPoints.points(address);
      if (points.isEmpty) return null;

      const pointsData = points.toJSON() as any;
      return {
        address,
        points: pointsData.points || 0,
        lastUpdated: pointsData.lastUpdated || 0
      };
    } catch (error) {
      console.error('Failed to fetch testnet points:', error);
      return null;
    }
  }

  /**
   * Enhanced Account Info
   */
  async getAccountInfo(address: string): Promise<AccountInfo> {
    const api = this.getApi();
    const accountData = await api.query.system.account(address);

    return {
      address,
      nonce: accountData.nonce.toNumber(),
      balance: {
        free: accountData.data.free.toString(),
        reserved: accountData.data.reserved.toString(),
        frozen: accountData.data.frozen.toString()
      }
    };
  }

  /**
   * Get Transaction Details with Events
   */
  async getTransaction(blockHash: string, extrinsicIndex: number): Promise<TransactionInfo | null> {
    const api = this.getApi();
    try {
      const signedBlock = await api.rpc.chain.getBlock(blockHash);
      const extrinsic = signedBlock.block.extrinsics[extrinsicIndex];

      if (!extrinsic) return null;

      // Get events for this block
      const apiAt = await api.at(blockHash);
      const events = await apiAt.query.system.events();

      // Filter events for this extrinsic
      const extrinsicEvents = events
        .filter((record: any) => record.phase.isApplyExtrinsic &&
                record.phase.asApplyExtrinsic.toNumber() === extrinsicIndex)
        .map((record: any) => ({
          section: record.event.section,
          method: record.event.method,
          data: record.event.data.toJSON()
        }));

      const success = extrinsicEvents.some(
        (e: any) => e.section === 'system' && e.method === 'ExtrinsicSuccess'
      );

      return {
        hash: extrinsic.hash.toString(),
        blockNumber: signedBlock.block.header.number.toNumber(),
        blockHash,
        method: extrinsic.method.method,
        section: extrinsic.method.section,
        args: extrinsic.args.map(arg => arg.toString()),
        signer: extrinsic.signer?.toString(),
        success,
        events: extrinsicEvents
      };
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      return null;
    }
  }

  /**
   * Search functionality
   */
  async search(query: string): Promise<{
    type: 'block' | 'transaction' | 'account' | 'task';
    data: any;
  } | null> {
    const api = this.getApi();

    // Try as block number
    if (/^\d+$/.test(query)) {
      const block = await this.getBlock(parseInt(query));
      if (block) return { type: 'block', data: block };
    }

    // Try as block hash
    if (query.startsWith('0x') && query.length === 66) {
      try {
        const block = await this.getBlock(query);
        if (block) return { type: 'block', data: block };
      } catch {}
    }

    // Try as account address
    if (query.length >= 47 && query.length <= 48) {
      try {
        const account = await this.getAccountInfo(query);
        return { type: 'account', data: account };
      } catch {}
    }

    // Try as task ID
    try {
      const task = await this.getTask(query);
      if (task) return { type: 'task', data: task };
    } catch {}

    return null;
  }
}

export const substrateClient = new SubstrateClient();