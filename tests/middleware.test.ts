import test from 'node:test';
import assert from 'node:assert/strict';
import { hashApiToken } from '@/lib/auth/security';
import { evaluateProxyRequest, shouldBypassProxy } from '@/proxy';

const API_HASH = hashApiToken('api-secret');

function decide(pathname: string, overrides: Partial<Parameters<typeof evaluateProxyRequest>[0]> = {}) {
  return evaluateProxyRequest({ pathname, hasSession: false, authHeader: null, apiTokenHash: API_HASH, ...overrides });
}

test('proxy redirects every unauthenticated private page including unknown paths', () => {
  assert.deepEqual(decide('/entries/new'), { type: 'redirect', location: '/login' });
  assert.deepEqual(decide('/future-private-page'), { type: 'redirect', location: '/login' });
  assert.deepEqual(decide('/private.json'), { type: 'redirect', location: '/login' });
});

test('proxy only exposes login and explicit framework assets', () => {
  assert.deepEqual(decide('/login'), { type: 'next' });
  assert.equal(shouldBypassProxy('/favicon.ico'), true);
  assert.equal(shouldBypassProxy('/robots.txt'), true);
  assert.equal(shouldBypassProxy('/_next/static/chunk.js'), true);
  assert.equal(shouldBypassProxy('/images/logo.png'), false);
});

test('proxy allows authenticated pages and redirects authenticated login', () => {
  assert.deepEqual(decide('/', { hasSession: true }), { type: 'next' });
  assert.deepEqual(decide('/login', { hasSession: true }), { type: 'redirect', location: '/' });
});

test('dashboard API requires a browser session', () => {
  assert.deepEqual(decide('/api/dashboard/entries'), { type: 'json', status: 401, body: { error: 'Unauthorized' } });
  assert.deepEqual(decide('/api/dashboard/entries', { hasSession: true }), { type: 'next' });
});

test('external API requires the independently hashed Bearer token', () => {
  assert.deepEqual(decide('/api/entries'), { type: 'json', status: 401, body: { error: 'Unauthorized' } });
  assert.deepEqual(decide('/api/entries', { authHeader: 'Bearer api-secret' }), { type: 'next' });
  assert.deepEqual(decide('/api/entries', { authHeader: 'Bearer wrong' }), { type: 'json', status: 401, body: { error: 'Unauthorized' } });
});
