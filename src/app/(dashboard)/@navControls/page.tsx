import { DashboardFilters } from '@/components/DashboardFilters';
import {
  filterDashboardEntriesByDate,
  getDashboardDatesWithEntries,
  loadDashboardEntries,
} from '@/lib/dashboard-data';

export default async function DashboardNavControls({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q, date } = await searchParams;

  const allEntries = await loadDashboardEntries(q);
  const filteredEntries = filterDashboardEntriesByDate(allEntries, date);
  const datesWithEntries = getDashboardDatesWithEntries(allEntries);

  return (
    <DashboardFilters
      datesWithEntries={datesWithEntries}
      entriesCount={filteredEntries.length}
      selectedDate={date}
    />
  );
}
