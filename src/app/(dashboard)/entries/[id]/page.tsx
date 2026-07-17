import { db } from '@/lib/db';
import { entries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Trash2, Sparkles, Pencil } from 'lucide-react';
import { deleteEntry, regenerateEntryMetadata } from '@/lib/actions/entries';
import { FormattedDate } from '@/components/FormattedDate';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages';
import { dashboardPath, entryEditPath } from '@/lib/pathname';
import { parseStoredTags } from '@/lib/tags';
import { PendingAIRefresh } from '@/components/PendingAIRefresh';

export function buildEntryDetailViewModel(
  entry: {
    content: string;
    title: string | null;
    summary: string | null;
    tags: string | null;
    aiStatus: string | null;
    createdAt: Date | null;
  },
  copy: typeof messages
) {
  return {
    ...entry,
    displayTitle: entry.title || copy.editor.untitledCapture,
    summary: entry.aiStatus === 'done' ? entry.summary : null,
    tags: parseStoredTags(entry.tags),
    statusLabel: entry.aiStatus === 'failed' ? copy.common.failed : null,
    statusTone: entry.aiStatus === 'failed' ? 'danger' : 'muted',
    regenerateLabel: copy.entryDetail.regenerateMetadata,
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

  const viewModel = buildEntryDetailViewModel(entry, messages);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {entry.aiStatus === 'pending' ? <PendingAIRefresh /> : null}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild className="-ml-2 text-muted hover:text-primary">
          <Link href={dashboardPath()} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <form action={regenerateEntryMetadata.bind(null, id)}>
            <Button
              variant="secondary"
              size="icon"
              type="submit"
              className="h-10 w-10 text-muted hover:text-primary"
              aria-label={viewModel.regenerateLabel}
              title={viewModel.regenerateLabel}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </form>

          <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-muted hover:text-primary">
            <Link href={entryEditPath(id)} aria-label={messages.common.edit} title={messages.common.edit}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>

          <form action={deleteEntry.bind(null, id)}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="h-10 w-10 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label={messages.common.delete}
              title={messages.common.delete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <article className="rounded-lg border border-border bg-surface">
        <div className="space-y-8 p-5 md:p-8">
          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <FormattedDate date={entry.createdAt} />
              </div>
              {viewModel.statusLabel && (
                <div className="flex items-center gap-2 rounded-md border border-danger/20 px-2 py-1 text-danger">
                  <Sparkles className="h-3.5 w-3.5" />
                  {viewModel.statusLabel}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-text md:text-4xl">
                {viewModel.displayTitle}
              </h1>

              {viewModel.summary && (
                <div className="border-l-2 border-primary pl-4">
                  <p className="text-xs font-medium text-primary">{messages.entryDetail.aiSummary}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {viewModel.summary}
                  </p>
                </div>
              )}

              {viewModel.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {viewModel.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-surface2 px-2 py-1 text-xs text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="prose prose-lg max-w-none leading-8 text-text/90 prose-headings:text-text prose-strong:text-text prose-code:text-primary">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
}
