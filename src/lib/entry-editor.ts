import { ENTRY_CONTENT_MAX_LENGTH } from '@/lib/validation';

// Start warning with enough room left to react before the limit bites.
export const CONTENT_WARNING_RATIO = 0.9;

type EditorCopy = {
  characters: (count: number) => string;
  charactersNearLimit: (count: number, max: number) => string;
  charactersOverLimit: (count: number, max: number) => string;
};

/**
 * The character counter and whether the content may be submitted.
 *
 * The textarea used to carry maxLength, which silently truncated a long paste
 * with no feedback at all. Now the text is kept and the editor says why it
 * cannot be saved.
 */
export function describeContentLength(
  length: number,
  copy: EditorCopy,
  max = ENTRY_CONTENT_MAX_LENGTH,
): { text: string; tone: 'muted' | 'warning' | 'danger'; overLimit: boolean } {
  if (length > max) {
    return {
      text: copy.charactersOverLimit(length, max),
      tone: 'danger',
      overLimit: true,
    };
  }
  if (length >= max * CONTENT_WARNING_RATIO) {
    return {
      text: copy.charactersNearLimit(length, max),
      tone: 'warning',
      overLimit: false,
    };
  }
  return { text: copy.characters(length), tone: 'muted', overLimit: false };
}

export function isEntrySubmittable({
  content,
  overLimit,
  pending,
}: {
  content: string;
  overLimit: boolean;
  pending: boolean;
}) {
  return !pending && !overLimit && content.trim().length > 0;
}
