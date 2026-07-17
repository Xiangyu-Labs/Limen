import { TimelineSkeleton } from '@/components/TimelineSkeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>
      <TimelineSkeleton />
    </div>
  );
}
