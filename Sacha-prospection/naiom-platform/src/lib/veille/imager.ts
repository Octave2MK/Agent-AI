/**
 * « Imager le script » — transforme le script parlé d'un reel en un short
 * vertical (9:16) fait de SCHÉMAS ANIMÉS dans le style « Bronx » (orange
 * #F5411C / violet #5B4DEE / Archivo), identique aux visuels coulisses.
 *
 * Pipeline : Claude conçoit N slides (SVG animés) → Puppeteer capture les
 * frames de chaque slide → ffmpeg encode un MP4 1080×1920.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { generateText } from "ai";
import puppeteer, { type Browser } from "puppeteer";
import type { VeillePost } from "./store";
import { getAIModel, requireAIKey } from "../ai/provider";

export const PUBLIC_SHORTS_DIR = path.join(process.cwd(), "public", "generated-shorts");
export const PUBLIC_SHORTS_URL = "/generated-shorts";

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;
const MAX_SLIDES = 6;
/** durée totale minimale de la vidéo, en secondes */
const MIN_TOTAL_SEC = 25;

/** Une slide-schéma, telle que produite par le modèle. */
export interface ShortSlide {
  eyebrow: string;
  /** peut contenir <span class="lv-mark">…</span> (variantes m2 / m3) */
  title: string;
  goal?: string;
  analog?: string;
  /** SCHÉMA — markup intérieur d'un <svg viewBox="0 0 1200 620"> (gauche) */
  svg: string;
  /** MAQUETTE D'INTERFACE Claude/ChatGPT — markup intérieur d'un <svg viewBox="0 0 600 470"> (droite, optionnel) */
  app?: string;
  /** explication « 💡 … », peut contenir <b>…</b> */
  why: string;
  board?: "" | "lav" | "mint" | "peach" | "ciel";
  /** durée d'affichage en secondes */
  dur?: number;
}

/* ============================ 1. GÉNÉRATION ============================= */

