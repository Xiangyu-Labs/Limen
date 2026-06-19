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
    helperText:
      mode === 'create'
        ? messages.editor.createHelper
        : messages.editor.editHelper,
    metaLabel: messages.editor.characters(contentLength),
  };
}

export function EntryEditorShell({
  title,
  helperText,
  metaLabel,
  children,
}: {
  title: string;
  helperText: string;
  metaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-xl shadow-black/5">
      <div className="border-b border-border bg-surface px-6 py-5 md:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">{messages.common.timeline}</p>
            <h2 className="text-xl font-bold tracking-tight text-text">{title}</h2>
            <p className="text-sm leading-relaxed text-muted">{helperText}</p>
          </div>
          <div className="rounded-full border border-border bg-surface2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            {metaLabel}
          </div>
        </div>
      </div>
      {children}
    </Card>
  );
}
