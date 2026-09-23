import { updateCreative } from "@/lib/creative/store";

export const runtime = "nodejs";

/** POST /api/creative/schedule { id, platform, at } — programme (ou déprogramme) la publication. */
export async function POST(req: Request) {
  try {
    const { id, platform, at } = (await req.json()) as { id?: string; platform?: string; at?: string };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const schedule = platform && at ? { platform, at, status: "scheduled" as const } : null;
    const c = await updateCreative(id, { schedule });
    if (!c) return Response.json({ error: "Créative introuvable" }, { status: 404 });
    return Response.json({ success: true, schedule: c.schedule });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
