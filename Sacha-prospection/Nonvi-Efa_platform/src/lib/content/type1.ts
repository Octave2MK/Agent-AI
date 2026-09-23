import { generateText } from "ai";
import { getAIModel, requireAIKey } from "@/lib/ai/provider";

export type T1Layout = "cover" | "flow" | "compare" | "stat" | "tools" | "list" | "diagram" | "chat" | "note" | "checklist" | "timeline" | "network" | "screen" | "cta";
export interface FlowStep { icon?: string; label: string; desc?: string }
export interface Bullet { icon?: string; text: string }
export interface DiagNode { label: string; logo?: string; icon?: string }
export interface ChatMsg { role: "user" | "claude"; text: string }
export interface T1Slide { layout: T1Layout; title: string; sub?: string; para?: string; steps?: FlowStep[]; before?: string[]; after?: string[]; stat?: { value: string; label: string; bars?: { label: string; pct: number }[] }; rows?: { tool: string; desc: string }[]; bullets?: Bullet[]; diagram?: { nodes: DiagNode[]; caption?: string }; chat?: { messages: ChatMsg[]; connect?: string }; noteCard?: { title: string; lines: string[]; tags?: string[] }; checklist?: { text: string; done: boolean }[]; timeline?: { when: string; label: string }[]; network?: { nodes: string[]; caption?: string }; screen?: { app: string; rows: string[] }; postit?: string }
export interface T1Content { slides: T1Slide[]; tools: string[]; idea: string }

const SYS = `Tu es Léa, créatrice de contenu Nonvi-Efa. Tu conçois des CARROUSELS INSTAGRAM ÉDUCATIFS : explicatifs, clairs, ludiques. On doit COMPRENDRE ce que tu racontes. Tu tutoies, zéro jargon creux.
Tu choisis, pour chaque idée, le layout qui l'EXPLIQUE le mieux (schéma, avant/après, chiffre, tableau, liste, diagramme). Rien de hors-sujet.
Tu réponds UNIQUEMENT avec un JSON valide (aucun texte autour, pas de bloc markdown, échappe les retours-ligne dans les chaînes).`;

function prompt(idea: string, tools: string[]): string {
  const toolLine = tools.length ? tools.join(", ") : "(aucun outil précis — n'invente pas de logo)";
  return `Sujet : « ${idea} ».\nOutils/logos autorisés (les SEULS que tu peux citer dans "tools"/"diagram", n'en invente pas d'autres) : ${toolLine}.\n\nMÉTHODE (importante) : pour CHAQUE slide, choisis l'illustration qui EXPLIQUE LE MIEUX ce point précis, et remplis-la avec du concret SPÉCIFIQUE au sujet (pas du générique). Deux sujets différents ne donnent JAMAIS les mêmes illustrations. Ne mets pas une illustration "pour décorer" : elle doit avoir du SENS et illustrer le propos. Varie les layouts.\n\nExemples de bon choix : un PROCESSUS → "flow" ; parler À Claude → "chat" ; une NOTE/doc → "note" ; des idées RELIÉES → "network" ; des ÉTAPES dans le temps → "timeline" ; une routine/todo → "checklist" ; un CHIFFRE fort → "stat" ; SANS vs AVEC → "compare" ; comparer des OUTILS → "tools".\n\nCrée 7 à 8 slides ÉDUCATIVES, COMPLÈTES et DENSES. La plupart des slides ont un "para" de 2-3 phrases.\n- "cover" : accroche ≤ 7 mots + sub.\n- "chat" : conversation réelle de 2-4 messages.\n- "note" : noteCard avec lignes concrètes.\n- "flow" : 3 à 5 étapes.\n- "compare" : before/after.\n- "stat" : valeur + label + 2-3 barres.\n- "tools" : outils autorisés.\n- "list" : 3-5 points développés.\n- "diagram" : 2-3 éléments reliés.\n- "network" : 5-7 nœuds reliés.\n- "timeline" : 3-4 étapes.\n- "checklist" : 4-6 éléments.\n- "screen" : interface réaliste d'un outil autorisé.\n- "cta" : titre fort + invitation à commenter/DM.\nRègles : slide 1 = cover, dernière = cta. Entre : au moins un chat et un note OU diagram, plus un flow et un compare/stat. Varie. Textes développés, concrets, français. Ajoute un postit sur 2-3 slides tools/list.\nRéponds en JSON : {"slides":[...]}.`;
}

function esc(s: string): string { let o = "", inStr = false, e = false; for (const c of s) { if (e) { o += c; e = false; continue; } if (c === "\\") { o += c; e = true; continue; } if (c === '"') { inStr = !inStr; o += c; continue; } if (inStr && (c === "\n" || c === "\r" || c === "\t")) o += c === "\n" ? "\\n" : c === "\r" ? "\\r" : "\\t"; else o += c; } return o; }

export async function generateType1(idea: string, tools: string[]): Promise<T1Content> {
  requireAIKey();
  const { text } = await generateText({ model: getAIModel("claude-sonnet-5"), maxOutputTokens: 4000, system: SYS, prompt: prompt(idea, tools) });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let slides: T1Slide[] = [];
  try { slides = (JSON.parse(cleaned).slides ?? []) as T1Slide[]; } catch { try { slides = (JSON.parse(esc(cleaned)).slides ?? []) as T1Slide[]; } catch { slides = []; } }
  slides = slides.map((s) => { const rec = s as unknown as Record<string, unknown>; const nested = (rec.content ?? rec.data) as Record<string, unknown> | undefined; const flat = (nested && typeof nested === "object" && !Array.isArray(nested) ? { ...rec, ...nested } : rec) as Record<string, unknown>; if (!flat.layout && flat.type) flat.layout = flat.type; return flat as unknown as T1Slide; });
  if (!slides.length) slides = [{ layout: "cover", title: idea, sub: "" }];
  return { slides, tools, idea };
}
