import type { ActionResult } from '@/lib/actions/result';
import type { messages as copyShape } from '@/lib/messages';

export const UNDO_TOAST_DURATION_MS = 8_000;

export function buildDeletedToastMessage(
  title: string | null,
  copy: typeof copyShape,
) {
  const name = title?.trim();
  return name ? copy.trash.entryDeletedNamed(name) : copy.trash.entryDeleted;
}

type UndoDeps = {
  restore: (id: string) => Promise<ActionResult<{ id: string }>>;
  refresh: () => void;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  copy: typeof copyShape;
};

/**
 * Runs from a toast action, after the component that triggered the delete has
 * already unmounted. It must therefore not be wrapped in that component's
 * useTransition; router.refresh() is safe because the router is global.
 */
export function createUndoHandler({
  restore,
  refresh,
  notifySuccess,
  notifyError,
  copy,
}: UndoDeps) {
  return async function undo(id: string) {
    try {
      const result = await restore(id);
      if (!result.ok) {
        notifyError(result.error);
        return;
      }
      // The timeline refetches its loaded pages when the server hands it a
      // new first page, so a refresh is all the restored entry needs.
      refresh();
      notifySuccess(copy.trash.entryRestored);
    } catch {
      notifyError(copy.trash.restoreFailed);
    }
  };
}
