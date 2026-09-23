import { addCreative, type Creative } from "@/lib/creative/store";
import { generateSoul, isHiggsfieldConfigured } from "@/lib/integrations/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/creative/generate { idea, format, prompt, negativePrompt }
 * Envoie le prompt à Higgsfield Soul et enregistre la créative (pending).
 */
export async function POST(req: Request) {
  try {
    const { idea, format, prompt, negativePrompt } = (await req.json()) as {
      idea?: string; format?: string; prompt?: string; negativePrompt?: string;
    };
    if (!prompt?.trim()) return Response.json({ error: "Prompt requis" }, { status: 400 });
    if (!isHiggsfieldConfigured())
      return Response.json({ error: "Higgsfield non connecté — ajoute HIGGSFIELD_API_KEY et HIGGSFIELD_SECRET dans .env.local." }, { status: 412 });

    const fmt = format ?? "1:1";
    const job = await generateSoul({ prompt: prompt.trim(), format: fmt, negativePrompt: negativePrompt?.trim(), quality: "2k" });

    const creative: Creative = {
      id: `cr-${Date.now().toString(36)}`,
      idea: idea?.trim() ?? "",
      format: fmt,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt?.trim(),
      status: "pending",
      imageUrl: null,
      thumbUrl: null,
      requestId: job.requestId,
      statusUrl: job.statusUrl,
      createdAt: new Date().toISOString(),
      schedule: null,
    };
    await addCreative(creative);
    return Response.json({ success: true, id: creative.id });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
