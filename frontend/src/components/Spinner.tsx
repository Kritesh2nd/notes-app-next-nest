export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      role="status"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = "Loading blueprint…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--color-linefaint)] border-t-[var(--color-amber)]" />
        <div className="absolute inset-3 rounded-full border border-dashed border-[var(--color-linefaint)]" />
      </div>
      <p className="tech-label">{label}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="blueprint-card h-44 animate-pulse p-5">
      <div className="mb-4 h-3 w-1/3 bg-[var(--color-linefaint)]" />
      <div className="mb-2 h-4 w-3/4 bg-[var(--color-linefaint)]" />
      <div className="h-3 w-full bg-[var(--color-linefaint)]" />
      <div className="mt-2 h-3 w-5/6 bg-[var(--color-linefaint)]" />
    </div>
  );
}
