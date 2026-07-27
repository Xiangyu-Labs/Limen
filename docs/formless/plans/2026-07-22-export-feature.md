# Settings and Export Implementation Plan

**Status:** Implemented

**Source Spec:** `docs/formless/specs/2026-07-22-export-feature.md`

## Architecture

- `settings` stores a fixed-owner record with database constraints and an
  application-level default reader.
- A session-protected Server Action validates and upserts preferences.
- The dashboard layout reads settings once per request and applies theme tokens.
- New and edit entry pages pass the saved editor size to the shared editor; new
  entries derive their date in the saved time zone.
- `/settings` contains both preferences and a native GET export form.
- `/api/export` is a session-protected Route Handler. Query parsing, SQL loading,
  tolerant tag filtering, serializers, and response streaming are separate,
  testable layers.

## Export Flow

1. Validate format, inclusive date bounds, and repeated tags.
2. Query by date and stable ascending order in SQL.
3. Apply OR tag matching with the tolerant tag parser.
4. Redirect empty/error cases to status feedback on `/settings`.
5. Stream Markdown or versioned JSON with download headers and a filename dated
   in the configured time zone.

The previous design using `/export`, AND tag matching, JSONB casts, and a Server
Action returning a file response is superseded by this implementation.

## Verification

Automated tests cover migrations/defaults, settings validation and upsert,
timezone boundaries, inclusive SQL filtering, stable ordering, corrupt tags,
both serializers, route authentication and redirects, download headers, page
controls, theme application, and all three editor sizes. The repository-wide
`npm run check` remains the release gate.
