import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");

test("runner image copies runtime files needed for drizzle initialization", () => {
  assert.match(dockerfile, /COPY --from=builder \/app\/\.next\/standalone \.\//);
  assert.match(dockerfile, /COPY --from=builder \/app\/\.next\/static \.\/\.next\/static/);
  assert.match(dockerfile, /COPY --from=builder \/app\/drizzle \.\/drizzle/);
  const runnerStage = dockerfile.split("FROM base AS runner")[1] ?? "";
  assert.doesNotMatch(runnerStage, /COPY --from=deps \/app\/node_modules \.\/node_modules/);
});

test("docker startup uses a dedicated entrypoint script", () => {
  assert.equal(existsSync(new URL("../docker-entrypoint.sh", import.meta.url)), true);
  assert.match(dockerfile, /COPY --chmod=755 docker-entrypoint\.sh \.\//);
  assert.match(dockerfile, /ENTRYPOINT \["\.\/docker-entrypoint\.sh"\]/);

  const entrypoint = readFileSync(new URL("../docker-entrypoint.sh", import.meta.url), "utf8");

  assert.doesNotMatch(entrypoint, /npm run db:push/);
  assert.match(entrypoint, /SESSION_SECRET must contain at least 32 characters/);
  assert.match(entrypoint, /exec node server\.js/);
});

test("package exposes versioned database migration scripts", () => {
  const scripts = JSON.parse(packageJson).scripts;
  assert.equal(scripts["db:migrate"], "drizzle-kit migrate");
  assert.equal(scripts["db:generate"], "drizzle-kit generate");
});
