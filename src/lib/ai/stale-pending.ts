import { and, eq, lte } from 'drizzle-orm';
import { db, type AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';

export const AI_PENDING_TIMEOUT_MS = 10 * 60 * 1_000;

export async function recoverStalePendingEntries(
  database: AppDatabase = db,
  now = new Date(),
) {
  const cutoff = new Date(now.getTime() - AI_PENDING_TIMEOUT_MS);
  return database
    .update(entries)
    .set({ aiStatus: 'failed', updatedAt: now })
    .where(and(eq(entries.aiStatus, 'pending'), lte(entries.updatedAt, cutoff)))
    .returning({ id: entries.id });
}
