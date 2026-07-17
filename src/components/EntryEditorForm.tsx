'use client';

import { type FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createEntry, updateEntry } from '@/lib/actions/entries';
import { ENTRY_CONTENT_MAX_LENGTH } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EntryEditorShell, buildEntryEditorShellModel } from '@/components/EntryEditorShell';
import { messages } from '@/lib/messages';

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
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const shell = buildEntryEditorShellModel({ mode, contentLength: content.length });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startTransition(async () => {
      try {
        const result = mode === 'create'
          ? await createEntry(formData)
          : await updateEntry(entryId as string, formData);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success(mode === 'create' ? '记录已保存，正在整理' : '修改已保存，正在重新整理');
        router.push(result.data.redirectTo);
        router.refresh();
      } catch {
        const message = '保存失败，请重试';
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <EntryEditorShell title={shell.title} metaLabel={shell.metaLabel}>
      <form onSubmit={submit} className="flex min-h-[640px] flex-col md:min-h-[72vh]">
        <div className="border-b border-border bg-surface px-4 py-3 md:px-5">
          <label htmlFor="entry-created-at" className="sr-only">{messages.editor.time}</label>
          <Input id="entry-created-at" name="createdAt" type="date" defaultValue={initialCreatedAt} className="max-w-56" disabled={isPending} required />
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
          disabled={isPending}
        />

        <div className="flex flex-col gap-2 border-t border-border bg-surface px-4 py-3 md:px-5">
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !content.trim()} className="h-10 min-w-24 px-4">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isPending ? '保存中' : shell.primaryActionLabel}</span>
            </Button>
          </div>
        </div>
      </form>
    </EntryEditorShell>
  );
}
