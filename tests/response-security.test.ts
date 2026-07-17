import test from 'node:test';
import assert from 'node:assert/strict';
import { applySecurityHeaders, buildContentSecurityPolicy } from '@/lib/auth/response-security';

test('production CSP is nonce based and denies framing and unsafe objects', () => {
  const policy = buildContentSecurityPolicy('nonce-value', false);
  assert.match(policy, /script-src 'self' 'nonce-nonce-value' 'strict-dynamic'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.doesNotMatch(policy, /unsafe-eval/);
});

test('private responses receive no-store and defense-in-depth headers', () => {
  const headers = new Headers();
  applySecurityHeaders(headers, 'default-src \'self\'', true);
  assert.equal(headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-frame-options'), 'DENY');
  assert.match(headers.get('strict-transport-security') ?? '', /max-age=63072000/);
});
