import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("project includes a PostCSS config for Tailwind v4", () => {
  assert.ok(existsSync(new URL("../postcss.config.mjs", import.meta.url)));

  const source = readFileSync(new URL("../postcss.config.mjs", import.meta.url), "utf8");
  assert.match(
    source,
    /["@']@tailwindcss\/postcss["@']/,
    "postcss.config.mjs must enable @tailwindcss/postcss",
  );
});

test("package.json declares the Tailwind PostCSS plugin dependency", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(
    pkg.devDependencies?.["@tailwindcss/postcss"],
    "package.json must declare @tailwindcss/postcss in devDependencies",
  );
});
