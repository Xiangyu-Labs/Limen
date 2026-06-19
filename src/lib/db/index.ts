import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { ensureDatabaseDirectory, migrateLegacyDatabase, resolveDatabasePath } from "./config";
import { normalizeEntryCreatedAtDates } from "./entry-date-migration";

const databasePath = resolveDatabasePath();
ensureDatabaseDirectory(databasePath);
migrateLegacyDatabase(databasePath);

const sqlite = new Database(databasePath);
normalizeEntryCreatedAtDates(sqlite);
export const db = drizzle(sqlite, { schema });
