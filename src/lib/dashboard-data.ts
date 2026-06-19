import { desc, like, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';

export type DashboardEntry = typeof entries.$inferSelect;

export async function loadDashboardEntries(q?: string): Promise<DashboardEntry[]> {
  if (q) {
    return db.select().from(entries)
      .where(or(
        like(entries.content, `%${q}%`),
        like(entries.title, `%${q}%`),
        like(entries.summary, `%${q}%`)
      ))
      .orderBy(desc(entries.createdAt));
  }

  return db.select().from(entries).orderBy(desc(entries.createdAt));
}
