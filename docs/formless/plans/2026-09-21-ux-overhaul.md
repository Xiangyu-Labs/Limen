# UX Overhaul Implementation Plan

**Status:** Implemented

**Source Spec:** `docs/formless/specs/2026-09-21-ux-overhaul.md`

## Architecture

- The theme is applied at `<html>` from the root layout, which also supplies
  the toast theme and `generateViewport`'s `themeColor`.
- `MarkdownContent` is the single renderer, shared by the detail page and the
  editor preview, so what is written and what is read cannot drift.
- `lib/db/entry-tags.ts` is the only reader and writer of tag rows.
  `syncEntryTags` inserts before deleting and encodes the lock in its SQL
  predicates, because `drizzle-orm/neon-http` has no interactive transactions.
- `lib/db/entry-scope.ts` names the deleted-state scopes and
  `lib/db/entries-repo.ts` provides scoped single-entry readers.
- `lib/trash/purge.ts` owns retention and orphan-tag collection.
- Editor, draft, stats, streak, highlight, grouping, scroll-restore and undo
  logic all live in exported pure functions, keeping them testable without a
  DOM in line with the existing suite.

## Migrations

`0005` adds `tags`/`entry_tags` and backfills them; `0006` drops
`entries.tags`; `0007` adds `deleted_at` and makes the timeline and AI-status
indexes partial on `deleted_at IS NULL`; `0008` adds `title_locked_at`.

Only DML is hand-written — DDL comes from `db:generate`, or the snapshot drifts
and the next generate re-emits it. The drop is a separate file from the
backfill because a migration file has no transaction on neon-http.

## Guardrails

- `tests/entry-scope-guard.test.ts` fails the build when a file queries
  `entries` without a scope, and when anything calls `.transaction()`. The
  partial indexes make a missing scope a performance regression, not just a
  correctness one.
- `tests/migration-normalized-tags.test.ts` replays the real migrations against
  PGlite with NULL, empty, malformed, non-array and oversized legacy values.
- `tests/soft-delete-read-paths.test.ts` asserts invisibility once per read
  path, as a named list that grows by one line.

## Verification

`npm run check` (224 tests), `npm run build`, and `npm audit` all pass. The
audit had been failing before this work, including an unauthenticated RCE
advisory against Next.js.
