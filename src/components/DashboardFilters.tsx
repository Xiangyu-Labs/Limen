import { Suspense } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { messages } from '@/lib/messages';

export function DashboardFilters() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Suspense fallback={<div className="h-10 min-w-0 flex-1 animate-pulse rounded-md bg-surface2" />}>
        <SearchInput placeholder={messages.common.search} className="min-w-0 max-w-none flex-1" />
      </Suspense>
    </div>
  );
}
