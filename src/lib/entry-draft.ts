import { ENTRY_CONTENT_MAX_LENGTH, parseEntryDate } from '@/lib/validation';

const DRAFT_VERSION = 1;
const DRAFT_PREFIX = 'limen:entry-draft:';

export type EntryDraft = {
  content: string;
  createdAt: string;
  savedAt: string;
};

export function hasEntryDraftChanges(
  content: string,
  createdAt: string,
  initialContent: string,
  initialCreatedAt: string,
) {
  return content !== initialContent || createdAt !== initialCreatedAt;
}

export function entryDraftKey(mode: 'create' | 'edit', entryId?: string) {
  return mode === 'create'
    ? `${DRAFT_PREFIX}new`
    : `${DRAFT_PREFIX}edit:${entryId ?? ''}`;
}

export function serializeEntryDraft(
  content: string,
  createdAt: string,
  savedAt = new Date(),
) {
  return JSON.stringify({
    version: DRAFT_VERSION,
    content,
    createdAt,
    savedAt: savedAt.toISOString(),
  });
}

export function parseEntryDraft(value: string | null): EntryDraft | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      parsed.version !== DRAFT_VERSION ||
      typeof parsed.content !== 'string' ||
      parsed.content.length > ENTRY_CONTENT_MAX_LENGTH ||
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.savedAt !== 'string' ||
      Number.isNaN(new Date(parsed.savedAt).getTime())
    ) {
      return null;
    }
    if (parsed.createdAt) parseEntryDate(parsed.createdAt);
    return {
      content: parsed.content,
      createdAt: parsed.createdAt,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}
