import test from "node:test";
import assert from "node:assert/strict";

test("assertLocale rejects invalid locale", async () => {
  const { assertLocale } = await import("@/app/[locale]/layout");
  assert.throws(() => assertLocale("fr"));
});

test("redirect helpers only generate locale-prefixed routes", async () => {
  const { dashboardPath, entryDetailPath, loginPath } = await import("@/lib/i18n/pathname");
  assert.equal(dashboardPath("zh"), "/zh");
  assert.equal(loginPath("en"), "/en/login");
  assert.equal(entryDetailPath("zh", "entry-1"), "/zh/entries/entry-1");
});
