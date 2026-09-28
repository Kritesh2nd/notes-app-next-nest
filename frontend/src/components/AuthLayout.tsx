import { ReactNode } from "react";
import Link from "next/link";
import { CompassBadge } from "@/components/Schematic";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <CompassBadge className="mb-4 h-14 w-14" />
          <p className="tech-label">SECURE ACCESS PANEL</p>
          <h1 className="mt-2 font-sans-tech text-2xl font-bold text-[var(--color-line)]">{title}</h1>
          <p className="mt-1 font-sans-tech text-sm text-[#8593ad]">{subtitle}</p>
        </div>

        <div className="blueprint-card corner-ticks p-6 sm:p-8">{children}</div>

        {footer && <div className="mt-6 text-center font-sans-tech text-sm text-[#8593ad]">{footer}</div>}

        <p className="mt-8 text-center">
          <Link href="/" className="tech-label hover:text-[var(--color-amber-bright)]">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
