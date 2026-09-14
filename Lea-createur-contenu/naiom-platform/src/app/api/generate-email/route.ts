import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/generate-email
 * body: { purpose: string, context: string, tone?: string }
 * → retourne { subject, body } (structure stricte)
 *
 * Utilise Claude pour rédiger un email en JSON structuré.
 */
export async function POST(req: Request) {
  const { purpose, context, tone } = await req.json();
  if (!purpose || !context) {
    return Response.json({ error: "purpose et context sont requis" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY absente" }, { status: 412 });
  }

  const system = `Tu es un rédacteur d'emails professionnels pour NAIOM Agency.

CONSIGNES :
- Français, vouvoiement B2B
- Ton : ${tone ?? "professionnel, empathique, direct"}
- Pas de jargon creux (disruptif, game-changer, etc.)
- Signature : "Zeyneb Madi, NAIOM Agency"
- RÉPONSE OBLIGATOIRE en JSON strict, pas de markdown, pas de préambule.

Format de réponse :
{"subject": "...", "body": "Bonjour ...,\\n\\n[corps]\\n\\nBien à vous,\\nZeyneb"}`;

  const userPrompt = `Objectif : ${purpose}

Contexte :
${context}

Réponds uniquement avec le JSON structuré (subject + body).`;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-5"),
      system,
      prompt: userPrompt,
      maxRetries: 1,
    });

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (typeof parsed.subject !== "string" || typeof parsed.body !== "string") {
      throw new Error("Structure invalide");
    }
    return Response.json({ subject: parsed.subject, body: parsed.body });
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Erreur inconnue",
      },
      { status: 502 }
    );
  }
}
