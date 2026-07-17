import test from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { entries } from "@/lib/db/schema";
import { importLegacyEntries, type LegacyEntryRow } from "@/lib/db/sqlite-import";
import { createTestDb } from "./helpers/test-db";

function legacyEntry(overrides: Partial<LegacyEntryRow> = {}): LegacyEntryRow {
  return {
    id: "legacy-1",
    content: "Imported diary entry",
    title: null,
    summary: null,
    tags: null,
    source: "web",
    ai_status: "pending",
    created_at: Date.parse("2024-02-03T18:30:00.000Z") / 1_000,
    updated_at: null,
    ...overrides,
  };
}

test("SQLite entries import with UTC day conversion and nullable fields", async () => {
  const fixture = await createTestDb();
  try {
    const result = await importLegacyEntries([legacyEntry()], fixture.db);
    assert.deepEqual(result, { total: 1, inserted: 1, skipped: 0 });

    const row = await fixture.db.query.entries.findFirst({ where: eq(entries.id, "legacy-1") });
    assert.equal(row?.createdAt.toISOString(), "2024-02-03T00:00:00.000Z");
    assert.equal(row?.updatedAt, null);
    assert.equal(row?.title, null);
    assert.equal(row?.tags, null);
  } finally {
    await fixture.cleanup();
  }
});

test("SQLite import is idempotent for identical entries", async () => {
  const fixture = await createTestDb();
  try {
    const source = [legacyEntry({ updated_at: Date.parse("2024-02-04T01:02:03.000Z") / 1_000 })];
    await importLegacyEntries(source, fixture.db);
    const repeated = await importLegacyEntries(source, fixture.db);
    assert.deepEqual(repeated, { total: 1, inserted: 0, skipped: 1 });
  } finally {
    await fixture.cleanup();
  }
});

test("SQLite import rejects conflicts before inserting any missing entries", async () => {
  const fixture = await createTestDb();
  try {
    await fixture.db.insert(entries).values({
      id: "legacy-1",
      content: "Cloud version",
      createdAt: new Date("2024-02-03T00:00:00.000Z"),
    });

    await assert.rejects(
      () => importLegacyEntries([legacyEntry(), legacyEntry({ id: "legacy-2" })], fixture.db),
      /conflicting target entries: legacy-1/,
    );
    assert.equal(await fixture.db.$count(entries), 1);
  } finally {
    await fixture.cleanup();
  }
});
