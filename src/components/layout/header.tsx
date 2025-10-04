'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useExplorerStore } from '@/store/explorer-store';
import { GlobalSearch } from '@/components/search/global-search';
import { GlinCoinIcon } from '@/components/icons/glin-coin-icon';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Blocks, Activity, TrendingUp, Cpu, Award, Rocket } from 'lucide-react';

const navigation = [
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Validators', href: '/validators', icon: Activity },
  { name: 'Tasks', href: '/tasks', icon: TrendingUp },
  { name: 'Providers', href: '/providers', icon: Cpu },
  { name: 'Leaderboard', href: '/leaderboard', icon: Award },
  { name: 'Deploy', href: '/deploy-contract', icon: Rocket },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected, networkStats } = useExplorerStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center px-4">
          {/* Logo */}
          <Link
            href="/"
            className="mr-6 flex items-center space-x-3 hover:opacity-90 transition-opacity"
          >
            <GlinCoinIcon size={32} />
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
                GLIN
              </span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Explorer
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1 ml-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center space-x-3">
            <GlobalSearch />
            <ThemeToggle />

            {/* Connection Status */}
            {isConnected && (
              <div className="hidden lg:flex items-center gap-3">
                {/* Network Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300 whitespace-nowrap">
                    Testnet
                  </span>
                </div>

                {/* Latest Block */}
                {networkStats?.blockNumber && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <Blocks className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300 font-mono">
                      #{networkStats.blockNumber.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Connecting State */}
            {!isConnected && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Connecting...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}