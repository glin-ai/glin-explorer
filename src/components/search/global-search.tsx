'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { substrateClient } from '@/lib/substrate/client';
import { Search, Loader2, X } from 'lucide-react';
import { debounce } from '@/lib/utils';

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setResults(null);
        return;
      }

      setSearching(true);
      try {
        const result = await substrateClient.search(searchQuery.trim());
        setResults(result);
      } catch (error) {
        console.error('Search failed:', error);
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleSelect = (type: string, data: any) => {
    setShowResults(false);
    setQuery('');
    setResults(null);

    switch (type) {
      case 'block':
        router.push(`/block/${data.number}`);
        break;
      case 'account':
        router.push(`/account/${data.address}`);
        break;
      case 'task':
        router.push(`/tasks/${data.id}`);
        break;
      default:
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search by block, address, transaction, or task..."
          className="w-full pl-10 pr-10 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/50"
        />
        {(query || searching) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {searching ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <button
                onClick={clearSearch}
                className="hover:bg-secondary rounded p-1 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && query.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {searching && (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {!searching && results && (
            <button
              onClick={() => handleSelect(results.type, results.data)}
              className="w-full p-4 hover:bg-secondary transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium capitalize">{results.type}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {results.type === 'block' && `Block #${results.data.number}`}
                    {results.type === 'account' && `Account ${results.data.address.slice(0, 16)}...`}
                    {results.type === 'task' && `Task ${results.data.id}`}
                  </div>
                </div>
                <div className="text-xs text-purple-600">View →</div>
              </div>
            </button>
          )}

          {!searching && !results && query.length >= 3 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}

          <div className="p-3 bg-secondary/50 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Tip:</span> Search by block number, block hash, account address, or task ID
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}