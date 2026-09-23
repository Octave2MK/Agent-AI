"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

interface FaceRef {
  name: string;
  sizeLabel: string;
  bytes: number;
}

interface Thumb {
  label: string;
  visualUrl: string;
  finalUrl: string;
  prompt: string;
}

interface RefsResponse {
  found: boolean;
  faces: FaceRef[];
  error?: string;
}

const ANGLE_PRESETS = [
  "Confiant, regard caméra",
  "Surpris / choqué",
  "Sourire enthousiaste",
  "Sérieux, intense",
  "Curieux, intrigué",
];

export function ThumbnailStudio() {
  const [faces, setFaces] = useState<FaceRef[]>([]);
  const [refError, setRefError] = useState<string | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [title, setTitle] = useState("");
  const [angle, setAngle] = useState("");
  const [selectedFace, setSelectedFace] = useState<string>("");

  const [generating, setGenerating] = useState(false);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/youtube-thumbnail/references")
      .then((r) => r.json())
      .then((data: RefsResponse) => {
        if (cancelled) return;
        if (!data.found || data.faces.length === 0) {
          setRefError(data.error || "Aucune photo dans le dossier MINIATURE.");
        } else {
          setFaces(data.faces);
          setSelectedFace(data.faces[0].name);
        }
      })
      .catch((e) => !cancelled && setRefError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => !cancelled && setLoadingRefs(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = async () => {
    if (title.trim().length < 2 || generating) return;
    setGenerating(true);
    setGenError(null);
    setThumbs([]);
    try {
      const res = await fetch("/api/youtube-thumbnail/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          angle: angle.trim() || undefined,
          referenceName: selectedFace || undefined,
          count: 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setThumbs(data.thumbnails ?? []);
      if (data.errors?.length) {
        setGenError(
          `${data.errors.length} composition(s) en échec — affichage des réussies.`
        );
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = title.trim().length >= 2 && !generating && faces.length > 0;

  return (
    <div className="space-y-5">
      {/* ===== Formulaire ===== */}
      <div className="glass-brutal rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: "#E8461F" }}>
            <Icon name="Image" size={16} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--color-ink)]">Miniature YouTube</h3>
            <p className="text-[11px] text-[var(--color-ink-soft)]">
              Ton visage (dossier MINIATURE) composé dans 3 miniatures 1280×720, titre incrusté net.
            </p>
          </div>
        </div>

        {/* État de la référence visage */}
        {loadingRefs ? (
          <div className="mb-4 h-9 rounded-lg bg-white/[0.05] animate-pulse" />
        ) : refError ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2.5 text-[12px] text-amber-200">
            <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
            <span>{refError}</span>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)] mb-1.5">
              Visage de référence
            </label>
            <div className="flex flex-wrap gap-2">
              {faces.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedFace(f.name)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    selectedFace === f.name
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/[0.12] text-[var(--color-ink)]"
                      : "border-[var(--color-line)] bg-white/[0.04] text-[var(--color-ink-soft)] hover:bg-white/[0.08]"
                  )}
                >
                  <Icon name="User" size={12} />
                  {f.name}
                  <span className="text-[10px] text-[var(--color-ink-dim)]">{f.sizeLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Titre */}
        <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)] mb-1.5">
          Titre de la vidéo
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. : J'ai remplacé mon SDR par une IA"
          maxLength={70}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] outline-none focus:border-[var(--color-accent)]/60"
        />
        <div className="mt-1 text-[10px] text-[var(--color-ink-dim)]">
          Entoure un mot de <code>*astérisques*</code> pour le mettre en jaune. {title.length}/70
        </div>

        {/* Émotion / angle */}
        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)] mb-1.5">
          Émotion / expression
        </label>
        <input
          type="text"
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="Optionnel — ex. : surpris, intense, sourire confiant"
          maxLength={120}
          className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] outline-none focus:border-[var(--color-accent)]/60"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ANGLE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAngle(p)}
              className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--color-ink-soft)] hover:bg-white/[0.08]"
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-[14px] font-bold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <Icon name="Loader" size={15} className="animate-spin" />
              Génération des 3 miniatures…
            </>
          ) : (
            <>
              <Icon name="Sparkles" size={15} />
              Générer 3 miniatures
            </>
          )}
        </button>
        {generating && (
          <p className="mt-2 text-center text-[11px] text-[var(--color-ink-dim)]">
            ~20–40 s · Nano Banana compose ton visage puis le titre est incrusté.
          </p>
        )}
      </div>

      {/* ===== Erreur globale ===== */}
      {genError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 text-[12px] text-red-200">
          <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
          <span>{genError}</span>
        </div>
      )}

      {/* ===== Résultats ===== */}
      {generating && thumbs.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-white/[0.05] animate-pulse" style={{ aspectRatio: "16/9" }} />
          ))}
        </div>
      )}

      {thumbs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {thumbs.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] overflow-hidden"
            >
              <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.finalUrl} alt={t.label} className="absolute inset-0 h-full w-full object-cover" />
                <a
                  href={t.finalUrl}
                  download
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black"
                >
                  <Icon name="Download" size={10} /> Télécharger
                </a>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-[12px] font-semibold text-[var(--color-ink)] truncate">{t.label}</span>
                <a
                  href={t.visualUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] whitespace-nowrap"
                >
                  Visuel brut ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
