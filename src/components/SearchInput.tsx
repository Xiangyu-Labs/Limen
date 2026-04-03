'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

export function normalizeSearchQuery(query: string) {
  return query.trim();
}

export function buildSearchHref(currentUrl: string, query: string) {
  const normalized = normalizeSearchQuery(query);
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.searchParams);

  if (normalized) {
    params.set('q', normalized);
  } else {
    params.delete('q');
  }

  const serialized = params.toString();
  return serialized ? `/?${serialized}` : '/';
}

export function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUrl = `http://localhost/?${searchParams.toString()}`;
    router.push(buildSearchHref(currentUrl, query));
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search entries..."
        className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-12 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            router.push(buildSearchHref(`http://localhost/?${searchParams.toString()}`, ''));
          }}
          className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-text"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
