import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("package.json exposes aggregated Node test scripts", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(pkg.scripts["test:node"], /DATABASE_URL=postgresql:\/\//);
  assert.match(pkg.scripts["test:node"], /node --import tsx --test/);
  assert.equal(pkg.scripts.test, "npm run test:node");
  assert.equal(pkg.scripts["db:migrate"], "tsx scripts/migrate.ts");
  assert.equal(pkg.scripts["auth:hash-password"], "tsx scripts/hash-password.ts");
  assert.equal(pkg.engines.node, "24.x");
});
