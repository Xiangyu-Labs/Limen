import test from "node:test";
import assert from "node:assert/strict";

test("buildSearchHref preserves path and query params", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/?page=1", "  focus "), "/?page=1&q=focus");
});

test("buildSearchHref removes q when query is cleared", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/?page=1&q=old", "   "), "/?page=1");
});

test("buildSearchHref drops the removed dashboard date parameter", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/?date=2024-01-03&page=1", "focus"), "/?page=1&q=focus");
});
