import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLoginAttemptKey,
  generateApiToken,
  hashPassword,
  verifyApiToken,
  verifyPassword,
} from '@/lib/auth/security';

test('password hashes verify without storing plaintext', async () => {
  const password = 'a-long-private-password';
  const encoded = await hashPassword(password, Buffer.alloc(16, 7));
  assert.doesNotMatch(encoded, new RegExp(password));
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword('wrong-password-value', encoded), false);
  assert.equal(await verifyPassword(password, 'malformed'), false);
  assert.equal(await verifyPassword('short', encoded), false);
  assert.equal(await verifyPassword('x'.repeat(129), encoded), false);
});

test('API tokens are independently generated and hash verified', () => {
  const { token, hash } = generateApiToken();
  assert.equal(verifyApiToken(token, hash), true);
  assert.equal(verifyApiToken('wrong', hash), false);
  assert.equal(hash.includes(token), false);
});

test('login identifiers are HMACed and stable', () => {
  const first = createLoginAttemptKey('203.0.113.1, 10.0.0.1', 'secret');
  assert.equal(first, createLoginAttemptKey('203.0.113.1', 'secret'));
  assert.notEqual(first, createLoginAttemptKey('203.0.113.2', 'secret'));
  assert.doesNotMatch(first, /203\.0\.113/);
});
