"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Calendar, ChevronRight, CheckSquare2, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelection } from "@/hooks/useSelection";
import { bulkDeleteEntries, bulkRegenerateEntryMetadata } from "@/lib/actions/entries";

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

export function EntriesTimelineClient({ entries }: { entries: TimelineEntry[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selection = useSelection({ allIds: entries.map((entry) => entry.id) });

  const runBulkRegenerate = () => {
    if (selection.selectedIds.length === 0) return;
    startTransition(async () => {
      await bulkRegenerateEntryMetadata(selection.selectedIds);
      selection.exitSelectionMode();
      router.refresh();
    });
  };

  const runBulkDelete = () => {
    if (selection.selectedIds.length === 0) return;
    startTransition(async () => {
      await bulkDeleteEntries(selection.selectedIds);
      selection.exitSelectionMode();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {!selection.isSelectionMode ? (
          <button
            type="button"
            onClick={selection.toggleSelectionMode}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            <CheckSquare2 className="h-4 w-4" />
            Select
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={selection.isAllSelected ? selection.clearSelection : selection.selectAll}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:bg-surface2 hover:text-text"
            >
              <CheckSquare2 className="h-4 w-4" />
              {selection.isAllSelected ? "Clear all" : "Select all"}
            </button>
            <button
              type="button"
              onClick={selection.exitSelectionMode}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:bg-surface2 hover:text-text"
            >
              <X className="h-4 w-4" />
              Exit
            </button>
            <span className="rounded-full bg-surface2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              {selection.selectedCount} selected
            </span>
            <button
              type="button"
              disabled={selection.selectedCount === 0 || isPending}
              onClick={runBulkRegenerate}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Regenerate
            </button>
            <button
              type="button"
              disabled={selection.selectedCount === 0 || isPending}
              onClick={runBulkDelete}
              className="inline-flex items-center gap-2 rounded-full bg-danger px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </>
        )}
      </div>

      <div className="grid gap-4">
        {entries.map((entry) => {
          const checked = selection.selectedIds.includes(entry.id);
          const card = (
            <div className="flex min-w-0 items-start justify-between gap-6">
              <div className="flex min-w-0 flex-1 gap-4">
                {selection.isSelectionMode && (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => selection.toggleSelection(entry.id)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary"
                    aria-label={`Select ${entry.displayTitle}`}
                  />
                )}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <h2 className="truncate text-lg font-bold tracking-tight text-text transition-colors group-hover:text-primary">
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
                      {entry.createdAt ? new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(entry.createdAt) : "Unknown"}
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
              </div>
              {!selection.isSelectionMode && (
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--border)] transition-colors group-hover:text-[var(--primary)]" />
              )}
            </div>
          );

          if (selection.isSelectionMode) {
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => selection.toggleSelection(entry.id)}
                className="group w-full rounded-[var(--radius-xl)] border border-border/80 bg-surface p-5 text-left active:scale-[0.99] hover:border-primary/20 hover:shadow-md transition-all duration-200 md:p-6"
              >
                {card}
              </button>
            );
          }

          return (
            <Link
              key={entry.id}
              href={`/entries/${entry.id}`}
              className="group rounded-[var(--radius-xl)] border border-border/80 bg-surface p-5 active:scale-[0.99] hover:border-primary/20 hover:shadow-md transition-all duration-200 md:p-6"
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
