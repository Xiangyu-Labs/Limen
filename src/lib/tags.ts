const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== 'string') continue;
    const tag = candidate.trim().slice(0, MAX_TAG_LENGTH);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

export function parseStoredTags(value: string | null): string[] {
  if (!value) return [];
  try {
    return normalizeTags(JSON.parse(value));
  } catch {
    return [];
  }
}
