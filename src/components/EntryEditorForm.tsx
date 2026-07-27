'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createEntry, updateEntry } from '@/lib/actions/entries';
import { ENTRY_CONTENT_MAX_LENGTH } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  EntryEditorShell,
  buildEntryEditorShellModel,
} from '@/components/EntryEditorShell';
import { messages } from '@/lib/messages';
import {
  entryDraftKey,
  hasEntryDraftChanges,
  parseEntryDraft,
  serializeEntryDraft,
} from '@/lib/entry-draft';

const DRAFT_SAVE_DELAY_MS = 500;
const DRAFT_STORAGE_ERROR = '__limen_draft_storage_error__';
const draftTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
});

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
  const [contentOverride, setContentOverride] = useState<string>();
  const [createdAtOverride, setCreatedAtOverride] = useState<string>();
  const [error, setError] = useState<string>();
  const [draftStatus, setDraftStatus] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const draftKey = entryDraftKey(mode, entryId);
  const subscribeToDraft = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === draftKey) onStoreChange();
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    },
    [draftKey],
  );
  const getDraftSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(draftKey);
    } catch {
      return DRAFT_STORAGE_ERROR;
    }
  }, [draftKey]);
  const rawDraft = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    () => null,
  );
  const restoredDraft = useMemo(
    () => (rawDraft === DRAFT_STORAGE_ERROR ? null : parseEntryDraft(rawDraft)),
    [rawDraft],
  );
  const shouldRestoreDraft = Boolean(
    restoredDraft &&
    hasEntryDraftChanges(
      restoredDraft.content,
      restoredDraft.createdAt,
      initialContent,
      initialCreatedAt,
    ),
  );
  const content =
    contentOverride ??
    (shouldRestoreDraft ? restoredDraft?.content : undefined) ??
    initialContent;
  const createdAt =
    createdAtOverride ??
    (shouldRestoreDraft ? restoredDraft?.createdAt : undefined) ??
    initialCreatedAt;
  const latestDraftRef = useRef({
    content: initialContent,
    createdAt: initialCreatedAt,
  });
  const draftChangedRef = useRef(false);
  const visibleDraftStatus =
    draftStatus ??
    (rawDraft === DRAFT_STORAGE_ERROR
      ? '无法读取本地草稿'
      : shouldRestoreDraft
        ? '已恢复本地草稿'
        : undefined);
  const shell = buildEntryEditorShellModel({
    mode,
    contentLength: content.length,
  });

  const persistDraft = useCallback(() => {
    if (!draftChangedRef.current) return;
    try {
      const latest = latestDraftRef.current;
      if (
        !hasEntryDraftChanges(
          latest.content,
          latest.createdAt,
          initialContent,
          initialCreatedAt,
        )
      ) {
        localStorage.removeItem(draftKey);
        draftChangedRef.current = false;
        setDraftStatus('草稿已清除');
        return;
      }
      const savedAt = new Date();
      localStorage.setItem(
        draftKey,
        serializeEntryDraft(latest.content, latest.createdAt, savedAt),
      );
      setDraftStatus(`草稿已保存 ${draftTimeFormatter.format(savedAt)}`);
    } catch {
      setDraftStatus('草稿保存失败，请勿关闭页面');
    }
  }, [draftKey, initialContent, initialCreatedAt]);

  useEffect(() => {
    if (!draftChangedRef.current) return;
    const timeout = window.setTimeout(persistDraft, DRAFT_SAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [content, createdAt, persistDraft]);

  useEffect(() => {
    const flush = () => persistDraft();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [persistDraft]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    draftChangedRef.current = true;
    persistDraft();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startTransition(async () => {
      try {
        const result =
          mode === 'create'
            ? await createEntry(formData)
            : await updateEntry(entryId as string, formData);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        try {
          localStorage.removeItem(draftKey);
          draftChangedRef.current = false;
        } catch {
          // A stale local draft is safer than losing a failed save.
        }
        toast.success(
          mode === 'create'
            ? '记录已保存，正在整理'
            : '修改已保存，正在重新整理',
        );
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
      <form
        onSubmit={submit}
        className="flex min-h-[640px] flex-col md:min-h-[72vh]"
      >
        <div className="border-b border-border bg-surface px-4 py-3 md:px-5">
          <label htmlFor="entry-created-at" className="sr-only">
            {messages.editor.time}
          </label>
          <Input
            id="entry-created-at"
            name="createdAt"
            type="date"
            value={createdAt}
            onChange={(event) => {
              draftChangedRef.current = true;
              setDraftStatus('正在保存草稿');
              latestDraftRef.current = {
                content,
                createdAt: event.target.value,
              };
              setCreatedAtOverride(event.target.value);
            }}
            className="max-w-56"
            disabled={isPending}
            required
          />
        </div>

        <label htmlFor="entry-content" className="sr-only">
          {messages.editor.content}
        </label>
        <Textarea
          id="entry-content"
          name="content"
          required
          maxLength={ENTRY_CONTENT_MAX_LENGTH}
          value={content}
          onChange={(event) => {
            draftChangedRef.current = true;
            setDraftStatus('正在保存草稿');
            latestDraftRef.current = {
              content: event.target.value,
              createdAt,
            };
            setContentOverride(event.target.value);
          }}
          placeholder={
            mode === 'create' ? messages.editor.contentPlaceholder : undefined
          }
          className="flex-1 resize-none border-0 bg-transparent p-4 text-lg leading-8 focus-visible:ring-0 md:p-6"
          autoFocus={mode === 'create'}
          disabled={isPending}
        />

        <div className="flex flex-col gap-2 border-t border-border bg-surface px-4 py-3 md:px-5">
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex min-h-10 items-center justify-between gap-3">
            <p
              aria-live="polite"
              className={
                visibleDraftStatus?.includes('失败') ||
                visibleDraftStatus?.includes('无法')
                  ? 'text-sm text-danger'
                  : 'text-sm text-muted'
              }
            >
              {visibleDraftStatus}
            </p>
            <Button
              type="submit"
              disabled={isPending || !content.trim()}
              className="h-10 min-w-24 px-4"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isPending ? '保存中' : shell.primaryActionLabel}</span>
            </Button>
          </div>
        </div>
      </form>
    </EntryEditorShell>
  );
}
