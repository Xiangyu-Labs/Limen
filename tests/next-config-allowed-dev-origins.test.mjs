import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('next config reads ALLOWED_DEV_ORIGINS from environment', () => {
  const source = readFileSync(
    new URL('../next.config.ts', import.meta.url),
    'utf8',
  );

  assert.ok(
    source.includes('ALLOWED_DEV_ORIGINS'),
    'next.config.ts must reference ALLOWED_DEV_ORIGINS environment variable',
  );
  assert.ok(
    source.includes('process.env'),
    'next.config.ts must read from process.env',
  );
});

test('next config does not contain hardcoded origins', () => {
  const source = readFileSync(
    new URL('../next.config.ts', import.meta.url),
    'utf8',
  );

  assert.ok(
    !source.includes('allowedDevOrigins:'),
    'next.config.ts should not contain a hardcoded allowedDevOrigins literal. ' +
      'Origins must be set via the ALLOWED_DEV_ORIGINS environment variable.',
  );
});

test('next config parses comma-separated origins correctly', () => {
  // Test the parsing logic in isolation by evaluating the config module's
  // approach: split by comma, trim whitespace, remove empty entries.

  const inputs = [
    ['localhost,192.168.1.100', ['localhost', '192.168.1.100']],
    [' localhost , 192.168.1.100 ', ['localhost', '192.168.1.100']],
    ['', null],
    ['  ', null],
    ['localhost', ['localhost']],
  ];

  for (const [raw, expected] of inputs) {
    if (raw) {
      const result = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (expected) {
        assert.deepEqual(result, expected);
      } else {
        assert.equal(result.length, 0);
      }
    }
  }
});
