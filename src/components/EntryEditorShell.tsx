import { Card } from '@/components/ui/card';
import type { Locale } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/getMessages';

export function buildEntryEditorShellModel({
  mode,
  contentLength,
  locale = 'en',
}: {
  mode: 'create' | 'edit';
  contentLength: number;
  locale?: Locale;
}) {
  const messages = getMessages(locale);

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
  locale = 'en',
  children,
}: {
  title: string;
  helperText: string;
  metaLabel: string;
  locale?: Locale;
  children: React.ReactNode;
}) {
  const messages = getMessages(locale);

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
