'use client';

import { useActionState, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { createEntry, updateEntry, type EntryFormState } from '@/lib/actions/entries';
import { ENTRY_CONTENT_MAX_LENGTH } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EntryEditorShell, buildEntryEditorShellModel } from '@/components/EntryEditorShell';
import { messages } from '@/lib/messages';

type FormAction = (state: EntryFormState, formData: FormData) => Promise<EntryFormState>;

export function EntryEditorForm({
  mode,
  entryId,
  initialContent = '',
  initialCreatedAt,
}: {
  mode: 'create' | 'edit';
  entryId?: string;
  initialContent?: string;
  initialCreatedAt: string;
}) {
  const [content, setContent] = useState(initialContent);
  const action: FormAction = mode === 'create'
    ? createEntry
    : updateEntry.bind(null, entryId as string);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const shell = buildEntryEditorShellModel({ mode, contentLength: content.length });

  return (
    <EntryEditorShell title={shell.title} metaLabel={shell.metaLabel}>
      <form action={formAction} className="flex min-h-[640px] flex-col md:min-h-[72vh]">
        <div className="border-b border-border bg-surface px-4 py-3 md:px-5">
          <label htmlFor="entry-created-at" className="sr-only">{messages.editor.time}</label>
          <Input
            id="entry-created-at"
            name="createdAt"
            type="date"
            defaultValue={initialCreatedAt}
            className="max-w-56"
            required
          />
        </div>

        <label htmlFor="entry-content" className="sr-only">{messages.editor.content}</label>
        <Textarea
          id="entry-content"
          name="content"
          required
          maxLength={ENTRY_CONTENT_MAX_LENGTH}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={mode === 'create' ? messages.editor.contentPlaceholder : undefined}
          className="flex-1 resize-none border-0 bg-transparent p-4 text-lg leading-8 focus-visible:ring-0 md:p-6"
          autoFocus={mode === 'create'}
        />

        <div className="flex flex-col gap-2 border-t border-border bg-surface px-4 py-3 md:px-5">
          {state?.error ? <p role="alert" className="text-sm text-danger">{state.error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !content.trim()} className="h-10 px-4">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{shell.primaryActionLabel}</span>
            </Button>
          </div>
        </div>
      </form>
    </EntryEditorShell>
  );
}
