import test from 'node:test';
import assert from 'node:assert/strict';
import type { AIStatus } from '@/lib/ai/polling';

async function requestStatus(status: AIStatus | undefined, authorized = true) {
  const { createEntryStatusHandler } =
    await import('@/app/api/dashboard/entries/[id]/status/route');
  const GET = createEntryStatusHandler({
    authorize: () => authorized,
    loadStatus: () => status,
  });
  return GET(
    new Request('http://localhost/api/dashboard/entries/entry/status'),
    {
      params: Promise.resolve({ id: 'entry' }),
    },
  );
}

for (const aiStatus of ['pending', 'done', 'failed'] as const) {
  test(`status endpoint returns ${aiStatus}`, async () => {
    const response = await requestStatus(aiStatus);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { aiStatus });
  });
}

test('status endpoint rejects an unauthenticated request', async () => {
  const response = await requestStatus('pending', false);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('status endpoint returns 404 for a missing entry', async () => {
  const response = await requestStatus(undefined);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Not Found' });
});

test('status endpoint preserves a null AI status', async () => {
  const response = await requestStatus(null);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { aiStatus: null });
});
