'use client';

import { useEffect, useState } from 'react';
import { backendClient, type LeaderboardEntry } from '@/lib/api/backend-client';
import { Award, Loader2, Trophy, Medal, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await backendClient.getLeaderboard(100);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard. Backend service may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/20';
    if (rank === 3) return 'bg-orange-600/10 border-orange-600/20';
    return 'bg-card';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Leaderboard Unavailable</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalPoints = leaderboard.reduce((sum, entry) => sum + entry.points, 0);
  const avgPoints = leaderboard.length > 0 ? totalPoints / leaderboard.length : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Testnet Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Top participants earning points for mainnet airdrop
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-600/10 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Participants</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(leaderboard.length)}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Points</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalPoints)}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Avg Points</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(Math.round(avgPoints))}</p>
        </div>
      </div>

      {/* Top 3 Highlight */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((entry, index) => (
            <div
              key={entry.address}
              className={`rounded-lg border p-6 ${getRankBg(index + 1)}`}
            >
              <div className="flex items-center justify-between mb-4">
                {getRankIcon(index + 1)}
                <span className="text-2xl font-bold">{formatNumber(entry.points)}</span>
              </div>
              <Link
                href={`/account/${entry.address}`}
                className="font-mono text-sm text-purple-600 hover:text-purple-700 break-all"
              >
                {entry.address.slice(0, 16)}...
              </Link>
              <div className="text-xs text-muted-foreground mt-2">
                {entry.activities} activities
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span>All Participants</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Address</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Points</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Activities</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No participants yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr
                    key={entry.address}
                    className={`hover:bg-secondary/50 transition-colors ${getRankBg(entry.rank)}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start w-12">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/account/${entry.address}`}
                        className="font-mono text-sm text-purple-600 hover:text-purple-700"
                      >
                        {entry.address.slice(0, 12)}...{entry.address.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-lg">{formatNumber(entry.points)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-muted-foreground">{entry.activities}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/account/${entry.address}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border bg-blue-600/10 border-blue-600/20 p-6">
        <h3 className="font-semibold text-blue-600 mb-2">How to Earn Points</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Use the faucet to claim testnet tokens (one-time)</li>
          <li>• Register as a GPU provider and stake tokens</li>
          <li>• Complete federated learning tasks</li>
          <li>• Submit gradients with valid proofs</li>
          <li>• Maintain high reputation through quality contributions</li>
        </ul>
        <p className="text-sm text-blue-600 mt-4 font-medium">
          Points will determine your mainnet GLIN airdrop allocation!
        </p>
      </div>
    </div>
  );
}