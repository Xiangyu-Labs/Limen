export function TimelineSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="正在加载">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid min-h-28 animate-pulse gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)] md:px-5">
          <div className="h-4 w-12 rounded bg-surface2" />
          <div className="space-y-3">
            <div className="h-4 w-2/5 rounded bg-surface2" />
            <div className="h-3 w-full rounded bg-surface2" />
            <div className="h-3 w-4/5 rounded bg-surface2" />
          </div>
        </div>
      ))}
    </div>
  );
}
