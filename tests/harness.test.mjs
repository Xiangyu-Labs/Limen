import test from "node:test";
import assert from "node:assert/strict";

test("test harness can create and clean up a temp database", async () => {
  const { createTestDb } = await import("./helpers/test-db.ts");
  const { seedEntry } = await import("./helpers/test-entries.ts");

  const fixture = createTestDb();
  try {
    const seeded = await seedEntry(fixture.db, { id: "harness-entry" });
    assert.equal(seeded.id, "harness-entry");

    const rows = fixture.sqlite.prepare("SELECT COUNT(*) AS count FROM entries").get();
    assert.equal(rows.count, 1);
  } finally {
    fixture.cleanup();
  }
});
