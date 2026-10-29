export type FormStatus = 'DRAFT' | 'PUBLISHED';

const styles: Record<FormStatus, { label: string; pill: string; dot: string }> = {
  DRAFT: { label: 'Draft', pill: 'bg-neutral-soft text-ink-muted', dot: 'bg-ink-muted' },
  PUBLISHED: { label: 'Published', pill: 'bg-success-soft text-success-ink', dot: 'bg-success' },
};

export function StatusBadge({ status }: { status: FormStatus }) {
  const { label, pill, dot } = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${pill}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}