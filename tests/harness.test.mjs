import test from "node:test";
import assert from "node:assert/strict";

test("test harness can create and clean up a temp database", async () => {
  const { createTestDb } = await import("./helpers/test-db.ts");
  const { seedEntry } = await import("./helpers/test-entries.ts");

  const fixture = await createTestDb();
  try {
    const seeded = await seedEntry(fixture.db, { id: "harness-entry" });
    assert.equal(seeded.id, "harness-entry");

    const rows = await fixture.client.query("SELECT COUNT(*)::int AS count FROM entries");
    assert.equal(rows.rows[0].count, 1);
  } finally {
    await fixture.cleanup();
  }
});
