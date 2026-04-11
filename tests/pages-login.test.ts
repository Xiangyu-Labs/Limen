import test from "node:test";
import assert from "node:assert/strict";

test("login labels are localized by locale", async () => {
  const { getLoginSubmitLabel } = await import("@/app/[locale]/(auth)/login/page");

  assert.equal(getLoginSubmitLabel("zh", false), "进入日记");
  assert.equal(getLoginSubmitLabel("en", true), "Authenticating...");
});
