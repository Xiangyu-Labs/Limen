import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseTimelinePosition,
  serializeTimelinePosition,
  timelineStateKey,
} from '@/lib/timeline/scroll-restore';

test('the saved position is keyed per filter', () => {
  assert.notEqual(
    timelineStateKey('rain'),
    timelineStateKey(undefined, 'rain'),
  );
  assert.equal(timelineStateKey(), timelineStateKey(undefined, undefined));
  assert.match(timelineStateKey('a', 'b'), /a\|b$/);
});

test('a saved position round-trips', () => {
  const position = { size: 4, offset: 1234 };
  assert.deepEqual(
    parseTimelinePosition(serializeTimelinePosition(position)),
    position,
  );
});

test('a corrupt or hostile position cannot make the page fetch forever', () => {
  assert.equal(parseTimelinePosition(null), null);
  assert.equal(parseTimelinePosition('{oops'), null);
  assert.equal(parseTimelinePosition('{"size":"x","offset":0}'), null);
  assert.equal(parseTimelinePosition('{"size":0,"offset":0}'), null);
  assert.equal(parseTimelinePosition('{"size":2,"offset":-5}'), null);
  // Clamped rather than rejected, so a large but plausible value still works.
  assert.deepEqual(parseTimelinePosition('{"size":9999,"offset":10}'), {
    size: 50,
    offset: 10,
  });
});

test('the timeline restores pages before it restores the offset', () => {
  // Scrolling first would be clamped: the document is still one page tall.
  const source = readFileSync(
    new URL('../src/components/EntriesTimelineClient.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    source,
    /if \(\(data\?\.length \?\? 0\) < saved\.size\) return;/,
  );
  assert.match(source, /window\.scrollTo\(\{ top: saved\.offset \}\)/);
});

test('the timeline groups by month, highlights matches and links tags', () => {
  const source = readFileSync(
    new URL('../src/components/EntriesTimelineClient.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /groupTimelineEntriesByPeriod/);
  assert.match(source, /<Highlighted text=\{entry\.displayTitle\}/);
  assert.match(source, /\?tag=\$\{encodeURIComponent\(name\)\}/);
  // The tag chip sits inside a Link, so it must suppress the navigation.
  assert.match(
    source,
    /event\.preventDefault\(\);\s*\n\s*event\.stopPropagation\(\)/,
  );
  assert.match(source, /messages\.dashboard\.backToTop/);
});
