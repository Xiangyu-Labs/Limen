import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

test("entry date migration truncates existing created_at timestamps to UTC days", async () => {
  const { normalizeEntryCreatedAtDates } = await import("@/lib/db/entry-date-migration");
  const sqlite = new Database(":memory:");

  try {
    sqlite.exec(`
      CREATE TABLE entries (
        id TEXT PRIMARY KEY NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    sqlite.prepare("INSERT INTO entries (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)").run(
      "with-time",
      "Has a time component",
      Date.parse("2024-01-03T11:45:00.000Z") / 1000,
      Date.parse("2024-01-03T11:45:00.000Z") / 1000,
    );
    sqlite.prepare("INSERT INTO entries (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)").run(
      "already-day",
      "Already normalized",
      Date.parse("2024-01-04T00:00:00.000Z") / 1000,
      Date.parse("2024-01-04T09:30:00.000Z") / 1000,
    );

    const firstRun = normalizeEntryCreatedAtDates(sqlite);

    assert.equal(firstRun.changed, 1);
    assert.deepEqual(
      sqlite.prepare("SELECT id, created_at, updated_at FROM entries ORDER BY id").all(),
      [
        {
          id: "already-day",
          created_at: Date.parse("2024-01-04T00:00:00.000Z") / 1000,
          updated_at: Date.parse("2024-01-04T09:30:00.000Z") / 1000,
        },
        {
          id: "with-time",
          created_at: Date.parse("2024-01-03T00:00:00.000Z") / 1000,
          updated_at: Date.parse("2024-01-03T11:45:00.000Z") / 1000,
        },
      ],
    );

    const secondRun = normalizeEntryCreatedAtDates(sqlite);
    assert.equal(secondRun.changed, 0);
  } finally {
    sqlite.close();
  }
});

test("entry date migration is a no-op before the entries table exists", async () => {
  const { normalizeEntryCreatedAtDates } = await import("@/lib/db/entry-date-migration");
  const sqlite = new Database(":memory:");

  try {
    assert.deepEqual(normalizeEntryCreatedAtDates(sqlite), { changed: 0 });
  } finally {
    sqlite.close();
  }
});
