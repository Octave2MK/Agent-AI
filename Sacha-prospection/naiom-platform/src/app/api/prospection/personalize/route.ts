import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { readLeads, updateLead } from "@/lib/prospection/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/prospection/personalize — ÉTAPE 3 · PERSONNALISATION (Profilé → Prêt)
 * body: { leadId }
 * Claude rédige l'email + le message LinkedIn personnalisés à partir de la fiche.
 */
export async function POST(req: Request) {
  const provider = process.env.AI_PROVIDER ?? "anthropic";

  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY absente dans .env.local." },
      { status: 412 }
    );
  }

  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY absente dans .env.local." },
      { status: 412 }
    );
  }
  try {
    const { leadId } = await req.json();
    const lead = (await readLeads()).find((l) => l.id === leadId);
    if (!lead) return Response.json({ error: "Lead introuvable" }, { status: 404 });

    const anthropic =
      provider === "anthropic"
        ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        : null;

    const google =
      provider === "gemini"
        ? createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
        : null;

    const { text } = await generateText({
      model:
        provider === "gemini"
          ? google!("gemini-3.8-flash")
          : anthropic!("claude-sonnet-5"),
      prompt: `Tu es Sacha, l'agent prospection de NAIOM Agency (agence d'ingénierie d'agents IA et d'automatisations n8n pour PME, basée à Dubaï, clientèle francophone).

Rédige une approche de prospection B2B personnalisée pour ce prospect :

- Entreprise : ${lead.name}
- Activité : ${lead.category ?? lead.niche} à ${lead.ville}
- Site web : ${lead.website ?? "aucun"}
- Réputation : ${lead.reviewsCount ?? 0} avis Google, note ${lead.rating ?? "?"}/5
- Ce qu'on sait : ${lead.insights ?? "rien de plus"}

Objectif : proposer un audit gratuit de leurs process (ce qu'une équipe d'agents IA + automatisations pourrait leur faire gagner).

Règles STRICTES :
- Email : objet ≤ 8 mots, corps ≤ 120 mots, vouvoiement. 1re phrase = un fait PRÉCIS sur eux (leurs avis, leur activité, leur ville — pas de flatterie générique). 1 seul bénéfice concret lié à leur métier. CTA doux : proposer l'audit gratuit ou une question ouverte. Signature "Zeyneb — NAIOM Agency".
- LinkedIn : ≤ 280 caractères, ton direct, pas de "j'espère que vous allez bien".
- Aucun chiffre inventé, aucun jargon creux.

Réponds UNIQUEMENT en JSON valide :
{"subject": "...", "email": "...", "linkedin": "..."}`,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const parsed = JSON.parse(cleaned.slice(start)) as {
      subject: string;
      email: string;
      linkedin: string;
    };

    const updated = await updateLead(leadId, {
      status: "pret",
      outreach: { ...parsed, generatedAt: new Date().toISOString() },
    });
    return Response.json({ success: true, lead: updated });
  } catch (err) {
    console.error("[prospection/personalize]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
