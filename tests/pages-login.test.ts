import test from "node:test";
import assert from "node:assert/strict";

test("login labels are Chinese-only", async () => {
  const { getLoginSubmitLabel } = await import("@/app/login/page");

  assert.equal(getLoginSubmitLabel(false), "进入日记");
  assert.equal(getLoginSubmitLabel(true), "认证中...");
});
