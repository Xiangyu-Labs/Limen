import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("next config allows LAN dev origin used for mobile debugging", () => {
  const source = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

  assert.match(
    source,
    /allowedDevOrigins\s*:\s*\[[^\]]*["']192\.168\.6\.156["']/s,
    "next.config.ts must allow 192.168.6.156 as a dev origin",
  );
});
