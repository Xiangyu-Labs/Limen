import { Suspense } from 'react';
import { CalendarFilter } from '@/components/CalendarFilter';
import { SearchInput } from '@/components/SearchInput';
import { messages } from '@/lib/messages';

interface DashboardFiltersProps {
  datesWithEntries: string[];
  entriesCount: number;
  selectedDate?: string;
}

export function DashboardFilters({ datesWithEntries, entriesCount, selectedDate }: DashboardFiltersProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <Suspense fallback={<div className="h-10 flex-1 animate-pulse rounded-md bg-surface2" />}>
          <SearchInput placeholder={messages.common.search} className="min-w-0 max-w-none flex-1" />
        </Suspense>
        <CalendarFilter datesWithEntries={datesWithEntries} selectedDate={selectedDate} />
        <span className="shrink-0 px-1 text-xs text-muted sm:px-2">
          {entriesCount} {messages.dashboard.entriesCount}
        </span>
      </div>
    </section>
  );
}
