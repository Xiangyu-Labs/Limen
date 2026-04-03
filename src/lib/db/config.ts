import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_DATABASE_URL = "sqlite:///./data/limen.db";
const SQLITE_PREFIX = "sqlite:";
const SQLITE_MEMORY_URLS = new Set(["sqlite::memory:", "sqlite://:memory:"]);

export function getDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  const value = databaseUrl?.trim();
  return value && value.length > 0 ? value : DEFAULT_DATABASE_URL;
}

export function resolveDatabasePath(databaseUrl = process.env.DATABASE_URL, cwd = process.cwd()) {
  const value = getDatabaseUrl(databaseUrl);

  if (SQLITE_MEMORY_URLS.has(value)) {
    return ":memory:";
  }

  if (!value.startsWith(SQLITE_PREFIX)) {
    throw new Error(`Unsupported DATABASE_URL: ${value}. Only sqlite URLs are supported.`);
  }

  const location = decodeURIComponent(value.slice(SQLITE_PREFIX.length));
  if (!location.startsWith("///")) {
    throw new Error(
      `Unsupported DATABASE_URL: ${value}. Expected sqlite:///./relative.db or sqlite:////absolute.db.`,
    );
  }

  const filePath = location.slice(3);
  if (!filePath) {
    throw new Error(`Unsupported DATABASE_URL: ${value}. Missing SQLite file path.`);
  }

  return resolve(cwd, filePath);
}

export function ensureDatabaseDirectory(filePath: string) {
  if (filePath === ":memory:") {
    return;
  }

  mkdirSync(dirname(filePath), { recursive: true });
}

export function migrateLegacyDatabase(targetPath: string, cwd = process.cwd()) {
  if (targetPath === ":memory:" || existsSync(targetPath)) {
    return;
  }

  const legacyPath = resolve(cwd, "limen.db");
  if (legacyPath === targetPath || !existsSync(legacyPath)) {
    return;
  }

  copyFileSync(legacyPath, targetPath);

  for (const suffix of ["-wal", "-shm"]) {
    const legacySidecar = `${legacyPath}${suffix}`;
    if (existsSync(legacySidecar)) {
      copyFileSync(legacySidecar, `${targetPath}${suffix}`);
    }
  }
}
