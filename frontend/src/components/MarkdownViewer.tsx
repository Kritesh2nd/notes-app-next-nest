"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="markdown-body max-w-none font-sans-tech text-[var(--color-line)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mb-4 mt-6 border-b border-[var(--color-linefaint)] pb-2 font-sans-tech text-2xl font-bold text-[var(--color-line)] first:mt-0" {...p} />,
          h2: (p) => <h2 className="mb-3 mt-6 font-sans-tech text-xl font-semibold text-[var(--color-line)]" {...p} />,
          h3: (p) => <h3 className="mb-2 mt-4 font-sans-tech text-lg font-semibold text-[var(--color-amber-bright)]" {...p} />,
          p: (p) => <p className="mb-4 leading-7 text-[#c7d0e0]" {...p} />,
          a: (p) => <a className="text-[var(--color-amber-bright)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-amber)]" target="_blank" rel="noreferrer" {...p} />,
          ul: (p) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-[#c7d0e0]" {...p} />,
          ol: (p) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-[#c7d0e0]" {...p} />,
          li: (p) => <li className="pl-1" {...p} />,
          blockquote: (p) => (
            <blockquote className="mb-4 border-l-2 border-[var(--color-amber)] bg-[rgba(224,165,44,0.06)] py-2 pl-4 italic text-[#b9c2d0]" {...p} />
          ),
          code: ({ className, children, ...p }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={`block overflow-x-auto font-mono-tech text-sm text-[var(--color-amber-bright)] ${className}`} {...p}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-none border border-[var(--color-linefaint)] bg-[rgba(6,16,36,0.6)] px-1.5 py-0.5 font-mono-tech text-[0.85em] text-[var(--color-amber-bright)]" {...p}>
                {children}
              </code>
            );
          },
          pre: (p) => <pre className="mb-4 overflow-x-auto border border-[var(--color-linefaint)] bg-[rgba(6,16,36,0.7)] p-4" {...p} />,
          hr: () => <hr className="my-6 border-dashed border-[var(--color-linefaint)]" />,
          table: (p) => (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border-collapse border border-[var(--color-linefaint)] text-sm" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-[var(--color-linefaint)] bg-[rgba(16,42,92,0.5)] px-3 py-2 text-left tech-label" {...p} />,
          td: (p) => <td className="border border-[var(--color-linefaint)] px-3 py-2 text-[#c7d0e0]" {...p} />,
          strong: (p) => <strong className="font-semibold text-[var(--color-line)]" {...p} />,
          input: (p) => <input className="mr-2 accent-[var(--color-amber)]" disabled {...p} />,
        }}
      >
        {content || "*Nothing drafted yet.*"}
      </ReactMarkdown>
    </div>
  );
}
