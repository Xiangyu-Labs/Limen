import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

export function createTestDb() {
  const dir = mkdtempSync(join(tmpdir(), "limen-test-"));
  const file = join(dir, `${randomUUID()}.db`);
  const sqlite = new Database(file);
  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      title TEXT,
      summary TEXT,
      tags TEXT,
      source TEXT DEFAULT 'web',
      ai_status TEXT DEFAULT 'pending',
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  return {
    db,
    sqlite,
    file,
    cleanup() {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
