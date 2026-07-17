import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDashboardEntriesPage } from '@/lib/dashboard-data';
import { createTestDb } from './helpers/test-db';
import { seedEntry } from './helpers/test-entries';

test('dashboard cursor pagination is stable for entries on the same date', async () => {
  const fixture = await createTestDb();
  try {
    const createdAt = new Date('2024-01-03T00:00:00.000Z');
    for (let index = 0; index < 23; index += 1) {
      await seedEntry(fixture.db, {
        id: `entry-${String(index).padStart(2, '0')}`,
        content: `content ${index}`,
        createdAt,
      });
    }
    const first = await loadDashboardEntriesPage({ limit: 10 }, fixture.db);
    const second = await loadDashboardEntriesPage({ limit: 10, cursor: first.pageInfo.nextCursor ?? undefined }, fixture.db);
    assert.equal(first.items.length, 10);
    assert.equal(second.items.length, 10);
    assert.equal(new Set([...first.items, ...second.items].map((entry) => entry.id)).size, 20);
    assert.equal(first.pageInfo.hasMore, true);
  } finally {
    await fixture.cleanup();
  }
});

test('dashboard search treats SQL wildcard characters literally', async () => {
  const fixture = await createTestDb();
  try {
    await seedEntry(fixture.db, { id: 'literal', content: 'progress is 100% complete' });
    await seedEntry(fixture.db, { id: 'other', content: 'progress is complete' });
    const page = await loadDashboardEntriesPage({ q: '100%' }, fixture.db);
    assert.deepEqual(page.items.map((entry) => entry.id), ['literal']);
  } finally {
    await fixture.cleanup();
  }
});
