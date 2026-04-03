import test from "node:test";
import assert from "node:assert/strict";

test("normalizeSearchQuery trims user input", async () => {
  const { normalizeSearchQuery } = await import("@/components/SearchInput");
  assert.equal(normalizeSearchQuery("  hello world  "), "hello world");
  assert.equal(normalizeSearchQuery("   "), "");
});

test("buildSearchHref adds q when query is present", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/?page=1", "  focus "), "/?page=1&q=focus");
});

test("buildSearchHref removes q when query is cleared", async () => {
  const { buildSearchHref } = await import("@/components/SearchInput");
  assert.equal(buildSearchHref("http://localhost/?page=1&q=old", "   "), "/?page=1");
});
