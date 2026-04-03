import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { ensureDatabaseDirectory, migrateLegacyDatabase, resolveDatabasePath } from "./config";

const databasePath = resolveDatabasePath();
ensureDatabaseDirectory(databasePath);
migrateLegacyDatabase(databasePath);

const sqlite = new Database(databasePath);
export const db = drizzle(sqlite, { schema });
