import test from "node:test";
import assert from "node:assert/strict";

test("login state derives the submit label from loading state", async () => {
  const { getLoginSubmitLabel } = await import("@/app/(auth)/login/page");

  assert.equal(getLoginSubmitLabel(false), "Access Diary");
  assert.equal(getLoginSubmitLabel(true), "Authenticating...");
});
