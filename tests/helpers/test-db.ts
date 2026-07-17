import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { resolve } from "node:path";
import * as schema from "@/lib/db/schema";

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });

  return {
    db,
    client,
    async cleanup() {
      await client.close();
    },
  };
}
