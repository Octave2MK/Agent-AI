import { generateText } from "ai";
import { getAIModel, getAIProvider } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { purpose, context, tone } = await req.json();
  if (!purpose || !context) return Response.json({ error: "purpose et context sont requis" }, { status: 400 });

  const system = `Tu es un rédacteur d'emails professionnels pour Nonvi-Efa Agency.

CONSIGNES :
- Français, vouvoiement B2B
- Ton : ${tone ?? "professionnel, empathique, direct"}
- Pas de jargon creux (disruptif, game-changer, etc.)
- Signature : "Melyssa Madi, Nonvi-Efa Agency"
- RÉPONSE OBLIGATOIRE en JSON strict, pas de markdown, pas de préambule.

Format de réponse :
{"subject": "...", "body": "Bonjour ...,\\n\\n[corps]\\n\\nBien à vous,\\nMelyssa"}`;
  const userPrompt = `Objectif : ${purpose}\n\nContexte :\n${context}\n\nRéponds uniquement avec le JSON structuré (subject + body).`;

  try {
    const { text } = await generateText({ model: getAIModel("claude-sonnet-5"), system, prompt: userPrompt, maxRetries: 1 });
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.subject !== "string" || typeof parsed.body !== "string") throw new Error("Structure invalide");
    return Response.json({ subject: parsed.subject, body: parsed.body, provider: getAIProvider() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    const status = /API_KEY absente/.test(message) ? 412 : 502;
    return Response.json({ error: message }, { status });
  }
}
