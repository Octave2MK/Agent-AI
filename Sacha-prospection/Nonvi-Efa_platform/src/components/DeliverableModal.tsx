"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Icon } from "./Icon";

export function DeliverableModal({
  agentSlug,
  slug,
  title,
  children,
}: {
  agentSlug: string;
  slug: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onEsc);
      if (!content && !loading) {
        setLoading(true);
        fetch(`/api/deliverable?agent=${encodeURIComponent(agentSlug)}&slug=${encodeURIComponent(slug)}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
          .then((data) => setContent(data.content))
          .catch((e) => setErr(e.message))
          .finally(() => setLoading(false));
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, agentSlug, slug, content, loading]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left"
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-8 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl max-h-[90vh]"
          >
            <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#0a1410] truncate pr-4">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-[var(--color-marine-50)]"
                aria-label="Fermer"
              >
                <Icon name="X" size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Icon name="Loader" size={14} className="animate-spin" />
                  Chargement…
                </div>
              )}
              {err && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  Erreur : {err}
                </div>
              )}
              {content && (
                <article className="prose-Nonvi-Efa">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </article>
              )}
            </div>
            <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2 text-[11px] text-[var(--color-muted)]">
              Appuie sur <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] border border-[var(--color-line)]">Esc</kbd> pour fermer
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
