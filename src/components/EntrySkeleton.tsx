/** Shared placeholder so navigating to a server-rendered page is never silent. */
export function EntrySkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4" aria-label="正在加载">
      <div className="h-10 w-10 animate-pulse rounded-md bg-surface2" />
      <div className="animate-pulse space-y-6 rounded-lg border border-border bg-surface p-5 md:p-8">
        <div className="h-4 w-32 rounded bg-surface2" />
        <div className="h-9 w-3/5 rounded bg-surface2" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-4 rounded bg-surface2"
              style={{ width: `${95 - index * 7}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
