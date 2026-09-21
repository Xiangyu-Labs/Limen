'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  setEntryTags,
  setEntryTitle,
  unlockEntryMetadata,
} from '@/lib/actions/entries';
import { buildTagEditorModel } from '@/lib/entry-metadata-editor';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function EntryTitleEditor({
  entryId,
  title,
  locked,
}: {
  entryId: string;
  title: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const result = await setEntryTitle(entryId, draft);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setEditing(false);
        toast.success(messages.entryDetail.metadataSaved);
        router.refresh();
      } catch {
        toast.error(messages.entryDetail.metadataSaveFailed);
      }
    });
  }

  if (!editing) {
    return (
      <div className="group/title flex items-start gap-2">
        <h1 className="min-w-0 flex-1 text-3xl font-semibold leading-tight tracking-tight text-text md:text-4xl">
          {title}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={messages.entryDetail.editTitle}
          title={messages.entryDetail.editTitle}
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
          className="mt-1 shrink-0 text-muted opacity-0 transition-opacity focus-visible:opacity-100 group-hover/title:opacity-100"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="entry-title" className="sr-only">
        {messages.entryDetail.editTitle}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="entry-title"
          value={draft}
          autoFocus
          disabled={isPending}
          maxLength={200}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
            if (event.key === 'Escape') setEditing(false);
          }}
          className="h-11 text-xl font-semibold"
        />
        <Button
          type="button"
          size="icon"
          onClick={save}
          disabled={isPending}
          aria-label={messages.entryDetail.saveTitle}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setEditing(false)}
          disabled={isPending}
          aria-label={messages.entryDetail.cancelTitleEdit}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {locked ? (
        <p className="text-xs text-muted">{messages.entryDetail.titleLocked}</p>
      ) : null}
    </div>
  );
}

export function EntryTagsEditor({
  entryId,
  tags,
  locked,
}: {
  entryId: string;
  tags: string[];
  locked: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();
  const model = buildTagEditorModel({
    tags,
    draft,
    locked,
    copy: messages,
  });

  function commit(next: string[]) {
    startTransition(async () => {
      try {
        const result = await setEntryTags(entryId, next);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setDraft('');
        router.refresh();
      } catch {
        toast.error(messages.entryDetail.metadataSaveFailed);
      }
    });
  }

  function unlock() {
    startTransition(async () => {
      try {
        const result = await unlockEntryMetadata(entryId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        router.refresh();
      } catch {
        toast.error(messages.entryDetail.metadataSaveFailed);
      }
    });
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex flex-wrap items-center gap-2">
        {model.chips.map((chip) => (
          <span
            key={chip.name}
            className="inline-flex items-center gap-1 rounded-md bg-surface2 py-1 pl-2 pr-1 text-xs text-muted"
          >
            <Link
              href={`${dashboardPath()}?tag=${encodeURIComponent(chip.name)}`}
              className="hover:text-primary"
            >
              #{chip.name}
            </Link>
            <button
              type="button"
              aria-label={chip.removeLabel}
              disabled={isPending}
              onClick={() => commit(tags.filter((name) => name !== chip.name))}
              className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (model.canAdd) commit([...tags, draft.trim()]);
          }}
          className="flex items-center gap-1"
        >
          <label htmlFor="entry-tag-draft" className="sr-only">
            {messages.entryDetail.addTag}
          </label>
          <Input
            id="entry-tag-draft"
            value={draft}
            disabled={isPending || model.remaining === 0}
            placeholder={messages.entryDetail.tagPlaceholder}
            onChange={(event) => setDraft(event.target.value)}
            className="h-7 w-28 px-2 text-xs"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isPending || !model.canAdd}
            aria-label={messages.entryDetail.addTag}
            className="h-7 w-7 text-muted"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {model.addDisabledReason && draft.trim() ? (
          <p role="alert" className={cn('text-danger')}>
            {model.addDisabledReason}
          </p>
        ) : null}
        {model.lockNotice ? (
          <>
            <span className="text-muted">{model.lockNotice}</span>
            <button
              type="button"
              onClick={unlock}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-muted underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {messages.entryDetail.unlockMetadata}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
