import { Plus, Search } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router';
import { Button } from '../ui/Button';

const TITLES: Record<string, string> = {
  '/forms': 'Forms',
  '/dashboard': 'Dashboard',
  '/responses': 'Responses',
  '/settings': 'Settings',
};

export function Header() {
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const title = TITLES[pathname] ?? 'FormBoundary';

  function onSearch(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line bg-surface px-8">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <div role="search" className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            aria-label="Search forms"
            placeholder="Search forms…"
            value={params.get('q') ?? ''}
            onChange={(event) => onSearch(event.target.value)}
            className="h-10 w-80 rounded-control border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary"
          />
        </div>
        <Button>
          <Plus aria-hidden className="size-4" />
          New form
        </Button>
      </div>
    </header>
  );
}