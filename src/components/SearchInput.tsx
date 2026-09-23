'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { SEARCH_QUERY_MAX_LENGTH } from '@/lib/validation';

export function normalizeSearchQuery(query: string) {
  return query.trim();
}

export const SEARCH_DEBOUNCE_MS = 300;

/** `/` focuses search, unless the user is already typing somewhere. */
export function isSearchShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  target: EventTarget | null;
}) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }
  const target = event.target as HTMLElement | null;
  if (!target || typeof target.closest !== 'function') return true;
  return !target.closest('input, textarea, select, [contenteditable="true"]');
}

export function buildSearchHref(currentUrl: string, query: string) {
  const normalized = normalizeSearchQuery(query);
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.searchParams);
  params.delete('date');
  // A new search starts a new result set; keeping a cursor or a tag filter
  // would silently scope it.
  params.delete('cursor');
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
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(initialQuery), 0);
    return () => window.clearTimeout(timeout);
  }, [initialQuery]);
  function navigate(value: string) {
    startTransition(() => router.push(buildSearchHref(currentUrl, value)));
  }

  // Searching as you type; Enter still submits immediately.
  useEffect(() => {
    if (normalizeSearchQuery(query) === normalizeSearchQuery(initialQuery)) {
      return;
    }
    const timeout = window.setTimeout(
      () => navigate(query),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeout);
    // navigate is stable enough here: it only closes over currentUrl, which
    // changes only when the URL we are already navigating to changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, initialQuery, currentUrl]);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        navigate(query);
      }}
      className={`relative w-full max-w-md ${className}`}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.blur();
        }}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-transparent bg-surface2 pl-9 pr-12 text-sm text-text transition-colors placeholder:text-muted hover:border-border focus:border-primary focus:bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {isPending ? (
        <Loader2
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
          aria-label="正在搜索"
        />
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
      ) : (
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-sm border border-border bg-bg px-1 font-mono text-[11px] text-muted md:inline-flex"
        >
          /
        </kbd>
      )}
    </form>
  );
}

export function SearchInput({
  placeholder = '搜索',
  className = '',
}: {
  placeholder?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = searchParams.get('q') || '';
  const currentUrl = `http://localhost${pathname}?${searchParams.toString()}`;
  return (
    <SearchForm
      initialQuery={query}
      placeholder={placeholder}
      className={className}
      currentUrl={currentUrl}
    />
  );
}
