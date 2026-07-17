'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Loader2, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteEntry, regenerateEntryMetadata } from '@/lib/actions/entries';
import { Button } from '@/components/ui/button';
import { dashboardPath, entryEditPath } from '@/lib/pathname';
import { messages } from '@/lib/messages';

export function EntryDetailActions({ entryId, pending }: { entryId: string; pending: boolean }) {
  const router = useRouter();
  const [isRegenerating, startRegeneration] = useTransition();
  const [isDeleting, startDeletion] = useTransition();
  const [optimisticPending, setOptimisticPending] = useOptimistic(pending);

  function regenerate() {
    startRegeneration(async () => {
      setOptimisticPending(true);
      try {
        const result = await regenerateEntryMetadata(entryId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success('已开始重新整理');
        router.refresh();
      } catch {
        toast.error('重新整理失败，请重试');
      }
    });
  }

  function remove() {
    startDeletion(async () => {
      try {
        const result = await deleteEntry(entryId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success('记录已删除');
        router.replace(dashboardPath());
        router.refresh();
      } catch {
        toast.error('删除失败，请重试');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        type="button"
        disabled={isRegenerating || optimisticPending}
        onClick={regenerate}
        className="h-10 w-10 text-muted hover:text-primary"
        aria-label={messages.entryDetail.regenerateMetadata}
        title={messages.entryDetail.regenerateMetadata}
      >
        {isRegenerating || optimisticPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Sparkles className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-muted hover:text-primary">
        <Link href={entryEditPath(entryId)} aria-label={messages.common.edit} title={messages.common.edit}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>

      <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            disabled={isDeleting}
            className="h-10 w-10 text-muted hover:bg-danger/10 hover:text-danger"
            aria-label={messages.common.delete}
            title={messages.common.delete}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-surface p-5 shadow-xl">
            <AlertDialog.Title className="text-base font-semibold text-text">删除这条记录？</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted">删除后无法恢复。</AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild><Button variant="ghost">取消</Button></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button type="button" disabled={isDeleting} onClick={remove} className="bg-danger text-white hover:bg-danger/90">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  删除
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
