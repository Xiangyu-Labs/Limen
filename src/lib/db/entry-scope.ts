import { and, isNotNull, isNull, type SQL } from 'drizzle-orm';
import { entries } from '@/lib/db/schema';

/**
 * Deleted-state scopes for every query against `entries`.
 *
 * Two reasons these exist rather than writing isNull(entries.deletedAt) by
 * hand at each call site. The obvious one is that there are a dozen read paths
 * and one of them will eventually be forgotten. The load-bearing one is that
 * entries_timeline_idx is a partial index predicated on `deleted_at IS NULL`,
 * so a query without that predicate does not merely show deleted rows — it
 * stops using the index.
 *
 * tests/entry-scope-guard.test.ts fails the build if a file touches `entries`
 * without going through one of these.
 */

/** Rows the owner can still see. The default for reads and mutations. */
export function activeEntries(...conditions: Array<SQL | undefined>): SQL {
  return and(isNull(entries.deletedAt), ...conditions) as SQL;
}

/** Rows in the recycle bin. Trash UI, restore and purge only. */
export function trashedEntries(...conditions: Array<SQL | undefined>): SQL {
  return and(isNotNull(entries.deletedAt), ...conditions) as SQL;
}

/**
 * Explicitly spans both states. Named to be conspicuous in review and in the
 * guard test; every use should say why it needs deleted rows too.
 */
export function anyEntryScope(
  ...conditions: Array<SQL | undefined>
): SQL | undefined {
  const present = conditions.filter(Boolean);
  return present.length > 0 ? (and(...present) as SQL) : undefined;
}
