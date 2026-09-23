"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

interface PromptBlock {
  id: string;
  content: string;
  label: string; // titre court ("Variante A", "Prompt 1"...)
}

interface GenState {
  status: "idle" | "loading" | "done" | "error";
  url?: string;
  filename?: string;
  error?: string;
}

function extractPrompts(markdown: string): PromptBlock[] {
  const prompts: PromptBlock[] = [];
  // Code blocks ``` ... ```
  const codeBlockRegex = /```(?:[a-z]*\n)?([\s\S]*?)```/g;
  let match;
  let i = 0;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const content = match[1].trim();
    // Heuristique : un prompt Nano Banana fait au moins ~50 car et ne ressemble pas à du JSON
    if (content.length >= 40 && !content.trim().startsWith("{")) {
      // Cherche une ligne de titre juste au-dessus du block
      const before = markdown.slice(0, match.index);
      const lastHeading = before.match(/(?:^|\n)(?:#{1,4}|\*\*|-)\s*([^\n*]+)(?:\*\*|$)\s*\n[^\n]*$/);
      const labelGuess =
        lastHeading?.[1]?.trim().slice(0, 60) || `Prompt ${i + 1}`;
      prompts.push({
        id: `p-${i++}`,
        content,
        label: labelGuess,
      });
    }
  }
  return prompts;
}

export function DesignerImagesPanel({
  agentSlug,
  markdown,
}: {
  agentSlug: string;
  markdown: string;
}) {
  const prompts = useMemo(() => extractPrompts(markdown), [markdown]);
  const [states, setStates] = useState<Record<string, GenState>>({});
  const [savingPack, setSavingPack] = useState(false);
  const [packResult, setPackResult] = useState<string | null>(null);

  // Actif sur tous les agents qui peuvent produire des prompts image
  // (designer en priorité, mais aussi createur-contenu, orchestrateur, presentateur)
  const eligible = ["designer", "createur-contenu", "orchestrateur", "presentateur", "strategiste"];
  if (!eligible.includes(agentSlug) || prompts.length === 0) return null;

  const generateOne = async (p: PromptBlock) => {
    setStates((s) => ({ ...s, [p.id]: { status: "loading" } }));
    try {
      const res = await fetch("/api/nano-banana/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p.content, slug: p.label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStates((s) => ({
        ...s,
        [p.id]: { status: "done", url: data.publicUrl, filename: data.filename },
      }));
    } catch (e) {
      setStates((s) => ({
        ...s,
        [p.id]: { status: "error", error: e instanceof Error ? e.message : "Erreur" },
      }));
    }
  };

  const generateAll = async () => {
    // Séquentiel (évite rate limits)
    for (const p of prompts) {
      if (states[p.id]?.status !== "done") await generateOne(p);
    }
  };

  const doneCount = prompts.filter((p) => states[p.id]?.status === "done").length;
  const loadingCount = prompts.filter((p) => states[p.id]?.status === "loading").length;

  const savePack = async () => {
    const done = prompts.filter((p) => states[p.id]?.status === "done");
    if (done.length === 0) return;
    setSavingPack(true);
    try {
      const imagesBlock = done
        .map(
          (p, i) =>
            `### Image ${i + 1} — ${p.label}\n\n**URL :** ${window.location.origin}${states[p.id]!.url}\n\n**Prompt utilisé :**\n\n\`\`\`\n${p.content}\n\`\`\``
        )
        .join("\n\n");
      const content = `# Pack d'images générées — ${done.length} visuels\n\nProduit avec Nano Banana (Gemini 2.5 Flash Image).\n\n${imagesBlock}`;
      const res = await fetch("/api/deliverable/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: "designer",
          title: `Pack images ${done.length}`,
          content,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPackResult(data.title || "Pack enregistré");
    } catch (e) {
      setPackResult(e instanceof Error ? `Erreur : ${e.message}` : "Erreur");
    } finally {
      setSavingPack(false);
      setTimeout(() => setPackResult(null), 5000);
    }
  };

  return (
    <div className="mt-4 rounded-2xl glass-brutal overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-line)] bg-white/[0.03] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ background: "#E8461F" }}>
            <Icon name="Image" size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0a1410]">
              Prompts détectés — Nano Banana
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              {prompts.length} prompt{prompts.length > 1 ? "s" : ""} · {doneCount}/{prompts.length} généré
              {doneCount > 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && doneCount === prompts.length && (
            <button
              type="button"
              onClick={savePack}
              disabled={savingPack}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white/[0.06] backdrop-blur-xl px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-white/[0.12] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] disabled:opacity-60"
            >
              {savingPack ? (
                <>
                  <Icon name="Loader" size={12} className="animate-spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Icon name="Save" size={12} /> Enregistrer le pack
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={generateAll}
            disabled={loadingCount > 0 || doneCount === prompts.length}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-accent-hover)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] disabled:opacity-60"
          >
            {loadingCount > 0 ? (
              <>
                <Icon name="Loader" size={12} className="animate-spin" /> Génération {doneCount + loadingCount}/{prompts.length}
              </>
            ) : doneCount === prompts.length ? (
              <>
                <Icon name="Check" size={12} /> Tout est prêt
              </>
            ) : (
              <>
                <Icon name="Sparkles" size={12} /> Générer les {prompts.length} images
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
        {prompts.map((p) => {
          const s = states[p.id] ?? { status: "idle" };
          return (
            <div key={p.id} className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="p-3 border-b border-[var(--color-line)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-[#0a1410] truncate">
                    {p.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => generateOne(p)}
                    disabled={s.status === "loading" || s.status === "done"}
                    className={cn(
                      "shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                      s.status === "done"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : s.status === "loading"
                        ? "bg-[var(--color-marine-50)] text-[#0a1410]"
                        : "bg-[#0a1410] text-white hover:bg-[#0a1410]"
                    )}
                  >
                    {s.status === "loading" ? "…" : s.status === "done" ? "Prêt" : "Générer"}
                  </button>
                </div>
                <div className="mt-1 text-[10px] text-[var(--color-muted)] line-clamp-2 font-mono">
                  {p.content.slice(0, 160)}…
                </div>
              </div>
              <div className="relative bg-[var(--color-marine-50)]" style={{ aspectRatio: "1" }}>
                {s.status === "loading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-muted)]">
                    <Icon name="Loader" size={18} className="animate-spin" />
                    <span className="text-[11px]">Génération en cours…</span>
                  </div>
                )}
                {s.status === "idle" && (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)]">
                    <Icon name="ImagePlus" size={22} />
                  </div>
                )}
                {s.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-red-700 text-center">
                    <Icon name="AlertCircle" size={18} />
                    <span className="text-[10px] leading-tight">{s.error}</span>
                  </div>
                )}
                {s.status === "done" && s.url && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.url}
                      alt={p.label}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <a
                      href={s.url}
                      download={s.filename}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black"
                    >
                      <Icon name="Download" size={10} /> Télécharger
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {packResult && (
        <div className="border-t border-[var(--color-line)] bg-emerald-100 px-4 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <Icon name="CheckCircle" size={12} />
          {packResult}
        </div>
      )}
    </div>
  );
}
