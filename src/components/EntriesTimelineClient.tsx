'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import useSWR, { SWRConfig } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { ArrowUp, Calendar, Loader2, Sparkles } from 'lucide-react';
import { bulkRegenerateEntryMetadata } from '@/lib/actions/entries';
import { toast } from 'sonner';
import type { TimelineEntriesPage } from '@/lib/dashboard-data';
import { messages } from '@/lib/messages';
import { dashboardPath, entryDetailPath } from '@/lib/pathname';
import { useRouter } from 'next/navigation';
import {
  groupTimelineEntriesByPeriod,
  mergeTimelinePages,
  splitHighlightSegments,
} from '@/lib/timeline';
import {
  AdaptiveAIPollingScheduler,
  AI_POLL_SWR_OPTIONS,
  applyEntryStatusPatches,
  chunkPendingEntryIds,
  pendingEntryIds,
  type EntryStatusPatch,
} from '@/lib/ai/polling';
import { formatEntryCalendarDate } from '@/lib/format';
import {
  readTimelinePosition,
  timelineStateKey,
  writeTimelinePosition,
} from '@/lib/timeline/scroll-restore';

type EntryStatusResponse = { entries: EntryStatusPatch[] };

async function fetchTimelinePage(url: string): Promise<TimelineEntriesPage> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('加载时间线失败');
  return response.json();
}

export async function fetchEntryStatusPatches(
  ids: string[],
  fetcher: typeof fetch = fetch,
) {
  const responses = await Promise.all(
    chunkPendingEntryIds(ids).map(async (batch) => {
      const response = await fetcher('/api/dashboard/entries/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: batch }),
      });
      if (!response.ok) throw new Error('加载 AI 状态失败');
      return (await response.json()) as EntryStatusResponse;
    }),
  );
  return { entries: responses.flatMap((response) => response.entries) };
}

