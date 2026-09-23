"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

/** Bouton "Rejoindre brAIn" → ouvre un pop-up (rendu via portal, jamais rogné). */
export function BrainGate() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // bloque le scroll du fond quand la modale est ouverte
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[var(--color-bg)] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-3xl">🔒</div>
        <h3 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Réservé aux membres brAIn</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Si tu veux <b className="text-[var(--color-ink)]">tous les autres agents</b>, ils sont réservés aux
          membres <b className="text-[var(--color-accent)]">brAIn</b>.
        </p>
        <button
          onClick={() => setOpen(false)}
          className="mt-6 rounded-xl bg-[var(--color-ink)] px-6 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
        >
          Compris
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
      >
        <Icon name="Sparkles" size={13} /> Rejoindre brAIn pour y accéder
      </button>
      {open && mounted && createPortal(modal, document.body)}
    </>
  );
}
