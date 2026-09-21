'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { purgeEntry, restoreEntry } from '@/lib/actions/entries';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages';

export function TrashActions({
  entryId,
  title,
}: {
  entryId: string;
  title: string;
}) {
  const router = useRouter();
  const [isRestoring, startRestore] = useTransition();
  const [isPurging, startPurge] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function restore() {
    startRestore(async () => {
      try {
        const result = await restoreEntry(entryId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(messages.trash.entryRestored);
        router.refresh();
      } catch {
        toast.error(messages.trash.restoreFailed);
      }
    });
  }

  function purge() {
    startPurge(async () => {
      try {
        const result = await purgeEntry(entryId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setConfirmOpen(false);
        router.refresh();
      } catch {
        toast.error(messages.trash.purgeFailed);
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isRestoring}
        onClick={restore}
      >
        {isRestoring ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        {messages.trash.restore}
      </Button>

      <AlertDialog.Root
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isPurging) setConfirmOpen(open);
        }}
      >
        <AlertDialog.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPurging}
            className="text-muted hover:bg-danger/10 hover:text-danger"
          >
            {isPurging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {messages.trash.purge}
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-surface p-5 shadow-xl">
            <AlertDialog.Title className="text-base font-semibold text-text">
              {messages.trash.purgeConfirmTitle}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted">
              {title} — {messages.trash.purgeConfirmBody}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild disabled={isPurging}>
                <Button variant="ghost" disabled={isPurging}>
                  取消
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action
                asChild
                onClick={(event) => event.preventDefault()}
              >
                <Button
                  type="button"
                  disabled={isPurging}
                  onClick={purge}
                  className="bg-danger text-white hover:bg-danger/90"
                >
                  {isPurging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {messages.trash.purge}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
