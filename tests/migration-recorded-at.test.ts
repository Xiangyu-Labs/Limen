import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

function migration(name: string) {
  return readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8');
}

test('recorded_at migration backfills existing entries before requiring it', async () => {
  const client = new PGlite();
  try {
    await client.exec(migration('0000_pale_bloodstrike.sql'));
    await client.exec(migration('0001_silly_the_enforcers.sql'));
    await client.query(
      `insert into entries (id, content, created_at, updated_at)
       values ('existing', 'kept', '2026-07-24', '2026-07-24T08:30:00Z')`,
    );
    await client.exec(migration('0002_lush_beast.sql'));
    const result = await client.query<{ recorded_at: Date }>(
      `select recorded_at from entries where id = 'existing'`,
    );
    assert.equal(
      new Date(result.rows[0].recorded_at).toISOString(),
      '2026-07-24T08:30:00.000Z',
    );
  } finally {
    await client.close();
  }
});
