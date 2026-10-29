import { Skeleton } from '../../components/ui/Skeleton';

export function FormsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading forms</span>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((key) => (
          <div key={key} className="rounded-card border border-line bg-surface p-4 shadow-card">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-card">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}