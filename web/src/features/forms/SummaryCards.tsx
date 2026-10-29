import { SAMPLE_SUMMARY } from './sample-data';

const ITEMS = [
  { label: 'Total forms', value: SAMPLE_SUMMARY.totalForms },
  { label: 'Published', value: SAMPLE_SUMMARY.published },
  { label: 'Total responses', value: SAMPLE_SUMMARY.totalResponses },
];

export function SummaryCards() {
  return (
    <dl className="grid grid-cols-3 gap-4">
      {ITEMS.map(({ label, value }) => (
        <div key={label} className="rounded-card border border-line bg-surface p-4 shadow-card">
          <dt className="text-sm text-ink-muted">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-ink">{value.toLocaleString('en-IN')}</dd>
        </div>
      ))}
    </dl>
  );
}