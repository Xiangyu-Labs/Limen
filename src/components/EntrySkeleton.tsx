/** Shared placeholder so navigating to a server-rendered page is never silent. */
export function EntrySkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-8" aria-label="正在加载">
      <div className="h-10 w-10 animate-pulse rounded-md bg-surface2" />
      <div className="animate-pulse space-y-6">
        <div className="h-3 w-28 rounded-sm bg-surface2" />
        <div className="h-9 w-3/5 rounded-sm bg-surface2" />
        <div className="space-y-3 border-t border-border pt-10">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-4 rounded-sm bg-surface2"
              style={{ width: `${95 - index * 7}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
