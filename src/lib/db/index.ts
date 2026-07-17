import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
export const db = drizzle(databaseUrl, { schema });
