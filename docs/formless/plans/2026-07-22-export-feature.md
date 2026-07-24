# Export Feature Implementation Plan

**Status:** Draft

**Source Spec:** `docs/formless/specs/2026-07-22-export-feature.md`

## Goal

Add a `/export` page where authenticated users can download their diary entries as a single Markdown file, with optional date-range and tag filters.

## Background

Limen is a Next.js diary app with a single `entries` table (content, title, summary, tags as JSON string, createdAt). Auth uses JWT session cookies. Existing patterns: server actions in `lib/actions/` with dependency-injected core functions, server components in `app/`, client components in `components/`, session checks via `getSession()` or `requireSession()`.

The `/export` route is a new top-level page outside the `(dashboard)` route group. It will check session server-side (same pattern as dashboard layout), render a filter form, and use a server action to generate and return a downloadable Markdown file.

## Architecture

- **Server action** under `lib/actions/export.ts` (with `export-core.ts` for testable logic) handles building the Markdown and querying entries
- **Server component** at `app/export/page.tsx` checks session, fetches all available tags for the filter UI, renders the form
- **Client component** at `components/ExportForm.tsx` provides date-range inputs, tag multi-select, and a download button. The form uses native `<form action={serverAction}>` (no JS interception) so the browser handles the file download response
- **Messages** added to `lib/messages.ts` for export page UI strings
- **Nav link** added in dashboard `layout.tsx` header next to existing navigation items

## Constraints

- All new UI uses the existing CSS theme tokens (bg, surface, surface2, text, muted, border, primary)
- Messages follow the existing Chinese `messages` pattern
- Export action must respect the same session authorization as all other actions
- Tags stored as JSON string in `text` column — filtering requires either PostgreSQL JSONB operators or LIKE patterns

## Context Map

- `src/lib/db/schema.ts` — entries table definition and columns
- `src/lib/actions/entries-core.ts` — existing server action pattern (dependency injection, authorize)
- `src/lib/actions/result.ts` — ActionResult type
- `src/lib/messages.ts` — Chinese UI strings (add export strings here)
- `src/lib/format.ts` — date formatting utilities
- `src/app/(dashboard)/layout.tsx` — existing header layout, session check pattern, add nav link here
- `src/app/(dashboard)/entries/new/page.tsx` — example top-of-dashboard server page
- `src/components/ui/input.tsx` — existing input component for date inputs
- `src/components/ui/button.tsx` — button component with variants

## Tasks

### Task 1: Export server action and Markdown builder

**Outcome:**

A server action `exportEntries` that accepts optional filters (date range, tags), queries the entries table, builds a concatenated Markdown string, and returns a downloadable `Response`.

**Context:**

The action must authorize via `requireSession()`. Filter parameters arrive as FormData fields. Tag filtering uses `AND` semantics (entries must match ALL selected tags). The Markdown output follows the spec format with file header, per-entry frontmatter blocks, and `---` separators.

**Files:**

- Create: `src/lib/actions/export-core.ts`
- Create: `src/lib/actions/export.ts`

**Decisions and Boundaries:**

- Tags are stored as `text` (JSON string `["tag1","tag2"]`). For AND tag filtering, cast to `jsonb` in PostgreSQL and use `@>` containment operator: `sql\`${entries.tags}::jsonb @> ${JSON.stringify(selectedTags)}\``. This is precise and supports multi-tag AND filtering.
- Date filtering uses `>=` and `<=` on `entries.createdAt` (a `date` column, no time component).
- The action returns a `Response` with `Content-Disposition: attachment; filename="limen-export-YYYY-MM-DD.md"` and `Content-Type: text/markdown; charset=utf-8`.
- Entries are ordered by `createdAt ASC, id ASC` for chronological export.
- The Markdown builder is a pure function in `export-core.ts` — takes an array of entry rows, returns the full Markdown string. This makes it testable without DB access.

**Interfaces:**

- Consumes: `AppDatabase`, `entries` table schema, `requireSession` from auth
- Produces: `exportEntries(formData: FormData): Promise<Response>` — server action callable from a form

**Verification:**

- Run `npm run typecheck` — no type errors
- Verify the Markdown builder function produces correct output for a sample entry array: header block, frontmatter, separator between entries, no trailing separator after last entry
- Verify `Content-Disposition` and `Content-Type` headers on the Response

**Escalate if:**

