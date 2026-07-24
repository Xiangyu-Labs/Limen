import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Dynamically import next.config.ts with a cache-busting query parameter so
 * that each call re-evaluates the module with the current process.env values.
 */
async function importConfig() {
  const url = new URL('../next.config.ts', import.meta.url);
  url.searchParams.set('t', String(Date.now()));
  const mod = await import(url.href);
  return mod.default ?? mod;
}

test('next config omits allowedDevOrigins when env var is absent', async () => {
  delete process.env.ALLOWED_DEV_ORIGINS;

  const config = await importConfig();
  assert.ok(
    !('allowedDevOrigins' in config),
    'allowedDevOrigins should be omitted when ALLOWED_DEV_ORIGINS is not set',
  );
});

test('next config omits allowedDevOrigins for blank input', async () => {
  process.env.ALLOWED_DEV_ORIGINS = '';

  const config = await importConfig();
  assert.ok(
    !('allowedDevOrigins' in config),
    'allowedDevOrigins should be omitted when ALLOWED_DEV_ORIGINS is empty',
  );
});

test('next config omits allowedDevOrigins for whitespace-only input', async () => {
  process.env.ALLOWED_DEV_ORIGINS = '   ';

  const config = await importConfig();
  assert.ok(
    !('allowedDevOrigins' in config),
    'allowedDevOrigins should be omitted when ALLOWED_DEV_ORIGINS is whitespace',
  );
});

test('next config parses comma-separated origins correctly', async () => {
  process.env.ALLOWED_DEV_ORIGINS = 'localhost,example.com';

  const config = await importConfig();
  assert.ok('allowedDevOrigins' in config);
  assert.deepEqual(config.allowedDevOrigins, ['localhost', 'example.com']);
});

test('next config trims whitespace from origins', async () => {
  process.env.ALLOWED_DEV_ORIGINS = '  localhost , example.com  ';

  const config = await importConfig();
  assert.ok('allowedDevOrigins' in config);
  assert.deepEqual(config.allowedDevOrigins, ['localhost', 'example.com']);
});

test('next config handles single origin', async () => {
  process.env.ALLOWED_DEV_ORIGINS = 'localhost';

  const config = await importConfig();
  assert.ok('allowedDevOrigins' in config);
  assert.deepEqual(config.allowedDevOrigins, ['localhost']);
});
