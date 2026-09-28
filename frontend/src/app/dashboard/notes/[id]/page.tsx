"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { NoteEditor } from "@/components/NoteEditor";
import { PageLoader } from "@/components/Spinner";
import { Badge } from "@/components/Badge";
import { ConfirmDialog } from "@/components/Modal";

interface Note {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  updatedAt: string;
  createdAt: string;
}

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { push } = useToast();

  const [note, setNote] = useState<Note | null | "not-found">(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<Note>(`/notes/${params.id}`).then((result) => {
      if (result.success && result.data) setNote(result.data);
      else setNote("not-found");
    });
  }, [params.id]);

  async function handleSubmit(data: { title: string; content: string }) {
    setSaving(true);
    const result = await apiFetch<Note>(`/notes/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!result.success) {
      push(result.error || "Could not save note.", "error");
      return;
    }
    push("Note updated.", "success");
    router.push("/dashboard");
  }

  async function toggleFavorite() {
    if (!note || note === "not-found") return;
    const next = !note.isFavorite;
    setNote({ ...note, isFavorite: next });
    const result = await apiFetch(`/notes/${params.id}/favorite`, {
      method: "PATCH",
      body: JSON.stringify({ isFavorite: next }),
    });
    if (!result.success) push(result.error || "Could not update favorite.", "error");
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await apiFetch(`/notes/${params.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(false);
    if (!result.success) {
      push(result.error || "Could not delete note.", "error");
      return;
    }
    push("Note deleted.", "success");
    router.push("/dashboard");
  }

  if (note === null) return <PageLoader label="Loading note…" />;

  if (note === "not-found") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="font-sans-tech text-2xl font-bold text-[var(--color-line)]">Note not found</h1>
        <p className="font-sans-tech text-sm text-[#8593ad]">It may have been deleted or never existed.</p>
        <Link href="/dashboard" className="tech-label mt-2 hover:text-[var(--color-amber-bright)]">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="tech-label hover:text-[var(--color-amber-bright)]">
          ← Back to Dashboard
        </Link>

        <div className="mb-8 mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-sans-tech text-3xl font-bold text-[var(--color-line)]">Edit Note</h1>
          <div className="flex items-center gap-3">
            {note.isFavorite && <Badge tone="amber">Favorite</Badge>}
            <span className="font-mono-tech text-xs text-[#5c6b85]">
              Updated {new Date(note.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="blueprint-card corner-ticks p-6 sm:p-8">
          <NoteEditor
            initialTitle={note.title}
            initialContent={note.content}
            submitLabel="Save Changes"
            onSubmit={handleSubmit}
            loading={saving}
            extraActions={
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`tech-label flex items-center gap-1.5 ${
                    note.isFavorite ? "text-[var(--color-amber-bright)]" : "text-[#8593ad] hover:text-[var(--color-amber)]"
                  }`}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill={note.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
                  </svg>
                  {note.isFavorite ? "Favorited" : "Add to Favorites"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="tech-label text-[var(--color-danger)] hover:text-[#ff8a7f]"
                >
                  Delete Note
                </button>
              </div>
            }
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        description="This will permanently remove the note. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
