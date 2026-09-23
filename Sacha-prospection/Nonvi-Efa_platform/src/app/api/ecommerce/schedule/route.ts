import { updateVideo } from "@/lib/ecommerce/store";

export const runtime = "nodejs";

/**
 * POST /api/ecommerce/schedule
 * body: { videoId, day, time, caption? } — programme la vidéo sur Instagram
 * dans le calendrier éditorial. body: { videoId, remove: true } pour retirer.
 * (La publication automatique Instagram sera branchée en Phase 2 via l'API Graph.)
 */
export async function POST(req: Request) {
  try {
    const { videoId, day, time, caption, remove } = await req.json();
    if (!videoId) return Response.json({ error: "videoId requis" }, { status: 400 });

    if (remove) {
      const video = await updateVideo(videoId, { scheduled: undefined });
      if (!video) return Response.json({ error: "Vidéo introuvable" }, { status: 404 });
      return Response.json({ success: true, video });
    }

    if (!day || !time) {
      return Response.json({ error: "Jour et heure requis." }, { status: 400 });
    }
    const video = await updateVideo(videoId, {
      scheduled: { day, time, channel: "Instagram", caption },
    });
    if (!video) return Response.json({ error: "Vidéo introuvable" }, { status: 404 });
    return Response.json({ success: true, video });
  } catch (err) {
    console.error("[ecommerce/schedule]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
