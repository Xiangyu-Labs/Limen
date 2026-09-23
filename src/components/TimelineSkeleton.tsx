export function TimelineSkeleton() {
  return (
    <div className="space-y-1" aria-label="正在加载">
      <div className="flex items-center gap-3 py-2">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-surface2" />
        <div className="h-px flex-1 bg-border" />
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="grid animate-pulse gap-2 py-4 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-4"
        >
          <div className="h-4 w-12 rounded-sm bg-surface2" />
          <div className="space-y-2.5">
            <div className="h-4 w-2/5 rounded-sm bg-surface2" />
            <div className="h-3 w-full rounded-sm bg-surface2" />
            <div className="h-3 w-4/5 rounded-sm bg-surface2" />
          </div>
        </div>
      ))}
    </div>
  );
}
