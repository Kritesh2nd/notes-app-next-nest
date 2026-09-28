// Centralised, editable site copy. The `useContent()` hook (src/context/ContentContext.tsx)
// exposes this object app-wide so components never hardcode copy inline.

export const siteContent = {
  brand: {
    name: "Blueprint Notes",
    shortName: "BPN",
    tagline: "Draft your thinking like an engineer.",
  },
  nav: {
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ],
  },
  landing: {
    heroEyebrow: "SCHEMATIC-GRADE NOTE TAKING",
    heroTitle: "Design your ideas on a living blueprint.",
    heroSubtitle:
      "Blueprint Notes is a precision note-taking workspace with full Markdown support, instant search, and a technical-drawing aesthetic built for people who think in systems.",
    ctaPrimary: "Start Drafting — It's Free",
    ctaSecondary: "View the Specs",
    stats: [
      { label: "Markdown Engine", value: "GFM" },
      { label: "Encryption", value: "AES / bcrypt" },
      { label: "Uptime Target", value: "99.9%" },
      { label: "Sync Latency", value: "<120ms" },
    ],
    featuresEyebrow: "SYSTEM MODULES",
    featuresTitle: "Everything you need, nothing you don't.",
    features: [
      {
        code: "M-01",
        title: "Markdown Native",
        description:
          "Write in plain Markdown and preview live with GitHub-flavoured rendering — headings, tables, code blocks, and checklists all render instantly.",
      },
      {
        code: "M-02",
        title: "Favorites & Pinning",
        description:
          "Mark critical notes as favorites to keep them surfaced at the top of your workspace grid.",
      },
      {
        code: "M-03",
        title: "Secure Accounts",
        description:
          "Email verification, hashed credentials, and token-based password recovery keep every account locked down.",
      },
      {
        code: "M-04",
        title: "Full Data Control",
        description:
          "Edit, delete, or permanently remove your account and every associated note whenever you choose.",
      },
      {
        code: "M-05",
        title: "Admin Oversight",
        description:
          "A dedicated control room lets administrators audit, ban, or remove accounts to keep the workspace healthy.",
      },
      {
        code: "M-06",
        title: "Responsive Draftboard",
        description:
          "The interface adapts from widescreen drafting tables down to a single mobile pane without losing precision.",
      },
    ],
    howEyebrow: "PROCESS FLOW",
    howTitle: "From blank sheet to structured archive.",
    steps: [
      { step: "01", title: "Register", description: "Create an account and verify your email address." },
      { step: "02", title: "Draft", description: "Write notes in Markdown with live formatting." },
      { step: "03", title: "Organise", description: "Favorite key notes and edit anytime." },
      { step: "04", title: "Own Your Data", description: "Export your thinking or delete it — your call." },
    ],
    ctaBannerTitle: "Ready to put your ideas on the drafting table?",
    ctaBannerSubtitle: "No credit card. No clutter. Just a clean sheet and a pencil.",
  },
  about: {
    eyebrow: "PROJECT SPEC SHEET",
    title: "About Blueprint Notes",
    intro:
      "Blueprint Notes is a full-stack reference application: a Markdown-first notes workspace styled after technical drafting paper — deep blueprint blue, faint engineering grids, amber annotation ink, and monospace data labels.",
    mission:
      "We believe the tool you write in should feel as considered as the ideas you put into it. Blueprint Notes treats every note like a schematic: precise, revisable, and built to last.",
    stack: [
      { label: "Frontend", value: "Next.js (App Router) + TypeScript + Tailwind CSS v4" },
      { label: "Backend", value: "Next.js Route Handlers (REST-style API)" },
      { label: "Database", value: "PostgreSQL via Prisma ORM" },
      { label: "Auth", value: "JWT session cookies + bcrypt hashing" },
      { label: "Email", value: "Nodemailer (SMTP) with dev console fallback" },
    ],
    values: [
      {
        title: "Precision",
        description: "Every interaction — from form validation to error states — is deliberate and clearly labelled.",
      },
      {
        title: "Ownership",
        description: "Your notes and your account are yours to export, edit, or erase at any time.",
      },
      {
        title: "Durability",
        description: "Built on boring, reliable technology so your notes are still readable in ten years.",
      },
    ],
    closing:
      "This project doubles as a reference implementation for teams evaluating a production-style Next.js + Postgres stack, including containerised deployment pipelines.",
  },
  auth: {
    login: {
      title: "Access the Drafting Table",
      subtitle: "Sign in to continue working on your notes.",
    },
    register: {
      title: "Open a New Blueprint",
      subtitle: "Create an account to start drafting notes.",
    },
    forgot: {
      title: "Recover Access",
      subtitle: "Enter your email and we'll send reset instructions.",
    },
    reset: {
      title: "Set a New Password",
      subtitle: "Choose a strong password for your account.",
    },
    verify: {
      title: "Verifying your email",
      subtitle: "Hold tight while we confirm your account.",
    },
  },
  dashboard: {
    emptyTitle: "No notes on the board yet",
    emptySubtitle: "Click \"New Note\" to draft your first schematic.",
  },
  footer: {
    tagline: "A schematic workspace for structured thinking.",
    copyright: `© ${new Date().getFullYear()} Blueprint Notes. All rights reserved.`,
  },
} as const;

export type SiteContent = typeof siteContent;
