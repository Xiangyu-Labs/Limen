import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Trash2, Clock, Sparkles, Pencil } from 'lucide-react';
import { deleteEntry, regenerateEntryMetadata } from '@/lib/actions/entries';
import { FormattedDate } from '@/components/FormattedDate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function buildEntryDetailViewModel(entry: {
  content: string;
  title: string | null;
  summary: string | null;
  tags: string | null;
  aiStatus: string | null;
  createdAt: Date | null;
}) {
  return {
    ...entry,
    displayTitle: entry.title || 'Untitled Capture',
    summary: entry.aiStatus === 'done' ? entry.summary : null,
    tags: entry.tags ? JSON.parse(entry.tags) as string[] : [],
    showAIEnhancedBadge: entry.aiStatus === 'done',
    statusLabel:
      entry.aiStatus === 'done'
        ? 'AI Enhanced'
        : entry.aiStatus === 'failed'
          ? 'Needs review'
          : 'Processing',
    statusTone:
      entry.aiStatus === 'done'
        ? 'success'
        : entry.aiStatus === 'failed'
          ? 'danger'
          : 'warning',
    regenerateLabel: 'Regenerate AI Metadata',
  };
}

export default async function EntryDetailPage({
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

  const viewModel = buildEntryDetailViewModel(entry);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted hover:text-primary">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Timeline</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <form action={regenerateEntryMetadata.bind(null, id)}>
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              className="text-muted hover:text-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{viewModel.regenerateLabel}</span>
            </Button>
          </form>

          <Button variant="ghost" size="sm" asChild className="text-muted hover:text-primary">
            <Link href={`/entries/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
            </Link>
          </Button>

          <form action={deleteEntry.bind(null, id)}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-muted hover:text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
            </Button>
          </form>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-xl shadow-black/5">
        <div className="p-8 md:p-12 space-y-10">
          <header className="space-y-8">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              <div className="flex items-center gap-2 rounded-full bg-surface2 px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <FormattedDate date={entry.createdAt!} type="full" />
              </div>
              <div className="flex items-center gap-2 rounded-full bg-surface2 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                <FormattedDate date={entry.createdAt!} type="time" />
              </div>
              <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                viewModel.statusTone === 'success' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
              }`}>
                <Sparkles className="h-3.5 w-3.5" />
                {viewModel.statusLabel}
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-text leading-tight tracking-tight">
                {viewModel.displayTitle}
              </h1>

              {viewModel.summary && (
                <div className="rounded-[var(--radius-xl)] border border-primary/15 bg-primary/5 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">AI Summary</p>
                  <p className="mt-3 text-sm text-text/80 leading-relaxed italic">
                    {viewModel.summary}
                  </p>
                </div>
              )}

              {viewModel.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {viewModel.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="prose prose-lg max-w-none text-text/90 leading-relaxed prose-headings:text-text prose-strong:text-text prose-code:text-primary">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
        </div>
      </Card>
    </div>
  );
}
