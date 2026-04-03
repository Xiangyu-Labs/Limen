'use client';

import { useState } from 'react';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createEntry } from '@/lib/actions/entries';
import { Button } from '@/components/ui/button';
import { EntryEditorShell, buildEntryEditorShellModel } from '@/components/EntryEditorShell';

export function getDefaultCreatedAtValue(now = new Date()) {
  return now.toISOString().slice(0, 16);
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-text">New Capture</h1>
      </div>

      <EntryEditorShell title={shell.title} helperText={shell.helperText} metaLabel={shell.metaLabel}>
        <form
          action={async (formData) => {
            setLoading(true);
            await createEntry(formData);
          }}
          className="flex h-[75vh] flex-col"
        >
          <div className="grid gap-2 border-b border-border/80 bg-surface px-8 py-5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Save to
            </label>
            <input
              name="createdAt"
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface2 px-4 text-sm text-text focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <textarea
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Capture it here..."
            className="flex-1 w-full p-8 text-lg leading-relaxed border-none focus:ring-0 resize-none bg-transparent placeholder:text-muted/50"
            autoFocus
          />

          <div className="flex items-center justify-between border-t border-border bg-surface2/50 px-8 py-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                {shell.metaLabel}
              </span>
              <span className="text-[10px] font-medium text-muted/60 uppercase tracking-[0.18em]">
                {shell.helperText}
              </span>
            </div>
            <Button
              type="submit"
              disabled={isEntrySubmitDisabled({ loading, content })}
              className="h-12 px-8 font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
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
