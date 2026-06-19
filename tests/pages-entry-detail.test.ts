import test from "node:test";
import assert from "node:assert/strict";
import { messages } from "@/lib/messages";

test("entry detail view model exposes summary and tags without success status", async () => {
  const { buildEntryDetailViewModel } = await import("@/app/(dashboard)/entries/[id]/page");
  const model = buildEntryDetailViewModel({
    content: "# Heading",
    title: "Enhanced title",
    summary: "Enhanced summary",
    tags: JSON.stringify(["alpha", "beta"]),
    aiStatus: "done",
    createdAt: new Date(),
  } as never, messages);

  assert.equal(model.displayTitle, "Enhanced title");
  assert.equal(model.summary, "Enhanced summary");
  assert.deepEqual(model.tags, ["alpha", "beta"]);
  assert.equal(model.statusLabel, null);
  assert.equal(model.statusTone, "muted");
});

test("entry detail view model hides incomplete AI status", async () => {
  const { buildEntryDetailViewModel } = await import("@/app/(dashboard)/entries/[id]/page");
  const model = buildEntryDetailViewModel({
    content: "Plain content",
    title: null,
    summary: null,
    tags: null,
    aiStatus: "pending",
    createdAt: new Date(),
  } as never, messages);

  assert.equal(model.displayTitle, "未命名记录");
  assert.equal(model.summary, null);
  assert.deepEqual(model.tags, []);
  assert.equal(model.statusLabel, null);
  assert.equal(model.statusTone, "muted");
});

test("entry detail view model exposes regenerate action copy", async () => {
  const { buildEntryDetailViewModel } = await import("@/app/(dashboard)/entries/[id]/page");
  const model = buildEntryDetailViewModel({
    content: "Plain content",
    title: null,
    summary: null,
    tags: null,
    aiStatus: "failed",
    createdAt: new Date(),
  } as never, messages);

  assert.equal(model.regenerateLabel, "重新生成 AI 元数据");
  assert.equal(model.statusLabel, "失败");
  assert.equal(model.statusTone, "danger");
});
