'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useExplorerStore } from '@/store/explorer-store';
import { GlobalSearch } from '@/components/search/global-search';
import { Activity, Blocks, Users, Award, Cpu, TrendingUp } from 'lucide-react';

const navigation = [
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Validators', href: '/validators', icon: Activity },
  { name: 'Tasks', href: '/tasks', icon: TrendingUp },
  { name: 'Providers', href: '/providers', icon: Cpu },
  { name: 'Leaderboard', href: '/leaderboard', icon: Award },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected, chainInfo } = useExplorerStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            GLIN Explorer
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 transition-colors hover:text-foreground/80',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <GlobalSearch />
          {isConnected && chainInfo && (
            <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden xl:inline">{chainInfo.name}</span>
              <span className="hidden xl:inline">•</span>
              <span>{chainInfo.tokenSymbol}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}