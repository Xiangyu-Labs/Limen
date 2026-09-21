import type { Metadata } from 'next';
import { getEntryById } from '@/lib/entry-data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarkdownContent } from '@/components/MarkdownContent';
import { ArrowLeft, Calendar, Loader2, Sparkles } from 'lucide-react';
import { FormattedDate } from '@/components/FormattedDate';
import { EntryDetailActions } from '@/components/EntryDetailActions';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';
import {
  EntryTagsEditor,
  EntryTitleEditor,
} from '@/components/EntryMetadataEditor';
import { PendingAIRefresh } from '@/components/PendingAIRefresh';
import { recoverStalePendingEntries } from '@/lib/ai/stale-pending';

export function buildEntryDetailViewModel(
  entry: {
    content: string;
    title: string | null;
    summary: string | null;
    tags: string[];
    aiStatus: string | null;
    createdAt: Date | null;
  },
  copy: typeof messages,
) {
  return {
    ...entry,
    displayTitle: entry.title || copy.editor.untitledCapture,
    summary: entry.summary,
    statusLabel:
      entry.aiStatus === 'failed'
        ? copy.common.failed
        : entry.aiStatus === 'pending'
          ? copy.common.processing
          : null,
    statusTone: entry.aiStatus === 'failed' ? 'danger' : 'muted',
    regenerateLabel: copy.entryDetail.regenerateMetadata,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntryById(id);
  return {
    title: entry?.title || messages.editor.untitledCapture,
  };
}

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await recoverStalePendingEntries();
  const entry = await getEntryById(id);

  if (!entry) {
    notFound();
  }

  const viewModel = buildEntryDetailViewModel(entry, messages);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {entry.aiStatus === 'pending' ? (
        <PendingAIRefresh entryId={entry.id} />
      ) : null}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="-ml-2 text-muted hover:text-primary"
        >
          <Link href={dashboardPath()} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <EntryDetailActions
          entryId={id}
          pending={entry.aiStatus === 'pending'}
        />
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
                <div
                  className={
                    viewModel.statusTone === 'danger'
                      ? 'flex items-center gap-2 rounded-md border border-danger/20 px-2 py-1 text-danger'
                      : 'flex items-center gap-2 rounded-md border border-primary/20 px-2 py-1 text-primary'
                  }
                >
                  {entry.aiStatus === 'pending' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {viewModel.statusLabel}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <EntryTitleEditor
                entryId={entry.id}
                title={viewModel.displayTitle}
                locked={entry.titleLockedAt !== null}
              />

              {viewModel.summary && (
                <div className="border-l-2 border-primary pl-4">
                  <p className="text-xs font-medium text-primary">
                    {messages.entryDetail.aiSummary}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {viewModel.summary}
                  </p>
                </div>
              )}

              <EntryTagsEditor
                entryId={entry.id}
                tags={viewModel.tags}
                locked={entry.tagsLockedAt !== null}
              />
            </div>
          </header>

          <MarkdownContent>{entry.content}</MarkdownContent>
        </div>
      </article>
    </div>
  );
}
