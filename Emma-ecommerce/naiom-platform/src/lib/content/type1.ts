/**
 * Contenu STRUCTURÉ pour des carrousels ÉDUCATIFS (explicatifs, ludiques).
 * Léa choisit le meilleur layout pour EXPLIQUER chaque idée : schéma de flux,
 * avant/après, stat/graph, tableau d'outils, liste illustrée, diagramme.
 * Rendu ensuite en HTML éditorial (style template) — sans photo, sans hors-sujet.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export type T1Layout = "cover" | "flow" | "compare" | "stat" | "tools" | "list" | "diagram" | "chat" | "note" | "checklist" | "timeline" | "network" | "screen" | "cta";

export interface FlowStep { icon?: string; label: string; desc?: string }
export interface Bullet { icon?: string; text: string }
export interface DiagNode { label: string; logo?: string; icon?: string }
export interface ChatMsg { role: "user" | "claude"; text: string }

export interface T1Slide {
  layout: T1Layout;
  title: string;
  sub?: string;
  para?: string; // paragraphe explicatif (densité) — présent sur la plupart des slides
  steps?: FlowStep[]; // flow (schéma étapes → flèches, avec desc)
  before?: string[]; // compare
  after?: string[];
  stat?: { value: string; label: string; bars?: { label: string; pct: number }[] }; // stat/graph
  rows?: { tool: string; desc: string }[]; // tools (logos)
  bullets?: Bullet[]; // list illustrée
  diagram?: { nodes: DiagNode[]; caption?: string }; // diagramme (ex. Claude ⇄ Obsidian)
  chat?: { messages: ChatMsg[]; connect?: string }; // illustration interface Claude
  noteCard?: { title: string; lines: string[]; tags?: string[] }; // illustration note Obsidian
  checklist?: { text: string; done: boolean }[]; // illustration checklist
  timeline?: { when: string; label: string }[]; // illustration frise chronologique
  network?: { nodes: string[]; caption?: string }; // illustration graphe de connaissances
  screen?: { app: string; rows: string[] }; // illustration interface d'un outil (fenêtre)
  postit?: string; // post-it décoratif
}
export interface T1Content { slides: T1Slide[]; tools: string[]; idea: string }

const SYS = `Tu es Léa, créatrice de contenu NAIOM. Tu conçois des CARROUSELS INSTAGRAM ÉDUCATIFS : explicatifs, clairs, ludiques. On doit COMPRENDRE ce que tu racontes. Tu tutoies, zéro jargon creux.
Tu choisis, pour chaque idée, le layout qui l'EXPLIQUE le mieux (schéma, avant/après, chiffre, tableau, liste, diagramme). Rien de hors-sujet.
Tu réponds UNIQUEMENT avec un JSON valide (aucun texte autour, pas de bloc markdown, échappe les retours-ligne dans les chaînes).`;

function prompt(idea: string, tools: string[]): string {
  const toolLine = tools.length ? tools.join(", ") : "(aucun outil précis — n'invente pas de logo)";
  return `Sujet : « ${idea} ».
Outils/logos autorisés (les SEULS que tu peux citer dans "tools"/"diagram", n'en invente pas d'autres) : ${toolLine}.

MÉTHODE (importante) : pour CHAQUE slide, choisis l'illustration qui EXPLIQUE LE MIEUX ce point précis, et remplis-la avec du concret SPÉCIFIQUE au sujet (pas du générique). Deux sujets différents ne donnent JAMAIS les mêmes illustrations. Ne mets pas une illustration "pour décorer" : elle doit avoir du SENS et illustrer le propos. Varie les layouts.

Exemples de bon choix : un PROCESSUS → "flow" ; parler À Claude → "chat" ; une NOTE/doc → "note" ; des idées RELIÉES → "network" ; des ÉTAPES dans le temps → "timeline" ; une routine/todo → "checklist" ; un CHIFFRE fort → "stat" ; SANS vs AVEC → "compare" ; comparer des OUTILS → "tools".

Crée 7 à 8 slides ÉDUCATIVES, COMPLÈTES et DENSES (pas vides). La plupart des slides ont un "para" = un paragraphe explicatif de 2-3 phrases qui développe l'idée (on doit VRAIMENT comprendre). Layouts :
- "cover" : {title (accroche ≤ 7 mots), sub (1 phrase claire)}.
- "chat" : {title, para, chat:{messages:[{role:"user",text},{role:"claude",text}, ...] (2-4 messages qui illustrent une VRAIE conversation), connect:"Obsidian" (optionnel, l'outil connecté)}}. Utilise ce layout pour MONTRER concrètement (ex. on demande un truc à Claude et il agit).
- "note" : {title, para, noteCard:{title:"titre de la note", lines:["ligne markdown", "- point", "[[lien]]"], tags:["#tag"]}}. Illustre une note/doc.
- "flow" : {title, para (optionnel), steps:[{icon, label, desc (courte phrase)}]} — 3 à 5 étapes d'un PROCESSUS.
- "compare" : {title, para (optionnel), before:[2-3 puces "sans"], after:[2-3 puces "avec"]}.
- "stat" : {title, para (optionnel), stat:{value:"ex. 8h", label:"...", bars:[{label,pct}] 2-3 barres}}.
- "tools" : {title, para (optionnel), rows:[{tool, desc (phrase complète)}]} — "tool" DOIT être dans la liste autorisée.
- "list" : {title, para (optionnel), bullets:[{icon, text (phrase complète, pas 2 mots)}]} — 3-5 points développés.
- "diagram" : {title, para, diagram:{nodes:[{label, logo}], caption}} — relie 2-3 éléments.
- "network" : {title, para, network:{nodes:["Idée A","Note B","Projet C","Source D", ...5-7 nœuds], caption}} — graphe de connaissances (idées reliées). Idéal pour "tout est connecté".
- "timeline" : {title, para, timeline:[{when:"Jour 1", label:"..."}, ...3-4]} — étapes dans le temps.
- "checklist" : {title, para, checklist:[{text, done:true/false}, ...4-6]} — routine / checklist concrète.
- "screen" : {title, para, screen:{app:"<un des outils autorisés>", rows:["élément d'interface réaliste", ...4-6]}} — montre l'INTERFACE de l'outil (fenêtre avec son logo). Utilise-le quand tu parles d'un outil précis pour l'illustrer (ex. un tableau Salesforce, un board, une inbox).
- "cta" : {title (fort), sub (invite à commenter/DM)}.

Quand tu parles d'un OUTIL précis, privilégie "screen" (son interface) ou "chat"/"note" pour l'illustrer concrètement.

Règles : slide 1 = cover, dernière = cta. Entre : inclus OBLIGATOIREMENT au moins un "chat" (illustration Claude) et un "note" OU "diagram", plus un "flow" et un "compare"/"stat". VARIE. Textes développés, concrets, français.
Ajoute un "postit" (note manuscrite courte, ≤ 8 mots, une astuce/punchline) sur 2-3 slides de type "tools" ou "list" pour les remplir.
"icon" = mot-concept FR simple (note, idée, temps, recherche, lien, automatisation, cerveau, argent, email, tag, check, cible, graph, robot, base, éclair).
Réponds en JSON : {"slides":[...]}.`;
}

function esc(s: string): string { let o = "", inStr = false, e = false; for (const c of s) { if (e) { o += c; e = false; continue; } if (c === "\\") { o += c; e = true; continue; } if (c === '"') { inStr = !inStr; o += c; continue; } if (inStr && (c === "\n" || c === "\r" || c === "\t")) { o += c === "\n" ? "\\n" : c === "\r" ? "\\r" : "\\t"; continue; } o += c; } return o; }

export async function generateType1(idea: string, tools: string[]): Promise<T1Content> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY absente.");
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { text } = await generateText({ model: anthropic("claude-sonnet-5"), maxOutputTokens: 4000, system: SYS, prompt: prompt(idea, tools) });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let slides: T1Slide[] = [];
  try { slides = (JSON.parse(cleaned).slides ?? []) as T1Slide[]; }
  catch { try { slides = (JSON.parse(esc(cleaned)).slides ?? []) as T1Slide[]; } catch { slides = []; } }
  // normalise : Claude imbrique parfois les champs sous "content"/"data"
  slides = slides.map((s) => {
    const rec = s as unknown as Record<string, unknown>;
    const nested = (rec.content ?? rec.data) as Record<string, unknown> | undefined;
    let flat = (nested && typeof nested === "object" && !Array.isArray(nested) ? { ...rec, ...nested } : rec) as Record<string, unknown>;
    if (!flat.layout && flat.type) flat.layout = flat.type; // Claude met parfois "type"
    return flat as unknown as T1Slide;
  });
  if (!slides.length) slides = [{ layout: "cover", title: idea, sub: "" }];
  return { slides, tools, idea };
}
