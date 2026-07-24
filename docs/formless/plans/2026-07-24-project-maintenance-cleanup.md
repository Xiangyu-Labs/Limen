# Project Maintenance Cleanup Implementation Plan

**Source Spec:** `docs/formless/specs/2026-07-24-project-maintenance-refactor.md`

## Goal

Make Limen's commands, formatting, tests, configuration, documentation, and local code organization consistent while preserving all existing product and deployment behavior.

## Background

Limen is a private, single-user Next.js 16 application using npm, Node.js 24, TypeScript, ESLint, Node's test runner, Drizzle, Neon, and Vercel. The application is healthy: linting, type checking, and 74 currently discovered tests pass. The maintenance issues are primarily inconsistent repository contracts rather than broken product behavior.

The current `test` command delegates to a redundant `test:node` alias, uses a POSIX inline `DATABASE_URL`, and allows Node's default discovery to execute `tests/helpers/*.ts` as test files. CI repeats individual commands instead of consuming one local verification contract. Prettier is absent, npm publishing boilerplate remains in `package.json`, `docs/` is ignored, and `next.config.ts` contains personal LAN addresses. README combines onboarding, API, and deployment material. Source code is small and already has proportionate `app`, `components`, and `lib` boundaries, so this plan cleans concrete inconsistencies without introducing feature-first organization.

## Architecture

Keep the existing `src/app`, `src/components`, and `src/lib` architecture. Establish `package.json` scripts as the authoritative developer interface, with Prettier responsible for formatting and ESLint responsible for semantic checks. Make test setup and file selection explicit so the same command works without shell-specific environment assignment and helper files are not discovered as tests. CI and documentation consume these commands rather than redefining them.

Code cleanup is evidence-driven and local: remove confirmed dead exports or copy, consolidate meaningful repetition, correct misleading names or imports, and apply the formatter. Direct imports and existing client/server boundaries remain intact. No route, UI, API, database, authentication, AI scheduling, or business behavior changes are allowed.

## Constraints

- Preserve the existing `app`, `components`, and `lib` top-level source structure.
- Preserve all browser routes, API methods and response shapes, server-action outcomes, authentication behavior, database schema and migrations, AI processing, and visible UI behavior.
- Keep Node.js on major version 24 and npm as the only package manager.
- Do not broadly upgrade dependencies; add Prettier and remove a dependency only when its lack of runtime, configuration, adapter, and peer usage is demonstrated.
- Do not edit generated Drizzle migrations or snapshots for formatting.
- Track the entire `docs/` directory, including Formless specifications and plans.
- Keep secrets, real credentials, and personal LAN addresses out of tracked files.

## Context Map

- `docs/formless/specs/2026-07-24-project-maintenance-refactor.md` - Authoritative scope, decisions, exclusions, and acceptance criteria.
- `package.json` - Current npm scripts, Node engine, dependencies, and publishing boilerplate.
- `package-lock.json` - npm lockfile that must remain synchronized with manifest changes.
- `.github/workflows/ci.yml` - Current install, quality-gate, build, and audit sequence.
- `eslint.config.mjs` - Existing Next.js and TypeScript semantic lint configuration and generated-file ignores.
- `tsconfig.json` - TypeScript and `@/*` import configuration.
- `.gitignore` - Currently ignores all documentation as well as generated output and local data.
- `.env.example` - Public environment-variable contract.
- `next.config.ts` - Current hard-coded `allowedDevOrigins` values.
- `tests/test-scripts.test.mjs` - Structure-coupled assertions for the old command contract.
- `tests/next-config-allowed-dev-origins.test.mjs` - Structure-coupled assertion for a personal LAN address.
- `tests/helpers/test-env.ts` - Existing scoped environment helper; it is not a global test bootstrap.
- `README.md` - Current quick start, API reference, deployment guide, and product description.
- `src/lib/messages.ts` - Central UI copy including confirmed unused keys.
- `src/lib/actions/entries-core.ts` - Repeated AI scheduling/error-handling blocks and action dependency boundary.
- `src/lib/dashboard-data.ts` - Dashboard/API pagination and timeline view-model boundary; preserve query and cursor semantics.
- `src/lib/ai/processor.ts` - AI behavior and concurrency logic that must remain behaviorally unchanged.
- `src/lib/auth/` - Authentication and security behavior that must remain unchanged.
- `src/app/`, `src/components/`, `src/lib/` - Bounded source-cleanup area and retained architecture.

## Tasks

### Task 1: Establish the repository and tooling contract

**Outcome:**

The manifest, formatter, test runner, development-origin configuration, ignore rules, and CI expose one portable and documented-by-contract verification workflow.

**Context:**

This task creates the interfaces consumed by the source-formatting and documentation tasks. Read `package.json`, the lockfile, CI workflow, ESLint configuration, environment example, Next.js configuration, and the two structure-coupled tests first. Preserve the existing production environment contract and CI build placeholders.

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.gitignore`
- Modify: `.env.example`
- Modify: `next.config.ts`
- Modify: `tests/test-scripts.test.mjs`
- Modify: `tests/next-config-allowed-dev-origins.test.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `tests/setup.ts`

