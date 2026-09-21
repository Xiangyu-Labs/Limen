import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupTimelineEntriesByPeriod,
  splitHighlightSegments,
} from '@/lib/timeline';
import type { TimelineEntry } from '@/lib/dashboard-data';
import {
  buildTimelineEntriesPage,
  loadDashboardEntriesPage,
} from '@/lib/dashboard-data';
import { createTestDb } from './helpers/test-db';
import { seedEntry } from './helpers/test-entries';

function entry(id: string, createdAt: string): TimelineEntry {
  return {
    id,
    displayTitle: id,
    displaySummary: '',
    statusLabel: null,
    statusTone: 'muted',
    tags: [],
    createdAt: new Date(`${createdAt}T00:00:00.000Z`).toISOString(),
    isPending: false,
  };
}

test('the timeline is grouped by month and always names the year', () => {
  // Without this, a journal spanning years shows a run of "03-14" with no way
  // to tell 2024 from 2026.
  const sections = groupTimelineEntriesByPeriod([
    entry('a', '2026-03-14'),
    entry('b', '2026-03-02'),
    entry('c', '2026-02-28'),
    entry('d', '2024-03-01'),
  ]);
  assert.deepEqual(
    sections.map((section) => section.label),
    ['2026 年 3 月', '2026 年 2 月', '2024 年 3 月'],
  );
  assert.deepEqual(
    sections[0].entries.map((item) => item.id),
    ['a', 'b'],
  );
  assert.deepEqual(groupTimelineEntriesByPeriod([]), []);
});

test('the same month in different years does not merge', () => {
  const sections = groupTimelineEntriesByPeriod([
    entry('a', '2026-03-01'),
    entry('b', '2025-03-01'),
  ]);
  assert.equal(sections.length, 2);
});

test('search terms are split for highlighting, case-insensitively', () => {
  assert.deepEqual(splitHighlightSegments('Rainy Rain', 'rain'), [
    { text: 'Rain', matched: true },
    { text: 'y ', matched: false },
    { text: 'Rain', matched: true },
  ]);
  assert.deepEqual(splitHighlightSegments('nothing', 'zzz'), [
    { text: 'nothing', matched: false },
  ]);
  assert.deepEqual(splitHighlightSegments('plain'), [
    { text: 'plain', matched: false },
  ]);
  assert.deepEqual(splitHighlightSegments('plain', '   '), [
    { text: 'plain', matched: false },
  ]);
});

test('a regex-special query is matched literally', () => {
  assert.deepEqual(splitHighlightSegments('a.b axb', '.'), [
    { text: 'a', matched: false },
    { text: '.', matched: true },
    { text: 'b axb', matched: false },
  ]);
});

test('the preview shows the text around a deep match, not the summary', async () => {
  const fixture = await createTestDb();
  try {
    await seedEntry(fixture.db, {
      id: 'deep',
      summary: 'A summary that never mentions the term',
      content: `${'x'.repeat(3000)} needle ${'y'.repeat(3000)}`,
      aiStatus: 'done',
    });

    const searched = buildTimelineEntriesPage(
      await loadDashboardEntriesPage({ q: 'needle' }, fixture.db),
    );
    assert.match(searched.items[0].displaySummary, /needle/);
    // Truncated from the left, so the reader knows there is more above.
    assert.match(searched.items[0].displaySummary, /^…/);

    // Without a query the summary is still what shows.
    const plain = buildTimelineEntriesPage(
      await loadDashboardEntriesPage({}, fixture.db),
    );
    assert.match(plain.items[0].displaySummary, /^A summary/);
  } finally {
    await fixture.cleanup();
  }
});

test('a match in the title still falls back to the summary preview', async () => {
  const fixture = await createTestDb();
  try {
    await seedEntry(fixture.db, {
      id: 'titled',
      title: 'needle in the title',
      summary: 'A useful summary',
      content: 'body without the term',
      aiStatus: 'done',
    });
    const page = buildTimelineEntriesPage(
      await loadDashboardEntriesPage({ q: 'needle' }, fixture.db),
    );
    assert.equal(page.items[0].displaySummary, 'A useful summary');
  } finally {
    await fixture.cleanup();
  }
});
