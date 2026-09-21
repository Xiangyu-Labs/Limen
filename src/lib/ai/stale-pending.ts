import { eq, lte } from 'drizzle-orm';
import { db, type AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { activeEntries } from '@/lib/db/entry-scope';

export const AI_PENDING_TIMEOUT_MS = 10 * 60 * 1_000;
/** At most one recovery sweep per instance per minute. */
export const RECOVERY_THROTTLE_MS = 60 * 1_000;

let lastRecoveryAt = 0;

export function shouldRunRecovery(now = Date.now(), last = lastRecoveryAt) {
  return now - last >= RECOVERY_THROTTLE_MS;
}

/**
 * Throttled recovery for hot read paths.
 *
 * Every timeline render and every entry view used to issue an UPDATE before
 * responding, which put a Neon round-trip — on an HTTP driver with no
 * connection reuse — in front of the first byte. Polling routes still call
 * recoverStalePendingEntries directly, because there freshness is the point.
 */
export async function recoverStalePendingEntriesThrottled(
  database: AppDatabase = db,
  now = new Date(),
) {
  if (!shouldRunRecovery(now.getTime())) return [];
  lastRecoveryAt = now.getTime();
  return recoverStalePendingEntries(database, now);
}

export function resetRecoveryThrottleForTests() {
  lastRecoveryAt = 0;
}

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
