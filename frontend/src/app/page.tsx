"use client";

import Link from "next/link";
import { useContent } from "@/context/ContentContext";
import { Button } from "@/components/Button";
import { ConnectorArrow, CompassBadge } from "@/components/Schematic";

export default function HomePage() {
  const content = useContent();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-linefaint)] px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-[var(--color-linefaint)] px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-[blink_1.4s_step-end_infinite] rounded-full bg-[var(--color-amber)]" />
              <span className="tech-label">{content.landing.heroEyebrow}</span>
            </div>

            <h1 className="font-sans-tech text-4xl font-bold leading-[1.08] tracking-tight text-[var(--color-line)] sm:text-5xl lg:text-6xl">
              {content.landing.heroTitle}
            </h1>

            <p className="mt-6 max-w-xl font-sans-tech text-base leading-7 text-[#b9c2d0] sm:text-lg">
              {content.landing.heroSubtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button variant="primary" className="!px-7 !py-3.5 text-base">
                  {content.landing.ctaPrimary}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" className="!px-7 !py-3.5 text-base">
                  {content.landing.ctaSecondary}
                </Button>
              </Link>
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-dashed border-[var(--color-linefaint)] pt-8 sm:grid-cols-4">
              {content.landing.stats.map((s) => (
                <div key={s.label}>
                  <dt className="tech-label">{s.label}</dt>
                  <dd className="mt-1 font-sans-tech text-xl font-semibold text-[var(--color-amber-bright)]">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Schematic note-card illustration */}
          <div className="relative mx-auto w-full max-w-md animate-[float_6s_ease-in-out_infinite]">
            <div className="blueprint-card corner-ticks relative p-6 shadow-[0_0_60px_-15px_rgba(224,165,44,0.25)]">
              <div className="mb-4 flex items-center justify-between border-b border-dashed border-[var(--color-linefaint)] pb-3">
                <span className="tech-label">DOC // 00A1-NOTE</span>
                <CompassBadge className="h-9 w-9" />
              </div>
              <h3 className="font-sans-tech text-xl font-semibold text-[var(--color-line)]"># System Architecture</h3>
              <div className="mt-3 space-y-2 font-mono-tech text-xs text-[#8593ad]">
                <p>## Overview</p>
                <p className="text-[#c7d0e0]">- Frontend: **Next.js**</p>
                <p className="text-[#c7d0e0]">- Database: **PostgreSQL**</p>
                <p className="text-[#c7d0e0]">- Auth: `JWT` + bcrypt</p>
                <p>&gt; Draft. Revise. Ship.</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-dashed border-[var(--color-linefaint)] pt-3">
                <span className="font-mono-tech text-[0.65rem] text-[#5c6b85]">REV 3 · TODAY</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--color-amber)">
                  <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 -z-10 h-full w-full border border-[var(--color-linefaint)]" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[var(--color-linefaint)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="tech-label">{content.landing.featuresEyebrow}</p>
          <h2 className="mt-2 max-w-2xl font-sans-tech text-3xl font-bold text-[var(--color-line)] sm:text-4xl">
            {content.landing.featuresTitle}
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.landing.features.map((f) => (
              <div key={f.code} className="blueprint-card corner-ticks p-6 transition-colors hover:border-[var(--color-amber)]/50">
                <span className="font-mono-tech text-xs text-[var(--color-amber)]">{f.code}</span>
                <h3 className="mt-2 font-sans-tech text-lg font-semibold text-[var(--color-line)]">{f.title}</h3>
                <p className="mt-2 font-sans-tech text-sm leading-6 text-[#8593ad]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[var(--color-linefaint)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="tech-label">{content.landing.howEyebrow}</p>
          <h2 className="mt-2 font-sans-tech text-3xl font-bold text-[var(--color-line)] sm:text-4xl">
            {content.landing.howTitle}
          </h2>

          <div className="mt-14 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            {content.landing.steps.map((s, i) => (
              <div key={s.step} className="flex flex-1 items-center gap-4">
                <div className="blueprint-card flex-1 p-5">
                  <span className="font-mono-tech text-xs text-[var(--color-amber)]">STEP {s.step}</span>
                  <h3 className="mt-1 font-sans-tech text-base font-semibold text-[var(--color-line)]">{s.title}</h3>
                  <p className="mt-1 font-sans-tech text-sm text-[#8593ad]">{s.description}</p>
                </div>
                {i < content.landing.steps.length - 1 && (
                  <ConnectorArrow className="hidden h-6 w-10 shrink-0 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="blueprint-card corner-ticks relative overflow-hidden px-6 py-14 text-center sm:px-14">
            <div className="absolute inset-0 -z-10 grid-fade-mask bg-[radial-gradient(circle,rgba(224,165,44,0.08),transparent_65%)]" />
            <h2 className="font-sans-tech text-3xl font-bold text-[var(--color-line)] sm:text-4xl">
              {content.landing.ctaBannerTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-sans-tech text-[#b9c2d0]">{content.landing.ctaBannerSubtitle}</p>
            <div className="mt-8 flex justify-center">
              <Link href="/register">
                <Button variant="primary" className="!px-8 !py-3.5 text-base">
                  {content.landing.ctaPrimary}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
