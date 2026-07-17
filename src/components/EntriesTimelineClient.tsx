'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useTransition } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Calendar, Loader2, Sparkles } from 'lucide-react';
import { bulkRegenerateEntryMetadata } from '@/lib/actions/entries';
import type { TimelineEntriesPage } from '@/lib/dashboard-data';
import { messages } from '@/lib/messages';
import { entryDetailPath } from '@/lib/pathname';
import { mergeTimelinePages } from '@/lib/timeline';

const entryDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

async function fetchTimelinePage(url: string): Promise<TimelineEntriesPage> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('加载时间线失败');
  return response.json();
}

export function EntriesTimelineClient({
  initialPage,
  query,
}: {
  initialPage: TimelineEntriesPage;
  query?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isRetryPending, startRetryTransition] = useTransition();
  const { data, error, isValidating, size, setSize, mutate } = useSWRInfinite<TimelineEntriesPage>(
    (pageIndex, previousPage) => {
      if (previousPage && !previousPage.pageInfo.hasMore) return null;
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (pageIndex > 0 && previousPage?.pageInfo.nextCursor) {
        params.set('cursor', previousPage.pageInfo.nextCursor);
      }
      return `/api/dashboard/entries?${params.toString()}`;
    },
    fetchTimelinePage,
    { fallbackData: [initialPage], revalidateFirstPage: false },
  );

  const timelineEntries = useMemo(() => mergeTimelinePages(data), [data]);
  const lastPage = data?.at(-1) ?? initialPage;
  const hasMore = lastPage.pageInfo.hasMore;
  const isLoadingMore = isValidating && size > (data?.length ?? 0);
  const failedIds = useMemo(() => (
    timelineEntries.filter((entry) => entry.statusTone === 'danger').map((entry) => entry.id)
  ), [timelineEntries]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isValidating) void setSize((current) => current + 1);
    }, { rootMargin: '240px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isValidating, setSize]);

  function retryAllFailed() {
    if (failedIds.length === 0) return;
    startRetryTransition(async () => {
      await bulkRegenerateEntryMetadata(failedIds);
      await mutate((pages) => pages?.map((page) => ({
        ...page,
        items: page.items.map((entry) => (
          failedIds.includes(entry.id)
            ? { ...entry, statusLabel: null, statusTone: 'muted' as const }
            : entry
        )),
      })), { revalidate: false });
    });
  }

  return (
    <div className="space-y-3">
      {failedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/20 bg-surface px-3 py-3">
          <button
            type="button"
            disabled={isRetryPending}
            onClick={retryAllFailed}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isRetryPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {messages.common.regenerate}
          </button>
          <span className="text-sm text-muted">{failedIds.length} {messages.common.failed}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {timelineEntries.map((entry) => (
          <Link
            key={entry.id}
            href={entryDetailPath(entry.id)}
            className="group grid min-h-28 gap-3 border-b border-border px-4 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_112px] last:border-b-0 hover:bg-surface2/60 active:bg-surface2 sm:grid-cols-[72px_minmax(0,1fr)] md:px-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted sm:block sm:pt-0.5">
              <Calendar className="h-4 w-4 sm:hidden" />
              <span>{entryDateFormatter.format(new Date(entry.createdAt))}</span>
            </div>
            <div className="min-w-0 space-y-2">
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-base font-semibold tracking-tight text-text group-hover:text-primary">{entry.displayTitle}</h2>
                <p className="line-clamp-2 text-sm leading-6 text-muted">{entry.displaySummary}</p>
              </div>
              {entry.tags.length > 0 || entry.statusLabel ? (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted">
                  {entry.statusLabel ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-danger/20 px-2 py-1 text-danger">
                      <span className="h-1.5 w-1.5 rounded-full bg-danger" />{entry.statusLabel}
                    </span>
                  ) : null}
                  {entry.tags.map((tag) => <span key={tag} className="rounded-md bg-surface2 px-2 py-1">#{tag}</span>)}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center" aria-live="polite">
        {hasMore ? (
          <button
            type="button"
            disabled={isValidating}
            onClick={() => void setSize((current) => current + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm text-muted hover:bg-surface2 hover:text-text disabled:opacity-50"
          >
            {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {messages.dashboard.loadMore}
          </button>
        ) : <span className="text-xs text-muted">{messages.dashboard.endOfTimeline}</span>}
      </div>
      {error ? <p role="alert" className="text-center text-sm text-danger">{messages.dashboard.loadFailed}</p> : null}
    </div>
  );
}
