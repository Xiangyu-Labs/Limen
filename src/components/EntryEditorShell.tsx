import { Card } from '@/components/ui/card';
import { messages } from '@/lib/messages';
import { cn } from '@/lib/utils';

export function buildEntryEditorShellModel({
  mode,
}: {
  mode: 'create' | 'edit';
}) {
  return {
    title:
      mode === 'create'
        ? messages.editor.newCapture
        : messages.editor.editEntry,
    primaryActionLabel:
      mode === 'create' ? messages.editor.capture : messages.editor.save,
  };
}

export function EntryEditorShell({
  title,
  metaLabel,
  metaTone = 'muted',
  children,
}: {
  title: string;
  metaLabel: string;
  metaTone?: 'muted' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate text-sm font-semibold text-text">{title}</h2>
          <div
            className={cn(
              'shrink-0 font-mono text-xs tabular-nums',
              metaTone === 'danger' && 'font-medium text-danger',
              metaTone === 'warning' && 'text-warning',
              metaTone === 'muted' && 'text-muted',
            )}
          >
            {metaLabel}
          </div>
        </div>
      </div>
      {children}
    </Card>
  );
}
