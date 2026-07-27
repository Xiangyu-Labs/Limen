import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AdaptiveAIPollingScheduler,
  AI_POLL_FAST_INTERVAL_MS,
  AI_POLL_MEDIUM_INTERVAL_MS,
  AI_POLL_SLOW_INTERVAL_MS,
  AI_POLL_SWR_OPTIONS,
  TerminalAIStatusRefreshGuard,
  normalizeAIStatus,
  pendingEntryIds,
} from '@/lib/ai/polling';

test('AI polling moves through the 3, 10, and 30 second tiers', () => {
  const scheduler = new AdaptiveAIPollingScheduler();
  const startedAt = 10_000;

  assert.equal(
    scheduler.getInterval(['entry'], startedAt),
    AI_POLL_FAST_INTERVAL_MS,
  );
  assert.equal(
    scheduler.getInterval(['entry'], startedAt + 14_999),
    AI_POLL_FAST_INTERVAL_MS,
  );
  assert.equal(
    scheduler.getInterval(['entry'], startedAt + 15_000),
    AI_POLL_MEDIUM_INTERVAL_MS,
  );
  assert.equal(
    scheduler.getInterval(['entry'], startedAt + 60_000),
    AI_POLL_SLOW_INTERVAL_MS,
  );
});

test('a changed pending ID set restarts the fast tier', () => {
  const scheduler = new AdaptiveAIPollingScheduler();
  scheduler.getInterval(['first'], 0);
  assert.equal(
    scheduler.getInterval(['first'], 20_000),
    AI_POLL_MEDIUM_INTERVAL_MS,
  );
  assert.equal(
    scheduler.getInterval(['second'], 20_000),
    AI_POLL_FAST_INTERVAL_MS,
  );
  assert.equal(
    scheduler.getInterval(['second', 'third'], 70_000),
    AI_POLL_FAST_INTERVAL_MS,
  );
});

test('AI polling stops without pending entries and restarts from fast', () => {
  const scheduler = new AdaptiveAIPollingScheduler();
  scheduler.getInterval(['entry'], 0);
  assert.equal(scheduler.getInterval(['entry'], 70_000), 30_000);
  assert.equal(scheduler.getInterval([], 70_001), 0);
  assert.equal(scheduler.getInterval(['entry'], 90_000), 3_000);
});

test('temporary failures back off to 30 seconds and success recovers', () => {
  const scheduler = new AdaptiveAIPollingScheduler();
  scheduler.getInterval(['entry'], 0);

  scheduler.recordFailure();
  assert.equal(scheduler.getInterval(['entry'], 1_000), 6_000);
  scheduler.recordFailure();
  assert.equal(scheduler.getInterval(['entry'], 2_000), 12_000);
  scheduler.recordFailure();
  assert.equal(scheduler.getInterval(['entry'], 3_000), 24_000);
  scheduler.recordFailure();
  assert.equal(scheduler.getInterval(['entry'], 4_000), 30_000);

  scheduler.recordSuccess();
  assert.equal(scheduler.getInterval(['entry'], 5_000), 3_000);
});

test('pending IDs are collected across pages without other comparisons', () => {
  assert.deepEqual(
    pendingEntryIds([
      {
        items: [
          { id: 'done', isPending: false },
          { id: 'pending-1', isPending: true },
        ],
      },
      { items: [{ id: 'pending-2', isPending: true }] },
    ]),
    ['pending-1', 'pending-2'],
  );
});

test('SWR polling pauses while hidden or offline and revalidates on recovery', () => {
  assert.equal(AI_POLL_SWR_OPTIONS.refreshWhenHidden, false);
  assert.equal(AI_POLL_SWR_OPTIONS.refreshWhenOffline, false);
  assert.equal(AI_POLL_SWR_OPTIONS.revalidateOnFocus, true);
  assert.equal(AI_POLL_SWR_OPTIONS.revalidateOnReconnect, true);
  assert.equal(AI_POLL_SWR_OPTIONS.shouldRetryOnError, false);
});

test('entry detail refreshes once when pending reaches either terminal state', () => {
  for (const terminalStatus of ['done', 'failed'] as const) {
    const guard = new TerminalAIStatusRefreshGuard();
    assert.equal(guard.shouldRefresh('pending'), false);
    assert.equal(guard.shouldRefresh(terminalStatus), true);
    assert.equal(guard.shouldRefresh(terminalStatus), false);
  }
  assert.equal(new TerminalAIStatusRefreshGuard().shouldRefresh(null), false);
});

test('stored AI statuses are normalized to the internal API contract', () => {
  assert.equal(normalizeAIStatus('pending'), 'pending');
  assert.equal(normalizeAIStatus('done'), 'done');
  assert.equal(normalizeAIStatus('failed'), 'failed');
  assert.equal(normalizeAIStatus(null), null);
  assert.equal(normalizeAIStatus('unexpected'), null);
});
