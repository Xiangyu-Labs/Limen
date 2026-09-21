import type { Metadata } from 'next';
import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { entryTagNamesSql, parseTagNames } from '@/lib/db/entry-tags';
import { trashedEntries } from '@/lib/db/entry-scope';
import { daysUntilPurge, purgeExpiredEntries } from '@/lib/trash/purge';
import { formatAbsoluteDate } from '@/lib/format';
import { messages } from '@/lib/messages';
import { settingsPath } from '@/lib/pathname';
import { Button } from '@/components/ui/button';
import { TrashActions } from '@/components/TrashActions';

export const metadata: Metadata = { title: '回收站' };

type TrashRow = {
  id: string;
  title: string | null;
  preview: string;
  tags: string[];
  deletedAt: Date;
};

export function buildTrashViewModel(
  rows: TrashRow[],
  copy: typeof messages,
  now: Date,
) {
  return {
    isEmpty: rows.length === 0,
    items: rows.map((row) => ({
      id: row.id,
      displayTitle: row.title || copy.editor.untitledCapture,
      preview: row.preview,
      tags: row.tags,
      deletedOn: copy.trash.deletedOn(formatAbsoluteDate(row.deletedAt)),
      expiresIn: copy.trash.expiresIn(daysUntilPurge(row.deletedAt, now)),
    })),
  };
}

export default async function TrashPage() {
  // Inline, like recoverStalePendingEntries on the timeline: the bin must never
  // show something that should already be gone. This page is rarely opened, so
  // the cost does not matter, which is why the sweep is not on the hot path.
  await purgeExpiredEntries();

  const rows = await db
    .select({
      id: entries.id,
      title: entries.title,
      preview: entries.summary,
      content: entries.content,
      tags: entryTagNamesSql,
      deletedAt: entries.deletedAt,
    })
    .from(entries)
    .where(trashedEntries())
    .orderBy(desc(entries.deletedAt));

  const model = buildTrashViewModel(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      preview: (row.preview ?? row.content).slice(0, 200),
      tags: parseTagNames(row.tags),
      deletedAt: row.deletedAt as Date,
    })),
    messages,
    new Date(),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link
            href={settingsPath()}
            aria-label={messages.trash.backToSettings}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{messages.trash.title}</h1>
      </div>
      <p className="text-sm text-muted">{messages.trash.description}</p>

      {model.isEmpty ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border border-border bg-surface text-center">
          <Trash2 className="h-6 w-6 text-muted" />
          <p className="mt-3 text-sm text-muted">{messages.trash.empty}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border bg-surface">
          {model.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 md:flex-row md:items-center md:px-5"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="truncate text-base font-medium text-text">
                  {item.displayTitle}
                </h2>
                <p className="line-clamp-2 text-sm leading-6 text-muted">
                  {item.preview}
                </p>
                <p className="text-xs text-muted">
                  {item.deletedOn} · {item.expiresIn}
                </p>
              </div>
              <TrashActions entryId={item.id} title={item.displayTitle} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
