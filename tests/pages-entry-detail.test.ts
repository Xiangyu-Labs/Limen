import test from "node:test";
import assert from "node:assert/strict";

test("entry detail view model exposes summary and tags for AI-complete entries", async () => {
  const { buildEntryDetailViewModel } = await import("@/app/(dashboard)/entries/[id]/page");
  const model = buildEntryDetailViewModel({
    id: "1",
    content: "# Heading",
    title: "Enhanced title",
    summary: "Enhanced summary",
    tags: JSON.stringify(["alpha", "beta"]),
    aiStatus: "done",
    createdAt: new Date(),
  } as never);

  assert.equal(model.displayTitle, "Enhanced title");
  assert.equal(model.summary, "Enhanced summary");
  assert.deepEqual(model.tags, ["alpha", "beta"]);
  assert.equal(model.showAIEnhancedBadge, true);
  assert.equal(model.statusLabel, "AI Enhanced");
  assert.equal(model.statusTone, "success");
});

test("entry detail view model falls back for incomplete entries", async () => {
  const { buildEntryDetailViewModel } = await import("@/app/(dashboard)/entries/[id]/page");
  const model = buildEntryDetailViewModel({
    id: "1",
    content: "Plain content",
    title: null,
    summary: null,
    tags: null,
    aiStatus: "pending",
    createdAt: new Date(),
  } as never);

  assert.equal(model.displayTitle, "Untitled Capture");
  assert.equal(model.summary, null);
  assert.deepEqual(model.tags, []);
  assert.equal(model.showAIEnhancedBadge, false);
  assert.equal(model.statusLabel, "Processing");
  assert.equal(model.statusTone, "warning");
});

test("entry detail view model exposes regenerate action copy", async () => {
  const { buildEntryDetailViewModel } = await import("@/app/(dashboard)/entries/[id]/page");
  const model = buildEntryDetailViewModel({
    id: "1",
    content: "Plain content",
    title: null,
    summary: null,
    tags: null,
    aiStatus: "failed",
    createdAt: new Date(),
  } as never);

  assert.equal(model.regenerateLabel, "Regenerate AI Metadata");
  assert.equal(model.statusLabel, "Needs review");
  assert.equal(model.statusTone, "danger");
});
