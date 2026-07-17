import Link from 'next/link';
import { EntriesTimelineClient } from '@/components/EntriesTimelineClient';
import { buildTimelineEntriesPage, loadDashboardEntriesPage } from '@/lib/dashboard-data';
import { messages } from '@/lib/messages';
import { newEntryPath } from '@/lib/pathname';
import { normalizeSearchQuery } from '@/lib/validation';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const q = normalizeSearchQuery(rawQuery);
  const initialPage = buildTimelineEntriesPage(await loadDashboardEntriesPage({ q }));

  return (
    <div className="space-y-5">
      {initialPage.items.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-surface text-center">
          <p className="text-sm text-muted">{messages.dashboard.emptyMessage}</p>
          <Link
            href={newEntryPath()}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {messages.dashboard.createFirstEntry}
          </Link>
        </div>
      ) : (
        <EntriesTimelineClient key={q ?? ''} initialPage={initialPage} query={q} />
      )}
    </div>
  );
}
