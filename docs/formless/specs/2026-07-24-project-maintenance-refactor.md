# Project Maintenance Cleanup Specification

## Problem

Limen is functionally healthy, but its maintenance surface is inconsistent. npm commands do not provide one clear verification entry point, the default Node test discovery executes helper modules as tests, `package.json` retains irrelevant package-publishing metadata, documentation mixes onboarding, deployment, and API reference material, all of `docs/` is ignored, local network configuration is committed as machine-specific values, and source formatting is not enforced. Some naming, file responsibilities, and formatting conventions are also inconsistent across the small codebase.

## Goals

- Establish a small, predictable npm command contract for development, formatting, verification, database maintenance, and credential generation.
- Make a fresh checkout understandable and operable from a concise Chinese README with tracked supporting documentation.
- Enforce one repository-wide source and documentation format with Prettier while retaining ESLint for semantic linting.
- Fix test discovery so helper modules are not executed as standalone tests.
- Clean up demonstrably unclear names, misplaced responsibilities, and meaningful duplication without replacing the existing architecture.
- Preserve all existing user-visible behavior, routes, API contracts, authentication behavior, database behavior, and AI processing behavior.
- Keep formatting checks, linting, type checking, tests, and production build green after the cleanup.

## Non-Goals

- Reorganizing the project into `features`, `modules`, a monorepo, or another new architecture.
- Adding product features or redesigning the UI.
- Adding drafts, soft deletion, calendar views, new search modes, session management, Passkeys, API versioning, AI job queues, or automatic AI retries.
- Changing route URLs, request or response shapes, database schema or migrations, authentication rules, AI processing, or pagination semantics.
- Upgrading application dependencies solely because newer versions exist.
- Creating abstractions only to reduce file length or eliminate small, readable duplication.

## Background

Limen is a private, single-user Next.js 16 App Router application using React 19, TypeScript, Neon Postgres, Drizzle ORM, Node's test runner, and npm. The repository contains about 4,100 lines across application, script, and test code. Its largest source modules are approximately 180 lines, and the existing `app`, `components`, and `lib` structure is proportionate to the project's size. The `auth`, `ai`, and `db` directories already provide useful boundaries.

At specification time, ESLint, TypeScript, and all 74 discovered tests pass. The test command also discovers `tests/helpers/*.ts`, which appear as successful test files despite containing support code rather than test cases. This work is therefore a maintenance cleanup, not a recovery from a broken architecture.

## Decisions

### Refactor Depth

**Choice:** Perform an architecture-preserving deep cleanup.

**Rationale:** The project is small and personal. A full feature-first migration would create substantial file movement and import churn without solving a demonstrated scaling problem. Cleanup will be thorough across tooling, documentation, formatting, and concrete code issues, while retaining the understandable `app`, `components`, and `lib` organization.

### Code Organization

**Choice:** Keep `src/app`, `src/components`, and `src/lib`, refining only local boundaries that have a clear ownership or dependency problem.

**Rationale:** Next.js entrypoints belong in `app`, reusable React components remain easy to find in `components`, and server/domain utilities already have sensible subdirectories in `lib`. Files may be renamed, moved into an existing subdirectory, split, or combined when that makes a real responsibility clearer; no new top-level architecture will be imposed.

### Import Boundaries

**Choice:** Retain direct, statically analyzable imports and keep client modules separated from server-only authentication, database, and AI processing code.

**Rationale:** Direct imports protect Next.js client/server boundaries and avoid broad barrel files that could expand client bundles or server traces. Existing aliases may remain where they are clear.

### Behavior Compatibility

**Choice:** Preserve the existing UI, routes, API contracts, authentication, database behavior, AI processing, and deployment behavior.

**Rationale:** The original request concerns project tidiness and maintainability. Product and data-model changes would obscure the cleanup and add unnecessary risk for a personal application.

### npm Command Contract

**Choice:** Replace redundant or unclear aliases with a documented command set centered on `dev`, `build`, `start`, `format`, `format:check`, `lint`, `lint:fix`, `typecheck`, `test`, and `check`, while retaining clearly named database and authentication utilities.

**Rationale:** A contributor should not need to know the underlying runner to choose a command. `test` will explicitly target test files, and `check` will aggregate the normal quality gates. CI will invoke the same public commands documented for local use, followed by a production build where appropriate.

### Package Metadata

**Choice:** Mark the project private, declare the intended npm toolchain, and remove npm publishing boilerplate that does not describe this application.

**Rationale:** Limen is a deployed private application rather than a published library. Its manifest should communicate that fact and prevent accidental publication.

### Formatting

**Choice:** Add Prettier, format all maintained source, configuration, test, and documentation files once, and enforce formatting in local and CI checks.

**Rationale:** The repository currently mixes formatting conventions without an automated formatter. A single baseline removes recurring style decisions. Generated migrations, generated snapshots, build output, dependency artifacts, and lockfile internals will not be manually rewritten merely for visual consistency.

### Test Organization

**Choice:** Keep the current test framework, allow structure-coupled tests to be rewritten when cleanup changes internal paths, and configure discovery to execute only named test files.

**Rationale:** Tests should protect behavior rather than incidental source layout. Helper modules must be imported by tests without being reported as standalone tests. A wholesale test-directory reorganization is not required.

### Documentation

**Choice:** Keep a concise Chinese README and move detailed API and deployment guidance into tracked documents under `docs/`; track the entire `docs/` tree, including Formless specifications and plans.

**Rationale:** Onboarding information should remain easy to scan, while operational and interface details need stable, linkable homes. Tracking all documentation removes the current ambiguous state where local workflow artifacts exist under an ignored directory.

### Local Development Origins

