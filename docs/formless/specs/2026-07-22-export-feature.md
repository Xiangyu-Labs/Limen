# Settings and Export Specification

**Status:** Implemented

## Goal

Provide one authenticated `/settings` page for instance-wide preferences and
self-service diary backups. There is no separate `/export` page.

## Settings

The single-user `settings` table uses the fixed owner ID `owner`. Missing data
falls back to:

- theme: `system`
- time zone: `Asia/Shanghai`
- editor font size: `medium`
- default export format: `markdown`

Settings are validated and saved with an upsert. Themes are `system`, `light`,
and `dark`; editor sizes are `small` (16px), `medium` (18px), and `large`
(20px); export formats are `markdown` and `json`. The time zone must be a valid
IANA identifier. Theme tokens are applied by the authenticated dashboard layout,
and the time zone determines the default date for new entries and export file
names.

## Export Interface

The settings page submits a native GET form to `GET /api/export`:

- `format=markdown|json` is required.
- `from=YYYY-MM-DD` and `to=YYYY-MM-DD` are optional and inclusive.
- `tags=<tag>` may be repeated. Multiple tags use OR semantics.

The route requires the session cookie. Invalid parameters, query failures, and
empty results redirect to `/settings?export=invalid|error|empty`. Unauthorized
requests redirect to `/login`. Errors never expose database details.

Date predicates run in SQL. Results use the stable order `createdAt ASC,
recordedAt ASC, id ASC`. Tags are parsed and filtered in the application with
the tolerant stored-tag parser so corrupt historical JSON cannot abort a full
backup.

Successful responses are streamed with `Cache-Control: no-store`, a correct
MIME type, and an attachment filename dated in the saved time zone.

## Formats

Markdown is one chronological file. Its header records generation time, entry
count, date filters, and tag filters. Every entry has JSON-escaped YAML
frontmatter, a heading, its diary date, and the original Markdown body.

JSON is a lossless, versioned backup object with `schemaVersion: 1`,
`exportedAt`, normalized filter metadata, and `entries`. Every entry preserves
`id`, `content`, `title`, `summary`, the original stored `tags` value, `source`,
`aiStatus`, `createdAt`, `recordedAt`, and `updatedAt`.

## Exclusions

This version does not add import, ZIP output, automatic backup, data deletion,
password settings, AI configuration, or per-device preferences.