**Decisions and Boundaries:**

- Mark the application private, declare the npm toolchain compatible with the checked-in lockfile, and remove npm-publishing boilerplate that does not describe a private deployed application. Retain useful repository identity metadata only when it remains accurate.
- Expose `dev`, `build`, `start`, `format`, `format:check`, `lint`, `lint:fix`, `typecheck`, `test`, and `check`. Retain the existing `db:migrate`, `db:generate`, `auth:hash-password`, and `auth:generate-api-token` names because they are already explicit.
- Remove `test:node`. Make `test` select only the current root-level `tests/*.test.ts` and `tests/*.test.mjs` files, or use an equally explicit cross-platform discovery mechanism. Do not move test files merely to satisfy the command.
- Move the placeholder test `DATABASE_URL` into a bootstrap loaded before test modules, rather than embedding a POSIX environment assignment in the npm script. The bootstrap must not override a caller-provided `DATABASE_URL`.
- Define `check` as the local aggregate for `format:check`, `lint`, `typecheck`, and `test`. Keep the production build separate because it requires deployment-like environment placeholders and is slower; CI runs `check` and then `build`.
- Add Prettier as a development dependency. Configure it as the sole formatting authority without duplicating semantic ESLint responsibilities. Ignore dependencies, build output, coverage, local data, the lockfile, and generated Drizzle SQL/snapshot metadata.
- Remove the blanket `docs/` ignore while retaining ignores for generated output, dependencies, secrets, and local data.
- Replace committed LAN origins with optional `ALLOWED_DEV_ORIGINS`, parsed as a comma-separated list with whitespace trimmed and empty entries removed. When absent or empty, omit `allowedDevOrigins` from the Next.js configuration. Document the variable in `.env.example` using non-personal examples.
- Rewrite the two structure-coupled tests to protect the new durable contracts: supported commands and explicit test selection; environment-origin parsing without dependence on a specific hostname or address.
- Keep the existing `npm audit --audit-level=moderate` CI step unless executing it reveals that it is already a persistent nondeterministic blocker. Escalate rather than silently deleting a security gate.

**Interfaces:**

- Consumes: Node.js 24, npm lockfile v3, existing test files, existing CI build environment placeholders.
- Produces: the supported npm command contract; `ALLOWED_DEV_ORIGINS`; Prettier configuration and ignore policy; explicit test bootstrap and discovery behavior.

**Verification:**

- Run the rewritten focused command/config tests and confirm `tests/helpers/*.ts` do not appear as test files.
- Run `npm run format:check`, `npm run lint`, and `npm run typecheck` after formatting the files touched by this task.
- Inspect `npm test` output to confirm only named `*.test.*` files are discovered and all existing test cases still pass.
- Run the CI-equivalent production build with the existing placeholder environment values; this detects broken Next.js configuration and client/server imports.

**Escalate if:**

- Node's supported test-file selection cannot express the current `.ts` and `.mjs` suite portably without adding another runner or a nontrivial wrapper.
- Prettier conflicts with generated files that cannot be reliably excluded.
- Environment-driven origins require a different value shape than Next.js `allowedDevOrigins` accepts.
- Updating the manifest exposes a dependency or audit failure that requires broad version upgrades.

### Task 2: Perform bounded source cleanup and establish the formatting baseline

**Outcome:**

Maintained source, scripts, configuration, and tests follow one format, confirmed dead code and local inconsistencies are removed, and the existing architecture and behavior remain intact.

**Context:**

This task depends on Task 1's formatter and commands. Start with the known inconsistencies in `src/lib/messages.ts`, duplicate imports in the dashboard layout, and repeated action scheduling blocks, then inspect the bounded `src/app`, `src/components`, `src/lib`, `src/proxy.ts`, `scripts`, and `tests` areas. The goal is not to maximize changed files or abstractions; every semantic cleanup needs a concrete readability, ownership, duplication, or dead-code justification.

**Files:**

- Modify: `src/app/**/*.ts`
- Modify: `src/app/**/*.tsx`
- Modify: `src/components/**/*.tsx`
- Modify: `src/lib/**/*.ts`
- Modify: `src/proxy.ts`
- Modify: `scripts/*.ts`
- Modify: `tests/*.test.ts`
- Modify: `tests/*.test.tsx`
- Modify: `tests/*.test.mjs`
- Modify: `tests/helpers/*.ts`
- Modify: root maintained configuration files covered by Prettier

**Decisions and Boundaries:**

