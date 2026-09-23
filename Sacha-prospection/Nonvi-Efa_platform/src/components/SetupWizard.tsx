"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface Key { name: string; label: string; required: boolean; help: string; url: string; placeholder: string; note?: string; set: boolean }

/** Assistant de configuration — pop-up au 1er lancement : demande les clés manquantes
 *  de l'agent + explique où les trouver, puis les enregistre (Next recharge). */
export function SetupWizard({ slug }: { slug: string }) {
  const [mounted, setMounted] = useState(false);
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    fetch(`/api/setup?slug=${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { keys: Key[]; missingRequired: boolean }) => {
        setKeys(j.keys);
        if (j.missingRequired) setOpen(true);
      })
      .catch(() => {});
  }, [slug]);

  if (!mounted || !open || !keys) return null;

  const toFill = keys.filter((k) => !k.set);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, values: vals }),
      });
      setDone(true);
      // Next (dev) redémarre sur changement de .env.local → on recharge après un court délai.
      setTimeout(() => window.location.reload(), 3500);
    } catch { setSaving(false); }
  }

  const canSave = toFill.filter((k) => k.required).every((k) => (vals[k.name] ?? "").trim().length > 3);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-lg rounded-3xl bg-[var(--color-bg)] p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">✅</div>
            <h3 className="text-2xl font-black text-[var(--color-ink)]">C&apos;est enregistré !</h3>
            <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">Je recharge ton agent avec tes clés…</p>
            <div className="mt-4 flex justify-center"><Icon name="Loader" size={22} className="animate-spin text-[var(--color-accent)]" /></div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span className="chip emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Configuration · 1 min</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Connecte ton agent</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">
              Pour fonctionner, ton agent a besoin de {toFill.length === 1 ? "cette clé" : "ces clés"}. Colle-les ci-dessous —
              chaque bouton t&apos;emmène direct à la page où la trouver. Rien n&apos;est envoyé ailleurs : tout reste sur ton ordi.
            </p>

            <div className="mt-5 space-y-4">
              {toFill.map((k) => (
                <div key={k.name} className="rounded-2xl border border-[var(--color-line)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[14px] font-black text-[var(--color-ink)]">
                      {k.label} {k.required ? <span className="text-[var(--color-accent)]">*</span> : <span className="text-[11px] font-semibold text-[var(--color-muted)]">(optionnel)</span>}
                    </div>
                    <a href={k.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-[var(--color-ink)] px-2.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90">
                      Ouvrir la page <Icon name="ExternalLink" size={11} />
                    </a>
                  </div>
                  {k.note && <div className="mt-1 text-[11.5px] font-semibold text-[var(--color-accent)]">{k.note}</div>}
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">{k.help}</p>
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={k.placeholder}
                    value={vals[k.name] ?? ""}
                    onChange={(e) => setVals((v) => ({ ...v, [k.name]: e.target.value }))}
                    className="mt-2.5 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-[13px] font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button onClick={() => setOpen(false)} className="text-[12px] font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]">Plus tard</button>
              <button
                onClick={save}
                disabled={!canSave || saving}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-[13px] font-black text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Icon name={saving ? "Loader" : "Sparkles"} size={14} className={saving ? "animate-spin" : ""} />
                {saving ? "Enregistrement…" : "Enregistrer & lancer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
