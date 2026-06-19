"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { bulkRegenerateEntryMetadata } from "@/lib/actions/entries";
import { messages } from "@/lib/messages";
import { entryDetailPath } from "@/lib/pathname";

type TimelineEntry = {
  id: string;
  displayTitle: string;
  displaySummary: string;
  statusLabel: string | null;
  statusTone: string;
  tags: string[];
  createdAt: Date | null;
};

function toneClasses(tone: string) {
  if (tone === "danger") return "border-danger/20 text-danger";
  return "border-border text-muted";
}

function toneDotClasses(tone: string) {
  if (tone === "danger") return "bg-danger";
  return "bg-primary";
}

function formatEntryDate(date: Date | null): string {
  if (!date) return messages.common.unknown;
  return new Intl.DateTimeFormat('zh-CN', { month: "2-digit", day: "2-digit" }).format(date);
}

interface EntriesTimelineClientProps {
  entries: TimelineEntry[];
}

export function EntriesTimelineClient({ entries }: EntriesTimelineClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const failedIds = entries
    .filter((entry) => entry.statusTone === 'danger')
    .map((entry) => entry.id);

  const runRetryAllFailed = () => {
    if (failedIds.length === 0) return;
    startTransition(async () => {
      await bulkRegenerateEntryMetadata(failedIds);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {failedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/20 bg-surface px-3 py-3">
          <button
            type="button"
            disabled={isPending}
            onClick={runRetryAllFailed}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {messages.common.regenerate}
          </button>
          <span className="text-sm text-muted">
            {failedIds.length} {messages.common.failed}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={entryDetailPath(entry.id)}
            className="group grid min-h-28 gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-surface2/60 active:bg-surface2 sm:grid-cols-[72px_minmax(0,1fr)] md:px-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted sm:block sm:pt-0.5">
              <Calendar className="h-4 w-4 sm:hidden" />
              <span>{formatEntryDate(entry.createdAt)}</span>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-base font-semibold tracking-tight text-text transition-colors group-hover:text-primary">
                  {entry.displayTitle}
                </h2>
                <p className="line-clamp-2 text-sm leading-6 text-muted">
                  {entry.displaySummary}
                </p>
              </div>

              {(entry.tags.length > 0 || entry.statusLabel) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted">
                  {entry.statusLabel && (
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 ${toneClasses(entry.statusTone)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${toneDotClasses(entry.statusTone)}`} />
                      {entry.statusLabel}
                    </span>
                  )}
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-surface2 px-2 py-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
