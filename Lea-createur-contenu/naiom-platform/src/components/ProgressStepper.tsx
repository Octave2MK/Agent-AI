"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

/**
 * Plan d'étapes par agent — affiché à la place du markdown streamé pour
 * donner un signal "l'agent travaille" sans exposer le contenu brut.
 *
 * 5 étapes par agent, la dernière étant toujours "Mise en forme" / finalisation.
 */
const AGENT_PLANS: Record<string, string[]> = {
  strategiste: [
    "Lecture du brief et du contexte marque",
    "Analyse de la niche et des concurrents",
    "Construction de l'ICP (persona + JTBD)",
    "Formulation du positionnement et des angles",
    "Mise en forme du brief structuré",
  ],
  "createur-contenu": [
    "Lecture du brief et de la voix de marque",
    "Sélection du framework (AIDA / PAS / BAB)",
    "Écriture du hook et variantes",
    "Rédaction du corps et du CTA",
    "Finalisation (hashtags, A/B)",
  ],
  designer: [
    "Lecture de la direction artistique",
    "Choix du modèle (Nano Banana / Midjourney / Ideogram)",
    "Rédaction du prompt principal",
    "Génération des variantes par format",
    "Vérification des interdictions brand",
  ],
  analyste: [
    "Lecture des données brutes",
    "Calcul des KPIs vs baseline",
    "Identification des top / flop contenus",
    "Formulation des recommandations",
    "Structuration en slides visuelles",
  ],
  presentateur: [
    "Lecture du livrable source",
    "Structuration narrative (SCQA / Minto)",
    "Rédaction slide par slide",
    "Choix des layouts visuels",
    "Finalisation du deck",
  ],
  gmail: [
    "Lecture de la boîte de réception",
    "Classification par niveau d'urgence",
    "Regroupement thématique",
    "Priorisation des actions",
    "Structuration en deck visuel",
  ],
  fireflies: [
    "Lecture du transcript",
    "Extraction des décisions et enjeux",
    "Scoring BANT",
    "Plan d'action équipe",
    "Structuration en deck visuel",
  ],
  cv: [
    "Lecture des candidatures",
    "Scoring vs fiche de poste",
    "Analyse forces / réserves",
    "Ranking et recommandations",
    "Structuration en deck visuel",
  ],
  orchestrateur: [
    "Identification de l'agent cible",
    "Préparation du contexte",
    "Production du livrable",
    "Finalisation",
    "Vérification",
  ],
};

const DEFAULT_PLAN = [
  "Lecture du contexte",
  "Analyse de la demande",
  "Production du livrable",
  "Vérification",
  "Finalisation",
];

export interface ProgressStepperProps {
  agentSlug: string;
  agentName: string;
  /** Longueur cumulée du texte déjà streamé (proxy de progression). */
  streamedChars: number;
  /** true dès que le serveur a accepté la requête mais que rien ne stream encore. */
  pending: boolean;
  accent?: "marine" | "nude" | "muted";
}

export function ProgressStepper({ agentSlug, agentName, streamedChars, pending, accent = "marine" }: ProgressStepperProps) {
  const plan = AGENT_PLANS[agentSlug] ?? DEFAULT_PLAN;
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 250);
    return () => clearInterval(t);
  }, []);

  // Progression : combine temps écoulé (secondes) et longueur streamée.
  // - Les 3 premières secondes : seul le temps compte (l'agent "lit").
  // - Ensuite, la longueur streamée prend le relais (cap à 2000 chars = 90 %).
  // - Plafonne à 95 % tant que le streaming continue.
  const sec = elapsed / 1000;
  const timeFraction = Math.min(sec / 25, 0.95); // 25s estimé
  const charFraction = Math.min(streamedChars / 2500, 0.95);
  const progress = pending ? Math.min(timeFraction * 0.4, 0.2) : Math.max(timeFraction, charFraction);
  const pct = Math.min(Math.round(progress * 100), 95);

  // Étape courante = progression × nb d'étapes
  const currentIdx = Math.min(Math.floor(progress * plan.length), plan.length - 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] border border-[var(--color-ink)]" />
          </span>
          <span className="text-sm font-black tracking-tight text-[var(--color-ink)] truncate">
            {agentName} travaille
          </span>
        </div>
        <span className="text-[11px] font-black tabular-nums text-[var(--color-ink)] bg-white/[0.08] backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--color-ink)] bg-white/[0.08] backdrop-blur-md">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps list */}
      <ol className="space-y-1.5">
        {plan.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li key={idx} className="flex items-center gap-2.5 text-xs">
              <span className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10",
                done && "bg-emerald-500 text-white",
                active && "bg-[var(--color-accent)] text-white",
                !done && !active && "bg-white text-[var(--color-muted)]",
              )}>
                {done ? (
                  <Icon name="Check" size={10} />
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-[9px] font-black text-[var(--color-ink)]">{idx + 1}</span>
                )}
              </span>
              <span className={cn(
                "leading-tight",
                done && "text-[var(--color-muted)] line-through font-medium",
                active && "text-[var(--color-ink)] font-black",
                !done && !active && "text-[var(--color-muted)] font-semibold",
              )}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
