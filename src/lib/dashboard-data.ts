import { and, desc, eq, ilike, lt, or, sql, type SQL } from 'drizzle-orm';
import { db, type AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { decodeEntryCursor, encodeEntryCursor } from '@/lib/pagination';
import { normalizeSearchQuery } from '@/lib/validation';
import {
  entryTagNamesSql,
  hasAnyTag,
  parseTagNames,
} from '@/lib/db/entry-tags';
import { messages } from '@/lib/messages';
import { recoverStalePendingEntries } from '@/lib/ai/stale-pending';
import { activeEntries } from '@/lib/db/entry-scope';

export const DASHBOARD_PREVIEW_LENGTH = 280;

export type DashboardEntry = {
  id: string;
  title: string | null;
  preview: string;
  tags: string[];
  aiStatus: string | null;
  createdAt: Date;
  recordedAt: Date;
};

export type DashboardEntriesPage = {
  items: DashboardEntry[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
};

export type TimelineEntry = {
  id: string;
  displayTitle: string;
  displaySummary: string;
  statusLabel: string | null;
  statusTone: 'danger' | 'muted';
  tags: string[];
  createdAt: string;
  isPending: boolean;
};

export type TimelineEntriesPage = {
  items: TimelineEntry[];
  pageInfo: DashboardEntriesPage['pageInfo'];
};

export function buildTimelineEntriesPage(
  page: DashboardEntriesPage,
): TimelineEntriesPage {
  return {
    pageInfo: page.pageInfo,
    items: page.items.map((entry) => ({
      id: entry.id,
      displayTitle: entry.title || messages.dashboard.untitledEntry,
      displaySummary: entry.preview,
      tags: entry.tags,
      statusLabel:
        entry.aiStatus === 'failed'
          ? messages.common.failed
          : entry.aiStatus === 'pending'
            ? messages.common.processing
            : null,
      statusTone: entry.aiStatus === 'failed' ? 'danger' : 'muted',
      createdAt: entry.createdAt.toISOString(),
      isPending: entry.aiStatus === 'pending',
    })),
  };
}

function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

type EntryFilters = { q?: string; tag?: string; cursor?: string };

function buildEntryWhere({ q, tag, cursor: cursorValue }: EntryFilters) {
  const conditions: SQL[] = [];
  const query = normalizeSearchQuery(q);
  if (query) {
    const pattern = `%${escapeLikePattern(query)}%`;
    conditions.push(
      or(
        ilike(entries.content, pattern),
        ilike(entries.title, pattern),
        ilike(entries.summary, pattern),
      ) as SQL,
    );
  }

  // Tag filtering runs in SQL against entry_tags_tag_id_entry_id_idx rather
  // than loading rows and filtering them in JS.
  if (tag) conditions.push(hasAnyTag([tag]));

  const cursor = decodeEntryCursor(cursorValue);
  if (cursor) {
    const cursorCondition = or(
      lt(entries.createdAt, cursor.createdAt),
      and(
        eq(entries.createdAt, cursor.createdAt),
        lt(entries.recordedAt, cursor.recordedAt),
      ),
      and(
        eq(entries.createdAt, cursor.createdAt),
        eq(entries.recordedAt, cursor.recordedAt),
        lt(entries.id, cursor.id),
      ),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  return activeEntries(...conditions);
}

export async function loadDashboardEntriesPage(
  { q, tag, cursor, limit = 20 }: EntryFilters & { limit?: number },
  database: AppDatabase = db,
): Promise<DashboardEntriesPage> {
  await recoverStalePendingEntries(database);
  const rows = await database
    .select({
      id: entries.id,
      title: entries.title,
      preview: sql<string>`left(coalesce(${entries.summary}, ${entries.content}), ${DASHBOARD_PREVIEW_LENGTH})`,
      tags: entryTagNamesSql,
      aiStatus: entries.aiStatus,
      createdAt: entries.createdAt,
      recordedAt: entries.recordedAt,
    })
    .from(entries)
    .where(buildEntryWhere({ q, tag, cursor }))
    .orderBy(
      desc(entries.createdAt),
      desc(entries.recordedAt),
      desc(entries.id),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items: items.map((row) => ({ ...row, tags: parseTagNames(row.tags) })),
    pageInfo: {
      hasMore,
      limit,
      nextCursor:
        hasMore && last
          ? encodeEntryCursor({
              createdAt: last.createdAt,
              recordedAt: last.recordedAt,
              id: last.id,
            })
          : null,
    },
  };
}

export async function loadApiEntriesPage(
  {
    cursor,
    limit,
  }: {
    cursor?: string;
    limit: number;
  },
  database: AppDatabase = db,
) {
  await recoverStalePendingEntries(database);
  const rows = await database
    .select({
      id: entries.id,
      content: entries.content,
      title: entries.title,
      summary: entries.summary,
      tags: entryTagNamesSql,
      source: entries.source,
      aiStatus: entries.aiStatus,
      createdAt: entries.createdAt,
      recordedAt: entries.recordedAt,
      updatedAt: entries.updatedAt,
    })
    .from(entries)
    .where(buildEntryWhere({ cursor }))
    .orderBy(
      desc(entries.createdAt),
      desc(entries.recordedAt),
      desc(entries.id),
    )
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items: items.map((row) => ({ ...row, tags: parseTagNames(row.tags) })),
    pageInfo: {
      hasMore,
      limit,
      nextCursor:
        hasMore && last
          ? encodeEntryCursor({
              createdAt: last.createdAt,
              recordedAt: last.recordedAt,
              id: last.id,
            })
          : null,
    },
  };
}
