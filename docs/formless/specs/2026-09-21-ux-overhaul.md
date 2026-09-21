# UX Overhaul Specification

**Status:** Implemented

## Goal

Close twenty-two findings from a full review of `src/`, covering four paths a
daily user actually walks: writing an entry, finding an old one, deleting one,
and the cost of simply loading a page.

## Silent Failures

Four defects produced no error and no warning, which is why they survived:

- `prose` utilities were used on entry bodies while `@tailwindcss/typography`
  was never installed. Tailwind emits nothing for unknown utilities, and
  preflight had already reset heading sizes and list markers, so Markdown
  rendered flat.
- `react-markdown` ran without `remark-breaks`, collapsing the single newlines
  that diary entries are mostly made of.
- `data-theme` was set on one `div` inside the dashboard layout, leaving the
  login page, the document background and every toast on the light palette.
- `@custom-variant dark` targeted a `.dark` class the app never applies, so any
  `dark:` utility would have been inert.

## Data Ownership

The AI owned title, summary and tags outright, and `updateEntry` cleared all
three before queueing a regeneration — so a failed AI call destroyed them
permanently. Metadata is now retained until replaced. Title and tags are
editable by hand, each guarded by its own lock column (`title_locked_at`,
`tags_locked_at`) that the AI respects. Clearing both locks returns the fields
to automatic generation.

## Tags

Tags move from a JSON array stored in `entries.tags` to `tags` and `entry_tags`.
Tag listing, timeline filtering and export filtering all run against indexes.
Existing data is backfilled inside the migration, tolerating the corrupt JSON
that `parseStoredTags` has always accepted.

## Deletion

Deletion is soft. Entries move to a recycle bin at `/settings/trash`, can be
undone from the toast that follows the delete, and are purged after 30 days
along with any tags left unreferenced. Every user-facing read excludes trashed
rows through a named scope, enforced by a guard test rather than by convention.
`DELETE /api/entries/[id]` is soft as well; permanent deletion is web-only.

## Reads and Writes

No user-facing read issues a write before responding. Stale-pending recovery
moved to `after()` with a per-instance throttle; the AI status polling routes
keep it synchronous, since freshness is their purpose.

## Sessions

The session cookie renews when it has under three days left, so an active
reader never meets the seven-day wall. The single plaintext `AUTH_PASSWORD`
design is unchanged: password rotation remains an environment-variable
operation.

## Exclusions

No hashed credentials, no in-app password change, no separate API token, no
attachments, no offline write queue, and no hard-delete API endpoint.
