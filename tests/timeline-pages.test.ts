import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTimelinePages } from '@/lib/timeline';
import type { TimelineEntriesPage } from '@/lib/dashboard-data';

function page(ids: string[]): TimelineEntriesPage {
  return {
    items: ids.map((id) => ({
      id,
      displayTitle: id,
      displaySummary: id,
      statusLabel: null,
      statusTone: 'muted',
      tags: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      isPending: false,
    })),
    pageInfo: { hasMore: false, nextCursor: null, limit: 20 },
  };
}

test('timeline page merging preserves order and removes duplicates', () => {
  assert.deepEqual(mergeTimelinePages([page(['3', '2']), page(['2', '1'])]).map((entry) => entry.id), ['3', '2', '1']);
});
