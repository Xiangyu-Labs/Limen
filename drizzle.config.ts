import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { ensureDatabaseDirectory, migrateLegacyDatabase, resolveDatabasePath } from "./src/lib/db/config";

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function" && existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databasePath = resolveDatabasePath();
ensureDatabaseDirectory(databasePath);
migrateLegacyDatabase(databasePath);

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: databasePath,
  },
});
