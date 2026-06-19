import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { messages } from "@/lib/messages";

test("dashboard view model exposes empty state copy", async () => {
  const { buildDashboardViewModel } = await import("@/app/(dashboard)/page");
  const model = buildDashboardViewModel([], messages, undefined);

  assert.equal(model.heading, "时间线");
  assert.equal(model.emptyMessage, "还没有记录");
});

test("dashboard view model hides pending AI status", async () => {
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
  ], messages, undefined);

  assert.equal(model.entries[0].statusLabel, null);
  assert.equal(model.entries[0].statusTone, "muted");
  assert.equal(model.entries[0].displayTitle, "未命名记录");
});

test("dashboard view model prefers AI-enhanced title, summary, and tags without success status", async () => {
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
  ], messages, "focus");

  assert.equal(model.heading, "“focus”的搜索结果");
  assert.equal(model.entries[0].displayTitle, "Enhanced title");
  assert.equal(model.entries[0].displaySummary, "Enhanced summary");
  assert.equal(model.entries[0].statusLabel, null);
  assert.equal(model.entries[0].statusTone, "muted");
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
  ], messages, undefined);

  assert.equal(model.entries[0].statusLabel, "失败");
  assert.equal(model.entries[0].statusTone, "danger");
});

test("dashboard groups search and date into one compact filter surface", () => {
  const dashboardPath = new URL("../src/app/(dashboard)/page.tsx", import.meta.url);
  const layoutPath = new URL("../src/app/(dashboard)/layout.tsx", import.meta.url);
  const filtersPath = new URL("../src/components/DashboardFilters.tsx", import.meta.url);

  assert.equal(existsSync(filtersPath), true, "dashboard filter component should exist");

  const dashboardSource = readFileSync(dashboardPath, "utf8");
  const layoutSource = readFileSync(layoutPath, "utf8");
  const filtersSource = readFileSync(filtersPath, "utf8");

  assert.match(dashboardSource, /DashboardFilters/);
  assert.doesNotMatch(dashboardSource, /<aside\b/);
  assert.doesNotMatch(dashboardSource, /<h1\b/);
  assert.match(dashboardSource, /entriesCount=\{filteredEntries\.length\}/);
  assert.doesNotMatch(layoutSource, /SearchInput/);
  assert.match(filtersSource, /<SearchInput/);
  assert.match(filtersSource, /<CalendarFilter/);
  assert.match(filtersSource, /entriesCount/);
});
