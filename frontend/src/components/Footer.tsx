"use client";

import Link from "next/link";
import { useContent } from "@/context/ContentContext";

export function Footer() {
  return <FooterInner />;
}

function FooterInner() {
  const content = useContent();
  return (
    <footer className="border-t border-[var(--color-linefaint)] bg-[var(--color-blue-950)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-sans-tech text-lg font-semibold">{content.brand.name}</p>
            <p className="tech-label mt-1 text-[#5c6b85]">{content.footer.tagline}</p>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="tech-label hover:text-[var(--color-amber-bright)]">
              Home
            </Link>
            <Link href="/about" className="tech-label hover:text-[var(--color-amber-bright)]">
              About
            </Link>
            <Link href="/register" className="tech-label hover:text-[var(--color-amber-bright)]">
              Sign Up
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-dashed border-[var(--color-linefaint)] pt-6">
          <p className="font-mono-tech text-xs text-[#5c6b85]">{content.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
