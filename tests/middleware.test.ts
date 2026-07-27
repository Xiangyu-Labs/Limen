import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProxyRequest, shouldBypassProxy } from '@/proxy';

function decide(
  pathname: string,
  overrides: Partial<Parameters<typeof evaluateProxyRequest>[0]> = {},
) {
  return evaluateProxyRequest({ pathname, hasSession: false, ...overrides });
}

test('proxy redirects every unauthenticated private page including unknown paths', () => {
  assert.deepEqual(decide('/entries/new'), {
    type: 'redirect',
    location: '/login',
  });
  assert.deepEqual(decide('/future-private-page'), {
    type: 'redirect',
    location: '/login',
  });
});

test('proxy bypasses framework assets and internally authenticated API routes', () => {
  assert.deepEqual(decide('/login'), { type: 'next' });
  assert.equal(shouldBypassProxy('/favicon.ico'), true);
  assert.equal(shouldBypassProxy('/robots.txt'), true);
  assert.equal(shouldBypassProxy('/_next/static/chunk.js'), true);
  assert.equal(shouldBypassProxy('/api/entries'), true);
  assert.equal(shouldBypassProxy('/api/dashboard/entries'), true);
  assert.equal(shouldBypassProxy('/images/logo.png'), false);
});

test('proxy allows authenticated pages and redirects authenticated login', () => {
  assert.deepEqual(decide('/', { hasSession: true }), { type: 'next' });
  assert.deepEqual(decide('/login', { hasSession: true }), {
    type: 'redirect',
    location: '/',
  });
});
