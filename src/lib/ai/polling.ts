export const AI_POLL_FAST_INTERVAL_MS = 3_000;
export const AI_POLL_MEDIUM_INTERVAL_MS = 10_000;
export const AI_POLL_SLOW_INTERVAL_MS = 30_000;

const FAST_WINDOW_MS = 15_000;
const MEDIUM_WINDOW_MS = 60_000;

export type AIStatus = 'pending' | 'done' | 'failed' | null;

export function normalizeAIStatus(value: string | null): AIStatus {
  return value === 'pending' || value === 'done' || value === 'failed'
    ? value
    : null;
}

export const AI_POLL_SWR_OPTIONS = {
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
} as const;

export class TerminalAIStatusRefreshGuard {
  private refreshed = false;

  shouldRefresh(aiStatus: AIStatus) {
    if ((aiStatus !== 'done' && aiStatus !== 'failed') || this.refreshed)
      return false;
    this.refreshed = true;
    return true;
  }
}

export class AdaptiveAIPollingScheduler {
  private pendingSignature: string | null = null;
  private activityStartedAt: number | null = null;
  private consecutiveFailures = 0;

  getInterval(pendingIds: Iterable<string>, now = Date.now()) {
    const sortedIds = [...pendingIds].sort();
    const signature = sortedIds.length > 0 ? JSON.stringify(sortedIds) : '';

    if (!signature) {
      this.pendingSignature = null;
      this.activityStartedAt = null;
      this.consecutiveFailures = 0;
      return 0;
    }

    if (signature !== this.pendingSignature) {
      this.pendingSignature = signature;
      this.activityStartedAt = now;
    }

    const elapsed = now - (this.activityStartedAt ?? now);
    const baseInterval =
      elapsed < FAST_WINDOW_MS
        ? AI_POLL_FAST_INTERVAL_MS
        : elapsed < MEDIUM_WINDOW_MS
          ? AI_POLL_MEDIUM_INTERVAL_MS
          : AI_POLL_SLOW_INTERVAL_MS;
    const failureMultiplier = 2 ** this.consecutiveFailures;

    return Math.min(baseInterval * failureMultiplier, AI_POLL_SLOW_INTERVAL_MS);
  }

  recordFailure() {
    this.consecutiveFailures = Math.min(this.consecutiveFailures + 1, 4);
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
  }
}

export function pendingEntryIds(
  pages?: Array<{ items: Array<{ id: string; isPending: boolean }> }>,
) {
  if (!pages) return [];

  const ids: string[] = [];
  for (const page of pages) {
    for (const entry of page.items) {
      if (entry.isPending) ids.push(entry.id);
    }
  }
  return ids;
}
