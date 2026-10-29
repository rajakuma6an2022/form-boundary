export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="grid size-8 place-items-center rounded-control bg-primary text-white">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" />
          <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
          <path d="M9 12h6" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight text-ink">FormBoundary</span>
    </div>
  );
}