**Choice:** Replace committed machine-specific development origins with environment-driven configuration documented in `.env.example`.

**Rationale:** LAN hostnames and addresses belong to a developer's environment. The repository should provide a portable default while still supporting mobile and LAN testing when explicitly configured.

### Dependency Changes

**Choice:** Remove only dependencies proven unused after accounting for framework and peer requirements; do not combine the cleanup with broad upgrades.

**Rationale:** Dependency cleanup belongs in repository maintenance, but upgrades would add unrelated compatibility risk. A package used indirectly by a selected framework adapter is not considered unused merely because application code does not import it directly.

## Design

The existing top-level source layout remains:

```text
src/
  app/                     Next.js routes, layouts, loading/error UI, and route handlers
  components/              Application components and generic UI primitives
    ui/                    Low-level reusable controls
  lib/                     Domain and server utilities
    actions/               Server actions and their testable cores
    ai/                    AI processing and polling behavior
    auth/                  Authentication and response security
    db/                    Database client and schema
  proxy.ts                 Next.js proxy entrypoint
```

The cleanup will audit each source file for naming, responsibility, imports, error handling, and meaningful duplication. Changes are justified when they reduce a concrete ambiguity, remove dead code, consolidate an established concept, or restore an existing boundary. Large-scale moves based only on aesthetic symmetry are excluded.

Client components must not import server-only modules. Route handlers and server actions must retain authorization at their own boundaries. Pure validation, formatting, pagination, tag, date, and view-model logic should remain independently testable. Broad directory-level barrel exports will not be introduced.

The test command will use explicit `*.test.ts`, `*.test.tsx`, and `*.test.mjs` discovery or an equivalent deterministic mechanism. Shared fixtures remain under `tests/helpers` and will no longer appear as successful test files.

The README will contain the project purpose, prerequisites, quick start, essential commands, environment setup, and links to detailed documentation. `docs/api.md` will own HTTP API contracts and client examples. `docs/deployment.md` will own Neon and Vercel setup, migration operations, secret rotation, and deployment verification. Existing Formless documents will be tracked rather than silently excluded.

## Interfaces and Data Flow

Public interfaces remain unchanged:

- Browser routes retain their current paths, rendering behavior, and authentication redirects.
- API routes retain their methods, Bearer authorization, validation rules, status codes, and JSON shapes.
- Server actions retain their outcomes and navigation behavior.
- The Drizzle schema and existing SQL migration history remain unchanged.
- Password authentication, session cookies, and the single environment-configured API Token retain their current behavior.
- AI processing continues to use Next.js `after()` and the existing manual regeneration behavior; no persistent job or automatic retry mechanism is added.
- Existing production environment variables retain their names and meanings.

One development-only interface is added: a documented optional environment variable containing a comma-separated list of allowed development origins. Missing or blank configuration produces a portable default without committed personal network addresses.

The npm command surface becomes the supported developer interface. README and CI must use those commands consistently. Removed command aliases do not require backward compatibility because a complete command redesign was approved.

## Errors and Edge Cases

- Environment-driven development origins must trim whitespace and ignore empty list items.
- Test discovery must be shell-independent for the supported Node/npm environment and must not execute helper files as tests.
- Formatting must exclude generated output and dependency directories and must not rewrite migration snapshots in a way that changes generated semantics.
- Cleanup must preserve Next.js special filenames and route conventions.
- Existing intentionally logged failures in negative-path tests may remain; suppressing meaningful production logging merely to make tests quiet is not required.
- Dependency removal is allowed only after searches account for direct imports, framework adapters, peer requirements, configuration usage, and runtime loading.
- Documentation must not contain real credentials, private LAN addresses, or production secrets.
- If a proposed code cleanup requires a schema migration, route change, UI behavior change, or new runtime service, it is outside this specification and must be deferred.

## Compatibility and Rollout

Tooling, documentation, formatting, configuration, tests, and local code cleanup should be implemented in reviewable stages. Formatting-only churn should be kept separable from semantic edits as much as practical. Existing database migrations will not be regenerated.

Node.js remains on major version 24 and npm remains the package manager. Deployment remains compatible with the existing Vercel and Neon setup. No data migration, feature flag, credential rotation, or client update is required.

## Acceptance Criteria

- `package.json` identifies Limen as private, contains no irrelevant publishing boilerplate, and exposes the documented command contract.
- One documented command runs formatting verification, ESLint, TypeScript checking, and the complete test suite without executing helper files as tests.
- The production build succeeds using documented CI environment placeholders.
- CI invokes the same supported npm commands documented for contributors.
- Prettier configuration and ignore rules exist, and maintained source, configuration, tests, and Markdown pass `format:check`.
- The existing `src/app`, `src/components`, and `src/lib` architecture remains recognizable and contains no newly imposed feature-first or module hierarchy.
- Code changes are limited to demonstrable naming, responsibility, duplication, dead-code, import-boundary, or consistency improvements.
- Existing UI, routes, API responses, authentication, database schema, AI processing, and business behavior remain unchanged.
- Tests preserve existing behavioral coverage and no helper module is reported as a standalone test.
- README provides a concise Chinese quick start and command reference and links to tracked `docs/api.md` and `docs/deployment.md`.
- The entire `docs/` directory is eligible for version control, including `docs/formless/`.
- Committed configuration contains no personal LAN hostname or address; optional development origins are configured through a documented environment variable.
- Dependencies removed during cleanup are demonstrated unused, while dependency versions are not broadly upgraded.
- `npm run check` and `npm run build` pass after the completed cleanup.
- `git status` after verification contains no generated build, test, database, or formatter artifacts that should be ignored.

## Open Questions

None.
