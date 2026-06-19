import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { desc, like, or } from 'drizzle-orm';
import Link from 'next/link';
import { format, isSameDay } from 'date-fns';
import { EntriesTimelineClient } from '@/components/EntriesTimelineClient';
import { DashboardFilters } from '@/components/DashboardFilters';
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

  let query = db.select().from(entries).orderBy(desc(entries.createdAt));

  if (q) {
    query = db.select().from(entries)
      .where(or(
        like(entries.content, `%${q}%`),
        like(entries.title, `%${q}%`),
        like(entries.summary, `%${q}%`)
      ))
      .orderBy(desc(entries.createdAt)) as any;
  }

  const allEntries = await query;

  let filteredEntries = allEntries;
  if (date) {
    const filterDate = new Date(date + 'T00:00:00');
    filteredEntries = allEntries.filter((entry) =>
      entry.createdAt && isSameDay(entry.createdAt, filterDate)
    );
  }

  const datesWithEntries = allEntries
    .filter((entry) => entry.createdAt)
    .map((entry) => format(entry.createdAt!, 'yyyy-MM-dd'));

  const viewModel = buildDashboardViewModel(filteredEntries, messages, q);

  return (
    <div className="space-y-5">
      <DashboardFilters
        datesWithEntries={datesWithEntries}
        entriesCount={filteredEntries.length}
        selectedDate={date}
      />

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
