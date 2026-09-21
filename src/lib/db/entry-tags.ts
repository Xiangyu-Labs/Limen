import { inArray, sql, type SQL } from 'drizzle-orm';
import type { AppDatabase } from '@/lib/db';
import { entries, entryTags, tags } from '@/lib/db/schema';
import { normalizeTags } from '@/lib/tags';

/**
 * A correlated subquery returning an entry's tag names as a JSON array string.
 *
 * Cast to ::text and parsed in JS rather than relying on the driver's JSON
 * handling, because neon-http and PGlite decode json columns differently.
 */
/*
 * Identifiers are written out and table-qualified rather than interpolated as
 * Drizzle columns: inside a correlated subquery Drizzle renders them bare, so
 * `${entries.id}` becomes "id" and silently binds to tags.id instead.
 */
export const entryTagNamesSql = sql<string>`(
  SELECT coalesce(json_agg(t.name ORDER BY t.name), '[]')::text
  FROM entry_tags et
  JOIN tags t ON t.id = et.tag_id
  WHERE et.entry_id = "entries"."id"
)`;

export function parseTagNames(value: string | null): string[] {
  if (!value) return [];
  try {
    return normalizeTags(JSON.parse(value));
  } catch {
    return [];
  }
}

export async function loadEntryTagsMap(
  database: AppDatabase,
  ids: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>(ids.map((id) => [id, []]));
  if (ids.length === 0) return map;
  const rows = await database
    .select({ entryId: entryTags.entryId, name: tags.name })
    .from(entryTags)
    .innerJoin(tags, sql`${tags.id} = ${entryTags.tagId}`)
    .where(inArray(entryTags.entryId, ids))
    .orderBy(tags.name);
  for (const row of rows) map.get(row.entryId)?.push(row.name);
  return map;
}

/**
 * Every tag attached to at least one entry the owner can still see.
 *
 * Replaces the full-table scans that both the AI prompt and the settings
 * export list used to do over entries.tags.
 */
export async function listActiveTagNames(
  database: AppDatabase,
): Promise<string[]> {
  const rows = await database
    .selectDistinct({ name: tags.name })
    .from(tags)
    .innerJoin(entryTags, sql`${entryTags.tagId} = ${tags.id}`)
    .innerJoin(entries, sql`${entries.id} = ${entryTags.entryId}`);
  // Sorted in JS: Postgres collation will not reproduce pinyin order, and this
  // list is small enough that it does not matter.
  return rows
    .map((row) => row.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

/** "This entry carries at least one of these tags." Uses the tag_id index. */
export function hasAnyTag(names: string[]): SQL {
  if (names.length === 0) return sql`false`;
  return sql`EXISTS (
    SELECT 1 FROM entry_tags et
    JOIN tags t ON t.id = et.tag_id
    WHERE et.entry_id = "entries"."id"
      AND t.name = ANY(${sql.param(names)})
  )`;
}

/**
 * The only writer of entry_tags.
 *
 * neon-http has no interactive transactions, so this cannot be wrapped in one:
 * .transaction() type-checks, works under PGlite, and throws at runtime on
 * Neon. Inserts therefore run before the delete, so an interruption leaves a
 * superset of the intended tags rather than a gap.
 *
 * `respectLock` is enforced inside the SQL predicates instead of a read-then-
 * write in JS, which makes it race-free without a transaction.
 */
export async function syncEntryTags(
  database: AppDatabase,
  entryId: string,
  names: string[],
  { respectLock = true }: { respectLock?: boolean } = {},
): Promise<void> {
  const normalized = normalizeTags(names);
  const unlocked = respectLock
    ? sql`EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = ${entryId} AND e.tags_locked_at IS NULL
      )`
    : sql`true`;

  if (normalized.length > 0) {
    await database
      .insert(tags)
      .values(normalized.map((name) => ({ name })))
      .onConflictDoNothing();
    await database.execute(sql`
      INSERT INTO entry_tags (entry_id, tag_id)
      SELECT ${entryId}, t.id FROM tags t
      WHERE t.name = ANY(${sql.param(normalized)}) AND ${unlocked}
      ON CONFLICT DO NOTHING
    `);
  }

  const keep =
    normalized.length > 0
      ? sql`AND entry_tags.tag_id NOT IN (
          SELECT t.id FROM tags t WHERE t.name = ANY(${sql.param(normalized)})
        )`
      : sql``;

  await database.execute(sql`
    DELETE FROM entry_tags
    WHERE entry_tags.entry_id = ${entryId}
      ${keep}
      AND ${unlocked}
  `);
}
