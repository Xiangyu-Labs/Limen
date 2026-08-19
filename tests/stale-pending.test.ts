import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { recoverStalePendingEntries } from '@/lib/ai/stale-pending';
import { entries } from '@/lib/db/schema';
import { createTestDb } from './helpers/test-db';

test('pending recovery keeps 9:59 and fails entries at the 10:00 boundary', async () => {
  const fixture = await createTestDb();
  const now = new Date('2026-08-19T12:00:00.000Z');
  try {
    await fixture.db.insert(entries).values([
      {
        id: 'fresh',
        content: 'fresh',
        aiStatus: 'pending',
        createdAt: now,
        updatedAt: new Date('2026-08-19T11:50:01.000Z'),
      },
      {
        id: 'stale',
        content: 'stale',
        aiStatus: 'pending',
        createdAt: now,
        updatedAt: new Date('2026-08-19T11:50:00.000Z'),
      },
      {
        id: 'done',
        content: 'done',
        aiStatus: 'done',
        createdAt: now,
        updatedAt: new Date('2026-08-19T11:00:00.000Z'),
      },
    ]);

    assert.deepEqual(await recoverStalePendingEntries(fixture.db, now), [
      { id: 'stale' },
    ]);
    for (const [id, expected] of [
      ['fresh', 'pending'],
      ['stale', 'failed'],
      ['done', 'done'],
    ] as const) {
      const row = await fixture.db.query.entries.findFirst({
        columns: { aiStatus: true },
        where: eq(entries.id, id),
      });
      assert.equal(row?.aiStatus, expected);
    }
  } finally {
    await fixture.cleanup();
  }
});
