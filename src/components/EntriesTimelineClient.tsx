"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Calendar, ChevronRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { bulkRegenerateEntryMetadata } from "@/lib/actions/entries";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/getMessages";
import { entryDetailPath } from "@/lib/i18n/pathname";

type TimelineEntry = {
  id: string;
  displayTitle: string;
  displaySummary: string;
  statusLabel: string | null;
  statusTone: string;
  tags: string[];
  metaLine: string[];
  createdAt: Date | null;
};

function toneClasses(tone: string) {
  if (tone === "warning") return "bg-warning/10 text-warning";
  if (tone === "danger") return "bg-danger/10 text-danger";
  return "bg-primary/10 text-primary";
}

function toneDotClasses(tone: string) {
  if (tone === "warning") return "bg-warning";
  if (tone === "danger") return "bg-danger";
  return "bg-primary";
}

function formatEntryDate(date: Date | null, locale: Locale): string {
  if (!date) return locale === 'zh' ? '未知' : 'Unknown';
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { month: "2-digit", day: "2-digit" }).format(date);
}

interface EntriesTimelineClientProps {
  entries: TimelineEntry[];
  locale: Locale;
}

export function EntriesTimelineClient({ entries, locale }: EntriesTimelineClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const messages = getMessages(locale);

  const failedIds = entries
    .filter((entry) => entry.statusTone === 'danger')
    .map((entry) => entry.id);

  const runRetryAllFailed = () => {
    if (failedIds.length === 0) return;
    startTransition(async () => {
      await bulkRegenerateEntryMetadata(locale, failedIds);
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
            href={entryDetailPath(locale, entry.id)}
            className="group overflow-hidden rounded-[var(--radius-xl)] border border-border/80 bg-surface p-5 active:scale-[0.99] hover:border-primary/20 hover:shadow-md transition-all duration-200 md:p-6"
          >
            <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-6">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <div className="min-w-0 space-y-2">
                    <h2 className="truncate text-base font-bold tracking-tight text-text transition-colors group-hover:text-primary sm:text-lg">
                      {entry.displayTitle}
                    </h2>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted/90">
                      {entry.displaySummary}
                    </p>
                  </div>
                  {entry.statusLabel && (
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${toneClasses(entry.statusTone)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${toneDotClasses(entry.statusTone)}`} />
                      {entry.statusLabel}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                  <span className="flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1">
                    <Calendar className="h-3 w-3" />
                    {formatEntryDate(entry.createdAt, locale)}
                  </span>
                  <span className="rounded-full border border-border bg-surface2/60 px-2.5 py-1">
                    {entry.metaLine[0]}
                  </span>
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
