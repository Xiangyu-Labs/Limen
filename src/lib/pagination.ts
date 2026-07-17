import { InputValidationError } from '@/lib/validation';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type EntryCursor = {
  createdAt: Date;
  id: string;
};

export function encodeEntryCursor(cursor: EntryCursor): string {
  return Buffer.from(JSON.stringify({
    v: 1,
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  })).toString('base64url');
}

export function decodeEntryCursor(value: string | null | undefined): EntryCursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown>;
    const createdAt = new Date(String(parsed.createdAt));
    if (
      parsed.v !== 1 ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0 ||
      parsed.id.length > 64 ||
      Number.isNaN(createdAt.getTime())
    ) {
      throw new Error('invalid cursor');
    }
    return { createdAt, id: parsed.id };
  } catch {
    throw new InputValidationError('分页 cursor 无效');
  }
}

export function parsePageLimit(value: string | null | undefined): number {
  if (!value) return DEFAULT_PAGE_SIZE;
  if (!/^\d+$/.test(value)) throw new InputValidationError('limit 必须是整数');
  const limit = Number(value);
  if (limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new InputValidationError(`limit 必须在 1 到 ${MAX_PAGE_SIZE} 之间`);
  }
  return limit;
}
