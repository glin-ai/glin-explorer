'use client';

import { useEffect, useState } from 'react';
import { type Task, formatGLIN } from '@glin-ai/sdk';
import { backendClient, type TaskInfo } from '@/lib/api/backend-client';
import { useExplorerStore } from '@/store/explorer-store';
import { TrendingUp, Loader2, ExternalLink, Users, Coins } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

export default function TasksPage() {
  const { isConnected, isConnecting, tasks: tasksModule } = useExplorerStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backendTasks, setBackendTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isConnected) {
      loadTasks();
    }
  }, [isConnected]);

  const loadTasks = async () => {
    if (!tasksModule) return;

    try {
      setLoading(true);
      // Load from blockchain
      const chainTasks = await tasksModule.getAllTasks();
      setTasks(chainTasks);

      // Load from backend (enhanced data)
      try {
        const apiTasks = await backendClient.getTasks();
        setBackendTasks(apiTasks);
      } catch (error) {
        console.log('Backend tasks not available:', error);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const formatted = formatGLIN(BigInt(balance));
    return formatNumber(parseFloat(formatted));
  };

  const getTaskStatus = (status: string): { label: string; color: string } => {
    const statusMap: Record<string, { label: string; color: string }> = {
      Open: { label: 'Open', color: 'text-blue-600 bg-blue-600/10' },
      InProgress: { label: 'In Progress', color: 'text-yellow-600 bg-yellow-600/10' },
      Completed: { label: 'Completed', color: 'text-green-600 bg-green-600/10' },
      Failed: { label: 'Failed', color: 'text-red-600 bg-red-600/10' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-600/10' };
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status.toLowerCase() === filter.toLowerCase();
  });

  if (isConnecting || (loading && !isConnected)) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-muted-foreground">
            {isConnecting ? 'Connecting to chain...' : 'Loading tasks...'}
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Federated Learning Tasks
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse and monitor ML training tasks on the GLIN network
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Tasks</div>
          <div className="text-2xl font-bold mt-1">{tasks.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Open Tasks</div>
          <div className="text-2xl font-bold mt-1">
            {tasks.filter(t => t.status === 'Open').length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="text-2xl font-bold mt-1">
            {tasks.filter(t => t.status === 'InProgress').length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold mt-1">
            {tasks.filter(t => t.status === 'Completed').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'open'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setFilter('inprogress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'inprogress'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Tasks List */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Tasks ({filteredTasks.length})</span>
          </h2>
        </div>
        <div className="divide-y">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tasks found
            </div>
          ) : (
            filteredTasks.map((task) => {
              const statusInfo = getTaskStatus(task.status);
              const backendTask = backendTasks.find((bt) => bt.id === task.id);

              return (
                <div key={task.id} className="p-6 hover:bg-secondary/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">#{task.id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-medium">{task.modelType}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Creator:</span>
                          <Link
                            href={`/account/${task.creator}`}
                            className="font-mono text-purple-600 hover:text-purple-700"
                          >
                            {task.creator.slice(0, 12)}...
                          </Link>
                        </div>
                        {backendTask?.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {backendTask.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                          <Coins className="h-4 w-4" />
                          <span>Bounty</span>
                        </div>
                        <div className="text-lg font-bold">{formatBalance(task.bounty)} tGLIN</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                          <Users className="h-4 w-4" />
                          <span>Providers</span>
                        </div>
                        <div className="text-lg font-bold">{task.providers.length}</div>
                      </div>

                      <Link
                        href={`/account/${task.creator}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium inline-flex items-center space-x-2"
                      >
                        <span>View Details</span>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}