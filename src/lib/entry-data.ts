import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db, type AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { entryTagNamesSql, parseTagNames } from '@/lib/db/entry-tags';

export type EntryRecord = {
  id: string;
  content: string;
  title: string | null;
  summary: string | null;
  tags: string[];
  source: string | null;
  aiStatus: string | null;
  tagsLockedAt: Date | null;
  createdAt: Date;
  recordedAt: Date;
  updatedAt: Date;
};

export async function findEntry(
  database: AppDatabase,
  id: string,
): Promise<EntryRecord | undefined> {
  const rows = await database
    .select({
      id: entries.id,
      content: entries.content,
      title: entries.title,
      summary: entries.summary,
      tags: entryTagNamesSql,
      source: entries.source,
      aiStatus: entries.aiStatus,
      tagsLockedAt: entries.tagsLockedAt,
      createdAt: entries.createdAt,
      recordedAt: entries.recordedAt,
      updatedAt: entries.updatedAt,
    })
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  const row = rows[0];
  return row ? { ...row, tags: parseTagNames(row.tags) } : undefined;
}

/**
 * Cached per request so a page and its generateMetadata can both read the
 * entry without issuing two queries.
 */
export const getEntryById = cache((id: string) => findEntry(db, id));
