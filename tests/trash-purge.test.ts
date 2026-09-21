import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { entries, tags } from '@/lib/db/schema';
import {
  TRASH_RETENTION_MS,
  daysUntilPurge,
  purgeExpiredEntries,
} from '@/lib/trash/purge';
import { createTestDb } from './helpers/test-db';
import { seedEntry } from './helpers/test-entries';

const NOW = new Date('2026-10-01T12:00:00.000Z');

test('retention expires at exactly 30 days, not a millisecond earlier', async () => {
  const fixture = await createTestDb();
  try {
    for (const [id, offset] of [
      ['expired', TRASH_RETENTION_MS],
      ['surviving', TRASH_RETENTION_MS - 1],
    ] as const) {
      await seedEntry(fixture.db, { id, content: id });
      await fixture.db
        .update(entries)
        .set({ deletedAt: new Date(NOW.getTime() - offset) })
        .where(eq(entries.id, id));
    }
    await seedEntry(fixture.db, { id: 'active', content: 'active' });

    const result = await purgeExpiredEntries(fixture.db, NOW);
    assert.deepEqual(result.purged, ['expired']);

    const remaining = await fixture.db.select({ id: entries.id }).from(entries);
    assert.deepEqual(remaining.map((row) => row.id).sort(), [
      'active',
      'surviving',
    ]);
  } finally {
    await fixture.cleanup();
  }
});

test('purging an entry takes its entry_tags with it', async () => {
  const fixture = await createTestDb();
  try {
    await seedEntry(fixture.db, { id: 'doomed', tags: ['solo'] });
    await fixture.db
      .update(entries)
      .set({ deletedAt: new Date(NOW.getTime() - TRASH_RETENTION_MS) })
      .where(eq(entries.id, 'doomed'));

    const result = await purgeExpiredEntries(fixture.db, NOW);
    assert.deepEqual(result.purged, ['doomed']);
    assert.equal(result.tagsRemoved, 1);
    assert.equal((await fixture.db.select().from(tags)).length, 0);
  } finally {
    await fixture.cleanup();
  }
});

test('a tag held only by a still-trashed entry survives the sweep', async () => {
  const fixture = await createTestDb();
  try {
    // entry_tags rows outlive a soft delete so a restore brings tags back, so
    // this tag is not an orphan and must not be collected.
    await seedEntry(fixture.db, { id: 'recent', tags: ['recoverable'] });
    await fixture.db
      .update(entries)
      .set({ deletedAt: new Date(NOW.getTime() - 1_000) })
      .where(eq(entries.id, 'recent'));

    const result = await purgeExpiredEntries(fixture.db, NOW);
    assert.deepEqual(result.purged, []);
    assert.equal(result.tagsRemoved, 0);
    assert.equal((await fixture.db.select().from(tags)).length, 1);
  } finally {
    await fixture.cleanup();
  }
});

test('the countdown shown in the bin never goes negative', () => {
  const deletedAt = new Date(NOW.getTime() - TRASH_RETENTION_MS + 1);
  assert.equal(daysUntilPurge(deletedAt, NOW), 1);
  assert.equal(daysUntilPurge(new Date(NOW.getTime()), NOW), 30);
  assert.equal(
    daysUntilPurge(new Date(NOW.getTime() - TRASH_RETENTION_MS * 2), NOW),
    0,
  );
});
