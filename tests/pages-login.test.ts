import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("login labels are Chinese-only", async () => {
  const { getLoginSubmitLabel } = await import("@/app/login/page");

  assert.equal(getLoginSubmitLabel(false), "进入");
  assert.equal(getLoginSubmitLabel(true), "进入中...");
});

test("login form falls back to POST so passwords never enter the URL", () => {
  const source = readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<form method="post" onSubmit=\{submit\}/);
});
