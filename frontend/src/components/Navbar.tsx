"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useContent } from "@/context/ContentContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";

export function Navbar() {
  const content = useContent();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = [
    ...content.nav.links,
    ...(user ? [{ label: "Dashboard", href: "/dashboard" }] : []),
    ...(user?.role === "ADMIN" ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-linefaint)] bg-[var(--color-blue-950)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center border border-[var(--color-amber)] text-[var(--color-amber)] transition-transform group-hover:rotate-45">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M4 20 L20 4 M4 4h6v6M20 20h-6v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-sans-tech text-lg font-semibold tracking-tight text-[var(--color-line)]">
            {content.brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`tech-label transition-colors hover:text-[var(--color-amber-bright)] ${
                pathname === link.href ? "text-[var(--color-amber)]" : "text-[var(--color-line)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <>
              <Link href="/dashboard/settings" className="tech-label text-[var(--color-line)] hover:text-[var(--color-amber-bright)]">
                {user.name.split(" ")[0]}
              </Link>
              <Button variant="secondary" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="tech-label hover:text-[var(--color-amber-bright)]">
                Sign In
              </Link>
              <Link href="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center border border-[var(--color-linefaint)] md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--color-linefaint)] bg-[var(--color-blue-950)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="tech-label" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-linefaint)] pt-4">
              {user ? (
                <Button variant="secondary" onClick={logout}>
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="secondary" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
