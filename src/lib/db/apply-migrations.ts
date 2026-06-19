import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import { ensureDatabaseDirectory, migrateLegacyDatabase, resolveDatabasePath } from "./config";
import { normalizeEntryCreatedAtDates } from "./entry-date-migration";

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function" && existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databasePath = resolveDatabasePath();
ensureDatabaseDirectory(databasePath);
migrateLegacyDatabase(databasePath);

if (databasePath === ":memory:") {
  console.log("[MIGRATE] Skipping persistent data migrations for in-memory SQLite.");
} else {
  const sqlite = new Database(databasePath);

  try {
    const entryDateResult = normalizeEntryCreatedAtDates(sqlite);
    console.log(`[MIGRATE] Normalized ${entryDateResult.changed} entry dates to day precision.`);
  } finally {
    sqlite.close();
  }
}
