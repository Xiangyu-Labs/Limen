import type { TimelineEntriesPage, TimelineEntry } from '@/lib/dashboard-data';

export function mergeTimelinePages(
  pages: TimelineEntriesPage[] | undefined,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const seen = new Set<string>();
  for (const page of pages ?? []) {
    for (const entry of page.items) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      entries.push(entry);
    }
  }
  return entries;
}

export type TimelineSection = {
  key: string;
  label: string;
  entries: TimelineEntry[];
};

/**
 * Groups the timeline by calendar month.
 *
 * The per-row date only shows MM-DD, so once a journal spans more than a year
 * a run of "03-14" tells you nothing about which year you are looking at. The
 * section heading carries the year; consecutive months in the same year keep
 * it, because a heading that sometimes omits the year reads as an error.
 *
 * Entries arrive already ordered by the query, so this only has to fold runs.
 */
export function groupTimelineEntriesByPeriod(
  entries: TimelineEntry[],
): TimelineSection[] {
  const sections: TimelineSection[] = [];
  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const last = sections.at(-1);
    if (last?.key === key) {
      last.entries.push(entry);
      continue;
    }
    sections.push({ key, label: `${year} 年 ${month} 月`, entries: [entry] });
  }
  return sections;
}

export type HighlightSegment = { text: string; matched: boolean };

/**
 * Splits text so a search term can be marked in the result.
 *
 * Case-insensitive, and the query is treated as a literal, never a pattern —
 * the same promise the SQL side makes by escaping LIKE wildcards.
 */
export function splitHighlightSegments(
  text: string,
  query?: string,
): HighlightSegment[] {
  const needle = query?.trim();
  if (!needle) return [{ text, matched: false }];

  const segments: HighlightSegment[] = [];
  const haystack = text.toLowerCase();
  const lowered = needle.toLowerCase();
  let cursor = 0;

  for (;;) {
    const index = haystack.indexOf(lowered, cursor);
    if (index === -1) break;
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), matched: false });
    }
    segments.push({
      text: text.slice(index, index + needle.length),
      matched: true,
    });
    cursor = index + needle.length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false });
  }
  return segments.length > 0 ? segments : [{ text, matched: false }];
}
