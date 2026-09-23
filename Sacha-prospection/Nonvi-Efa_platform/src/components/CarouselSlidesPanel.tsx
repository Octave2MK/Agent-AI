"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type Ratio = "1:1" | "4:5" | "9:16";

interface GeneratedSlide {
  index: number;
  publicUrl: string;
  filename: string;
}

interface GenState {
  status: "idle" | "loading" | "done" | "error";
  slides?: GeneratedSlide[];
  error?: string;
  ratio?: Ratio;
}

/**
 * Détecte si le markdown contient une structure de carrousel / deck
 * (H1 + au moins 2 H2, idéalement avec des tags [stat], [quote], etc.).
 */
export function detectCarousel(markdown: string): { hasCarousel: boolean; slideCount: number } {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  const h2Count = (markdown.match(/^##\s+/gm) ?? []).length;
  if (!h1 || h2Count < 2) return { hasCarousel: false, slideCount: 0 };
  return { hasCarousel: true, slideCount: h2Count + 1 };
}

export function CarouselSlidesPanel({
  agentSlug,
  markdown,
}: {
  agentSlug: string;
  markdown: string;
}) {
  const router = useRouter();
  const detection = useMemo(() => detectCarousel(markdown), [markdown]);
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [state, setState] = useState<GenState>({ status: "idle" });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Carrousels = uniquement pour le Créateur de Contenu (posts sociaux).
  // Les autres agents (Analyste, Stratège, Présentateur, Gmail, Fireflies, CV)
  // produisent des PDF de présentation 16:9 via /api/presentations/generate.
  const eligible = ["createur-contenu"];

  // Navigation clavier quand le viewer est en focus
  useEffect(() => {
    if (state.status !== "done" || !state.slides) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIdx((i) => Math.min((state.slides?.length ?? 1) - 1, i + 1));
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.status, state.slides]);

  // Désactive le scroll du body quand la lightbox est ouverte
  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  if (!eligible.includes(agentSlug) || !detection.hasCarousel) return null;

  const generate = async () => {
    setState({ status: "loading" });
    setCurrentIdx(0);
    try {
      const res = await fetch("/api/carousels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, ratio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setState({ status: "done", slides: data.slides, ratio });
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "Erreur" });
    }
  };

  const saveDeliverable = async () => {
    if (state.status !== "done" || !state.slides) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Carrousel";
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const imagesList = state.slides
        .map((s) => `### Slide ${s.index + 1}\n\n![Slide ${s.index + 1}](${origin}${s.publicUrl})\n\n**Fichier** : \`${s.filename}\``)
        .join("\n\n");
      const body = `# ${h1}\n\n**Format** : ${state.ratio} · ${state.slides.length} slides\n**Rendu** : HTML → PNG (texte impeccable)\n\n---\n\n## Images générées\n\n${imagesList}\n\n---\n\n## Markdown source\n\n\`\`\`markdown\n${markdown}\n\`\`\`\n`;

      const res = await fetch("/api/deliverable/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: "createur-contenu",
          title: `Carrousel — ${h1.slice(0, 60)}`,
          content: body,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSaveResult(`« ${data.title} » enregistré dans vos livrables.`);
      router.refresh();
    } catch (e) {
      setSaveResult(e instanceof Error ? `Erreur : ${e.message}` : "Erreur");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveResult(null), 4500);
    }
  };

  const downloadAll = () => {
    if (state.status !== "done" || !state.slides) return;
    state.slides.forEach((s, i) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = s.publicUrl;
        link.download = s.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 200);
    });
  };

  const ratioLabel: Record<Ratio, string> = {
    "1:1": "Carré (Instagram, LinkedIn)",
    "4:5": "Portrait (feed Instagram)",
    "9:16": "Story / Reel",
  };

  const slides = state.slides ?? [];
  const total = slides.length;
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < total - 1;

  return (
    <div className="mt-4 rounded-2xl border border-[#0a1410]/10 bg-white overflow-hidden shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]">
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[#0a1410]/10">
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white" style={{ background: "#C94F3C" }}>
            <Icon name="Images" size={14} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#0a1410]">
              Carrousel — style éditorial Nonvi-Efa
            </div>
            <div className="text-[11px] text-[#1e3a2c]">
              {detection.slideCount} slides · rendu HTML → PNG (texte 100 % fidèle)
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-3 space-y-3">
        {/* Sélecteur de format + bouton générer */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1e3a2c]">
            Format
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-[#0a1410]/15 bg-white/70 backdrop-blur-xl p-0.5 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.2)]">
            {(["1:1", "4:5", "9:16"] as Ratio[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatio(r)}
                disabled={state.status === "loading"}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  ratio === r
                    ? "bg-[#0a1410] text-white"
                    : "text-[#1e3a2c] hover:bg-[#0a1410]/10"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#1e3a2c]">{ratioLabel[ratio]}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={generate}
            disabled={state.status === "loading"}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ background: "#C94F3C" }}
          >
            {state.status === "loading" ? (
              <>
                <Icon name="Loader" size={12} className="animate-spin" /> Génération des {detection.slideCount} slides…
              </>
            ) : state.status === "done" ? (
              <>
                <Icon name="RefreshCw" size={12} /> Regénérer
              </>
            ) : (
              <>
                <Icon name="Sparkles" size={12} /> Générer le carrousel
              </>
            )}
          </button>

          {state.status === "done" && total > 0 && (
            <>
              <button
                type="button"
                onClick={saveDeliverable}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-accent-hover)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Icon name="Loader" size={12} className="animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={12} /> Enregistrer le carrousel
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={downloadAll}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-xl px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-white/[0.12] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]"
              >
                <Icon name="Download" size={12} /> Tout télécharger ({total})
              </button>
            </>
          )}
        </div>

        {state.status === "error" && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <Icon name="AlertCircle" size={12} className="inline mr-1" />
            {state.error}
          </div>
        )}

        {/* Viewer slider */}
        {state.status === "done" && total > 0 && (
          <div className="space-y-3">
            <div
              ref={viewerRef}
              className="relative rounded-2xl bg-gradient-to-br from-[#F5F0E8] to-[#E8DCC9] p-3 shadow-inner"
            >
              {/* Slide en cours — clic = agrandir en plein écran. Taille réduite pour rester visible entièrement dans le chat. */}
              <div className="relative flex items-center justify-center mx-auto" style={{ maxWidth: "420px" }}>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={`Agrandir le slide ${currentIdx + 1}`}
                  className="group relative w-full overflow-hidden rounded-xl shadow-xl bg-white/10 text-[var(--color-ink)] cursor-zoom-in"
                  style={{ aspectRatio: (state.ratio ?? ratio).replace(":", "/") }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slides[currentIdx].publicUrl}
                    alt={`Slide ${currentIdx + 1}`}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 text-white px-2.5 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="Maximize2" size={10} /> Agrandir
                  </span>
                </button>
              </div>

              {/* Controls flèches */}
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={!canPrev}
                aria-label="Slide précédent"
                className={cn(
                  "absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.1] backdrop-blur-xl border border-white/10 shadow-md transition-all",
                  canPrev ? "text-[#0a1410] hover:bg-[var(--color-marine-50)] hover:scale-105" : "text-[var(--color-muted)] opacity-40 cursor-not-allowed"
                )}
              >
                <Icon name="ChevronLeft" size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                disabled={!canNext}
                aria-label="Slide suivant"
                className={cn(
                  "absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.1] backdrop-blur-xl border border-white/10 shadow-md transition-all",
                  canNext ? "text-[#0a1410] hover:bg-[var(--color-marine-50)] hover:scale-105" : "text-[var(--color-muted)] opacity-40 cursor-not-allowed"
                )}
              >
                <Icon name="ChevronRight" size={18} />
              </button>

              {/* Indicateur position */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-[#2C2C2C] px-3 py-1 text-[11px] font-bold text-white tabular-nums">
                {currentIdx + 1} / {total}
              </div>

              {/* Action on current slide */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <a
                  href={slides[currentIdx].publicUrl}
                  download={slides[currentIdx].filename}
                  className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#0a1410] shadow-md hover:bg-white/10 text-[var(--color-ink)]"
                >
                  <Icon name="Download" size={11} /> Slide
                </a>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {slides.map((s, i) => (
                <button
                  key={s.filename}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "relative shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    currentIdx === i
                      ? "border-[#C94F3C] scale-105 shadow-md"
                      : "border-[var(--color-line)] opacity-60 hover:opacity-100"
                  )}
                  style={{ width: 72, aspectRatio: (state.ratio ?? ratio).replace(":", "/") }}
                  aria-label={`Aller au slide ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.publicUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute top-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                    {i + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Hint clavier */}
            <div className="text-center text-[10px] text-[var(--color-muted)]">
              ← → pour naviguer · clic sur une miniature pour sauter au slide
            </div>
          </div>
        )}

        {saveResult && (
          <div
            className={cn(
              "rounded-md px-3 py-2 text-xs flex items-center gap-2",
              saveResult.startsWith("Erreur")
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            )}
          >
            <Icon name={saveResult.startsWith("Erreur") ? "AlertCircle" : "CheckCircle"} size={12} />
            {saveResult}
          </div>
        )}
      </div>

      {/* Lightbox plein écran — clic sur un slide pour voir le post en entier, non rogné */}
      {lightboxOpen && state.status === "done" && total > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu plein écran du carrousel"
        >
          {/* Bouton fermer */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Fermer"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Icon name="X" size={18} />
          </button>

          {/* Indicateur page + format */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-white tabular-nums">
              {currentIdx + 1} / {total}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
              {state.ratio ?? ratio}
            </span>
          </div>

          {/* Flèche gauche */}
          {canPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((i) => Math.max(0, i - 1));
              }}
              aria-label="Slide précédent"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Icon name="ChevronLeft" size={22} />
            </button>
          )}

          {/* Slide centré — object-contain pour ne jamais rogner, hauteur max viewport */}
          <div
            className="relative flex items-center justify-center"
            style={{ maxWidth: "min(95vw, 1080px)", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[currentIdx].publicUrl}
              alt={`Slide ${currentIdx + 1} en plein écran`}
              className="rounded-xl shadow-2xl"
              style={{ maxHeight: "90vh", maxWidth: "100%", objectFit: "contain" }}
            />
          </div>

          {/* Flèche droite */}
          {canNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((i) => Math.min(total - 1, i + 1));
              }}
              aria-label="Slide suivant"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Icon name="ChevronRight" size={22} />
            </button>
          )}

          {/* Hint bas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-white/60">
            ← → pour naviguer · Échap ou clic en dehors pour fermer
          </div>
        </div>
      )}
    </div>
  );
}
