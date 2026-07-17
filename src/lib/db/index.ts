import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolve } from "node:path";
import * as schema from "./schema";
import { ensureDatabaseDirectory, migrateLegacyDatabase, resolveDatabasePath } from "./config";

const databasePath = resolveDatabasePath();
ensureDatabaseDirectory(databasePath);
migrateLegacyDatabase(databasePath);

const sqlite = new Database(databasePath);
export const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