- PostgreSQL JSONB `@>` operator requires an index on `tags` for performance with large datasets — discuss adding a GIN index if needed
- The total export approaches the Vercel serverless response limit — discuss streaming or chunking

---

### Task 2: Export page and form component

**Outcome:**

A server component at `/export` that checks session, renders a filter form with date range and tag options, and a client component that handles filter interaction and triggers the download.

**Context:**

The page must redirect unauthenticated users to `/login`. It needs to know all existing tags in the system so the tag multi-select can list them. The form submits to the `exportEntries` server action (Task 1) using native form submission (no `preventDefault`/`useTransition` for the download action, since the browser must receive the file Response directly).

**Files:**

- Create: `src/app/export/page.tsx`
- Create: `src/components/ExportForm.tsx`
- Modify: `src/lib/messages.ts`

**Decisions and Boundaries:**

- `page.tsx` is a server component that: (1) calls `getSession()`, redirects to `/login` if null; (2) queries all distinct tags across entries; (3) renders `<ExportForm availableTags={...} />`.
- Tags are collected from the DB: load all entries' tags, parse the JSON strings, deduplicate, sort alphabetically. This keeps the query simple (one column select, no new index needed). For very large datasets, a dedicated tags table or materialized view could be considered later.
- `ExportForm.tsx` is a client component with:
  - Date range: two `<Input type="date">` (from/to)
  - Tags: checkboxes list of available tags, or a simpler multi-select
  - "Download" button (type="submit")
  - `<form action={import('../lib/actions/export').exportEntries}>` — native form submission for file download
- No loading/success/error states needed client-side — the browser handles the download natively. If no entries match, the server action returns an empty file with header showing 0 entries.
- Add export-related messages to `messages.ts`:
  - `exportPage.title`: "导出日记"
  - `exportPage.description`: "将所有日记条目导出为 Markdown 文件"
  - `exportPage.dateFrom`: "开始日期"
  - `exportPage.dateTo`: "结束日期"
  - `exportPage.tags`: "标签筛选"
  - `exportPage.download`: "下载 Markdown"
  - `exportPage.noEntries`: "没有找到符合条件的条目"
  - `exportPage.total`: (count: number) => `共 ${count} 篇`

**Interfaces:**

- Consumes: `exportEntries` from Task 1, `getSession` from auth, `entries` table for tag listing, `parseStoredTags` from tags
- Produces: `/export` page route, `ExportForm` client component

**Verification:**

- Visit `/export` while logged in — page renders with filter form and download button
- Visit `/export` while logged out — redirects to `/login`
- Click "Download" with no filters — downloads a `.md` file with all entries
- Set date range + tags — only matching entries in the download
- Filter that matches nothing — downloads a file with 0 entries and appropriate header

**Escalate if:**

- None expected.

---

### Task 3: Dashboard navigation link

**Outcome:**

A visible but unobtrusive link/button in the dashboard header that navigates to `/export`.

**Context:**

The dashboard layout at `src/app/(dashboard)/layout.tsx` already has a header with the app logo, search bar, "new entry" (+), and logout button. The export link fits naturally in the right-side action group.

**Files:**

- Modify: `src/app/(dashboard)/layout.tsx`

**Decisions and Boundaries:**

- Add a small text link "导出" (or icon button variant="ghost") next to the "+" New button. For consistency, use `Button variant="ghost" size="sm" asChild` wrapped around a `Link` to `/export`.
- Use lucide-react `Download` icon matching the existing `PlusCircle` icon pattern
- Using an icon may clash with potential other needs — use text label "导出" for clarity
- Adding `import { Download } from 'lucide-react'`

**Interfaces:**

- Consumes: `exportPath` from pathname utility (add to `src/lib/pathname.ts` if desired, or inline `/export`)
- Produces: visible nav link in dashboard header

**Verification:**

- Navigate to dashboard — "导出" link visible in the header
- Click it — navigates to `/export`

**Escalate if:**

- None expected.

---

## Verification Strategy

- **Type safety:** `npm run typecheck` across all changes
- **Auth:** Manual session check — logged-in user sees the page, logged-out user is redirected
- **Export correctness:** Download with default (all), filtered (date/tags), and empty-result scenarios — verify file content in each case
- **No new tests justified:** The Markdown builder is a pure function worth testing, but the export behavior is exercised primarily by the browser-native download flow. Given the small, non-critical nature of this feature and the absence of a complex failure mode, manual verification is proportionate. If the pure Markdown builder grows more complex later, add a test then.
