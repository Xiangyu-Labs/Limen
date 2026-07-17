import test from 'node:test';
import assert from 'node:assert/strict';

const SECRET = 'test-session-secret-with-at-least-32-bytes';

test('session manager creates and verifies constrained owner tokens', async () => {
  const { createSessionManager } = await import('@/lib/auth/session');
  const manager = createSessionManager(SECRET);
  const payload = await manager.verify(await manager.create());
  assert.equal(payload.iss, 'limen');
  assert.equal(payload.aud, 'limen-web');
  assert.equal(payload.sub, 'owner');
  assert.equal(typeof payload.jti, 'string');
});

test('session manager rejects weak secrets and invalid cookies', async () => {
  const { createSessionManager } = await import('@/lib/auth/session');
  assert.throws(() => createSessionManager('too-short'), /32 bytes/);
  const manager = createSessionManager(SECRET);
  assert.equal(await manager.getSession({ get: () => ({ value: 'invalid' }) }), null);
  assert.equal(await manager.getSession({ get: () => undefined }), null);
});

test('session cookies use strict production-oriented attributes', async () => {
  const { sessionCookieOptions, SESSION_DURATION_SECONDS } = await import('@/lib/auth/session');
  const expires = new Date('2024-02-01T00:00:00.000Z');
  const options = sessionCookieOptions(expires);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'strict');
  assert.equal(options.path, '/');
  assert.equal(options.priority, 'high');
  assert.equal(SESSION_DURATION_SECONDS, 7 * 24 * 60 * 60);
});
