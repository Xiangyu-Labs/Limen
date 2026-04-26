import test from "node:test";
import assert from "node:assert/strict";
import { getMessages } from "../src/lib/i18n/getMessages";

test("dashboard view model exposes empty state copy", async () => {
  const { buildDashboardViewModel } = await import("@/app/[locale]/(dashboard)/page");
  const messages = getMessages('en');
  const model = buildDashboardViewModel([], messages, undefined);

  assert.equal(model.heading, "Timeline");
  assert.equal(model.emptyMessage, "No entries found. Start capturing your thoughts.");
});

test("dashboard view model marks pending entries as processing", async () => {
  const { buildDashboardViewModel } = await import("@/app/[locale]/(dashboard)/page");
  const messages = getMessages('en');
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
  ], messages, undefined);

  assert.equal(model.entries[0].statusLabel, "Processing");
  assert.equal(model.entries[0].statusTone, "warning");
  assert.equal(model.entries[0].displayTitle, "Untitled Entry");
  assert.equal(model.entries[0].metaLine[0], "0 tags");
});

test("dashboard view model prefers AI-enhanced title, summary, and tags", async () => {
  const { buildDashboardViewModel } = await import("@/app/[locale]/(dashboard)/page");
  const messages = getMessages('en');
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
  ], messages, "focus");

  assert.equal(model.heading, 'Results for "focus"');
  assert.equal(model.entries[0].displayTitle, "Enhanced title");
  assert.equal(model.entries[0].displaySummary, "Enhanced summary");
  assert.equal(model.entries[0].statusLabel, "Ready");
  assert.equal(model.entries[0].statusTone, "success");
  assert.equal(model.entries[0].metaLine[0], "2 tags");
  assert.deepEqual(model.entries[0].tags, ["one", "two"]);
});

test("dashboard view model marks failed AI entries clearly", async () => {
  const { buildDashboardViewModel } = await import("@/app/[locale]/(dashboard)/page");
  const messages = getMessages('en');
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
  ], messages, undefined);

  assert.equal(model.entries[0].statusLabel, "Failed");
  assert.equal(model.entries[0].statusTone, "danger");
});

