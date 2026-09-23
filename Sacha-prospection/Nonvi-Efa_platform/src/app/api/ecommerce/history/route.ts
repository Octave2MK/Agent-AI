import {
  arcadsConfigured,
  assetWatchUrl,
  getAsset,
  talkingActorStatus,
  talkingActorWatchUrl,
} from "@/lib/integrations/arcads";
import { isArcadsMcpConnected, mcpGetAsset } from "@/lib/integrations/arcadsMcp";
import { readStore, updateVideo, deleteVideo, type EcomVideo } from "@/lib/ecommerce/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/ecommerce/history
 * → { videos: EcomVideo[] } — rafraîchit d'abord le statut des vidéos en cours
 *   de génération auprès d'Arcads (statut + URL de lecture quand c'est prêt).
 */
export async function GET() {
  const store = await readStore();
  const mcp = await isArcadsMcpConnected();

  // Rafraîchit les vidéos "processing" (au plus 5 par appel pour rester rapide)
  if (mcp || arcadsConfigured()) {
    const processing = store.videos.filter((v) => v.status === "processing").slice(0, 5);
    await Promise.all(
      processing.map(async (v) => {
        try {
          const patch = await refreshOne(v);
          if (patch) await updateVideo(v.id, patch);
        } catch (err) {
          console.error("[ecommerce/history] refresh", v.id, err);
        }
      })
    );
  }

  const fresh = await readStore();
  return Response.json({ videos: fresh.videos, configured: mcp || arcadsConfigured() });
}

/**
 * DELETE /api/ecommerce/history — body: { videoId }
 * Supprime la vidéo de l'historique local (l'asset reste chez Arcads).
 */
export async function DELETE(req: Request) {
  try {
    const { videoId } = await req.json();
    if (!videoId) return Response.json({ error: "videoId requis" }, { status: 400 });
    const removed = await deleteVideo(videoId);
    if (!removed) return Response.json({ error: "Vidéo introuvable" }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[ecommerce/history DELETE]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

async function refreshOne(v: EcomVideo): Promise<Partial<EcomVideo> | null> {
  // Vidéos générées via MCP : tout est un asset, quel que soit le mode
  if (v.backend === "mcp") {
    const asset = await mcpGetAsset(v.arcadsId);
    if (asset.status === "generated") {
      return { status: "completed", url: asset.downloadUrl };
    }
    if (asset.status === "failed") {
      return { status: "failed", error: asset.error ?? "Génération échouée" };
    }
    return null;
  }
  if (v.kind === "avatar") {
    const st = await talkingActorStatus(v.arcadsId);
    if (st.status === "completed") {
      const url = await talkingActorWatchUrl(v.arcadsId).catch(() => undefined);
      return { status: "completed", url };
    }
    if (st.status === "failed") return { status: "failed", error: st.error ?? "Génération échouée" };
    return null;
  }
  // showcase → asset
  const asset = await getAsset(v.arcadsId);
  if (asset.status === "generated") {
    const url = asset.url ?? (await assetWatchUrl(v.arcadsId).catch(() => undefined));
    return { status: "completed", url, thumbnailUrl: asset.thumbnailUrl };
  }
  if (asset.status === "failed") return { status: "failed", error: asset.error ?? "Génération échouée" };
  return null;
}
