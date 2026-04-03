import { entries } from "@/lib/db/schema";

type TestDb = {
  insert: (table: typeof entries) => {
    values: (value: typeof entries.$inferInsert) => Promise<unknown>;
  };
};

export async function seedEntry(
  db: TestDb,
  value: Partial<typeof entries.$inferInsert> = {},
) {
  const now = new Date();
  const entry: typeof entries.$inferInsert = {
    id: value.id ?? "entry-1",
    content: value.content ?? "Seeded entry content",
    title: value.title ?? null,
    summary: value.summary ?? null,
    tags: value.tags ?? null,
    source: value.source ?? "web",
    aiStatus: value.aiStatus ?? "pending",
    createdAt: value.createdAt ?? now,
    updatedAt: value.updatedAt ?? now,
  };

  await db.insert(entries).values(entry);
  return entry;
}
