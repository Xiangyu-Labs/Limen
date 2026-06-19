import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");

test("runner image copies runtime files needed for drizzle initialization", () => {
  assert.match(dockerfile, /COPY --from=builder \/app\/drizzle\.config\.ts \.\/drizzle\.config\.ts/);
  assert.match(dockerfile, /COPY --from=builder \/app\/src \.\/src/);
  assert.match(dockerfile, /COPY --from=builder \/app\/tsconfig\.json \.\/tsconfig\.json/);
});

test("docker startup uses a dedicated entrypoint script", () => {
  assert.equal(existsSync(new URL("../docker-entrypoint.sh", import.meta.url)), true);
  assert.match(dockerfile, /COPY --chmod=755 docker-entrypoint\.sh \.\//);
  assert.match(dockerfile, /CMD \["\.\/docker-entrypoint\.sh"\]/);

  const entrypoint = readFileSync(new URL("../docker-entrypoint.sh", import.meta.url), "utf8");

  assert.match(entrypoint, /npm run db:push/);
  assert.match(entrypoint, /npm run db:migrate/);
  assert.ok(entrypoint.indexOf("npm run db:push") < entrypoint.indexOf("npm run db:migrate"));
  assert.match(entrypoint, /npm run start -- --hostname 0\.0\.0\.0 --port "\$\{PORT:-3000\}"/);
});

test("package exposes the data migration script used at startup", () => {
  const scripts = JSON.parse(packageJson).scripts;
  assert.match(scripts["db:migrate"], /tsx src\/lib\/db\/apply-migrations\.ts/);
});
