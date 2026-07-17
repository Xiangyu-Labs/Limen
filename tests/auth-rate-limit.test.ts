import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/test-db';
import { clearLoginFailures, getLoginRateLimit, recordLoginFailure } from '@/lib/auth/rate-limit';

test('login failures block the fifth attempt for fifteen minutes', async () => {
  const fixture = await createTestDb();
  const now = new Date('2026-01-01T00:00:00Z');
  try {
    const results = [];
    for (let index = 0; index < 5; index += 1) {
      results.push(await recordLoginFailure('client', now, fixture.db));
    }
    assert.equal(results.some((result) => result.blocked), true);
    const limit = await getLoginRateLimit('client', new Date(now.getTime() + 1_000), fixture.db);
    assert.equal(limit.blocked, true);
    assert.ok(limit.retryAfterSeconds > 0);
  } finally { await fixture.cleanup(); }
});

test('successful login clears recorded failures', async () => {
  const fixture = await createTestDb();
  try {
    await recordLoginFailure('client', new Date(), fixture.db);
    await clearLoginFailures('client', fixture.db);
    assert.deepEqual(await getLoginRateLimit('client', new Date(), fixture.db), { blocked: false, retryAfterSeconds: 0 });
  } finally { await fixture.cleanup(); }
});
