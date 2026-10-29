/** The server-error area is always in the DOM so screen readers announce the text when it appears. */
export function ServerAlert({ message }: { message: string | null }) {
  return (
    <div role="alert" className={message ? 'mb-4' : undefined}>
      {message ? (
        <p className="rounded-control border border-danger bg-danger-soft px-3 py-2 text-sm text-ink">{message}</p>
      ) : null}
    </div>
  );
}

export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      onClick={onToggle}
      className="rounded-control px-2 py-1 text-sm font-medium text-primary hover:text-primary-hover"
    >
      {visible ? 'Hide' : 'Show'}
    </button>
  );
}