'use client';

import { useState } from 'react';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createEntry } from '@/lib/actions/entries';
import { Button } from '@/components/ui/button';
import { EntryEditorShell, buildEntryEditorShellModel } from '@/components/EntryEditorShell';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';

export function getDefaultCreatedAtValue(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isEntrySubmitDisabled({
  loading,
  content,
}: {
  loading: boolean;
  content: string;
}) {
  return loading || !content.trim();
}

export default function NewEntryPage() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [createdAt, setCreatedAt] = useState(getDefaultCreatedAtValue());
  const shell = buildEntryEditorShellModel({ mode: 'create', contentLength: content.length });

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={dashboardPath()} aria-label={messages.common.timeline}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <EntryEditorShell title={shell.title} metaLabel={shell.metaLabel}>
        <form
          action={async (formData) => {
            setLoading(true);
            await createEntry(formData);
          }}
          className="flex min-h-[640px] flex-col md:min-h-[72vh]"
        >
          <div className="border-b border-border bg-surface px-4 py-3 md:px-5">
            <label className="sr-only">
              {messages.editor.saveTo}
            </label>
            <input
              name="createdAt"
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <textarea
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={messages.editor.contentPlaceholder}
            className="w-full flex-1 resize-none border-none bg-transparent p-4 text-lg leading-8 text-text placeholder:text-muted/50 focus:ring-0 md:p-6"
            autoFocus
          />

          <div className="flex items-center justify-end border-t border-border bg-surface px-4 py-3 md:px-5">
            <Button
              type="submit"
              disabled={isEntrySubmitDisabled({ loading, content })}
              className="h-10 px-4"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>{shell.primaryActionLabel}</span>
            </Button>
          </div>
        </form>
      </EntryEditorShell>
    </div>
  );
}
