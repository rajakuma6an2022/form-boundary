import { useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FormsSkeleton } from './FormsSkeleton';
import { FormsTable } from './FormsTable';
import { SAMPLE_FORMS } from './sample-data';
import { SummaryCards } from './SummaryCards';

export function FormsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('state'); // Day 1 aid: ?state=loading | empty | error shows each design state
  const query = (params.get('q') ?? '').trim();

  if (view === 'loading') return <FormsSkeleton />;

  if (view === 'error') {
    return (
      <ErrorState
        title="Couldn’t load your forms"
        description="Something went wrong on our side. Check your connection and try again."
        onRetry={() => setParams({}, { replace: true })}
      />
    );
  }

  if (view === 'empty') {
    return (
      <EmptyState
        title="No forms yet"
        description="Create a form, add the fields you need, and share a public link to start collecting responses."
        action={<Button>Create your first form</Button>}
      />
    );
  }

  const rows = SAMPLE_FORMS.filter((form) => form.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <SummaryCards />
      <section className="rounded-card border border-line bg-surface shadow-card">
        {rows.length > 0 ? (
          <FormsTable rows={rows} />
        ) : (
          <p className="px-5 py-12 text-center text-sm text-ink-muted">No forms match “{query}”.</p>
        )}
      </section>
    </div>
  );
}