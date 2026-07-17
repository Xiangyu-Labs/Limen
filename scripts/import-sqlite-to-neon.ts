import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { LegacyEntryRow } from "../src/lib/db/sqlite-import";

function sourcePathFromArgs(args: string[]) {
  const value = args[1];
  if (args.length !== 2 || args[0] !== "--source" || !value) {
    throw new Error("Usage: npm run db:import-sqlite -- --source /absolute/path/to/limen.db");
  }
  return resolve(value);
}

async function main() {
  const sourcePath = sourcePathFromArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    const envFile = [".env.local", ".env"].find((candidate) => existsSync(candidate));
    if (envFile) process.loadEnvFile(envFile);
  }

  const [{ db }, { importLegacyEntries }] = await Promise.all([
    import("../src/lib/db/index"),
    import("../src/lib/db/sqlite-import"),
  ]);

  const sqlite = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    const rows = sqlite.prepare(`
      SELECT id, content, title, summary, tags, source, ai_status, created_at, updated_at
      FROM entries
      ORDER BY id
    `).all() as LegacyEntryRow[];
    const result = await importLegacyEntries(rows, db);
    console.log(`Verified ${result.total} entries (${result.inserted} inserted, ${result.skipped} already present).`);
  } finally {
    sqlite.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
