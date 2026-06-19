import { db as appDb } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { processAIEntry as runAI } from '@/lib/ai/processor';
import { revalidatePath as nextRevalidatePath } from 'next/cache';
import { redirect as nextRedirect } from 'next/navigation';
import { eq, inArray } from 'drizzle-orm';
import { dashboardPath, entryDetailPath, entryEditPath } from '@/lib/pathname';

type EntryActionDeps = {
  db: typeof appDb;
  createId: () => string;
  scheduleAI: (job: () => Promise<void>) => void | Promise<void>;
  processAIEntry: typeof runAI;
  revalidatePath: typeof nextRevalidatePath;
  redirect: typeof nextRedirect;
};

export function parseEntryDateTimeInput(input: string | null | undefined) {
  if (!input) return new Date();
  return input.includes('Z') ? new Date(input) : new Date(`${input}:00.000Z`);
}

export function createEntryActions({
  db,
  createId,
  scheduleAI,
  processAIEntry,
  revalidatePath,
  redirect,
}: EntryActionDeps) {
  return {
    async createEntry(formData: FormData) {
      const content = formData.get('content') as string;
      const createdAtInput = formData.get('createdAt') as string | null;

      if (!content || content.trim().length === 0) {
        return { error: 'Content is required' };
      }

      const id = createId();
      await db.insert(entries).values({
        id,
        content,
        source: 'web',
        aiStatus: 'pending',
        createdAt: parseEntryDateTimeInput(createdAtInput),
        updatedAt: new Date(),
      });

      await scheduleAI(async () => {
        await processAIEntry(id, content).catch(err => {
          console.error(`AI background processing failed for entry ${id}:`, err);
        });
      });

      revalidatePath(dashboardPath());
      redirect(dashboardPath());
    },

    async deleteEntry(id: string) {
      await db.delete(entries).where(eq(entries.id, id));
      revalidatePath(dashboardPath());
      redirect(dashboardPath());
    },

    async updateEntry(id: string, formData: FormData) {
      const content = (formData.get('content') as string | null)?.trim() ?? '';
      if (!content) {
        redirect(entryEditPath(id));
      }

      const createdAtInput = formData.get('createdAt') as string | null;
      const createdAt = parseEntryDateTimeInput(createdAtInput);

      await db.update(entries).set({
        title: null,
        summary: null,
        tags: null,
        content,
        aiStatus: 'pending',
        createdAt,
        updatedAt: new Date(),
      }).where(eq(entries.id, id));

      await scheduleAI(async () => {
        await processAIEntry(id, content).catch(err => {
          console.error(`AI update processing failed for entry ${id}:`, err);
        });
      });

      revalidatePath(dashboardPath());
      revalidatePath(entryDetailPath(id));
      redirect(entryDetailPath(id));
    },

    async regenerateEntryMetadata(id: string) {
      const entry = await db.query.entries.findFirst({
        where: eq(entries.id, id),
      });

      if (!entry) {
        redirect(dashboardPath());
        return;
      }

      const content = entry.content;

      await db.update(entries).set({
        aiStatus: 'pending',
        updatedAt: new Date(),
      }).where(eq(entries.id, id));

      await scheduleAI(async () => {
        await processAIEntry(id, content).catch(err => {
          console.error(`AI regeneration failed for entry ${id}:`, err);
        });
      });

      revalidatePath(dashboardPath());
      revalidatePath(entryDetailPath(id));
      redirect(entryDetailPath(id));
    },

    async bulkRegenerateEntryMetadata(ids: string[]) {
      const normalizedIds = ids.filter(Boolean);
      if (normalizedIds.length === 0) return;

      const foundEntries = await db.query.entries.findMany({
        where: inArray(entries.id, normalizedIds),
      });
      const entryMap = new Map(foundEntries.map((entry) => [entry.id, entry]));

      await db.update(entries).set({
        aiStatus: 'pending',
        updatedAt: new Date(),
      }).where(inArray(entries.id, normalizedIds));

      await scheduleAI(async () => {
        for (const id of normalizedIds) {
          const entry = entryMap.get(id);
          if (!entry) continue;
          await processAIEntry(id, entry.content).catch(err => {
            console.error(`AI bulk regeneration failed for entry ${id}:`, err);
          });
        }
      });

      revalidatePath(dashboardPath());
    },

    async bulkDeleteEntries(ids: string[]) {
      const normalizedIds = ids.filter(Boolean);
      if (normalizedIds.length === 0) return;

      await db.delete(entries).where(inArray(entries.id, normalizedIds));
      revalidatePath(dashboardPath());
    },
  };
}
