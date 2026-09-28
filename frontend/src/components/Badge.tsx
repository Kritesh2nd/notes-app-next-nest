export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amber" | "danger" | "ok";
}) {
  const toneClass = {
    neutral: "border-[var(--color-linefaint)] text-[var(--color-line)]",
    amber: "border-[var(--color-amber)] text-[var(--color-amber-bright)]",
    danger: "border-[var(--color-danger)] text-[var(--color-danger)]",
    ok: "border-[var(--color-ok)] text-[var(--color-ok)]",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono-tech text-[0.65rem] uppercase tracking-widest ${toneClass}`}>
      {children}
    </span>
  );
}
