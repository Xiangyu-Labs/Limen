import Link from 'next/link';
import { EntriesTimelineClient } from '@/components/EntriesTimelineClient';
import {
  buildTimelineEntriesPage,
  loadDashboardEntriesPage,
} from '@/lib/dashboard-data';
import { messages } from '@/lib/messages';
import { dashboardPath, newEntryPath } from '@/lib/pathname';
import { normalizeSearchQuery } from '@/lib/validation';
import { X } from 'lucide-react';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const q = normalizeSearchQuery(rawQuery);
  const initialPage = buildTimelineEntriesPage(
    await loadDashboardEntriesPage({ q }),
  );

  return (
    <div className="space-y-5">
      {initialPage.items.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-surface text-center">
          <p className="text-sm text-muted">
            {q
              ? messages.dashboard.noSearchResults
              : messages.dashboard.emptyMessage}
          </p>
          {q ? (
            <Link
              href={dashboardPath()}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium text-muted hover:bg-surface2 hover:text-text"
            >
              <X className="h-4 w-4" />
              {messages.dashboard.clearSearch}
            </Link>
          ) : (
            <Link
              href={newEntryPath()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {messages.dashboard.createFirstEntry}
            </Link>
          )}
        </div>
      ) : (
        <EntriesTimelineClient
          key={q ?? ''}
          initialPage={initialPage}
          query={q}
        />
      )}
    </div>
  );
}
