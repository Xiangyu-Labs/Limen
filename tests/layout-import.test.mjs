import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("root layout imports globals.css so Tailwind styles are loaded", () => {
  const source = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /import\s+["']\.\/globals\.css["'];/,
    "src/app/layout.tsx must import ./globals.css",
  );
  assert.match(source, /export const dynamic = ['"]force-dynamic['"];/);
});
