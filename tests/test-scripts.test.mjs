import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("package.json exposes aggregated Node test scripts", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(pkg.scripts["test:node"], "node --import tsx --test");
  assert.equal(pkg.scripts.test, "npm run test:node");
});
