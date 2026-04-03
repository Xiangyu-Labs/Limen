import test from "node:test";
import assert from "node:assert/strict";

test("bulk selection helper hook module exposes selection primitives", async () => {
  const mod = await import("@/hooks/useSelection");
  assert.equal(typeof mod.useSelection, "function");
});
