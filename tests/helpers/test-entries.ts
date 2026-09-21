import type { AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { syncEntryTags } from '@/lib/db/entry-tags';

type SeedEntryOptions = Partial<Omit<typeof entries.$inferInsert, 'tags'>> & {
  /** Written to entry_tags, bypassing tags_locked_at. */
  tags?: string[];
};

export async function seedEntry(db: AppDatabase, value: SeedEntryOptions = {}) {
  const now = new Date();
  const { tags, ...columns } = value;
  const entry = {
    id: columns.id ?? 'entry-1',
    content: columns.content ?? 'Seeded entry content',
    title: columns.title ?? null,
    summary: columns.summary ?? null,
    source: columns.source ?? 'web',
    aiStatus: columns.aiStatus ?? 'pending',
    tagsLockedAt: columns.tagsLockedAt ?? null,
    createdAt: columns.createdAt ?? now,
    recordedAt: columns.recordedAt ?? now,
    updatedAt: columns.updatedAt ?? now,
  } satisfies typeof entries.$inferInsert;

  await db.insert(entries).values(entry);
  if (tags && tags.length > 0) {
    await syncEntryTags(db, entry.id, tags, { respectLock: false });
  }
  return { ...entry, tags: tags ?? [] };
}
