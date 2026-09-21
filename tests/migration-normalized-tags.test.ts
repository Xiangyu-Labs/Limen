import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIGRATIONS_DIR = resolve(process.cwd(), 'drizzle');
const BACKFILL_MIGRATION = '0005_neat_fantastic_four.sql';

function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function statements(file: string) {
  return readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8')
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

/**
 * Replays the real migrations up to and including the tag backfill, seeding
 * legacy rows in between so the backfill sees them. Mirrors the approach in
 * tests/migration-recorded-at.test.ts.
 */
async function migrateWithLegacyRows(
  rows: Array<{ id: string; tags: string | null }>,
) {
  const client = new PGlite();
  const files = migrationFiles();
  const backfillIndex = files.indexOf(BACKFILL_MIGRATION);
  assert.notEqual(backfillIndex, -1, `${BACKFILL_MIGRATION} is missing`);

  for (const file of files.slice(0, backfillIndex)) {
    for (const statement of statements(file)) await client.exec(statement);
  }

  for (const row of rows) {
    await client.query(
      `INSERT INTO entries (id, content, tags, created_at, recorded_at, updated_at)
       VALUES ($1, $2, $3, DATE '2026-01-01', now(), now())`,
      [row.id, `content ${row.id}`, row.tags],
    );
  }

  for (const statement of statements(files[backfillIndex])) {
    await client.exec(statement);
  }
  return client;
}

async function tagsOf(client: PGlite, entryId: string) {
  const result = await client.query<{ name: string }>(
    `SELECT t.name FROM entry_tags et
     JOIN tags t ON t.id = et.tag_id
     WHERE et.entry_id = $1 ORDER BY t.name`,
    [entryId],
  );
  return result.rows.map((row) => row.name);
}

test('the backfill moves legacy json tags into the new tables', async () => {
  const client = await migrateWithLegacyRows([
    { id: 'a', tags: JSON.stringify(['alpha', 'beta']) },
    { id: 'b', tags: JSON.stringify(['beta']) },
  ]);
  try {
    assert.deepEqual(await tagsOf(client, 'a'), ['alpha', 'beta']);
    assert.deepEqual(await tagsOf(client, 'b'), ['beta']);
    // A shared tag is one row, referenced twice.
    const distinct = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM tags`,
    );
    assert.equal(distinct.rows[0].count, 2);
  } finally {
    await client.close();
  }
});

test('corrupt legacy tag values are skipped instead of aborting the migration', async () => {
  // parseStoredTags has always tolerated these; the migration must too, or a
  // single bad row takes down every deploy and every test run.
  const client = await migrateWithLegacyRows([
    { id: 'null-tags', tags: null },
    { id: 'empty', tags: '' },
    { id: 'broken', tags: '{broken' },
    { id: 'not-array', tags: '"just a string"' },
    { id: 'object', tags: '{"a":1}' },
    { id: 'good', tags: JSON.stringify(['survivor']) },
  ]);
  try {
    for (const id of ['null-tags', 'empty', 'broken', 'not-array', 'object']) {
      assert.deepEqual(await tagsOf(client, id), [], id);
    }
    assert.deepEqual(await tagsOf(client, 'good'), ['survivor']);
  } finally {
    await client.close();
  }
});

test('the backfill normalizes exactly like normalizeTags', async () => {
  const client = await migrateWithLegacyRows([
    { id: 'messy', tags: JSON.stringify(['  spaced  ', '', 'dup', 'dup']) },
    { id: 'long', tags: JSON.stringify(['x'.repeat(60)]) },
    {
      id: 'many',
      tags: JSON.stringify(Array.from({ length: 12 }, (_, i) => `t${i}`)),
    },
  ]);
  try {
    assert.deepEqual(await tagsOf(client, 'messy'), ['dup', 'spaced']);
    assert.deepEqual(await tagsOf(client, 'long'), ['x'.repeat(50)]);
    assert.equal((await tagsOf(client, 'many')).length, 10);
  } finally {
    await client.close();
  }
});

test('re-running the backfill changes nothing', async () => {
  const client = await migrateWithLegacyRows([
    { id: 'a', tags: JSON.stringify(['alpha', 'beta']) },
  ]);
  try {
    const before = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM entry_tags`,
    );
    for (const statement of statements(BACKFILL_MIGRATION)) {
      await client.exec(statement).catch((error) => {
        // The DDL half will fail on a second run; only the DML must be idempotent.
        if (!/already exists/.test(String(error))) throw error;
      });
    }
    const after = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM entry_tags`,
    );
    assert.equal(after.rows[0].count, before.rows[0].count);
  } finally {
    await client.close();
  }
});
