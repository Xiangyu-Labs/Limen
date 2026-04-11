import test from "node:test";
import assert from "node:assert/strict";

test("buildSearchHref preserves locale path and query params", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/zh?page=1", "  focus "), "/zh?page=1&q=focus");
});

test("buildSearchHref removes q when query is cleared", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/en?page=1&q=old", "   "), "/en?page=1");
});
