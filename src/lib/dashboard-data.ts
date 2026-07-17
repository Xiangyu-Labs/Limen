import { and, desc, eq, ilike, lt, or, sql, type SQL } from 'drizzle-orm';
import { db, type AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { decodeEntryCursor, encodeEntryCursor } from '@/lib/pagination';
import { normalizeSearchQuery } from '@/lib/validation';
import { parseStoredTags } from '@/lib/tags';
import { messages } from '@/lib/messages';

export const DASHBOARD_PREVIEW_LENGTH = 280;

export type DashboardEntry = {
  id: string;
  title: string | null;
  preview: string;
  tags: string | null;
  aiStatus: string | null;
  createdAt: Date;
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

export function buildTimelineEntriesPage(page: DashboardEntriesPage): TimelineEntriesPage {
  return {
    pageInfo: page.pageInfo,
    items: page.items.map((entry) => ({
      id: entry.id,
      displayTitle: entry.title || messages.dashboard.untitledEntry,
      displaySummary: entry.preview,
      tags: parseStoredTags(entry.tags),
      statusLabel: entry.aiStatus === 'failed'
        ? messages.common.failed
        : entry.aiStatus === 'pending' ? messages.common.processing : null,
      statusTone: entry.aiStatus === 'failed' ? 'danger' : 'muted',
      createdAt: entry.createdAt.toISOString(),
      isPending: entry.aiStatus === 'pending',
    })),
  };
}

function escapeLikePattern(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function buildEntryWhere(q?: string, cursorValue?: string): SQL | undefined {
  const conditions: SQL[] = [];
  const query = normalizeSearchQuery(q);
  if (query) {
    const pattern = `%${escapeLikePattern(query)}%`;
    conditions.push(or(
      ilike(entries.content, pattern),
      ilike(entries.title, pattern),
      ilike(entries.summary, pattern),
    ) as SQL);
  }

  const cursor = decodeEntryCursor(cursorValue);
  if (cursor) {
    const cursorCondition = or(
      lt(entries.createdAt, cursor.createdAt),
      and(eq(entries.createdAt, cursor.createdAt), lt(entries.id, cursor.id)),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function loadDashboardEntriesPage({
  q,
  cursor,
  limit = 20,
}: {
  q?: string;
  cursor?: string;
  limit?: number;
}, database: AppDatabase = db): Promise<DashboardEntriesPage> {
  const rows = await database.select({
    id: entries.id,
    title: entries.title,
    preview: sql<string>`left(coalesce(${entries.summary}, ${entries.content}), ${DASHBOARD_PREVIEW_LENGTH})`,
    tags: entries.tags,
    aiStatus: entries.aiStatus,
    createdAt: entries.createdAt,
  }).from(entries)
    .where(buildEntryWhere(q, cursor))
    .orderBy(desc(entries.createdAt), desc(entries.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items,
    pageInfo: {
      hasMore,
      limit,
      nextCursor: hasMore && last
        ? encodeEntryCursor({ createdAt: last.createdAt, id: last.id })
        : null,
    },
  };
}

export async function loadApiEntriesPage({
  cursor,
  limit,
}: {
  cursor?: string;
  limit: number;
}, database: AppDatabase = db) {
  const rows = await database.select().from(entries)
    .where(buildEntryWhere(undefined, cursor))
    .orderBy(desc(entries.createdAt), desc(entries.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items,
    pageInfo: {
      hasMore,
      limit,
      nextCursor: hasMore && last
        ? encodeEntryCursor({ createdAt: last.createdAt, id: last.id })
        : null,
    },
  };
}
