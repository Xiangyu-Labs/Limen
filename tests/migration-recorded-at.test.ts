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

test('pending recovery migration backfills updated_at before requiring it', async () => {
  const client = new PGlite();
  try {
    for (const name of [
      '0000_pale_bloodstrike.sql',
      '0001_silly_the_enforcers.sql',
      '0002_lush_beast.sql',
      '0003_soft_lady_ursula.sql',
    ]) {
      await client.exec(migration(name));
    }
    await client.query(
      `insert into entries (id, content, created_at, updated_at)
       values ('missing-update', 'kept', '2026-07-24', null)`,
    );
    await client.exec(migration('0004_pending_recovery.sql'));
    const result = await client.query<{ updated_at: Date }>(
      `select updated_at from entries where id = 'missing-update'`,
    );
    assert.ok(result.rows[0].updated_at);
  } finally {
    await client.close();
  }
});
