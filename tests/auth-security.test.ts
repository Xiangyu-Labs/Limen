import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLoginAttemptKey,
  hasValidBearerToken,
  secureStringEqual,
  verifyPassword,
} from '@/lib/auth/security';

test('web login and Bearer API use the same plaintext password', async () => {
  const password = 'one-shared-password';
  assert.equal(await verifyPassword(password, password), true);
  assert.equal(await verifyPassword('wrong', password), false);
  assert.equal(secureStringEqual(password, password), true);
  assert.equal(secureStringEqual('short', 'longer'), false);
  assert.equal(
    hasValidBearerToken(
      new Request('http://localhost/api/entries', {
        headers: { Authorization: `Bearer ${password}` },
      }),
      password,
    ),
    true,
  );
  assert.equal(
    hasValidBearerToken(new Request('http://localhost/api/entries'), password),
    false,
  );
});

test('login identifiers are HMACed and stable', () => {
  const first = createLoginAttemptKey('203.0.113.1, 10.0.0.1', 'secret');
  assert.equal(first, createLoginAttemptKey('203.0.113.1', 'secret'));
  assert.notEqual(first, createLoginAttemptKey('203.0.113.2', 'secret'));
  assert.doesNotMatch(first, /203\.0\.113/);
});