/** Marks the search term inside a title or preview. */
function Highlighted({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {splitHighlightSegments(text, query).map((segment, index) =>
        segment.matched ? (
          <mark key={index} className="rounded-sm bg-primary/15 text-inherit">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

type EntriesTimelineProps = {
  initialPage: TimelineEntriesPage;
  query?: string;
  tag?: string;
};

/**
 * The server renders the first page fresh on every visit, so that page is the
 * truth, not whatever SWR remembers from the last visit.
 *
 * SWR's default cache is module-global and outlives client navigation. With
 * `revalidateFirstPage: false`, a remount served page 0 from that cache and
 * ignored `initialPage`: a new entry did not show up after saving, and edits,
 * restores and tag changes made elsewhere stayed invisible until a reload. A
 * cache per mount lets `fallbackData` be the fresh server page instead.
 */
export function EntriesTimelineClient(props: EntriesTimelineProps) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <EntriesTimeline {...props} />
    </SWRConfig>
  );
}

function EntriesTimeline({ initialPage, query, tag }: EntriesTimelineProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pollingSchedulerRef = useRef<AdaptiveAIPollingScheduler | null>(null);
  pollingSchedulerRef.current ??= new AdaptiveAIPollingScheduler();
  const [isRetryPending, startRetryTransition] = useTransition();
  const pollingScheduler = pollingSchedulerRef.current;
  const { data, error, isValidating, size, setSize, mutate } =
    useSWRInfinite<TimelineEntriesPage>(
      (pageIndex, previousPage) => {
        if (previousPage && !previousPage.pageInfo.hasMore) return null;
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (tag) params.set('tag', tag);
        if (pageIndex > 0 && previousPage?.pageInfo.nextCursor) {
          params.set('cursor', previousPage.pageInfo.nextCursor);
        }
        return `/api/dashboard/entries?${params.toString()}`;
      },
      fetchTimelinePage,
      {
        fallbackData: [initialPage],
        // The server just rendered page 0; fetching it again on mount is waste.
        revalidateOnMount: false,
        revalidateFirstPage: false,
      },
    );

  // router.refresh(), or a server action that revalidated this page, hands
  // down a new first page without remounting. Refetch every loaded page so the
  // later ones agree with it: an entry can move between pages when its date
  // changes.
  const renderedPageRef = useRef(initialPage);
  useEffect(() => {
    if (renderedPageRef.current === initialPage) return;
    renderedPageRef.current = initialPage;
    void mutate();
  }, [initialPage, mutate]);

  const timelineEntries = useMemo(() => mergeTimelinePages(data), [data]);
  const sections = useMemo(
    () => groupTimelineEntriesByPeriod(timelineEntries),
    [timelineEntries],
  );
  const [showBackToTop, setShowBackToTop] = useState(false);
  const positionKey = timelineStateKey(query, tag);
  const restoredRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 1_200);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ask for the pages that were loaded before navigating away.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = readTimelinePosition(positionKey);
    if (saved && saved.size > 1) void setSize(saved.size);
  }, [positionKey, setSize]);

  // Only scroll once those pages have actually arrived, otherwise the document
  // is still too short and the browser clamps the offset.
  const restoredScrollRef = useRef(false);
  useEffect(() => {
    if (restoredScrollRef.current) return;
    const saved = readTimelinePosition(positionKey);
    if (!saved) {
      restoredScrollRef.current = true;
      return;
    }
    if ((data?.length ?? 0) < saved.size) return;
    restoredScrollRef.current = true;
    window.scrollTo({ top: saved.offset });
  }, [data, positionKey]);

  useEffect(() => {
    const save = () =>
      writeTimelinePosition(positionKey, {
        size: data?.length ?? 1,
        offset: window.scrollY,
      });
    window.addEventListener('pagehide', save);
    return () => {
      save();
      window.removeEventListener('pagehide', save);
    };
  }, [data, positionKey]);
  const pendingIds = useMemo(() => pendingEntryIds(data), [data]);
  const pendingSignature = pendingIds.join('\u0000');
  useSWR<EntryStatusResponse>(
    pendingIds.length > 0
      ? ['/api/dashboard/entries/status', pendingSignature]
      : null,
    () => fetchEntryStatusPatches(pendingIds),
    {
      refreshInterval: () => pollingScheduler.getInterval(pendingIds),
      ...AI_POLL_SWR_OPTIONS,
      onError: () => pollingScheduler.recordFailure(),
      onSuccess: (response) => {
        pollingScheduler.recordSuccess();
        void mutate(
          (pages) =>
            pages?.map((page) => ({
              ...page,
              items: applyEntryStatusPatches(page.items, response.entries),
            })),
          { revalidate: false },
        );
      },
    },
  );
  const lastPage = data?.at(-1) ?? initialPage;
  const hasMore = lastPage.pageInfo.hasMore;
  const isLoadingMore = isValidating && size > (data?.length ?? 0);
  const failedIds = useMemo(
    () =>
      timelineEntries
        .filter((entry) => entry.statusTone === 'danger')
        .map((entry) => entry.id),
    [timelineEntries],
  );
  const failedIdSet = useMemo(() => new Set(failedIds), [failedIds]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !hasMore ||
      error ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isValidating)
          void setSize((current) => current + 1);
      },
      { rootMargin: '240px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isValidating, setSize]);

  function retryAllFailed() {
    if (failedIds.length === 0) return;
    startRetryTransition(async () => {
      try {
        await mutate(
          (pages) =>
            pages?.map((page) => ({
              ...page,
              items: page.items.map((entry) =>
                failedIdSet.has(entry.id)
                  ? {
                      ...entry,
                      statusLabel: messages.common.processing,
                      statusTone: 'muted' as const,
                      isPending: true,
                    }
                  : entry,
              ),
            })),
          { revalidate: false },
        );
        const result = await bulkRegenerateEntryMetadata(failedIds);
        if (!result.ok) {
          await mutate();
          toast.error(result.error);
          return;
        }
        toast.success(`已开始重新整理 ${result.data.ids.length} 条记录`);
      } catch {
        await mutate();
        toast.error('重新整理失败，请重试');
      }
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
            {isRetryPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {messages.common.regenerate}
          </button>
          <span className="text-sm text-muted">
            {failedIds.length} {messages.common.failed}
          </span>
        </div>
      ) : null}

      <div className="space-y-5">
        {sections.map((section) => (
          <section key={section.key} className="space-y-2">
            <h2 className="sticky top-16 z-[5] -mx-4 bg-bg/95 px-4 py-1 text-xs font-medium text-muted backdrop-blur md:-mx-6 md:px-6">
              {section.label}
            </h2>
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {section.entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={entryDetailPath(entry.id)}
                  className="group grid min-h-28 gap-3 border-b border-border px-4 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_112px] last:border-b-0 hover:bg-surface2/60 active:bg-surface2 sm:grid-cols-[72px_minmax(0,1fr)] md:px-5"
                >
                  <div className="flex items-center gap-2 text-sm text-muted sm:block sm:pt-0.5">
                    <Calendar className="h-4 w-4 sm:hidden" />
                    <span>
                      {formatEntryCalendarDate(new Date(entry.createdAt))}
                    </span>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate text-base font-semibold tracking-tight text-text group-hover:text-primary">
                        <Highlighted text={entry.displayTitle} query={query} />
                      </h3>
                      <p className="line-clamp-2 text-sm leading-6 text-muted">
                        <Highlighted
                          text={entry.displaySummary}
                          query={query}
                        />
                      </p>
                    </div>
                    {entry.tags.length > 0 || entry.statusLabel ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted">
                        {entry.statusLabel ? (
                          <span
                            className={
                              entry.isPending
                                ? 'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/20 px-2 py-1 text-primary'
                                : 'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-danger/20 px-2 py-1 text-danger'
                            }
                          >
                            {entry.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                            )}
                            {entry.statusLabel}
                          </span>
                        ) : null}
                        {entry.tags.map((name) => (
                          <button
                            key={name}
                            type="button"
                            // Inside a Link, so the navigation has to be
                            // suppressed before routing to the tag filter.
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              router.push(
                                `${dashboardPath()}?tag=${encodeURIComponent(name)}`,
                              );
                            }}
                            className="rounded-md bg-surface2 px-2 py-1 hover:text-primary"
                          >
                            #{name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="flex min-h-12 items-center justify-center"
        aria-live="polite"
      >
        {error ? (
          <button
            type="button"
            disabled={isValidating}
            onClick={() => void setSize(size)}
            className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {messages.dashboard.retryLoad}
          </button>
        ) : hasMore ? (
          <button
            type="button"
            disabled={isValidating}
            onClick={() => void setSize((current) => current + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm text-muted hover:bg-surface2 hover:text-text disabled:opacity-50"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {messages.dashboard.loadMore}
          </button>
        ) : (
          <span className="text-xs text-muted">
            {messages.dashboard.endOfTimeline}
          </span>
        )}
      </div>
      {error ? (
        <p role="alert" className="sr-only">
          {messages.dashboard.loadFailed}
        </p>
      ) : null}

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={messages.dashboard.backToTop}
          title={messages.dashboard.backToTop}
          className="fixed bottom-6 right-6 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-lg transition-colors hover:text-primary"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
