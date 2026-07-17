'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { SEARCH_QUERY_MAX_LENGTH } from '@/lib/validation';

export function normalizeSearchQuery(query: string) {
  return query.trim();
}

export function buildSearchHref(currentUrl: string, query: string) {
  const normalized = normalizeSearchQuery(query);
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.searchParams);
  params.delete('date');
  if (normalized) params.set('q', normalized);
  else params.delete('q');
  const serialized = params.toString();
  return serialized ? `${url.pathname}?${serialized}` : url.pathname;
}

function SearchForm({
  initialQuery,
  placeholder,
  className,
  currentUrl,
}: {
  initialQuery: string;
  placeholder: string;
  className: string;
  currentUrl: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  function navigate(value: string) {
    startTransition(() => router.push(buildSearchHref(currentUrl, value)));
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        navigate(query);
      }}
      className={`relative w-full max-w-md ${className}`}
    >
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={query}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-12 text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      {isPending ? (
        <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" aria-label="正在搜索" />
      ) : query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            navigate('');
          }}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface2 hover:text-text"
          aria-label="清除搜索"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}

export function SearchInput({ placeholder = '搜索', className = '' }: { placeholder?: string; className?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = searchParams.get('q') || '';
  const currentUrl = `http://localhost${pathname}?${searchParams.toString()}`;
  return (
    <SearchForm
      key={query}
      initialQuery={query}
      placeholder={placeholder}
      className={className}
      currentUrl={currentUrl}
    />
  );
}
