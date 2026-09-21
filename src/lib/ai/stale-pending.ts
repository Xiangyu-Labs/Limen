import { eq, lte } from 'drizzle-orm';
import { db, type AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { activeEntries } from '@/lib/db/entry-scope';

export const AI_PENDING_TIMEOUT_MS = 10 * 60 * 1_000;

export async function recoverStalePendingEntries(
  database: AppDatabase = db,
  now = new Date(),
) {
  const cutoff = new Date(now.getTime() - AI_PENDING_TIMEOUT_MS);
  return database
    .update(entries)
    .set({ aiStatus: 'failed', updatedAt: now })
    .where(
      activeEntries(
        eq(entries.aiStatus, 'pending'),
        lte(entries.updatedAt, cutoff),
      ),
    )
    .returning({ id: entries.id });
}
