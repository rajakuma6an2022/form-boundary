import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-card border border-line bg-surface px-6 py-16 text-center shadow-card">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}