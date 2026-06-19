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
    <div className="flex min-w-0 items-center gap-2">
      <Suspense fallback={<div className="h-10 min-w-0 flex-1 animate-pulse rounded-md bg-surface2" />}>
        <SearchInput placeholder={messages.common.search} className="min-w-0 max-w-none flex-1" />
      </Suspense>
      <CalendarFilter datesWithEntries={datesWithEntries} selectedDate={selectedDate} />
      <span className="inline-flex h-10 shrink-0 items-center rounded-md border border-border px-2 text-xs font-medium text-muted sm:px-3">
        {entriesCount} {messages.dashboard.entriesCount}
      </span>
    </div>
  );
}
