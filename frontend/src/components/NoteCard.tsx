"use client";

import Link from "next/link";
import { Badge } from "@/components/Badge";

export interface NoteSummary {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  updatedAt: string;
}

function excerpt(md: string, len = 110) {
  const plain = md
    .replace(/[#*_`>~-]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > len ? plain.slice(0, len) + "…" : plain || "Empty note.";
}

export function NoteCard({
  note,
  onToggleFavorite,
  onDelete,
}: {
  note: NoteSummary;
  onToggleFavorite: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="blueprint-card corner-ticks group relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-amber)]/50">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="tech-label truncate">
          NOTE // {note.id.slice(-6).toUpperCase()}
        </p>
        <button
          onClick={() => onToggleFavorite(note.id, !note.isFavorite)}
          aria-label={note.isFavorite ? "Unfavorite" : "Favorite"}
          className={`shrink-0 transition-transform hover:scale-110 ${
            note.isFavorite ? "text-[var(--color-amber)]" : "text-[#5c6b85] hover:text-[var(--color-amber)]"
          }`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill={note.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
          </svg>
        </button>
      </div>

      <Link href={`/dashboard/notes/${note.id}`} className="flex-1">
        <h3 className="mb-2 font-sans-tech text-lg font-semibold text-[var(--color-line)] line-clamp-2 group-hover:text-[var(--color-amber-bright)]">
          {note.title}
        </h3>
        <p className="font-mono-tech text-xs leading-5 text-[#8593ad] line-clamp-3">{excerpt(note.content)}</p>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-[var(--color-linefaint)] pt-3">
        <span className="font-mono-tech text-[0.65rem] text-[#5c6b85]">
          {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <div className="flex items-center gap-3">
          {note.isFavorite && <Badge tone="amber">Favorite</Badge>}
          <Link href={`/dashboard/notes/${note.id}`} className="tech-label hover:text-[var(--color-amber-bright)]">
            Open
          </Link>
          <button
            onClick={() => onDelete(note.id)}
            className="tech-label text-[var(--color-danger)] hover:text-[#ff8a7f]"
            aria-label="Delete note"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
