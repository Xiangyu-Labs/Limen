import type { TimelineEntriesPage, TimelineEntry } from '@/lib/dashboard-data';

export function mergeTimelinePages(pages: TimelineEntriesPage[] | undefined): TimelineEntry[] {
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
