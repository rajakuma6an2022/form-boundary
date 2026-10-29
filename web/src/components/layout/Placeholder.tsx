export function Placeholder({ name }: { name: string }) {
  return (
    <section className="rounded-card border border-line bg-surface p-8 shadow-card">
      <h2 className="text-lg font-semibold text-ink">{name}</h2>
      <p className="mt-2 text-sm text-ink-muted">This screen is built on a later day.</p>
    </section>
  );
}