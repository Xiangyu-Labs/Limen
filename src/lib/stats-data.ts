import { sql } from 'drizzle-orm';
import type { AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { activeEntries } from '@/lib/db/entry-scope';
import { computeWritingStats, type WritingStats } from '@/lib/stats';

const STREAK_WINDOW_DAYS = 400;

export async function loadWritingStats(
  database: AppDatabase,
  today: string,
): Promise<WritingStats> {
  const [totals] = await database
    .select({
      totalEntries: sql<number>`count(*)::int`,
      totalCharacters: sql<number>`coalesce(sum(char_length(${entries.content})), 0)::int`,
      entriesThisYear: sql<number>`count(*) filter (
        where date_part('year', ${entries.createdAt}) = date_part('year', ${today}::date)
      )::int`,
    })
    .from(entries)
    .where(activeEntries());

  // Bounded: a streak longer than this is not worth a full-table read.
  const dateRows = await database
    .selectDistinct({
      day: sql<string>`to_char(${entries.createdAt}, 'YYYY-MM-DD')`,
    })
    .from(entries)
    .where(
      activeEntries(
        sql`${entries.createdAt} >= ${today}::date - ${STREAK_WINDOW_DAYS}::int`,
      ),
    )
    .orderBy(sql`1 desc`);

  return computeWritingStats(
    {
      totalEntries: totals?.totalEntries ?? 0,
      totalCharacters: totals?.totalCharacters ?? 0,
      entriesThisYear: totals?.entriesThisYear ?? 0,
      entryDates: dateRows.map((row) => row.day),
    },
    today,
  );
}
