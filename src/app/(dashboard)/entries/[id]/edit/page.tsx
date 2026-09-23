import { getEntryById } from '@/lib/entry-data';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntryEditorForm } from '@/components/EntryEditorForm';
import { messages } from '@/lib/messages';
import { entryDetailPath } from '@/lib/pathname';
import { formatEntryDateForInput } from '@/lib/entry-date';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: '编辑' };

export function formatEntryDateForEditInput(date: Date | null) {
  return formatEntryDateForInput(date);
}

export function buildEditEntryFormModel(entry: {
  id: string;
  content: string;
  createdAt: Date | null;
}) {
  return {
    id: entry.id,
    content: entry.content,
    createdAt: formatEntryDateForEditInput(entry.createdAt),
  };
}

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const settingsPromise = getSettings();
  const { id } = await params;

  const [entry, settings] = await Promise.all([
    getEntryById(id),
    settingsPromise,
  ]);

  if (!entry) {
    notFound();
  }

  const model = buildEditEntryFormModel(entry);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="-ml-3 text-muted hover:text-text"
        >
          <Link
            href={entryDetailPath(id)}
            aria-label={messages.common.timeline}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <EntryEditorForm
        mode="edit"
        entryId={id}
        initialContent={model.content}
        initialCreatedAt={model.createdAt}
        editorFontSize={settings.editorFontSize}
        timeZone={settings.timeZone}
      />
    </div>
  );
}
