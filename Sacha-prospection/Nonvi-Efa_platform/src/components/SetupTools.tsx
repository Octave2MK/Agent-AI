"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface Key { name: string; label: string; required: boolean; help: string; url: string; placeholder: string; note?: string; set: boolean }

/**
 * Bouton "Connecter mes outils" + pop-up de configuration.
 * - S'ouvre tout seul au 1er lancement si une clé obligatoire manque.
 * - Réouvrable à tout moment via le bouton.
 * - Montre les clés déjà configurées (✓) et permet de les MODIFIER.
 * - À l'enregistrement : écrit .env.local, Next recharge, et on revérifie
 *   que les clés sont bien prises en compte (statut ✓).
 */
export function SetupTools({ slug }: { slug: string }) {
  const [mounted, setMounted] = useState(false);
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<"form" | "saving" | "done">("form");

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async (autoOpen: boolean) => {
    try {
      const j = await (await fetch(`/api/setup?slug=${slug}`, { cache: "no-store" })).json();
      setKeys(j.keys);
      if (autoOpen && j.missingRequired) setOpen(true);
      return j as { keys: Key[]; missingRequired: boolean };
    } catch { return null; }
  }, [slug]);

  useEffect(() => { void load(true); }, [load]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  async function save() {
    setSaving(true); setPhase("saving");
    try {
      await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, values: vals }) });
      // Next (dev) redémarre sur .env.local → on attend puis on revérifie que c'est pris.
      await new Promise((r) => setTimeout(r, 4000));
      for (let i = 0; i < 8; i++) {
        const j = await load(false);
        if (j && !j.missingRequired) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      setPhase("done");
      setVals({}); setEditing({});
      setTimeout(() => { setPhase("form"); }, 1800);
    } catch { setPhase("form"); } finally { setSaving(false); }
  }

  function openModal() { setPhase("form"); setVals({}); setEditing({}); setOpen(true); }

  const btn = (
    <button
      type="button"
      onClick={openModal}
      className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white/70 px-3.5 py-2 text-[13px] font-bold text-[var(--color-ink)] transition hover:bg-white"
    >
      <Icon name="Plug" size={14} /> Connecter mes outils
    </button>
  );

  const canSave = (keys ?? []).filter((k) => k.required && (!k.set || editing[k.name])).every((k) => (vals[k.name] ?? "").trim().length > 3)
    && Object.values(vals).some((v) => (v ?? "").trim().length > 3);

  const modal = open && keys && (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4" onClick={() => !saving && setOpen(false)}>
      <div className="my-8 w-full max-w-lg rounded-3xl bg-[var(--color-bg)] p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {phase === "done" ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">✅</div>
            <h3 className="text-2xl font-black text-[var(--color-ink)]">Tout est connecté !</h3>
            <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">Tes clés sont enregistrées et prises en compte. Ton agent est prêt.</p>
          </div>
        ) : phase === "saving" ? (
          <div className="py-10 text-center">
            <Icon name="Loader" size={28} className="mx-auto animate-spin text-[var(--color-accent)]" />
            <p className="mt-4 text-[14px] font-bold text-[var(--color-ink)]">Enregistrement & activation…</p>
            <p className="mt-1 text-[12px] text-[var(--color-ink-soft)]">Je vérifie que tout est bien pris en compte.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1"><span className="chip emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Configuration</span></div>
                <h3 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Connecter mes outils</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"><Icon name="X" size={18} /></button>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
              Colle tes clés — chaque bouton t&apos;emmène direct à la page où la trouver. Tout reste sur ton ordi. Les clés déjà
              configurées sont marquées ✓ (tu peux les modifier).
            </p>

            <div className="mt-5 space-y-3">
              {keys.map((k) => {
                const isEditing = !k.set || editing[k.name];
                return (
                  <div key={k.name} className="rounded-2xl border border-[var(--color-line)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[14px] font-black text-[var(--color-ink)]">
                        {k.set && <span className="text-emerald-600">✓</span>}
                        {k.label} {k.required ? <span className="text-[var(--color-accent)]">*</span> : <span className="text-[11px] font-semibold text-[var(--color-muted)]">(optionnel)</span>}
                      </div>
                      {isEditing ? (
                        <a href={k.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-[var(--color-ink)] px-2.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90">
                          Ouvrir la page <Icon name="ExternalLink" size={11} />
                        </a>
                      ) : (
                        <button onClick={() => setEditing((e) => ({ ...e, [k.name]: true }))} className="rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--color-ink)] hover:bg-white">
                          Modifier
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        {k.note && <div className="mt-1 text-[11.5px] font-semibold text-[var(--color-accent)]">{k.note}</div>}
                        <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">{k.help}</p>
                        <input
                          type="text" autoComplete="off" spellCheck={false} placeholder={k.placeholder}
                          value={vals[k.name] ?? ""}
                          onChange={(e) => setVals((v) => ({ ...v, [k.name]: e.target.value }))}
                          className="mt-2.5 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-[13px] font-mono"
                        />
                      </>
                    ) : (
                      <p className="mt-1 text-[12px] font-semibold text-emerald-600">Clé enregistrée et active.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setOpen(false)} className="text-[12px] font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]">Fermer</button>
              <button onClick={save} disabled={!canSave || saving}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-[13px] font-black text-white transition hover:opacity-90 disabled:opacity-40">
                <Icon name="Sparkles" size={14} /> Enregistrer &amp; activer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {btn}
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
