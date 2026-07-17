import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { processAIEntry } from '@/lib/ai/processor';
import { nanoid } from 'nanoid';
import { desc } from 'drizzle-orm';
import { parseEntryDateInput } from '@/lib/entry-date';

type RouteDeps = {
  db: typeof db;
  createId: () => string;
  processAIEntry: typeof processAIEntry;
  schedule: (fn: () => Promise<void>) => void | Promise<void>;
};

export function createEntriesRouteHandlers({
  db,
  createId,
  processAIEntry,
  schedule,
}: RouteDeps) {
  return {
    async POST(request: Request) {
      let id: string | null = null;
      try {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        if (!body || typeof body !== 'object') {
          return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
        }
        const { content, createdAt } = body as { content?: unknown; createdAt?: string | null };

        if (typeof content !== 'string' || content.trim().length === 0) {
          return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        id = createId();
        await db.insert(entries).values({
          id,
          content,
          source: 'web',
          aiStatus: 'pending',
          createdAt: parseEntryDateInput(createdAt),
        });

        try {
          await schedule(async () => {
            console.log(`Triggering AI processing for entry: ${id}`);
            await processAIEntry(id as string, content);
          });
        } catch (error) {
          console.error(`AI scheduling failed for entry ${id}:`, error);
        }

        console.info(`Created entry ${id}`);
        return NextResponse.json({ id, status: 'created', aiStatus: 'pending' }, { status: 201 });
      } catch (error) {
        console.error(`Error creating entry${id ? ` ${id}` : ''}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    },

    async GET(request: Request) {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = parseInt(searchParams.get('offset') || '0');

      try {
        const results = await db.query.entries.findMany({
          limit,
          offset,
          orderBy: [desc(entries.createdAt)],
        });

        return NextResponse.json(results);
      } catch (error) {
        console.error('Error fetching entries:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    },
  };
}

const routeHandlers = createEntriesRouteHandlers({
  db,
  createId: () => nanoid(12),
  processAIEntry,
  schedule: (fn) => after(fn),
});

export async function POST(request: NextRequest) {
  return routeHandlers.POST(request);
}

export async function GET(request: NextRequest) {
  return routeHandlers.GET(request);
}