const DESIGN_BRIEF = `Tu es motion-designer. Tu transformes le SCRIPT PARLÉ d'un reel Instagram en une
vidéo HORIZONTALE 16:9 faite de SCHÉMAS ANIMÉS qui EXPLIQUENT et IMAGENT le propos.
Tu REPRODUIS EXACTEMENT le style des visuels « coulisses » : boards pastel PLEINS (opaques),
un SCHÉMA animé à GAUCHE et, le plus souvent, une MAQUETTE D'INTERFACE (Claude, ChatGPT ou autre)
à DROITE où l'on voit un PROMPT se taper tout seul. INTERDIT : glassmorphism, transparence, flou,
fond sombre, boîte noire.

CHARTE (obligatoire, aucune autre couleur) :
- orange #F5411C · violet #5B4DEE · vert #188A5C · encre #0F0F0F · crème #FFFDF9
- boards pastel PLEINS : lav (violet clair), mint (vert clair), peach (pêche), ciel (bleu clair).
- Archivo (affichage) ; JetBrains Mono pour le mono/code (class="mt" sur les <text> mono).

FORMAT DE SORTIE — JSON STRICT, rien d'autre :
{"slides":[{
  "eyebrow":"label mono court, ex: PARTIE 1 · LA BOUCLE",
  "title":"titre court. Surligne 1 mot clé: <span class=\\"lv-mark\\">mot</span> (m2 = vert, m3 = orange)",
  "goal":"(optionnel) pastille verte, ex: 🎯 le but : …",
  "analog":"(optionnel) pastille violette, ex: 🔁 comme …",
  "svg":"SCHÉMA — markup INTÉRIEUR d'un <svg viewBox=\\"0 0 1200 620\\"> : un vrai schéma qui illustre l'idée (boîtes rx≈24, flèches, nœuds, flux étape→étape, boucle, comparaison). PAS de wordart isolé.",
  "app":"RECOMMANDÉ (à mettre sur la plupart des slides) — markup INTÉRIEUR d'un <svg viewBox=\\"0 0 600 470\\"> : une fenêtre d'app (Claude OU ChatGPT) avec 3 ronds macOS, une sidebar, un titre, 2-3 lignes qui apparaissent, et une BARRE DE PROMPT où un texte se tape tout seul. C'est ce qui montre CONCRÈTEMENT l'outil.",
  "why":"phrase 💡 qui explique en clair, avec 1-2 <b>passages en gras</b>",
  "board":"lav" | "mint" | "peach" | "ciel",
  "dur":5
}]}

RÈGLES SCHÉMA (svg, viewBox 0 0 1200 620) :
- Schéma lisible : flux gauche→droite, rectangles rx≈24, flèches, boucles, comparaisons. fill #0F0F0F sur fond clair, #fff sur boîtes de couleur (violet/orange/vert). Jamais de boîte noire/sombre.
- Animations (classes CSS déjà définies, à mettre en attribut class sur l'élément) :
  · "flow" (trait/flèche qui coule) · "pop" (pulsation) · "float" (flottement)
  · "ph" style="--d:0s|2s|4s" (apparition séquencée) · "fx"/"fo" (crossfade 2 états) · "blink" (curseur)
  · point qui suit un chemin : <animateMotion dur="4.5s" repeatCount="indefinite"><mpath href="#p1"/></animateMotion>
- Flèches : <marker id="arN" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#0F0F0F"/></marker> puis marker-end="url(#arN)".

RÈGLES INTERFACE (app, viewBox 0 0 600 470) :
- Fenêtre : <rect fill="#fff" stroke="#0F0F0F" stroke-width="3" rx="18">, 3 ronds #FF5F57 / #FEBC2E / #28C840, sidebar #F6F5F1, titre (ex « Quoi de prévu ? »), 2-3 lignes réponses qui apparaissent (class="lv-ph" style="--d:.4s|1.2s|2s").
- BARRE DE PROMPT en bas où le texte se tape : entoure le <text> d'un clipPath animé
  <clipPath id="clpN"><rect x=".." y=".." width="W" height=".."><animate attributeName="width" values="0;0;W;W;W" keyTimes="0;0.12;0.5;0.92;1" dur="6s" repeatCount="indefinite"/></rect></clipPath>
  + un curseur class="blink" (▌). La commande en orange, ex <tspan fill="#F5411C" font-weight="700" class="mt">/goal</tspan>.
- Choisis Claude OU ChatGPT selon le script.

IDs UNIQUES par slide (marker/path/clip préfixés par le n° de slide) pour éviter les collisions.

LANGUE — RÈGLE ABSOLUE :
- TOUT est en FRANÇAIS : eyebrow, titre, pastilles, why, ET chaque texte à l'intérieur des schémas SVG.
- Si le script est en anglais (ou autre langue), tu TRADUIS tout en français. Aucun mot d'anglais résiduel dans les schémas (sauf noms propres / marques).

CONTENU :
- 4 à 6 slides. La 1re = accroche/idée centrale, les suivantes déroulent le script, la dernière = punchline / à-retenir.
- La PLUPART des slides = duo (schéma à GAUCHE + interface Claude/ChatGPT à DROITE via le champ "app"). Fournis "app" sur AU MOINS 3 slides — c'est ce que l'utilisatrice veut voir : l'outil en action.
- Zéro jargon creux. Une idée par slide. Fidèle au script (ne pas inventer de chiffres).
- Varie les couleurs de board.

DURÉE (important) :
- La vidéo doit durer AU MOINS 25 secondes au total. Choisis "dur" (secondes, entre 4 et 8) pour chaque slide de façon à ce que la SOMME soit ≥ 25s (ex. 5 slides × 5-6s). Laisse le temps de lire le titre, le schéma et la note 💡.`;