- Apply Prettier to maintained files covered by Task 1's configuration. Do not format generated Drizzle artifacts or the lockfile.
- Remove confirmed unused message keys such as those with no source or test consumer, after repeating the reference search against the post-Task-1 tree. Do not alter visible copy as part of dead-code removal.
- Consolidate duplicate imports from the same module and correct obviously misleading local names where behavior remains identical.
- In `entries-core.ts`, consolidate repeated AI scheduling/error-reporting scaffolding only if the helper preserves the distinct operation context in logs, scheduling timing, and existing `processAIEntry` behavior. Leave it duplicated if the abstraction would obscure the action flow.
- Inspect exports, dependencies, and small helpers for actual consumers before removal. Account for Next.js file conventions, dynamic imports, Drizzle adapters, and peer dependencies. In particular, do not classify `@neondatabase/serverless` as unused solely because application code imports `drizzle-orm/neon-http` rather than that package directly.
- Preserve the intentionally different strict input-date validation and legacy stored-date normalization unless equivalence can be proven; do not merge them based only on similar names.
- Do not move code into new top-level directories, add barrel files, change React client/server boundaries, alter error behavior, or refactor stable modules merely to reduce line count.
- Structure-coupled tests may be rewritten only when they currently assert incidental source layout. Behavioral tests and their coverage must remain.

**Interfaces:**

- Consumes: Task 1's Prettier rules, npm commands, ignore policy, and unchanged public application contracts.
- Produces: a formatted, locally cleaned source tree with the same runtime interfaces and behavioral coverage.

**Verification:**

- Run targeted tests for every semantically cleaned module; formatting-only files require `format:check`, linting, and type checking rather than new tests.
- Run searches for removed exports and dependencies to ensure no static, dynamic, configuration, adapter, or test consumer remains.
- Run `npm run check`; it must pass with the same business test coverage and without helper files being counted as tests.
- Run `npm run build` with CI placeholders to detect import-boundary, route, and server/client regressions.
- Review the final diff separately for formatting-only and semantic changes; every semantic source change must map to a concrete cleanup listed in this task.

**Escalate if:**

- A proposed cleanup changes visible text, route behavior, API output, authentication, database semantics, AI scheduling, or error handling.
- Removing a suspected dependency requires changing the selected Drizzle, Next.js, Tailwind, or other framework adapter.
- A local cleanup would require a schema migration, new runtime service, or new top-level architecture.

### Task 3: Restructure documentation and complete integration verification

**Outcome:**

A concise Chinese README provides the correct quick start and command reference, detailed API and deployment guidance live in tracked documents, and all repository acceptance checks pass from the documented workflow.

**Context:**

This task depends on the final command and environment contracts from Task 1 and the final paths from Task 2. Use the existing README as the authoritative source for current product, API, security, Neon, and Vercel details, but verify every command and environment name against the implemented repository before moving text.

**Files:**

- Modify: `README.md`
- Create: `docs/api.md`
- Create: `docs/deployment.md`
- Track: `docs/formless/specs/2026-07-24-project-maintenance-refactor.md`
- Track: `docs/formless/plans/2026-07-24-project-maintenance-cleanup.md`
- Track: existing files under `docs/formless/`

**Decisions and Boundaries:**

- Keep README focused on project purpose, prerequisites, installation with npm, environment setup, database initialization, development startup, the supported command table, and links to detailed documentation.
- Put HTTP methods, authorization, request/response examples, pagination, limits, and shortcut-client guidance in `docs/api.md`. Preserve the existing API contract exactly; documentation must not imply unimplemented endpoints or behavior.
- Put Neon/Vercel setup, environment variables, migrations, region/runtime notes, credential generation and rotation, and deployment verification in `docs/deployment.md`.
- Document `ALLOWED_DEV_ORIGINS` as optional local-development configuration, not a production requirement.
- Keep documentation in Chinese except literal identifiers, code, commands, product names, and protocol terms where English is clearer.
- Track the entire existing `docs/` tree as selected by the user. Do not delete prior Formless artifacts merely because they describe separate work.
- Do not copy secrets or actual local network details into examples.

**Interfaces:**

- Consumes: Task 1's command/environment contract, Task 2's final repository paths, and the existing unchanged application/API behavior.
- Produces: `README.md` as the onboarding entrypoint, `docs/api.md` as the API reference, and `docs/deployment.md` as the operations reference.

**Verification:**

- Execute the README quick-start and verification commands that do not require real production credentials; confirm every referenced npm script and local path exists.
- Compare documented API methods, fields, limits, authorization, and pagination against route handlers and validation constants.
- Compare deployment environment variables and build instructions against `.env.example`, configuration modules, scripts, and CI.
- Run `npm run check` and the CI-equivalent `npm run build` with placeholder environment values.
- Run `git status --short` and `git check-ignore` on representative documentation, source, build, dependency, environment, and local-data paths. Documentation must be trackable; generated and sensitive paths must remain ignored.

**Escalate if:**

- Existing README guidance conflicts with implemented API, authentication, migration, or deployment behavior and the correct behavior cannot be established from source and tests.
- Tracking an existing Formless document would expose credentials, personal network data, or other sensitive content.
