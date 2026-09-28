export function SchematicCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 4 L4 40 M4 4 L40 4"
        stroke="var(--color-amber)"
        strokeWidth="1.5"
        className="animate-[draw-line_1s_ease_forwards]"
      />
      <circle cx="4" cy="4" r="2.5" fill="var(--color-amber)" />
    </svg>
  );
}

/** A schematic connector line with an arrowhead, used to link steps/sections. */
export function ConnectorArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 24" className={className} fill="none" aria-hidden="true">
      <line x1="0" y1="12" x2="86" y2="12" stroke="var(--color-linefaint)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M80 6 L92 12 L80 18" stroke="var(--color-amber)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function CompassBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="34" stroke="var(--color-linefaint)" strokeWidth="1" />
      <circle cx="40" cy="40" r="26" stroke="var(--color-linefaint)" strokeWidth="1" strokeDasharray="2 4" />
      <line x1="40" y1="6" x2="40" y2="14" stroke="var(--color-amber)" strokeWidth="1.5" />
      <line x1="40" y1="66" x2="40" y2="74" stroke="var(--color-amber)" strokeWidth="1.5" />
      <line x1="6" y1="40" x2="14" y2="40" stroke="var(--color-amber)" strokeWidth="1.5" />
      <line x1="66" y1="40" x2="74" y2="40" stroke="var(--color-amber)" strokeWidth="1.5" />
      <path d="M40 20 L48 40 L40 60 L32 40 Z" stroke="var(--color-amber)" strokeWidth="1.2" />
    </svg>
  );
}

export function BlueprintBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(30,74,147,0.35),transparent_70%)]" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(224,165,44,0.08),transparent_70%)]" />
      <div className="absolute inset-0 grid-fade-mask opacity-60" />
    </div>
  );
}
