"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { NoteEditor } from "@/components/NoteEditor";

export default function NewNotePage() {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: { title: string; content: string }) {
    setLoading(true);
    const result = await apiFetch<{ id: string }>("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (!result.success) {
      push(result.error || "Could not create note.", "error");
      return;
    }
    push("Note created.", "success");
    router.push("/dashboard");
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="tech-label hover:text-[var(--color-amber-bright)]">
          ← Back to Dashboard
        </Link>
        <h1 className="mb-8 mt-3 font-sans-tech text-3xl font-bold text-[var(--color-line)]">Draft a New Note</h1>
        <div className="blueprint-card corner-ticks p-6 sm:p-8">
          <NoteEditor onSubmit={handleSubmit} loading={loading} submitLabel="Create Note" />
        </div>
      </div>
    </div>
  );
}
