import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createTestDb } from './helpers/test-db';
import { entries, settings } from '@/lib/db/schema';
import {
  createSettingsActions,
  DEFAULT_SETTINGS,
  parseSettingsFormData,
  readSettings,
  SETTINGS_OWNER_ID,
} from '@/lib/settings-core';
import { formatDateInTimeZone } from '@/lib/entry-date';

function migration(name: string) {
  return readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8');
}

function validForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = {
    theme: 'dark',
    timeZone: 'Asia/Shanghai',
    editorFontSize: 'large',
    defaultExportFormat: 'json',
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test('settings migration preserves entries and defaults without a row', async () => {
  const fixture = await createTestDb();
  try {
    await fixture.db.insert(entries).values({
      id: 'existing',
      content: 'kept',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      recordedAt: new Date('2026-01-01T01:00:00Z'),
    });
    assert.deepEqual(await readSettings(fixture.db as never), DEFAULT_SETTINGS);
    assert.equal((await fixture.db.select().from(entries))[0].content, 'kept');
  } finally {
    await fixture.cleanup();
  }
});

test('settings migration leaves entries from an older database unchanged', async () => {
  const client = new PGlite();
  try {
    await client.exec(migration('0000_pale_bloodstrike.sql'));
    await client.exec(migration('0001_silly_the_enforcers.sql'));
    await client.exec(migration('0002_lush_beast.sql'));
    await client.query(
      `insert into entries (id, content, created_at, recorded_at)
       values ('before-settings', 'unchanged', '2026-07-26', '2026-07-26T08:00:00Z')`,
    );
    await client.exec(migration('0003_soft_lady_ursula.sql'));
    const entryResult = await client.query<{ content: string }>(
      `select content from entries where id = 'before-settings'`,
    );
    const tableResult = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name = 'settings'`,
    );
    assert.equal(entryResult.rows[0].content, 'unchanged');
    assert.equal(tableResult.rows[0].table_name, 'settings');
  } finally {
    await client.close();
  }
});

test('settings action authorizes and upserts one owner row', async () => {
  const fixture = await createTestDb();
  let authorizations = 0;
  const revalidated: string[] = [];
  try {
    const action = createSettingsActions({
      db: fixture.db as never,
      authorize: () => {
        authorizations += 1;
      },
      revalidatePath: (path) => {
        revalidated.push(path);
      },
    }).saveSettings;
    assert.equal((await action(undefined, validForm())).ok, true);
    assert.equal(
      (await action(undefined, validForm({ theme: 'light' }))).ok,
      true,
    );
    const rows = await fixture.db.select().from(settings);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].ownerId, SETTINGS_OWNER_ID);
    assert.equal(rows[0].theme, 'light');
    assert.equal(authorizations, 2);
    assert.deepEqual(revalidated, ['/', '/settings', '/', '/settings']);
  } finally {
    await fixture.cleanup();
  }
});

test('settings validation rejects invalid enums and time zones', () => {
  assert.equal(parseSettingsFormData(validForm({ theme: 'blue' })), null);
  assert.equal(
    parseSettingsFormData(validForm({ editorFontSize: 'huge' })),
    null,
  );
  assert.equal(
    parseSettingsFormData(validForm({ defaultExportFormat: 'xml' })),
    null,
  );
  assert.equal(
    parseSettingsFormData(validForm({ timeZone: 'Shanghai' })),
    null,
  );
});

test('settings action stops at the authentication boundary', async () => {
  const fixture = await createTestDb();
  try {
    const action = createSettingsActions({
      db: fixture.db as never,
      authorize: () => {
        throw new Error('Unauthorized');
      },
      revalidatePath: () => {},
    }).saveSettings;
    await assert.rejects(action(undefined, validForm()), /Unauthorized/);
    assert.equal((await fixture.db.select().from(settings)).length, 0);
  } finally {
    await fixture.cleanup();
  }
});

test('Asia/Shanghai date crosses the UTC day boundary', () => {
  const now = new Date('2026-07-27T16:30:00.000Z');
  assert.equal(formatDateInTimeZone(now, 'UTC'), '2026-07-27');
  assert.equal(formatDateInTimeZone(now, 'Asia/Shanghai'), '2026-07-28');
});
