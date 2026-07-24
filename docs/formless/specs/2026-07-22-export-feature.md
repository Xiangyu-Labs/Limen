# Export Feature Specification

**Status:** Approved

## Problem

Users have no way to download or back up their diary entries. The diary data exists only in the database, and there is no self-service mechanism to retrieve it. This is a common requirement for data ownership, offline reading, and migration.

## Goals

- Allow authenticated users to export diary entries as a single Markdown file
- Provide both "export all" and selective export (by date range or tags)
- Make the feature discoverable but unobtrusive within the existing dashboard

## Non-Goals

- Automated/scheduled backups
- Import functionality (re-importing exports)
- PDF or other binary formats
- API endpoint for programmatic export (dashboard API route exists separately)
- Image/media attachment inclusion in export

## Background

Limen is a diary app built on Next.js with a single `entries` table in PostgreSQL. Each entry has content (Markdown), title, summary, tags, createdAt, and aiStatus. Authentication uses JWT-based session cookies. The dashboard is at `/` (locale-aware) with the route group `(dashboard)`. There is no existing export or download functionality.

## Decisions

### Export Format

**Choice:** Markdown (`.md`)

**Rationale:** The entry content is already stored as Markdown, making it the most natural export format. Markdown is human-readable, universally editable, and preserves all formatting. A single concatenated file with `---` separators between entries is simple, universal, and avoids the complexity of ZIP generation on serverless infrastructure.

### Selection Scope

**Choice:** Both "export all" and selective

**Rationale:** The simplest use case is one-click full backup. However, users may want to export a specific period (e.g., one month) or topic. The /export page provides a form with date range + tag filters, defaulting to "all."

### Entry Point

**Choice:** Route `/export`

**Rationale:** Matches the user's own suggestion. A clean, memorable URL that works regardless of locale/client navigation. The page is protected by the existing auth middleware/session check.

### Output Structure

**Choice:** Single file (concatenated Markdown)

**Rationale:** Generating a ZIP archive on Vercel serverless functions (Node.js) requires the `archiver` dependency and streaming. A single concatenated Markdown file is simpler to implement, stream-friendly, and sufficient for a diary where chronological reading is the natural pattern. Entries are separated by `---`, with each entry starting with an `##` heading.

## Design

### Route

- `/export` — server-rendered page, protected by session check (same pattern as dashboard layout)
- GET renders the export form (client component with date/tag filters)
- POST triggers the export download

### Export Page Layout

- Simple page with a title ("Export Diary"), a brief description
- Optional filters: date range (from/to date inputs) and tag multi-select
- A "Download as Markdown" button
- If no entries match the filters, show an appropriate message

### Export Generation

- The `/export` page is a server component that renders a client component with filter controls
- On form submission, a **server action** queries the `entries` table with filters and returns the concatenated Markdown as a downloadable `Response`
- Using a server action (not a Route Handler) keeps the pattern consistent with the existing login flow and avoids duplicating auth checks
- Response uses `Content-Disposition: attachment; filename="limen-export-YYYY-MM-DD.md"` and `Content-Type: text/markdown; charset=utf-8`

### Locale

The export UI uses Chinese (`messages`) consistent with the rest of the app. This is a utility page, not a new locale boundary.

### Markdown Format

Each entry exports as:

```markdown
---
title: "entry title or 'Untitled Capture'"
date: YYYY-MM-DD
tags: [tag1, tag2]
summary: 'AI-generated summary or empty'
---

## Entry Title (or Untitled Capture)

_YYYY-MM-DD_

entry content (Markdown)

---
```

The final `---` separator is omitted after the last entry. The file starts with a header block:

```markdown
# Limen Diary Export

Generated: YYYY-MM-DD
Entries: 42
Date range: 2026-01-15 — 2026-07-22

---
```

## Interfaces and Data Flow

1. User navigates to `/export`
2. Page checks session (server-side), redirects to login if unauthorized
3. User sets optional filters (date range, tags) and clicks download
4. Form POST to server action that queries `entries` table with filters
5. Server constructs concatenated Markdown string
6. Response returned as a file download (with appropriate headers)

## Errors and Edge Cases

- **No entries match filters:** Show message "No entries found for the selected filters" with a button to clear filters
- **Very large export (>50MB):** For serverless function body size limits (Vercel 4.5MB unencoded response, 50MB streaming), use streaming response or chunked transfer. If total exceeds a reasonable threshold, warn the user and advise narrowing filters
- **No session:** Redirect to login page (existing pattern)
- **Database error:** Show error toast and retry option
- **Tags selection:** Tags are stored as JSON string in DB (`["tag1","tag2"]`). Filtering uses `LIKE` or `@>` (PostgreSQL JSON contains operator) depending on index choice

## Compatibility and Rollout

- `None` — new feature with no backward-compatibility concerns

## Acceptance Criteria

- [x] Authenticated user can visit `/export` and see the export page
- [x] "Download All" exports every diary entry as a single Markdown file
- [x] Filters (date range, tags) correctly narrow the exported entries
- [x] File downloads with correct filename (`limen-export-YYYY-MM-DD.md`)
- [x] Unauthenticated user is redirected to login
- [ ] No entries case shows empty state, not a broken download

## Open Questions

None.
