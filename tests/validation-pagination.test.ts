import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENTRY_CONTENT_MAX_LENGTH,
  InputValidationError,
  normalizeEntryIds,
  parseEntryContent,
  parseEntryDate,
} from '@/lib/validation';
import { decodeEntryCursor, encodeEntryCursor, parsePageLimit } from '@/lib/pagination';
import { parseStoredTags } from '@/lib/tags';

test('entry validation enforces content, date, and bulk limits', () => {
  assert.equal(parseEntryContent('x'.repeat(ENTRY_CONTENT_MAX_LENGTH)).length, ENTRY_CONTENT_MAX_LENGTH);
  assert.throws(() => parseEntryContent('x'.repeat(ENTRY_CONTENT_MAX_LENGTH + 1)), InputValidationError);
  assert.equal(parseEntryDate('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
  assert.throws(() => parseEntryDate('2024-02-30'), InputValidationError);
  assert.deepEqual(normalizeEntryIds(['a', 'a', '', 'b']), ['a', 'b']);
});

test('cursor round trips and invalid pagination input is rejected', () => {
  const cursor = { createdAt: new Date('2024-01-03T00:00:00.000Z'), id: 'entry-1' };
  assert.deepEqual(decodeEntryCursor(encodeEntryCursor(cursor)), cursor);
  assert.throws(() => decodeEntryCursor('not-a-cursor'), InputValidationError);
  assert.equal(parsePageLimit(null), 20);
  assert.throws(() => parsePageLimit('0'), InputValidationError);
  assert.throws(() => parsePageLimit('101'), InputValidationError);
});

test('stored tags tolerate malformed and oversized values', () => {
  assert.deepEqual(parseStoredTags('not-json'), []);
  assert.deepEqual(parseStoredTags(JSON.stringify([' one ', 'one', 3, 'two'])), ['one', 'two']);
});
