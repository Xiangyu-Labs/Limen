'use server';

import { after } from 'next/server';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { processAIEntry } from '@/lib/ai/processor';
import { createEntryActions } from './entries-core';

const entryActions = createEntryActions({
  db,
  createId: () => nanoid(12),
  scheduleAI: (job) => after(job),
  processAIEntry,
  revalidatePath,
  redirect,
});

export const createEntry = entryActions.createEntry;
export const deleteEntry = entryActions.deleteEntry;
export const updateEntry = entryActions.updateEntry;
export const regenerateEntryMetadata = entryActions.regenerateEntryMetadata;
export const bulkRegenerateEntryMetadata = entryActions.bulkRegenerateEntryMetadata;
export const bulkDeleteEntries = entryActions.bulkDeleteEntries;
