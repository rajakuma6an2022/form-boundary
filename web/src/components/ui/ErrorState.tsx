import { Button } from './Button';

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <section role="alert" className="rounded-card border border-danger bg-danger-soft px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      <div className="mt-6 flex justify-center">
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </section>
  );
}