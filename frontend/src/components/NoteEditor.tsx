"use client";

import { useState, FormEvent } from "react";
import { noteSchema } from "@/lib/validation";
import { Input, TextArea } from "@/components/FormField";
import { Button } from "@/components/Button";
import { MarkdownViewer } from "@/components/MarkdownViewer";

type Errors = Partial<Record<"title" | "content", string>>;

export function NoteEditor({
  initialTitle = "",
  initialContent = "",
  submitLabel = "Save Note",
  onSubmit,
  loading,
  extraActions,
}: {
  initialTitle?: string;
  initialContent?: string;
  submitLabel?: string;
  onSubmit: (data: { title: string; content: string }) => void;
  loading?: boolean;
  extraActions?: React.ReactNode;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [errors, setErrors] = useState<Errors>({});
  const [tab, setTab] = useState<"write" | "preview">("write");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = noteSchema.safeParse({ title, content });
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        label="Title"
        htmlFor="title"
        name="title"
        placeholder="Give this note a name…"
        required
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
        }}
        error={errors.title}
        className="!font-sans-tech !text-lg"
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="tech-label">
            Content (Markdown) <span className="text-[var(--color-danger)]">*</span>
          </span>
          <div className="flex border border-[var(--color-linefaint)]">
            <button
              type="button"
              onClick={() => setTab("write")}
              className={`tech-label px-3 py-1 ${tab === "write" ? "bg-[var(--color-amber)] text-[var(--color-blue-950)]" : "text-[#8593ad]"}`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`tech-label px-3 py-1 ${tab === "preview" ? "bg-[var(--color-amber)] text-[var(--color-blue-950)]" : "text-[#8593ad]"}`}
            >
              Preview
            </button>
          </div>
        </div>

        {tab === "write" ? (
          <>
            <textarea
              id="content"
              name="content"
              rows={16}
              placeholder={"# Heading\n\nWrite your note in **Markdown**…\n\n- item one\n- item two"}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              className={`field-input resize-y ${errors.content ? "field-error" : ""}`}
              aria-invalid={!!errors.content}
            />
            {errors.content && (
              <p className="mt-1.5 font-mono-tech text-xs text-[var(--color-danger)]" role="alert">
                ⚠ {errors.content}
              </p>
            )}
          </>
        ) : (
          <div className="min-h-[24rem] border border-[var(--color-linefaint)] bg-[rgba(6,16,36,0.4)] p-5">
            <MarkdownViewer content={content} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[var(--color-linefaint)] pt-5">
        <div>{extraActions}</div>
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
