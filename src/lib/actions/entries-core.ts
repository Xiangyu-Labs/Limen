import type { AppDatabase } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { processAIEntry as runAI } from '@/lib/ai/processor';
import { revalidatePath as nextRevalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { dashboardPath, entryDetailPath } from '@/lib/pathname';
import { InputValidationError, normalizeEntryIds, parseEntryInput } from '@/lib/validation';
import type { ActionResult } from '@/lib/actions/result';

type EntryActionDeps = {
  db: AppDatabase;
  createId: () => string;
  scheduleAI: (job: () => Promise<void>) => void | Promise<void>;
  processAIEntry: typeof runAI;
  revalidatePath: typeof nextRevalidatePath;
  authorize?: () => unknown | Promise<unknown>;
  processAIEntries?: (items: Array<{ id: string; content: string }>) => Promise<void>;
};

export function createEntryActions({
  db,
  createId,
  scheduleAI,
  processAIEntry,
  revalidatePath,
  authorize = () => {},
  processAIEntries,
}: EntryActionDeps) {
  return {
    async createEntry(formData: FormData): Promise<ActionResult<{ id: string; redirectTo: string }>> {
      await authorize();
      let input;
      try {
        input = parseEntryInput(formData.get('content'), formData.get('createdAt'));
      } catch (error) {
        if (error instanceof InputValidationError) return { ok: false, error: error.message };
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
      return { ok: true, data: { id, redirectTo: dashboardPath() } };
    },

    async deleteEntry(id: string): Promise<ActionResult<{ id: string; redirectTo: string }>> {
      await authorize();
      const deleted = await db.delete(entries).where(eq(entries.id, id)).returning({ id: entries.id });
      if (deleted.length === 0) return { ok: false, error: '记录不存在' };
      revalidatePath(dashboardPath());
      return { ok: true, data: { id, redirectTo: dashboardPath() } };
    },

    async updateEntry(id: string, formData: FormData): Promise<ActionResult<{ id: string; redirectTo: string }>> {
      await authorize();
      let input;
      try {
        input = parseEntryInput(formData.get('content'), formData.get('createdAt'));
      } catch (error) {
        if (error instanceof InputValidationError) return { ok: false, error: error.message };
        throw error;
      }

      const updated = await db.update(entries).set({
        title: null,
        summary: null,
        tags: null,
        content: input.content,
        aiStatus: 'pending',
        createdAt: input.createdAt,
        updatedAt: new Date(),
      }).where(eq(entries.id, id)).returning({ id: entries.id });
      if (updated.length === 0) return { ok: false, error: '记录不存在' };

      await scheduleAI(async () => {
        await processAIEntry(id, input.content).catch(err => {
          console.error(`AI update processing failed for entry ${id}:`, err);
        });
      });

      revalidatePath(dashboardPath());
      revalidatePath(entryDetailPath(id));
      return { ok: true, data: { id, redirectTo: entryDetailPath(id) } };
    },

    async regenerateEntryMetadata(id: string): Promise<ActionResult<{ id: string }>> {
      await authorize();
      const entry = await db.query.entries.findFirst({
        where: eq(entries.id, id),
      });

      if (!entry) {
        return { ok: false, error: '记录不存在' };
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
      return { ok: true, data: { id } };
    },

    async bulkRegenerateEntryMetadata(ids: string[]): Promise<ActionResult<{ ids: string[] }>> {
      await authorize();
      const normalizedIds = normalizeEntryIds(ids);
      if (normalizedIds.length === 0) return { ok: true, data: { ids: [] } };

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
      return { ok: true, data: { ids: jobsForResult(normalizedIds, entryMap) } };
    },

    async bulkDeleteEntries(ids: string[]): Promise<ActionResult<{ ids: string[] }>> {
      await authorize();
      const normalizedIds = normalizeEntryIds(ids);
      if (normalizedIds.length === 0) return { ok: true, data: { ids: [] } };

      const deleted = await db.delete(entries).where(inArray(entries.id, normalizedIds)).returning({ id: entries.id });
      revalidatePath(dashboardPath());
      return { ok: true, data: { ids: deleted.map((entry) => entry.id) } };
    },
  };
}

function jobsForResult(ids: string[], entryMap: Map<string, { id: string }>) {
  return ids.filter((id) => entryMap.has(id));
}
