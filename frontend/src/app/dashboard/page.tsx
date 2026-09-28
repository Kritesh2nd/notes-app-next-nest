"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useContent } from "@/context/ContentContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/Button";
import { SkeletonCard } from "@/components/Spinner";
import { NoteCard, NoteSummary } from "@/components/NoteCard";
import { ConfirmDialog } from "@/components/Modal";

export default function DashboardPage() {
  const content = useContent();
  const { user } = useAuth();
  const { push } = useToast();
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadNotes() {
    const result = await apiFetch<NoteSummary[]>("/notes");
    if (result.success) setNotes(result.data || []);
    else push(result.error || "Could not load notes.", "error");
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!notes) return [];
    return notes
      .filter((n) => (filter === "favorites" ? n.isFavorite : true))
      .filter((n) =>
        search.trim()
          ? n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [notes, filter, search]);

  async function toggleFavorite(id: string, next: boolean) {
    setNotes((prev) => prev?.map((n) => (n.id === id ? { ...n, isFavorite: next } : n)) || prev);
    const result = await apiFetch(`/notes/${id}/favorite`, {
      method: "PATCH",
      body: JSON.stringify({ isFavorite: next }),
    });
    if (!result.success) {
      push(result.error || "Could not update favorite.", "error");
      loadNotes();
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await apiFetch(`/notes/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (result.success) {
      setNotes((prev) => prev?.filter((n) => n.id !== deleteId) || prev);
      push("Note deleted.", "success");
    } else {
      push(result.error || "Could not delete note.", "error");
    }
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-dashed border-[var(--color-linefaint)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="tech-label">WORKSPACE // {user?.name?.toUpperCase() || "…"}</p>
            <h1 className="mt-1 font-sans-tech text-3xl font-bold text-[var(--color-line)]">Your Notes</h1>
          </div>
          <Link href="/dashboard/notes/new">
            <Button variant="primary">+ New Note</Button>
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <input
              className="field-input pl-9"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search notes"
            />
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6b85]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <div className="flex gap-2">
            {(["all", "favorites"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`tech-label border px-3 py-1.5 transition-colors ${
                  filter === f
                    ? "border-[var(--color-amber)] text-[var(--color-amber-bright)]"
                    : "border-[var(--color-linefaint)] text-[#8593ad] hover:text-[var(--color-line)]"
                }`}
              >
                {f === "all" ? "All Notes" : "Favorites"}
              </button>
            ))}
          </div>
        </div>

        {notes === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="blueprint-card corner-ticks flex flex-col items-center gap-3 px-6 py-20 text-center">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--color-amber)" strokeWidth="1.2">
              <path d="M6 3h9l5 5v13H6z" />
              <path d="M15 3v5h5" />
              <path d="M9 13h6M9 17h6M9 9h2" />
            </svg>
            <h2 className="font-sans-tech text-lg font-semibold text-[var(--color-line)]">
              {notes.length === 0 ? content.dashboard.emptyTitle : "No notes match your search"}
            </h2>
            <p className="max-w-sm font-sans-tech text-sm text-[#8593ad]">
              {notes.length === 0 ? content.dashboard.emptySubtitle : "Try a different keyword or clear the filter."}
            </p>
            {notes.length === 0 && (
              <Link href="/dashboard/notes/new" className="mt-2">
                <Button variant="primary">+ New Note</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onToggleFavorite={toggleFavorite} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Note"
        description="This will permanently remove the note. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