const FEWSHOT = `Exemple d'une slide DUO (schéma à gauche + interface à droite) — même structure & niveau de détail attendus, adapte au script (ne copie pas le sujet) :
{"eyebrow":"PARTIE 1 · LA BOUCLE","title":"Une <span class=\\"lv-mark\\">loop</span>, ça recommence tout seul","goal":"🎯 le but : un objectif, pas une tâche","board":"lav","dur":6,
"why":"Une IA classique répond une fois. Une loop <b>ne rend jamais un travail à moitié fait</b> : elle compare, corrige, recommence jusqu'à l'objectif.",
"svg":"<defs><marker id=\\"s1ar\\" viewBox=\\"0 0 10 10\\" refX=\\"8\\" refY=\\"5\\" markerWidth=\\"7\\" markerHeight=\\"7\\" orient=\\"auto-start-reverse\\"><path d=\\"M0,0L10,5L0,10z\\" fill=\\"#0F0F0F\\"/></marker></defs><path id=\\"s1p\\" d=\\"M 230 150 H 970 A 130 130 0 0 1 970 430 H 230 A 130 130 0 0 1 230 150 Z\\" fill=\\"none\\" stroke=\\"#0F0F0F\\" stroke-width=\\"4\\" class=\\"flow\\"/><rect x=\\"280\\" y=\\"95\\" width=\\"330\\" height=\\"110\\" rx=\\"24\\" fill=\\"#5B4DEE\\"/><text x=\\"445\\" y=\\"160\\" text-anchor=\\"middle\\" fill=\\"#fff\\" font-size=\\"30\\" font-weight=\\"700\\">Tu fixes l'objectif</text><rect x=\\"690\\" y=\\"95\\" width=\\"290\\" height=\\"110\\" rx=\\"24\\" fill=\\"#FFFDF9\\" stroke=\\"#0F0F0F\\" stroke-width=\\"3.5\\"/><text x=\\"835\\" y=\\"160\\" text-anchor=\\"middle\\" font-size=\\"30\\" font-weight=\\"700\\">Claude agit</text><rect x=\\"600\\" y=\\"375\\" width=\\"370\\" height=\\"110\\" rx=\\"24\\" fill=\\"#FFFDF9\\" stroke=\\"#0F0F0F\\" stroke-width=\\"3.5\\"/><text x=\\"785\\" y=\\"440\\" text-anchor=\\"middle\\" font-size=\\"28\\" font-weight=\\"700\\">Il compare</text><rect x=\\"110\\" y=\\"375\\" width=\\"280\\" height=\\"110\\" rx=\\"24\\" fill=\\"#F5411C\\"/><text x=\\"250\\" y=\\"420\\" text-anchor=\\"middle\\" fill=\\"#fff\\" font-size=\\"27\\" font-weight=\\"700\\">Pas bon ?</text><text x=\\"250\\" y=\\"453\\" text-anchor=\\"middle\\" fill=\\"#fff\\" font-size=\\"23\\">il corrige</text><circle r=\\"17\\" fill=\\"#F5411C\\" stroke=\\"#0F0F0F\\" stroke-width=\\"3.5\\"><animateMotion dur=\\"4.5s\\" repeatCount=\\"indefinite\\"><mpath href=\\"#s1p\\"/></animateMotion></circle><text x=\\"545\\" y=\\"300\\" text-anchor=\\"middle\\" font-size=\\"27\\" class=\\"mt\\" fill=\\"#5A564E\\">essai <tspan class=\\"ph\\" style=\\"--d:0s\\" font-size=\\"42\\" font-weight=\\"700\\" fill=\\"#F5411C\\">1</tspan><tspan class=\\"ph\\" style=\\"--d:2s\\" font-size=\\"42\\" font-weight=\\"700\\" fill=\\"#F5411C\\">2</tspan><tspan class=\\"ph\\" style=\\"--d:4s\\" font-size=\\"42\\" font-weight=\\"700\\" fill=\\"#188A5C\\">3</tspan></text><g class=\\"pop\\"><rect x=\\"1035\\" y=\\"235\\" width=\\"150\\" height=\\"110\\" rx=\\"26\\" fill=\\"#9DB8A1\\" stroke=\\"#0F0F0F\\" stroke-width=\\"3.5\\"/><text x=\\"1110\\" y=\\"300\\" text-anchor=\\"middle\\" font-size=\\"25\\" font-weight=\\"700\\">atteint ✓</text></g>",
"app":"<rect x=\\"20\\" y=\\"36\\" width=\\"560\\" height=\\"360\\\\" rx=\\"18\\" fill=\\"#fff\\" stroke=\\"#0F0F0F\\" stroke-width=\\"3\\"/><circle cx=\\"48\\" cy=\\"62\\" r=\\"6\\" fill=\\"#FF5F57\\"/><circle cx=\\"70\\" cy=\\"62\\" r=\\"6\\" fill=\\"#FEBC2E\\"/><circle cx=\\"92\\" cy=\\"62\\" r=\\"6\\" fill=\\"#28C840\\"/><rect x=\\"34\\" y=\\"84\\" width=\\"150\\" height=\\"296\\" rx=\\"12\\" fill=\\"#F6F5F1\\"/><rect x=\\"44\\" y=\\"96\\" width=\\"130\\" height=\\"30\\" rx=\\"8\\" fill=\\"#fff\\" stroke=\\"#E4E2DB\\" stroke-width=\\"1.5\\"/><text x=\\"55\\" y=\\"116\\" font-size=\\"12.5\\" font-weight=\\"700\\" fill=\\"#241F1A\\">+ Nouvelle session</text><text x=\\"55\\" y=\\"150\\" font-size=\\"12.5\\" fill=\\"#5A564E\\">Artéfacts</text><text x=\\"55\\" y=\\"176\\" font-size=\\"12.5\\" fill=\\"#5A564E\\">Routines</text><text x=\\"206\\" y=\\"122\\" font-size=\\"19\\" font-weight=\\"700\\" fill=\\"#241F1A\\"><tspan fill=\\"#E0764B\\">✳ </tspan>Quoi de prévu, Zeyneb ?</text><text x=\\"216\\" y=\\"166\\" font-size=\\"15\\" fill=\\"#5A564E\\" class=\\"lv-ph\\" style=\\"--d:0.4s\\">→ je fixe l'objectif</text><text x=\\"216\\" y=\\"198\\" font-size=\\"15\\" fill=\\"#5A564E\\" class=\\"lv-ph\\" style=\\"--d:1.2s\\">→ je compare, je corrige</text><text x=\\"216\\" y=\\"232\\" font-size=\\"15.5\\" font-weight=\\"700\\" fill=\\"#188A5C\\" class=\\"lv-ph\\" style=\\"--d:2s\\">✓ objectif atteint</text><rect x=\\"204\\" y=\\"330\\" width=\\"356\\" height=\\"42\\" rx=\\"12\\" fill=\\"#fff\\" stroke=\\"#C8C5BD\\" stroke-width=\\"2\\"/><clipPath id=\\"s1clp\\"><rect x=\\"216\\" y=\\"340\\" width=\\"330\\" height=\\"26\\"><animate attributeName=\\"width\\" values=\\"0;0;330;330;330\\" keyTimes=\\"0;0.14;0.5;0.92;1\\" dur=\\"6s\\" repeatCount=\\"indefinite\\"/></rect></clipPath><g clip-path=\\"url(#s1clp)\\"><text x=\\"218\\" y=\\"357\\" font-size=\\"14.5\\" fill=\\"#241F1A\\"><tspan fill=\\"#F5411C\\" font-weight=\\"700\\" class=\\"mt\\">/goal</tspan> un site qui marche</text></g><text x=\\"392\\" y=\\"357\\" font-size=\\"14.5\\" fill=\\"#241F1A\\" class=\\"blink\\">▌</text><text x=\\"556\\" y=\\"322\\" text-anchor=\\"end\\" font-size=\\"10.5\\" fill=\\"#8A867C\\">Opus 4.8</text>"}`;

