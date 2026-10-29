import { useEffect, useState } from 'react';
import { Logo } from '../../components/layout/Logo';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export function BootScreen() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" aria-busy="true" className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="text-sm text-ink-muted">Loading your workspace…</p>
        <Skeleton className="mx-auto h-3 w-48" />
        <Skeleton className="mx-auto h-3 w-32" />
        {slow ? (
          <p className="text-sm text-ink-muted">
            The server is waking up. On the free tier this can take up to a minute.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function BootError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div role="alert" className="w-full max-w-sm space-y-4 rounded-card border border-danger bg-danger-soft p-6 text-center">
        <h1 className="text-lg font-semibold text-ink">Can’t reach the server</h1>
        <p className="text-sm text-ink-muted">
          Check your connection and try again. If the server was asleep, it may need a moment.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}