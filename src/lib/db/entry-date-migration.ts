import type Database from "better-sqlite3";

type MigrationResult = {
  changed: number;
};

function hasEntriesCreatedAtColumn(sqlite: Database.Database) {
  const entriesTable = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'entries'")
    .get();

  if (!entriesTable) {
    return false;
  }

  return sqlite
    .prepare("PRAGMA table_info(entries)")
    .all()
    .some((column) => {
      return typeof column === "object" && column !== null && "name" in column && column.name === "created_at";
    });
}

export function normalizeEntryCreatedAtDates(sqlite: Database.Database): MigrationResult {
  if (!hasEntriesCreatedAtColumn(sqlite)) {
    return { changed: 0 };
  }

  const result = sqlite.prepare(`
    UPDATE entries
    SET created_at = CAST(strftime('%s', date(created_at, 'unixepoch')) AS INTEGER)
    WHERE created_at IS NOT NULL
      AND created_at != CAST(strftime('%s', date(created_at, 'unixepoch')) AS INTEGER)
  `).run();

  return { changed: result.changes };
}
