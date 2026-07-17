'use server';

import { after } from 'next/server';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { processAIEntries, processAIEntry } from '@/lib/ai/processor';
import { requireSession } from '@/lib/auth/session';
import { createEntryActions } from './entries-core';

const entryActions = createEntryActions({
  db,
  createId: () => nanoid(12),
  scheduleAI: (job) => after(job),
  processAIEntry,
  processAIEntries,
  authorize: requireSession,
  revalidatePath,
  redirect,
});

export type EntryFormState = { error?: string } | undefined;

export async function createEntry(_state: EntryFormState, formData: FormData) {
  return entryActions.createEntry(formData);
}
export const deleteEntry = entryActions.deleteEntry;
export async function updateEntry(id: string, _state: EntryFormState, formData: FormData) {
  return entryActions.updateEntry(id, formData);
}
export const regenerateEntryMetadata = entryActions.regenerateEntryMetadata;
export const bulkRegenerateEntryMetadata = entryActions.bulkRegenerateEntryMetadata;
export const bulkDeleteEntries = entryActions.bulkDeleteEntries;
