/**
 * Explorer API Client for GLIN Explorer
 * Connects to glinscan-api backend for indexed blockchain data
 */

export interface Block {
  number: number;
  hash: string;
  parent_hash: string;
  timestamp: string;
  extrinsics_count: number;
  events_count: number;
  finalized: boolean;
  created_at: string;
}

export interface Extrinsic {
  id: number;
  block_number: number;
  index: number;
  hash: string;
  signer: string | null;
  pallet: string;
  call: string;
  args: Record<string, unknown>;
  success: boolean;
  created_at: string;
}

export interface Event {
  id: number;
  block_number: number;
  extrinsic_id: number | null;
  index: number;
  pallet: string;
  event: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface Account {
  address: string;
  balance: string;
  nonce: number;
  extrinsics_count: number;
  last_updated: string;
}

export interface Contract {
  address: string;
  code_hash: string;
  deployer: string;
  block_number: number;
  verified: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ContractVerification {
  id: number;
  contract_address: string;
  wasm_hash: string;
  source_files: Array<{ path: string; content: string }>;
  status: 'pending' | 'building' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
  verified_at: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class ExplorerClient {
  constructor(private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {}

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Explorer API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/api/health');
  }

  // Blocks
  async getLatestBlocks(params?: PaginationParams): Promise<Block[]> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<Block[]>(`/api/blocks/latest${queryString}`);
  }

  async getBlock(number: number): Promise<Block> {
    return this.request<Block>(`/api/blocks/${number}`);
  }

  async getBlockByHash(hash: string): Promise<Block> {
    return this.request<Block>(`/api/blocks/hash/${hash}`);
  }

  // Extrinsics
  async getExtrinsic(hash: string): Promise<Extrinsic> {
    return this.request<Extrinsic>(`/api/extrinsics/${hash}`);
  }

  async getBlockExtrinsics(blockNumber: number): Promise<Extrinsic[]> {
    return this.request<Extrinsic[]>(`/api/blocks/${blockNumber}/extrinsics`);
  }

  async getLatestExtrinsics(params?: PaginationParams): Promise<Extrinsic[]> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<Extrinsic[]>(`/api/extrinsics/latest${queryString}`);
  }

  // Events
  async getBlockEvents(blockNumber: number): Promise<Event[]> {
    return this.request<Event[]>(`/api/blocks/${blockNumber}/events`);
  }

  async getExtrinsicEvents(extrinsicId: number): Promise<Event[]> {
    return this.request<Event[]>(`/api/extrinsics/${extrinsicId}/events`);
  }

  // Accounts
  async getAccount(address: string): Promise<Account> {
    return this.request<Account>(`/api/accounts/${address}`);
  }

  async getAccountExtrinsics(address: string, params?: PaginationParams): Promise<Extrinsic[]> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<Extrinsic[]>(`/api/accounts/${address}/extrinsics${queryString}`);
  }

  // Contracts
  async getContract(address: string): Promise<Contract> {
    return this.request<Contract>(`/api/contracts/${address}`);
  }

  async getLatestContracts(params?: PaginationParams): Promise<Contract[]> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<Contract[]>(`/api/contracts/latest${queryString}`);
  }

  // Contract Verification
  async getContractVerification(address: string): Promise<ContractVerification | null> {
    try {
      return await this.request<ContractVerification>(`/api/contracts/${address}/verification`);
    } catch (error) {
      // Return null if no verification found
      return null;
    }
  }

  async submitContractVerification(
    contractAddress: string,
    wasmHash: string,
    sourceFiles: Array<{ path: string; content: string }>
  ): Promise<ContractVerification> {
    return this.request<ContractVerification>('/api/contracts/verify', {
      method: 'POST',
      body: JSON.stringify({
        contract_address: contractAddress,
        wasm_hash: wasmHash,
        source_files: sourceFiles,
      }),
    });
  }

  // Search
  async search(query: string): Promise<{
    blocks: Block[];
    extrinsics: Extrinsic[];
    accounts: Account[];
    contracts: Contract[];
  }> {
    return this.request(`/api/search?q=${encodeURIComponent(query)}`);
  }
}

export const explorerClient = new ExplorerClient();
