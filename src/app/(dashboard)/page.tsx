import Link from 'next/link';
import { EntriesTimelineClient } from '@/components/EntriesTimelineClient';
import { filterDashboardEntriesByDate, loadDashboardEntries } from '@/lib/dashboard-data';
import { messages } from '@/lib/messages';
import { newEntryPath } from '@/lib/pathname';

export function buildDashboardViewModel(
  allEntries: Array<{
    id: string;
    content: string;
    title: string | null;
    summary: string | null;
    tags: string | null;
    aiStatus: string | null;
    createdAt: Date | null;
  }>,
  copy: typeof messages,
  q?: string,
) {
  return {
    heading: q ? copy.dashboard.resultsFor(q) : copy.common.timeline,
    emptyMessage: copy.dashboard.emptyMessage,
    entries: allEntries.map((entry) => ({
      ...entry,
      tags: entry.tags ? (JSON.parse(entry.tags) as string[]) : [],
      displayTitle: entry.title || copy.dashboard.untitledEntry,
      displaySummary: entry.summary || entry.content,
      statusLabel: entry.aiStatus === 'failed' ? copy.common.failed : null,
      statusTone: entry.aiStatus === 'failed' ? 'danger' : 'muted',
    })),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q, date } = await searchParams;

  const allEntries = await loadDashboardEntries(q);
  const filteredEntries = filterDashboardEntriesByDate(allEntries, date);

  const viewModel = buildDashboardViewModel(filteredEntries, messages, q);

  return (
    <div className="space-y-5">
      {viewModel.entries.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-surface text-center">
          <p className="text-sm text-muted">{viewModel.emptyMessage}</p>
          <Link
            href={newEntryPath()}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {messages.dashboard.createFirstEntry}
          </Link>
        </div>
      ) : (
        <EntriesTimelineClient entries={viewModel.entries} />
      )}
    </div>
  );
}
