'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

export function normalizeSearchQuery(query: string) {
  return query.trim();
}

export function buildSearchHref(currentUrl: string, query: string) {
  const normalized = normalizeSearchQuery(query);
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.searchParams);
  params.delete('date');

  if (normalized) {
    params.set('q', normalized);
  } else {
    params.delete('q');
  }

  const serialized = params.toString();
  return serialized ? `${url.pathname}?${serialized}` : url.pathname;
}

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export function SearchInput({ placeholder = 'Search entries...', className = '' }: SearchInputProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUrl = `http://localhost${pathname}?${searchParams.toString()}`;
    router.push(buildSearchHref(currentUrl, query));
  };

  return (
    <form onSubmit={handleSearch} className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-12 text-sm text-text placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            router.push(buildSearchHref(`http://localhost${pathname}?${searchParams.toString()}`, ''));
          }}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface2 hover:text-text"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
