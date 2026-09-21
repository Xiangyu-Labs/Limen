/**
 * Identifies the SWR keys that hold timeline pages.
 *
 * EntriesTimelineClient runs with `revalidateFirstPage: false`, and SWR's cache
 * is module-global and survives client navigation. Without invalidating these
 * keys, page 0 is served from cache after a delete or a restore, so the entry
 * does not disappear (a bug that predates soft delete) and an undone delete
 * does not come back.
 */
export function isTimelineCacheKey(key: unknown): boolean {
  if (typeof key === 'string') return isTimelineUrl(key);
  // useSWRInfinite wraps page keys in an array.
  if (Array.isArray(key)) return key.some(isTimelineCacheKey);
  return false;
}

function isTimelineUrl(value: string) {
  const url = value.startsWith('@"') ? value.slice(2) : value;
  return (
    url.startsWith('/api/dashboard/entries?') ||
    url === '/api/dashboard/entries'
  );
}