interface RawDeck {
  slides?: ShortSlide[];
}

/** Demande au modèle le déck de schémas à partir du script du reel. */
export async function generateShortDeck(post: VeillePost): Promise<ShortSlide[]> {
  requireAIKey();
  // On privilégie la traduction FR si elle existe (rendu 100 % français garanti).
  const script = (post.scriptFr ?? post.script ?? "").trim();
  if (!script) throw new Error("Ce reel n'a pas encore de script transcrit.");
  const langNote = post.scriptFr
    ? "(script déjà traduit en français)"
    : "(le script peut être en anglais — TRADUIS tout le rendu en français)";

  const { text } = await generateText({
    model: getAIModel("claude-sonnet-5"),
    maxOutputTokens: 16000,

    prompt: `${DESIGN_BRIEF}

${FEWSHOT}

--- SCRIPT DU REEL À IMAGER (auteur @${post.author}) ${langNote} ---
${script.slice(0, 4000)}
--- FIN DU SCRIPT ---

Produis maintenant le déck. Réponds UNIQUEMENT avec le JSON {"slides":[…]} (4 à 6 slides).`,
  });

  const deck = parseDeck(text);
  if (!deck.length) throw new Error("Le modèle n'a pas renvoyé de slides exploitables.");

  const slides = deck.slice(0, MAX_SLIDES).map((s) => ({
    ...s,
    dur: Math.min(Math.max(Number(s.dur) || 5, 4), 8),
  }));

  // Garantit une vidéo d'au moins MIN_TOTAL_SEC : si la somme est trop courte,
  // on allonge chaque slide proportionnellement (les anims bouclent, donc OK).
  const total = slides.reduce((sum, s) => sum + (s.dur ?? 5), 0);
  if (total < MIN_TOTAL_SEC) {
    const factor = MIN_TOTAL_SEC / total;
    for (const s of slides) s.dur = Math.round((s.dur ?? 5) * factor * 10) / 10;
  }
  return slides;
}

