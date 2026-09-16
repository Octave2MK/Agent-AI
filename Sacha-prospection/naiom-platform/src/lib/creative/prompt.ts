import { generateText } from "ai";
import { getAIModel, requireAIKey } from "@/lib/ai/provider";
import type { BrandKit } from "./store";

export interface FormulateInput { idea: string; format: string; brandKit: BrandKit }
export interface FormulateOutput { prompt: string; negativePrompt: string }
const FORMAT_HINT: Record<string, string> = { "1:1": "square feed post", "9:16": "vertical story / reel", "16:9": "wide banner / thumbnail", "4:5": "portrait feed post" };

export async function formulatePrompt(input: FormulateInput): Promise<FormulateOutput> {
  requireAIKey();
  const bk = input.brandKit;
  const brandCtx = [
    `Brand: ${bk.name || "the brand"}`,
    bk.palette?.length ? `Color palette (respect strictly): ${bk.palette.join(", ")}` : "",
    bk.font ? `Typography feel: ${bk.font}` : "",
    bk.univers ? `Art direction / mood: ${bk.univers}` : "",
    bk.notes ? `Constraints & must-haves: ${bk.notes}` : "",
  ].filter(Boolean).join("\n");
  const system = `Tu es Mia, Creative Strategist. Tu écris des prompts pour Higgsfield Soul (générateur d'images photoréaliste haut de gamme).
Règles:
- Sors UNIQUEMENT un JSON { "prompt": "...", "negative_prompt": "..." } — rien d'autre.
- Le "prompt" est en ANGLAIS, dense et visuel (une seule phrase riche à quelques phrases), format ${input.format} (${FORMAT_HINT[input.format] ?? ""}).
- Traduis l'univers de marque en langage visuel concret : lumière, matière, cadrage, composition, ambiance, couleurs de la palette.
- Respecte STRICTEMENT la palette et les contraintes de marque. Si un logo/texte est requis, décris l'espace négatif où il sera incrusté ensuite (ne demande pas à Soul d'écrire du texte).
- Photoréaliste, editorial, qualité studio. Pas de watermark.
- "negative_prompt": défauts à éviter (texte illisible, logos parasites, distorsions, low quality, extra fingers, etc.).`;
  const prompt = `IDÉE (client): ${input.idea}\n\nMARQUE:\n${brandCtx || "(pas de brand kit — direction neutre premium)"}\n\nRends le JSON maintenant.`;
  const { text } = await generateText({ model: getAIModel("claude-sonnet-5"), maxOutputTokens: 700, system, prompt });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { const j = JSON.parse(cleaned) as { prompt?: string; negative_prompt?: string }; return { prompt: (j.prompt ?? input.idea).trim(), negativePrompt: (j.negative_prompt ?? "text, watermark, low quality, blurry, distorted").trim() }; }
  catch { return { prompt: cleaned || input.idea, negativePrompt: "text, watermark, low quality, blurry, distorted" }; }
}
