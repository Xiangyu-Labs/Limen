import test from "node:test";
import assert from "node:assert/strict";

test("getLocaleSwitchTarget falls back to locale root for invalid paths", async () => {
  const { getLocaleSwitchTarget } = await import("@/components/LocaleSwitcher");
  assert.equal(getLocaleSwitchTarget("/unknown", "zh"), "/zh");
});

test("getLocaleSwitchTarget preserves query and hash", async () => {
  const { getLocaleSwitchTarget } = await import("@/components/LocaleSwitcher");
  assert.equal(getLocaleSwitchTarget("/zh/entries/1?q=focus#top", "en"), "/en/entries/1?q=focus#top");
});
