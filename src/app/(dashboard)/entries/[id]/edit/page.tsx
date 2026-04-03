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

export function formatEntryDateTimeForInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 16) : '';
}

export function buildEditEntryFormModel(entry: {
  id: string;
  title: string | null;
  summary: string | null;
  content: string;
  tags: string | null;
  createdAt: Date | null;
}) {
  return {
    id: entry.id,
    title: entry.title ?? '',
    summary: entry.summary ?? '',
    content: entry.content,
    tags: entry.tags ? (JSON.parse(entry.tags) as string[]).join(', ') : '',
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href={`/entries/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-text">Edit Entry</h1>
      </div>

      <EntryEditorShell title={shell.title} helperText={shell.helperText} metaLabel={shell.metaLabel}>
        <form action={updateEntry.bind(null, id)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Title</label>
            <Input name="title" defaultValue={model.title} placeholder="Untitled Capture" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Summary</label>
            <Textarea name="summary" defaultValue={model.summary} placeholder="Short summary..." className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Tags</label>
            <Input name="tags" defaultValue={model.tags} placeholder="tag1, tag2, tag3" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Time</label>
            <Input name="createdAt" type="datetime-local" defaultValue={model.createdAt} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Content</label>
            <Textarea name="content" defaultValue={model.content} className="min-h-[320px]" required />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="h-11 px-6 font-bold uppercase tracking-widest">
              <Save className="h-4 w-4" />
              <span>{shell.primaryActionLabel}</span>
            </Button>
          </div>
        </form>
      </EntryEditorShell>
    </div>
  );
}
