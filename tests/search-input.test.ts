import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

test('buildSearchHref preserves path and query params', async () => {
  const { buildSearchHref } = await import('@/components/SearchInput');
  assert.equal(
    buildSearchHref('http://localhost/?page=1', '  focus '),
    '/?page=1&q=focus',
  );
});

test('buildSearchHref removes q when query is cleared', async () => {
  const { buildSearchHref } = await import('@/components/SearchInput');
  assert.equal(
    buildSearchHref('http://localhost/?page=1&q=old', '   '),
    '/?page=1',
  );
});

test('buildSearchHref drops the removed dashboard date parameter', async () => {
  const { buildSearchHref } = await import('@/components/SearchInput');
  assert.equal(
    buildSearchHref('http://localhost/?date=2024-01-03&page=1', 'focus'),
    '/?page=1&q=focus',
  );
});

test('search input synchronizes URL changes without remounting the form', () => {
  const source = readFileSync(
    new URL('../src/components/SearchInput.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /setQuery\(initialQuery\)/);
  assert.doesNotMatch(source, /key=\{query\}/);
});

test('slash focuses search only when the user is not already typing', async () => {
  const { isSearchShortcut } = await import('@/components/SearchInput');
  const { document } = new JSDOM('<!doctype html><body></body>').window;
  const key = (
    target: EventTarget | null,
    overrides: Partial<{
      key: string;
      metaKey: boolean;
      ctrlKey: boolean;
    }> = {},
  ) => ({
    key: '/',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    target,
    ...overrides,
  });

  assert.equal(isSearchShortcut(key(document.body)), true);
  assert.equal(
    isSearchShortcut(key(document.createElement('textarea'))),
    false,
  );
  const field = document.createElement('div');
  field.innerHTML = '<label><input /></label>';
  assert.equal(isSearchShortcut(key(field.querySelector('input'))), false);
  assert.equal(isSearchShortcut(key(document.body, { ctrlKey: true })), false);
  assert.equal(isSearchShortcut(key(document.body, { key: 'a' })), false);
});
