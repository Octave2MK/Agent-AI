/**
 * Génération de contenu structuré par plateforme (agent Léa — createur-contenu).
 * Instagram / LinkedIn / Twitter(X). Claude renvoie un JSON adapté au réseau,
 * ensuite affiché dans un aperçu qui imite le rendu réel du réseau.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export type Platform = "instagram" | "linkedin" | "twitter";
export type Format =
  | "carousel" // IG + LinkedIn
  | "post" // IG (image + caption) / LinkedIn (texte)
  | "image" // LinkedIn image + texte accroche
  | "tweet" // Twitter simple
  | "thread"; // Twitter thread

export interface Slide { title: string; body: string }

export interface ContentResult {
  platform: Platform;
  format: Format;
  slides?: Slide[]; // carousel
  caption?: string; // légende sous le post (IG/LinkedIn)
  hashtags?: string[];
  headline?: string; // gros texte d'accroche (image LinkedIn/IG)
  body?: string; // corps du post
  tweets?: string[]; // thread twitter
}

const VOICE = `Voix NAIOM : experte mais accessible, zéro jargon creux (pas de "synergie", "game-changer"), phrases courtes, on parle AU lecteur ("vous"/"tu" selon le réseau). NAIOM = agence d'ingénierie d'agents IA + automatisations n8n.`;

// Voix LinkedIn de Zeyneb (d'après ses posts réels)
const LI_VOICE = `VOIX ZEYNEB (à respecter absolument) :
- 1re ligne = HOOK choc / breaking-news / affirmation forte (ex. "🚨 ALERTE : Anthropic vient de sortir Claude…", "Claude vient de tuer la recherche de clients."). Court, ça claque, ça donne envie de cliquer "voir plus".
- Ligne vide, puis corps TRÈS AÉRÉ : une idée par ligne, phrases courtes, beaucoup de sauts de ligne (\\n\\n).
- Utilise des flèches "→" pour énumérer des points concrets.
- Ton direct, tutoiement, zéro corporate, zéro jargon creux. Concret, orienté résultat.
- Termine par un CTA clair : soit "Commente « MOT » et je t'envoie X en DM", soit une question ouverte.
- Pas de hashtags dans le body (ils vont dans "hashtags").`;

function instructions(platform: Platform, format: Format, template?: string): string {
  const tmpl = template ? `\nStyle/DA visuelle choisie : "${template}" — adapte le ton des textes à cette ambiance.` : "";
  if (format === "carousel") {
    const n = platform === "instagram" ? "6 à 8" : "7 à 10";
    return `Format : CARROUSEL ${platform}. Produis ${n} slides.
- slide 1 = HOOK (accroche courte, ≤ 8 mots en "title", + 1 phrase "body").
- slides intermédiaires = 1 idée par slide (title = idée clé courte, body = 1-2 phrases concrètes).
- dernière slide = CTA clair.
Réponds en JSON: {"slides":[{"title":"","body":""}],"caption":"légende engageante avec 1-2 emojis","hashtags":["#..."]}.${tmpl}`;
  }
if (platform === "twitter" && format === "thread") {
  return `Format : THREAD X (Twitter). 5 à 7 tweets. Tweet 1 = hook fort. Chaque tweet ≤ 270 caractères, autonome. Numérote pas.
Réponds en JSON: {"tweets":["tweet1","tweet2",...]}.`;
}

if (platform === "twitter" && format === "image") {
  return `Format : POST X (Twitter) avec VISUEL. "headline" = accroche courte forte qui ira EN GROS sur l'image (≤ 10 mots). "body" = le tweet (≤ 270 caractères, percutant).
Réponds en JSON: {"headline":"","body":"","hashtags":["#..."]}.`;
}

if (platform === "twitter") {
  return `Format : TWEET unique X (Twitter), ≤ 270 caractères, percutant, un angle fort.
Réponds en JSON: {"body":"le tweet","hashtags":["#..."]}.`;
}

if (platform === "linkedin" && format === "image") {
  return `Format : POST LinkedIn IMAGE + texte. "headline" = accroche forte qui ira EN GROS sur le visuel (≤ 12 mots). "body" = le post LinkedIn dans la VOIX de Zeyneb.
${LI_VOICE}
Réponds en JSON: {"headline":"","body":"","hashtags":["#..."]}.${tmpl}`;
}
  if (platform === "linkedin") {
    return `Format : POST LinkedIn texte, dans la VOIX de Zeyneb.
${LI_VOICE}
Réponds en JSON: {"body":"le post complet avec sauts de ligne \\n","hashtags":["#..."]}.`;
  }
  // instagram post
  return `Format : POST Instagram (visuel + légende). "headline" = texte court qui ira sur l'image. "caption" = légende engageante avec emojis.
Réponds en JSON: {"headline":"","caption":"","hashtags":["#..."]}.${tmpl}`;
}

/** Échappe les retours-ligne/tab bruts À L'INTÉRIEUR des chaînes JSON (Claude en met parfois). */
function escapeCtrlInStrings(s: string): string {
  let out = "";
  let inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === "\\") { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && (ch === "\n" || ch === "\r" || ch === "\t")) {
      out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : "\\t";
      continue;
    }
    out += ch;
  }
  return out;
}

export async function generateContent(
  platform: Platform,
  format: Format,
  idea: string,
  template?: string
): Promise<ContentResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY absente dans .env.local.");
  const system = `Tu es Léa, copywriter senior chez NAIOM. Tu écris du contenu réseaux sociaux qui performe.
${VOICE}
Tu réponds UNIQUEMENT avec un objet JSON valide conforme au format demandé (aucun texte autour, pas de bloc markdown).`;
  const prompt = `Plateforme : ${platform}
${instructions(platform, format, template)}

IDÉE / SUJET : ${idea}

Rends le JSON maintenant.`;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { text } = await generateText({
    model: anthropic("claude-sonnet-5"),
    maxOutputTokens: 1800,

    system,
    prompt,
  });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let j: Partial<ContentResult> = {};
  try { j = JSON.parse(cleaned) as Partial<ContentResult>; }
  catch {
    try { j = JSON.parse(escapeCtrlInStrings(cleaned)) as Partial<ContentResult>; }
    catch { j = { body: cleaned }; }
  }
  return {
    platform, format,
    slides: j.slides,
    caption: j.caption,
    hashtags: j.hashtags,
    headline: j.headline,
    body: j.body,
    tweets: j.tweets,
  };
}
