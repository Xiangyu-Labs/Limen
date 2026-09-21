import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';

/**
 * Cached per request so a page and its generateMetadata can both read the
 * entry without issuing two queries.
 */
export const getEntryById = cache((id: string) =>
  db.query.entries.findFirst({ where: eq(entries.id, id) }),
);
