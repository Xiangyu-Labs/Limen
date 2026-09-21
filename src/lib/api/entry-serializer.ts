/**
 * The public Bearer API's entry shape.
 *
 * Both entry endpoints used to return the raw database row, which meant every
 * new column joined the public contract by accident. Internal bookkeeping such
 * as tags_locked_at and deleted_at must never reach a client.
 */
export type ApiEntry = {
  id: string;
  content: string;
  title: string | null;
  summary: string | null;
  /** A JSON array string, kept for compatibility with existing clients. */
  tags: string;
  source: string | null;
  aiStatus: string | null;
  createdAt: string;
  recordedAt: string;
  updatedAt: string | null;
};

export function serializeApiEntry(row: {
  id: string;
  content: string;
  title: string | null;
  summary: string | null;
  tags: string[];
  source: string | null;
  aiStatus: string | null;
  createdAt: Date;
  recordedAt: Date;
  updatedAt: Date | null;
}): ApiEntry {
  return {
    id: row.id,
    content: row.content,
    title: row.title,
    summary: row.summary,
    // docs/api.md documents this as a JSON string and the Shortcuts client
    // relies on it, so the array is re-serialized rather than sent as-is.
    tags: JSON.stringify(row.tags),
    source: row.source,
    aiStatus: row.aiStatus,
    createdAt: row.createdAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}
