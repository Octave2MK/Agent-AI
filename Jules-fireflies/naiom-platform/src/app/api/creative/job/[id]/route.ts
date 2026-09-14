import { readStore, updateCreative } from "@/lib/creative/store";
import { pollSoul } from "@/lib/integrations/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET /api/creative/job/[id] — interroge Higgsfield et met à jour la créative. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await readStore();
  const c = s.creatives.find((x) => x.id === id);
  if (!c) return Response.json({ error: "Créative introuvable" }, { status: 404 });
  if (c.status === "done") return Response.json({ status: "done", imageUrl: c.imageUrl, thumbUrl: c.thumbUrl });

  try {
    const r = await pollSoul({ statusUrl: c.statusUrl, requestId: c.requestId });
    if (r.status === "completed" && r.imageUrl) {
      const upd = await updateCreative(id, { status: "done", imageUrl: r.imageUrl, thumbUrl: r.thumbUrl });
      return Response.json({ status: "done", imageUrl: upd?.imageUrl, thumbUrl: upd?.thumbUrl });
    }
    if (r.status === "failed") {
      await updateCreative(id, { status: "error", error: "Génération échouée côté Higgsfield." });
      return Response.json({ status: "error", error: "Génération échouée." });
    }
    return Response.json({ status: "pending" });
  } catch (err) {
    return Response.json({ status: "pending", note: err instanceof Error ? err.message : "poll" });
  }
}
