import test from "node:test";
import assert from "node:assert/strict";

test("dashboard view model exposes empty state copy", async () => {
  const { buildDashboardViewModel } = await import("@/app/(dashboard)/page");
  const model = buildDashboardViewModel([], undefined);

  assert.equal(model.heading, "Timeline");
  assert.equal(model.emptyMessage, "No entries found. Start capturing your thoughts.");
});

test("dashboard view model marks pending entries as processing", async () => {
  const { buildDashboardViewModel } = await import("@/app/(dashboard)/page");
  const model = buildDashboardViewModel([
    {
      id: "1",
      content: "Raw content",
      title: null,
      summary: null,
      tags: null,
      aiStatus: "pending",
      createdAt: new Date(),
    } as never,
  ], undefined);

  assert.equal(model.entries[0].statusLabel, "Processing");
  assert.equal(model.entries[0].statusTone, "warning");
  assert.equal(model.entries[0].displayTitle, "Untitled Entry");
  assert.equal(model.entries[0].metaLine[0], "0 tags");
});

test("dashboard view model prefers AI-enhanced title, summary, and tags", async () => {
  const { buildDashboardViewModel } = await import("@/app/(dashboard)/page");
  const model = buildDashboardViewModel([
    {
      id: "1",
      content: "Raw content",
      title: "Enhanced title",
      summary: "Enhanced summary",
      tags: JSON.stringify(["one", "two"]),
      aiStatus: "done",
      createdAt: new Date(),
    } as never,
  ], "focus");

  assert.equal(model.heading, 'Results for "focus"');
  assert.equal(model.entries[0].displayTitle, "Enhanced title");
  assert.equal(model.entries[0].displaySummary, "Enhanced summary");
  assert.equal(model.entries[0].statusLabel, "Ready");
  assert.equal(model.entries[0].statusTone, "success");
  assert.equal(model.entries[0].metaLine[0], "2 tags");
  assert.deepEqual(model.entries[0].tags, ["one", "two"]);
});

test("dashboard view model marks failed AI entries clearly", async () => {
  const { buildDashboardViewModel } = await import("@/app/(dashboard)/page");
  const model = buildDashboardViewModel([
    {
      id: "1",
      content: "Raw content",
      title: null,
      summary: null,
      tags: null,
      aiStatus: "failed",
      createdAt: new Date(),
    } as never,
  ], undefined);

  assert.equal(model.entries[0].statusLabel, "Needs review");
  assert.equal(model.entries[0].statusTone, "danger");
});

test("dashboard view model exposes top-level status summary counts", async () => {
  const { buildDashboardViewModel } = await import("@/app/(dashboard)/page");
  const model = buildDashboardViewModel([
    {
      id: "1",
      content: "Pending",
      title: null,
      summary: null,
      tags: null,
      aiStatus: "pending",
      createdAt: new Date(),
    } as never,
    {
      id: "2",
      content: "Failed",
      title: null,
      summary: null,
      tags: null,
      aiStatus: "failed",
      createdAt: new Date(),
    } as never,
    {
      id: "3",
      content: "Done",
      title: "Done",
      summary: "Done",
      tags: JSON.stringify(["x"]),
      aiStatus: "done",
      createdAt: new Date(),
    } as never,
  ], undefined);

  assert.deepEqual(model.summaryStats, [
    { label: "Processing", value: 1, tone: "warning" },
    { label: "Needs review", value: 1, tone: "danger" },
    { label: "Ready", value: 1, tone: "success" },
  ]);
});
