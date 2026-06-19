import { Card } from '@/components/ui/card';
import { messages } from '@/lib/messages';

export function buildEntryEditorShellModel({
  mode,
  contentLength,
}: {
  mode: 'create' | 'edit';
  contentLength: number;
}) {
  return {
    title: mode === 'create' ? messages.editor.newCapture : messages.editor.editEntry,
    primaryActionLabel: mode === 'create' ? messages.editor.capture : messages.editor.save,
    metaLabel: messages.editor.characters(contentLength),
  };
}

export function EntryEditorShell({
  title,
  metaLabel,
  children,
}: {
  title: string;
  metaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-surface px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate text-base font-semibold tracking-tight text-text">{title}</h2>
          <div className="shrink-0 text-sm text-muted">
            {metaLabel}
          </div>
        </div>
      </div>
      {children}
    </Card>
  );
}
