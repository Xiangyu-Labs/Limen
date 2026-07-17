import { inArray } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { normalizeToUtcDay } from "@/lib/entry-date";

export type LegacyEntryRow = {
  id: string;
  content: string;
  title: string | null;
  summary: string | null;
  tags: string | null;
  source: string | null;
  ai_status: string | null;
  created_at: number;
  updated_at: number | null;
};

type StoredEntry = typeof entries.$inferSelect;
type EntryValue = StoredEntry;

const IMPORT_BATCH_SIZE = 100;

function legacyTimestamp(value: number | null, field: string) {
  if (value === null) return null;
  if (!Number.isFinite(value)) throw new Error(`Invalid ${field} timestamp`);
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${field} timestamp`);
  return date;
}

export function convertLegacyEntry(row: LegacyEntryRow): EntryValue {
  if (!row.id || typeof row.id !== "string") throw new Error("Legacy entry is missing an id");
  if (typeof row.content !== "string") throw new Error(`Legacy entry ${row.id} has invalid content`);
  const createdAt = legacyTimestamp(row.created_at, "created_at");
  if (!createdAt) throw new Error(`Legacy entry ${row.id} is missing created_at`);

  return {
    id: row.id,
    content: row.content,
    title: row.title,
    summary: row.summary,
    tags: row.tags,
    source: row.source,
    aiStatus: row.ai_status,
    createdAt: normalizeToUtcDay(createdAt),
    updatedAt: legacyTimestamp(row.updated_at, "updated_at"),
  };
}

function datesEqual(left: Date | null, right: Date | null) {
  return left?.getTime() === right?.getTime();
}

export function entriesMatch(expected: EntryValue, actual: StoredEntry) {
  return expected.id === actual.id
    && expected.content === actual.content
    && expected.title === actual.title
    && expected.summary === actual.summary
    && expected.tags === actual.tags
    && expected.source === actual.source
    && expected.aiStatus === actual.aiStatus
    && datesEqual(expected.createdAt, actual.createdAt)
    && datesEqual(expected.updatedAt, actual.updatedAt);
}

async function loadEntriesById(database: AppDatabase, ids: string[]) {
  const rows: StoredEntry[] = [];
  for (let index = 0; index < ids.length; index += IMPORT_BATCH_SIZE) {
    rows.push(...await database.query.entries.findMany({
      where: inArray(entries.id, ids.slice(index, index + IMPORT_BATCH_SIZE)),
    }));
  }
  return rows;
}

export async function importLegacyEntries(rows: LegacyEntryRow[], database: AppDatabase) {
  const converted = rows.map(convertLegacyEntry);
  const ids = converted.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) throw new Error("Legacy database contains duplicate entry ids");

  const existing = new Map((await loadEntriesById(database, ids)).map((entry) => [entry.id, entry]));
  const conflicts = converted.filter((entry) => {
    const target = existing.get(entry.id);
    return target ? !entriesMatch(entry, target) : false;
  });
  if (conflicts.length > 0) {
    throw new Error(`Import aborted: conflicting target entries: ${conflicts.map((entry) => entry.id).join(", ")}`);
  }

  const missing = converted.filter((entry) => !existing.has(entry.id));
  for (let index = 0; index < missing.length; index += IMPORT_BATCH_SIZE) {
    await database.insert(entries)
      .values(missing.slice(index, index + IMPORT_BATCH_SIZE))
      .onConflictDoNothing({ target: entries.id });
  }

  const imported = new Map((await loadEntriesById(database, ids)).map((entry) => [entry.id, entry]));
  const invalid = converted.filter((entry) => {
    const target = imported.get(entry.id);
    return !target || !entriesMatch(entry, target);
  });
  if (invalid.length > 0) {
    throw new Error(`Import verification failed for entries: ${invalid.map((entry) => entry.id).join(", ")}`);
  }

  return { total: converted.length, inserted: missing.length, skipped: converted.length - missing.length };
}
