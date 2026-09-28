"use client";

import { useContent } from "@/context/ContentContext";

export default function AboutPage() {
  const content = useContent();
  const about = content.about;

  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="tech-label">{about.eyebrow}</p>
        <h1 className="mt-2 font-sans-tech text-4xl font-bold text-[var(--color-line)] sm:text-5xl">{about.title}</h1>
        <p className="mt-6 max-w-2xl font-sans-tech text-lg leading-8 text-[#b9c2d0]">{about.intro}</p>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="blueprint-card corner-ticks p-6">
            <h2 className="font-sans-tech text-xl font-semibold text-[var(--color-amber-bright)]">Our Mission</h2>
            <p className="mt-3 font-sans-tech text-sm leading-6 text-[#c7d0e0]">{about.mission}</p>
          </div>

          <div className="blueprint-card corner-ticks p-6">
            <h2 className="font-sans-tech text-xl font-semibold text-[var(--color-amber-bright)]">Tech Stack</h2>
            <dl className="mt-3 divide-y divide-dashed divide-[var(--color-linefaint)] font-mono-tech text-xs">
              {about.stack.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-2">
                  <dt className="text-[#5c6b85]">{row.label}</dt>
                  <dd className="text-right text-[#c7d0e0]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="font-sans-tech text-2xl font-bold text-[var(--color-line)]">What We Value</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {about.values.map((v, i) => (
              <div key={v.title} className="blueprint-card p-5">
                <span className="font-mono-tech text-xs text-[var(--color-amber)]">
                  V-{String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-sans-tech font-semibold text-[var(--color-line)]">{v.title}</h3>
                <p className="mt-2 font-sans-tech text-sm leading-6 text-[#8593ad]">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-dashed border-[var(--color-linefaint)] pt-8">
          <p className="font-sans-tech text-sm leading-7 text-[#8593ad]">{about.closing}</p>
        </div>
      </div>
    </div>
  );
}
