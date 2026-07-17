import test from "node:test";
import assert from "node:assert/strict";
import { AI_POLL_MAX_DURATION_MS, shouldPollPendingAI } from "@/lib/ai/polling";

test("pending AI polling only runs inside the bounded window", () => {
  const startedAt = 10_000;
  assert.equal(shouldPollPendingAI(true, startedAt, startedAt), true);
  assert.equal(shouldPollPendingAI(true, startedAt, startedAt + AI_POLL_MAX_DURATION_MS - 1), true);
  assert.equal(shouldPollPendingAI(true, startedAt, startedAt + AI_POLL_MAX_DURATION_MS), false);
});

test("AI polling stops when no entry is pending or the timer has not started", () => {
  assert.equal(shouldPollPendingAI(false, 10_000, 10_001), false);
  assert.equal(shouldPollPendingAI(true, null, 10_001), false);
});
