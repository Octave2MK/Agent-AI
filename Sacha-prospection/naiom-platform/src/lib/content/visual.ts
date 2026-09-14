/**
 * Génération des VISUELS via Higgsfield (nano_banana_pro) à partir des templates
 * de Zeyneb : chaque slide de carrousel est rendue en reproduisant le template
 * choisi, avec le texte de la slide. Léa écrit le texte, Higgsfield fait le visuel.
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@/lib/paths";
import { hfCreate, hfGet } from "@/lib/integrations/higgsfield";
import type { Platform, Slide } from "./generate";

const TEMPLATES_DIR = path.join(REPO_ROOT, "Templates creation de contenu ");
const MODEL = "nano_banana_pro";

/**
 * refId → LISTE ordonnée des slides du template (chaque slide a un design différent).
 * ig-typeX → toutes les captures du dossier "Type X" triées (slide 1, 2, 3…).
 * li-N → l'image unique choisie.
 */
export function resolveTemplateSlides(refId?: string | null): string[] {
  if (!refId) return [];
  if (refId.startsWith("li-")) {
    const n = refId.slice(3);
    const p = path.join(TEMPLATES_DIR, "Template Linkedin ", `${n}.png`);
    return fs.existsSync(p) ? [p] : [];
  }
  if (refId.startsWith("ig-type")) {
    const num = refId.replace("ig-type", "");
    const base = path.join(TEMPLATES_DIR, "Template instagram");
    const dir = fs.readdirSync(base).find((d) => d.replace(/\s+/g, "") === `Type${num}`);
    if (!dir) return [];
    const full = path.join(base, dir);
    return fs.readdirSync(full).filter((f) => /\.png$/i.test(f)).sort().map((f) => path.join(full, f));
  }
  return [];
}

/** Photo de Zeyneb (référence visage) pour les templates LinkedIn/Twitter. */
export function facePath(): string | null {
  const dir = path.join(TEMPLATES_DIR, "Template instagram", "Photo de moi ");
  try {
    const f = fs.readdirSync(dir).find((x) => /\.(jpe?g|png)$/i.test(x));
    return f ? path.join(dir, f) : null;
  } catch { return null; }
}

function aspectFor(platform: Platform): string {
  return platform === "instagram" ? "4:5" : "1:1";
}

function slidePrompt(slide: Slide, i: number, total: number, idea: string, hasFace: boolean): string {
  const role = i === 0 ? "SLIDE DE COUVERTURE (hook)" : i === total - 1 ? "SLIDE FINALE (appel à l'action)" : `SLIDE de contenu ${i + 1}/${total}`;
  return [
    "Recrée cette image de référence À L'IDENTIQUE. Garde EXACTEMENT les mêmes éléments graphiques : les petites mascottes/personnages pixel Claude, les illustrations, icônes, logos, tableaux, encadrés, post-its, flèches dessinées, textures, couleurs, typographies et la mise en page — au pixel près.",
    "La SEULE chose que tu changes, c'est le TEXTE (remplacé par le contenu ci-dessous). Ne supprime, n'ajoute et ne modifie AUCUN élément visuel. Ne « réinterprète » pas le style : copie-le.",
    hasFace ? "Si l'image de référence contient une personne (visage/portrait), remplace SON visage par celui de la personne sur la photo de référence fournie, en gardant exactement la même pose, le même cadrage et la même scène. Garde ce visage identique et cohérent sur toutes les slides." : "",
    `C'est la ${role} d'un carrousel sur : « ${idea} ».`,
    `Titre principal (français, même emplacement et même style que la référence) : « ${slide.title} ».`,
    slide.body ? `Texte secondaire : « ${slide.body} ».` : "",
    "Texte net, parfaitement lisible, bien orthographié en français. Pas de filigrane.",
  ].filter(Boolean).join(" ");
}

export interface SlideJob { index: number; jobId: string }

/** Crée un job Higgsfield par slide — chaque slide référence la slide CORRESPONDANTE
 *  du template pour un carrousel aux designs variés (couverture ≠ slides de contenu). */
export async function createSlideJobs(
  platform: Platform,
  slides: Slide[],
  refId: string | null,
  idea: string
): Promise<SlideJob[]> {
  const tplSlides = resolveTemplateSlides(refId);
  if (!tplSlides.length) throw new Error("Template introuvable — choisis un modèle valide.");
  const face = facePath(); // ta tête sur tous les réseaux (utilisée si le template montre une personne)
  const aspect = aspectFor(platform);

  const jobs: SlideJob[] = [];
  for (let i = 0; i < slides.length; i++) {
    const ref = tplSlides[Math.min(i, tplSlides.length - 1)]; // slide i ↔ template slide i
    const refs = face ? [ref, face] : [ref];
    const jobId = await hfCreate(MODEL, slidePrompt(slides[i], i, slides.length, idea, !!face), refs, { aspect_ratio: aspect, resolution: "2k" });
    jobs.push({ index: i, jobId });
  }
  return jobs;
}

export async function pollSlideJobs(jobs: SlideJob[]): Promise<{ index: number; status: string; imageUrl: string | null }[]> {
  return Promise.all(
    jobs.map(async (j) => {
      const r = await hfGet(j.jobId);
      return { index: j.index, status: r.status, imageUrl: r.imageUrl };
    })
  );
}
