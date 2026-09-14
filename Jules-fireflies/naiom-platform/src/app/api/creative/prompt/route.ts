import { readStore } from "@/lib/creative/store";
import { formulatePrompt } from "@/lib/creative/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/creative/prompt { idea, format } → Mia formule le prompt Higgsfield. */
export async function POST(req: Request) {
  try {
    const { idea, format } = (await req.json()) as { idea?: string; format?: string };
    if (!idea?.trim()) return Response.json({ error: "Idée requise" }, { status: 400 });
    const { brandKit } = await readStore();
    const out = await formulatePrompt({ idea: idea.trim(), format: format ?? "1:1", brandKit });
    return Response.json({ success: true, ...out });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
