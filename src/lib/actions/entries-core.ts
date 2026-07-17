import type { AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { processAIEntry as runAI } from '@/lib/ai/processor';
import { revalidatePath as nextRevalidatePath } from 'next/cache';
import { redirect as nextRedirect } from 'next/navigation';
import { eq, inArray } from 'drizzle-orm';
import { dashboardPath, entryDetailPath } from '@/lib/pathname';
import { InputValidationError, normalizeEntryIds, parseEntryInput } from '@/lib/validation';

type EntryActionDeps = {
  db: AppDatabase;
  createId: () => string;
  scheduleAI: (job: () => Promise<void>) => void | Promise<void>;
  processAIEntry: typeof runAI;
  revalidatePath: typeof nextRevalidatePath;
  redirect: typeof nextRedirect;
  authorize?: () => unknown | Promise<unknown>;
  processAIEntries?: (items: Array<{ id: string; content: string }>) => Promise<void>;
};

export function createEntryActions({
  db,
  createId,
  scheduleAI,
  processAIEntry,
  revalidatePath,
  redirect,
  authorize = () => {},
  processAIEntries,
}: EntryActionDeps) {
  return {
    async createEntry(formData: FormData) {
      await authorize();
      let input;
      try {
        input = parseEntryInput(formData.get('content'), formData.get('createdAt'));
      } catch (error) {
        if (error instanceof InputValidationError) return { error: error.message };
        throw error;
      }

      const id = createId();
      await db.insert(entries).values({
        id,
        content: input.content,
        source: 'web',
        aiStatus: 'pending',
        createdAt: input.createdAt,
        updatedAt: new Date(),
      });

      await scheduleAI(async () => {
        await processAIEntry(id, input.content).catch(err => {
          console.error(`AI background processing failed for entry ${id}:`, err);
        });
      });

      revalidatePath(dashboardPath());
      redirect(dashboardPath());
    },

    async deleteEntry(id: string) {
      await authorize();
      await db.delete(entries).where(eq(entries.id, id));
      revalidatePath(dashboardPath());
      redirect(dashboardPath());
    },

    async updateEntry(id: string, formData: FormData) {
      await authorize();
      let input;
      try {
        input = parseEntryInput(formData.get('content'), formData.get('createdAt'));
      } catch (error) {
        if (error instanceof InputValidationError) return { error: error.message };
        throw error;
      }

      await db.update(entries).set({
        title: null,
        summary: null,
        tags: null,
        content: input.content,
        aiStatus: 'pending',
        createdAt: input.createdAt,
        updatedAt: new Date(),
      }).where(eq(entries.id, id));

      await scheduleAI(async () => {
        await processAIEntry(id, input.content).catch(err => {
          console.error(`AI update processing failed for entry ${id}:`, err);
        });
      });

      revalidatePath(dashboardPath());
      revalidatePath(entryDetailPath(id));
      redirect(entryDetailPath(id));
    },

    async regenerateEntryMetadata(id: string) {
      await authorize();
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
      await authorize();
      const normalizedIds = normalizeEntryIds(ids);
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
        const jobs = normalizedIds.flatMap((id) => {
          const entry = entryMap.get(id);
          return entry ? [{ id, content: entry.content }] : [];
        });
        if (processAIEntries) {
          await processAIEntries(jobs);
          return;
        }
        for (const job of jobs) await processAIEntry(job.id, job.content);
      });

      revalidatePath(dashboardPath());
    },

    async bulkDeleteEntries(ids: string[]) {
      await authorize();
      const normalizedIds = normalizeEntryIds(ids);
      if (normalizedIds.length === 0) return;

      await db.delete(entries).where(inArray(entries.id, normalizedIds));
      revalidatePath(dashboardPath());
    },
  };
}
