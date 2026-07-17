import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthActions } from '@/lib/auth/action-core';

function dependencies(overrides: Record<string, unknown> = {}) {
  const cookieWrites: string[] = [];
  return {
    cookieWrites,
    actions: createAuthActions({
      passwordHash: 'encoded',
      verifyPassword: async (password) => password === 'correct-password-value',
      getRateLimit: async () => ({ blocked: false, retryAfterSeconds: 0 }),
      recordFailure: async () => ({ blocked: false, retryAfterSeconds: 0, failures: 1 }),
      clearFailures: async () => {},
      createSession: async () => 'signed-session',
      setSessionCookie: async (token) => { cookieWrites.push(token); },
      clearSessionCookie: async () => { cookieWrites.push('cleared'); },
      ...overrides,
    }),
  };
}

test('login stores a session after password verification', async () => {
  const { actions, cookieWrites } = dependencies();
  const formData = new FormData();
  formData.set('password', 'correct-password-value');
  assert.deepEqual(await actions.login(formData, 'client'), { ok: true, data: undefined });
  assert.deepEqual(cookieWrites, ['signed-session']);
});

test('login records invalid passwords without setting a cookie', async () => {
  let failures = 0;
  const { actions, cookieWrites } = dependencies({
    recordFailure: async () => { failures += 1; return { blocked: false, retryAfterSeconds: 0, failures }; },
  });
  const formData = new FormData();
  formData.set('password', 'wrong');
  const result = await actions.login(formData, 'client');
  assert.equal(result.ok, false);
  assert.equal(failures, 1);
  assert.deepEqual(cookieWrites, []);
});

test('login rejects blocked clients before password verification', async () => {
  let verified = false;
  const { actions } = dependencies({
    getRateLimit: async () => ({ blocked: true, retryAfterSeconds: 120 }),
    verifyPassword: async () => { verified = true; return true; },
  });
  const result = await actions.login(new FormData(), 'blocked-client');
  assert.deepEqual(result, { ok: false, error: '密码错误或请求过于频繁', retryAfterSeconds: 120 });
  assert.equal(verified, false);
});

test('logout clears the session cookie', async () => {
  const { actions, cookieWrites } = dependencies();
  assert.deepEqual(await actions.logout(), { ok: true, data: undefined });
  assert.deepEqual(cookieWrites, ['cleared']);
});
