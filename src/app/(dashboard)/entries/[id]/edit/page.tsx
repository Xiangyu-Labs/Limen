import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { updateEntry } from '@/lib/actions/entries';
import { Button } from '@/components/ui/button';
import { EntryEditorShell, buildEntryEditorShellModel } from '@/components/EntryEditorShell';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { messages } from '@/lib/messages';
import { entryDetailPath } from '@/lib/pathname';

export function formatEntryDateTimeForInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 16) : '';
}

export function buildEditEntryFormModel(entry: {
  id: string;
  content: string;
  createdAt: Date | null;
}) {
  return {
    id: entry.id,
    content: entry.content,
    createdAt: formatEntryDateTimeForInput(entry.createdAt),
  };
}

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const entry = await db.query.entries.findFirst({
    where: eq(entries.id, id),
  });

  if (!entry) {
    notFound();
  }

  const model = buildEditEntryFormModel(entry);
  const shell = buildEntryEditorShellModel({ mode: 'edit', contentLength: model.content.length });

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={entryDetailPath(id)} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <EntryEditorShell title={shell.title} metaLabel={shell.metaLabel}>
        <form action={updateEntry.bind(null, id)} className="flex min-h-[640px] flex-col md:min-h-[72vh]">
          <div className="border-b border-border bg-surface px-4 py-3 md:px-5">
            <label className="sr-only">{messages.editor.time}</label>
            <Input name="createdAt" type="datetime-local" defaultValue={model.createdAt} className="max-w-56" />
          </div>

          <label className="sr-only">{messages.editor.content}</label>
          <Textarea
            name="content"
            defaultValue={model.content}
            className="flex-1 resize-none border-0 bg-transparent p-4 text-lg leading-8 focus-visible:ring-0 md:p-6"
            required
          />

          <div className="flex justify-end border-t border-border bg-surface px-4 py-3 md:px-5">
            <Button type="submit" className="h-10 px-4">
              <Save className="h-4 w-4" />
              <span>{shell.primaryActionLabel}</span>
            </Button>
          </div>
        </form>
      </EntryEditorShell>
    </div>
  );
}
