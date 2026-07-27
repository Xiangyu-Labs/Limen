import { and, asc, gte, lte } from 'drizzle-orm';
import type { AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import type { ExportFilters } from '@/lib/export-core';

export async function loadExportEntries(
  database: AppDatabase,
  filters: ExportFilters,
) {
  const conditions = [];
  if (filters.from)
    conditions.push(
      gte(entries.createdAt, new Date(`${filters.from}T00:00:00Z`)),
    );
  if (filters.to)
    conditions.push(
      lte(entries.createdAt, new Date(`${filters.to}T00:00:00Z`)),
    );
  return database
    .select()
    .from(entries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(entries.createdAt), asc(entries.recordedAt), asc(entries.id));
}
