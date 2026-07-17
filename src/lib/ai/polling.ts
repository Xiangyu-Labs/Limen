export const AI_POLL_INTERVAL_MS = 2_000;
export const AI_POLL_MAX_DURATION_MS = 60_000;

export function shouldPollPendingAI(hasPending: boolean, startedAt: number | null, now: number) {
  return hasPending && startedAt !== null && now - startedAt < AI_POLL_MAX_DURATION_MS;
}
