import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { desc, like, or } from 'drizzle-orm';
import Link from 'next/link';
import { EntriesTimelineClient } from '@/components/EntriesTimelineClient';
import { getMessages } from '@/lib/i18n/getMessages';
import type { Locale } from '@/lib/i18n/config';
import { newEntryPath } from '@/lib/i18n/pathname';

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
  messages: ReturnType<typeof getMessages>,
  q?: string,
) {
  const counts = {
    pending: allEntries.filter((entry) => entry.aiStatus === 'pending').length,
    failed: allEntries.filter((entry) => entry.aiStatus === 'failed').length,
    done: allEntries.filter((entry) => entry.aiStatus === 'done').length,
  };

  return {
    heading: q ? messages.dashboard.resultsFor(q) : messages.common.timeline,
    emptyMessage: messages.dashboard.emptyMessage,
    summaryStats: [
      { label: messages.common.processing, value: counts.pending, tone: 'warning' },
      { label: messages.common.needsReview, value: counts.failed, tone: 'danger' },
      { label: messages.common.ready, value: counts.done, tone: 'success' },
    ],
    entries: allEntries.map((entry) => ({
      ...entry,
      tags: entry.tags ? (JSON.parse(entry.tags) as string[]) : [],
      displayTitle: entry.title || messages.dashboard.untitledEntry,
      displaySummary: entry.summary || entry.content,
      statusLabel:
        entry.aiStatus === 'pending'
          ? messages.common.processing
          : entry.aiStatus === 'failed'
            ? messages.common.needsReview
            : entry.aiStatus === 'done'
              ? messages.common.ready
              : null,
      statusTone:
        entry.aiStatus === 'pending'
          ? 'warning'
          : entry.aiStatus === 'failed'
            ? 'danger'
            : entry.aiStatus === 'done'
              ? 'success'
              : 'muted',
      metaLine: [messages.dashboard.tagsCount(entry.tags ? (JSON.parse(entry.tags) as string[]).length : 0)],
    })),
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale: localeParam }, { q }] = await Promise.all([params, searchParams]);
  const locale = localeParam as Locale;
  const messages = getMessages(locale);

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
  const viewModel = buildDashboardViewModel(allEntries, messages, q);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border/70 bg-surface px-5 py-5 shadow-sm md:flex-row md:items-end md:justify-between md:px-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">{messages.common.timeline}</p>
          <h1 className="text-2xl font-bold tracking-tight text-text">{viewModel.heading}</h1>
          <p className="text-sm text-muted">{messages.dashboard.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full border border-border bg-surface2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            {allEntries.length} {messages.dashboard.entriesCount}
          </span>
          {viewModel.summaryStats.map((stat) => (
            <span
              key={stat.label}
              className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                stat.tone === 'warning'
                  ? 'bg-warning/10 text-warning'
                  : stat.tone === 'danger'
                    ? 'bg-danger/10 text-danger'
                    : 'bg-primary/10 text-primary'
              }`}
            >
              {stat.value} {stat.label}
            </span>
          ))}
        </div>
      </div>

      {viewModel.entries.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface py-20 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-muted text-sm font-medium">{viewModel.emptyMessage}</p>
          <Link href={newEntryPath(locale)} className="mt-6 text-primary text-sm font-bold uppercase tracking-widest hover:underline active:scale-[0.99] transition-transform">
            {messages.dashboard.createFirstEntry}
          </Link>
        </div>
      ) : (
        <EntriesTimelineClient entries={viewModel.entries} locale={locale} />
      )}
    </div>
  );
}
