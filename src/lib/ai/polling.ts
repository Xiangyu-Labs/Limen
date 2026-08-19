import { messages } from '@/lib/messages';

export const AI_POLL_FAST_INTERVAL_MS = 3_000;
export const AI_POLL_MEDIUM_INTERVAL_MS = 10_000;
export const AI_POLL_SLOW_INTERVAL_MS = 30_000;

const FAST_WINDOW_MS = 15_000;
const MEDIUM_WINDOW_MS = 60_000;

export type AIStatus = 'pending' | 'done' | 'failed' | null;

export type EntryStatusPatch = {
  id: string;
  aiStatus: AIStatus;
  title: string | null;
  summary: string | null;
  tags: string[];
};

export const AI_STATUS_BATCH_SIZE = 100;

export function chunkPendingEntryIds(
  ids: string[],
  batchSize = AI_STATUS_BATCH_SIZE,
) {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += batchSize) {
    chunks.push(ids.slice(index, index + batchSize));
  }
  return chunks;
}

export function applyEntryStatusPatches<
  T extends {
    id: string;
    displayTitle: string;
    displaySummary: string;
    tags: string[];
    statusLabel: string | null;
    statusTone: 'danger' | 'muted';
    isPending: boolean;
  },
>(entries: T[], patches: EntryStatusPatch[]) {
  const patchMap = new Map(patches.map((patch) => [patch.id, patch]));
  return entries.map((entry) => {
    const patch = patchMap.get(entry.id);
    if (!patch) return entry;
    return {
      ...entry,
      displayTitle: patch.title || messages.dashboard.untitledEntry,
      displaySummary: patch.summary ?? entry.displaySummary,
      tags: patch.tags,
      statusLabel:
        patch.aiStatus === 'failed'
          ? messages.common.failed
          : patch.aiStatus === 'pending'
            ? messages.common.processing
            : null,
      statusTone: patch.aiStatus === 'failed' ? 'danger' : 'muted',
      isPending: patch.aiStatus === 'pending',
    } as T;
  });
}

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
