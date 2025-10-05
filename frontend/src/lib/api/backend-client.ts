/**
 * Backend API Client for GLIN Explorer
 * Connects to glin-backend for enhanced data (leaderboard, faucet, tasks, providers)
 */

export interface LeaderboardEntry {
  address: string;
  points: number;
  rank: number;
  activities: number;
}

export interface FaucetStats {
  totalClaims: number;
  totalDistributed: string;
  uniqueUsers: number;
}

export interface TaskInfo {
  id: string;
  creator: string;
  bounty: string;
  status: string;
  createdAt: number;
  modelType?: string;
  description?: string;
}

export interface ProviderInfo {
  address: string;
  stake: string;
  reputation: number;
  tasksCompleted: number;
  gpuSpecs?: Record<string, unknown>;
}

export class BackendClient {
  constructor(private baseUrl: string = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:8080') {}

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Points & Leaderboard
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>(`/api/v1/points/leaderboard?limit=${limit}`);
  }

  async getUserPoints(address: string): Promise<{ address: string; points: number; rank: number }> {
    return this.request(`/api/v1/points/user/${address}`);
  }

  // Faucet
  async getFaucetStats(): Promise<FaucetStats> {
    return this.request<FaucetStats>('/api/v1/faucet/stats');
  }

  async checkFaucetStatus(address: string): Promise<{ canClaim: boolean; nextClaimAt?: number }> {
    return this.request(`/api/v1/faucet/status?address=${address}`);
  }

  // Tasks
  async getTasks(status?: string): Promise<TaskInfo[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<TaskInfo[]>(`/api/v1/tasks${query}`);
  }

  async getTask(taskId: string): Promise<TaskInfo> {
    return this.request<TaskInfo>(`/api/v1/tasks/${taskId}`);
  }

  // Providers
  async getProviders(): Promise<ProviderInfo[]> {
    return this.request<ProviderInfo[]>('/api/v1/providers');
  }

  async getProvider(address: string): Promise<ProviderInfo> {
    return this.request<ProviderInfo>(`/api/v1/providers/${address}`);
  }

  // Analytics (optional - if backend provides)
  async getNetworkAnalytics(): Promise<Record<string, unknown>> {
    return this.request('/api/v1/analytics/network');
  }
}

export const backendClient = new BackendClient();