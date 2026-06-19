"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Calendar, ChevronRight, Sparkles } from "lucide-react";
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
  if (tone === "danger") return "bg-danger/10 text-danger";
  return "bg-primary/10 text-primary";
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
    <div className="space-y-4">
      {failedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={runRetryAllFailed}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {messages.common.regenerate}
          </button>
          <span className="rounded-full bg-surface2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            {failedIds.length} {messages.common.failed}
          </span>
        </div>
      )}

      <div className="grid gap-4">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={entryDetailPath(entry.id)}
            className="group overflow-hidden rounded-[var(--radius-xl)] border border-border/80 bg-surface p-5 active:scale-[0.99] hover:border-primary/20 hover:shadow-md transition-all duration-200 md:p-6"
          >
            <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-6">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="min-w-0 space-y-2">
                  <h2 className="truncate text-base font-bold tracking-tight text-text transition-colors group-hover:text-primary sm:text-lg">
                    {entry.displayTitle}
                  </h2>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted/90">
                    {entry.displaySummary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                  <span className="flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1">
                    <Calendar className="h-3 w-3" />
                    {formatEntryDate(entry.createdAt)}
                  </span>
                  {entry.statusLabel && (
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${toneClasses(entry.statusTone)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${toneDotClasses(entry.statusTone)}`} />
                      {entry.statusLabel}
                    </span>
                  )}
                </div>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--border)] transition-colors group-hover:text-[var(--primary)]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