function parseDeck(text: string): ShortSlide[] {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return [];
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as RawDeck;
    return Array.isArray(obj.slides) ? obj.slides.filter((s) => s && s.title && s.svg) : [];
  } catch {
    return [];
  }
}

/* ============================ 2. TEMPLATE HTML ========================== */

/** CSS repris À L'IDENTIQUE des visuels « coulisses » (boards pleins, duo, interface), calé en 1920×1080. */
const BRONX_CSS = `
:root{--bronx:#F5411C;--violet:#5B4DEE;--ink:#0F0F0F;--font-display:'Archivo';--font-sans:'Inter';--font-mono:'JetBrains Mono',monospace}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#fff}
body{font-family:var(--font-sans),system-ui;color:var(--ink)}
.lv-slide{width:${WIDTH}px;height:${HEIGHT}px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 52px}
/* ===== board PLEIN (aucune transparence, aucun flou) ===== */
.lv-board{background:#fff;border:1.5px solid #eeedf6;border-radius:40px;display:flex;flex-direction:column;flex:1;width:100%;padding:44px 60px 38px;box-shadow:0 2px 6px #0f0f0f0a,0 30px 70px -30px #5b4dee47;overflow:hidden}
.lv-board.lav{background:#f3f0ff;border-color:#e6e0fb}
.lv-board.mint{background:#edf9f2;border-color:#dcf0e5}
.lv-board.peach{background:#fff3eb;border-color:#fbe5d6}
.lv-board.ciel{background:#eff6ff;border-color:#deebfb}
.lv-eyebrow{font-family:var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--bronx);margin-bottom:8px;font-size:25px;font-weight:700}
.lv-h2{font-family:var(--font-display);letter-spacing:-.02em;color:var(--ink);font-size:56px;font-weight:800;line-height:1.06;margin:0}
.lv-mark{background:#dcd3ff;outline:1.5px solid #5b4dee8c;padding:.04em .18em;position:relative;white-space:nowrap}
.lv-mark.m2{background:#c6eedb;outline-color:#188a5c80}
.lv-mark.m3{background:#ffd9c7;outline-color:#f5411c80}
.lv-mark:before,.lv-mark:after{content:"";background:#5b4dee;border:1.5px solid #fff;border-radius:50%;width:10px;height:10px;position:absolute}
.lv-mark.m2:before,.lv-mark.m2:after{background:#188a5c}
.lv-mark.m3:before,.lv-mark.m3:after{background:#f5411c}
.lv-mark:before{top:-5px;left:-5px}.lv-mark:after{bottom:-5px;right:-5px}
.lv-row{display:flex;flex-wrap:wrap;row-gap:6px;column-gap:12px;margin-top:12px}
.lv-goal{color:#0f0f0f;background:#c6eedb;border:2px solid #0f0f0f;border-radius:999px;display:inline-flex;align-items:center;gap:.5em;padding:.4em 1em;font-size:23px;font-weight:700;box-shadow:3px 3px #0f0f0f24}
.lv-analog{color:#0f0f0f;background:#dcd3ff;border:2px solid #0f0f0f;border-radius:999px;display:inline-flex;align-items:center;gap:.5em;padding:.4em 1em;font-size:23px;font-weight:700;box-shadow:3px 3px #0f0f0f24}
.lv-fig{flex:1;display:flex;justify-content:center;align-items:center;min-height:0;margin:12px 0}
.lv-fig svg{width:100%;height:100%}
.lv-fig svg text{font-family:var(--font-display)}
.lv-fig svg .mt{font-family:var(--font-mono)}
/* ===== duo : schéma (gauche) + interface (droite) ===== */
.duo-fig{align-items:stretch}
.lv-duo{display:flex;gap:36px;align-items:center;width:100%;height:100%;min-height:0}
.duo-schema{flex:1.6;min-width:0;height:100%;display:flex;align-items:center;justify-content:center}
.duo-schema svg{width:100%;height:100%}
.duo-app{flex:1;min-width:0;max-width:560px;height:100%;display:flex;align-items:center;justify-content:center}
.duo-app svg{width:100%;height:100%}
.lv-why{font-family:var(--font-sans);color:#0f0f0f;background:#fff;border:2px dashed #0f0f0f;border-radius:16px;margin-top:8px;padding:16px 24px;font-size:27px;line-height:1.34}
.lv-why b{-webkit-box-decoration-break:clone;box-decoration-break:clone;background:#dcd3ff;border-radius:4px;padding:0 .25em}
.lv-sign{margin-top:8px;text-align:right;font-family:var(--font-mono);font-size:20px;color:#8A8A8A}
/* ==== animations identiques aux visuels coulisses ==== */
@keyframes dashM{to{stroke-dashoffset:-20}}
@keyframes seqA{0%{opacity:.3}5%,30%{opacity:1}38%,100%{opacity:.3}}
@keyframes phA{0%{opacity:0}3%,30%{opacity:1}34%,100%{opacity:0}}
@keyframes fxA{0%,42%{opacity:1}52%,88%{opacity:0}96%,100%{opacity:1}}
@keyframes foA{0%,42%{opacity:0}52%,88%{opacity:1}96%,100%{opacity:0}}
@keyframes popA{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes blinkA{50%{opacity:0}}
@keyframes spinA{to{transform:rotate(360deg)}}
@keyframes ph8A{0%{opacity:0}3%,80%{opacity:1}88%,100%{opacity:0}}
.flow{stroke-dasharray:11 9;animation:dashM 1s linear infinite}
.seq{opacity:.3;animation:seqA 6s infinite;animation-delay:var(--d,0s)}
.ph{opacity:0;animation:phA 6s infinite;animation-delay:var(--d,0s)}
.lv-ph{opacity:0;animation:phA 7s infinite;animation-delay:var(--d,0s)}
.fx{animation:fxA 6s infinite;animation-delay:var(--d,0s)}
.fo{opacity:0;animation:foA 6s infinite;animation-delay:var(--d,0s)}
.pop{transform-box:fill-box;transform-origin:center;animation:popA 5s infinite}
.float{transform-box:fill-box;transform-origin:center;animation:floatA 3.5s ease-in-out infinite}
.blink,.lv-blink{animation:blinkA 1s steps(1) infinite}
.spinArrow{transform-box:fill-box;transform-origin:center;animation:spinA 4s linear infinite}
.ph8{opacity:0;animation:ph8A 8s infinite;animation-delay:var(--d,0s)}
`;

const FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">';

/** Convertit **gras** markdown résiduel en <b>. */
function mdBold(s: string): string {
  return (s ?? "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

/** HTML autonome d'UNE slide (paysage 1920×1080), style coulisses. */
export function slideHTML(slide: ShortSlide): string {
  const board = slide.board ? ` ${slide.board}` : "";
  const pills = [
    slide.goal ? `<div class="lv-goal">${slide.goal}</div>` : "",
    slide.analog ? `<div class="lv-analog">${slide.analog}</div>` : "",
  ].join("");
  const row = pills ? `<div class="lv-row">${pills}</div>` : "";
  const schema = `<svg viewBox="0 0 1200 620" preserveAspectRatio="xMidYMid meet">${slide.svg}</svg>`;
  const fig = slide.app
    ? `<div class="lv-fig duo-fig"><div class="lv-duo">
      <div class="duo-schema">${schema}</div>
      <div class="duo-app"><svg viewBox="0 0 600 470" preserveAspectRatio="xMidYMid meet">${slide.app}</svg></div>
    </div></div>`
    : `<div class="lv-fig">${schema}</div>`;
  return `<!doctype html><html lang="fr"><head><meta charset="UTF-8">${FONT_LINK}<style>${BRONX_CSS}</style></head>
<body><div class="lv-slide"><div class="lv-board${board}">
  <div class="lv-eyebrow">${slide.eyebrow ?? ""}</div>
  <h2 class="lv-h2">${mdBold(slide.title)}</h2>
  ${row}
  ${fig}
  <div class="lv-why">💡 ${mdBold(slide.why ?? "")}</div>
  <div class="lv-sign">@zeyneb_madi</div>
</div></div></body></html>`;
}

/* ============================ 3. RENDU MP4 ============================= */

async function resolveFfmpeg(): Promise<string> {
  const candidates = [
    process.env.FFMPEG_PATH,
    "ffmpeg",
    path.join(os.homedir(), ".local/bin/ffmpeg"),
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (c === "ffmpeg") return c; // laissé au PATH
    try {
      await fs.access(c);
      return c;
    } catch {
      /* suivant */
    }
  }
  return "ffmpeg";
}

function runFfmpeg(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    ff.stderr.on("data", (d) => (err += d.toString()));
    ff.on("error", (e) =>
      reject(new Error(`ffmpeg introuvable (${bin}) : ${e.message}. Installe ffmpeg ou renseigne FFMPEG_PATH.`))
    );
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg a échoué (code ${code}) : ${err.slice(-400)}`))
    );
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Capture chaque slide en temps réel (les anims tournent), puis encode un MP4.
 * Retourne l'URL publique du fichier.
 */
export async function renderDeckToMp4(
  slides: ShortSlide[],
  shortCode: string
): Promise<{ publicUrl: string; absPath: string; slides: number; durationSec: number }> {
  await fs.mkdir(PUBLIC_SHORTS_DIR, { recursive: true });
  const framesDir = await fs.mkdtemp(path.join(os.tmpdir(), "veille-short-"));

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  let frameIdx = 0;
  let totalMs = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    for (const slide of slides) {
      await page.setContent(slideHTML(slide), { waitUntil: "domcontentloaded", timeout: 30000 });
      try {
        await Promise.race([
          page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
          wait(4000),
        ]);
      } catch {
        /* polices en fallback */
      }

      const durMs = (slide.dur ?? 5) * 1000;
      totalMs += durMs;
      const start = Date.now();
      let localFrame = 0;
      while (Date.now() - start < durMs) {
        const file = path.join(framesDir, `frame-${String(frameIdx).padStart(6, "0")}.png`);
        await page.screenshot({ path: file as `${string}.png`, type: "png", captureBeyondViewport: false });
        frameIdx++;
        localFrame++;
        const nextAt = start + localFrame * (1000 / FPS);
        const sleep = nextAt - Date.now();
        if (sleep > 0) await wait(sleep);
      }
    }
  } finally {
    await browser.close();
  }

  if (frameIdx === 0) {
    await fs.rm(framesDir, { recursive: true, force: true });
    throw new Error("Aucune frame capturée.");
  }

  const safeCode = shortCode.replace(/[^a-zA-Z0-9_-]/g, "") || "short";
  const filename = `${new Date().toISOString().slice(0, 10)}-${safeCode}-${Date.now()}.mp4`;
  const absPath = path.join(PUBLIC_SHORTS_DIR, filename);
  const ffmpeg = await resolveFfmpeg();

  try {
    await runFfmpeg(ffmpeg, [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      path.join(framesDir, "frame-%06d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      "-movflags",
      "+faststart",
      absPath,
    ]);
  } finally {
    await fs.rm(framesDir, { recursive: true, force: true });
  }

  return {
    publicUrl: `${PUBLIC_SHORTS_URL}/${filename}`,
    absPath,
    slides: slides.length,
    durationSec: Math.round(totalMs / 1000),
  };
}
