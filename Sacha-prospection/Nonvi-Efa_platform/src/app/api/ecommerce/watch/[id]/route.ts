import { assetWatchUrl, getAsset, talkingActorWatchUrl } from "@/lib/integrations/arcads";
import { isArcadsMcpConnected, mcpGetAsset } from "@/lib/integrations/arcadsMcp";
import { readStore, type EcomVideo } from "@/lib/ecommerce/store";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/ecommerce/watch/{id}
 * Redirige vers une URL de lecture FRAÎCHE de la vidéo Arcads.
 *
 * Les liens Arcads sont signés et expirent (~12 h). En stockant le lien on
 * obtient une vidéo « morte » le lendemain. Ce proxy va chercher une URL
 * fraîche à chaque lecture — le <video src> pointe ici, jamais ne périme.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await readStore();
  const video = store.videos.find((v) => v.id === id);
  if (!video) return new Response("Vidéo introuvable", { status: 404 });

  try {
    const url = await freshUrl(video);
    if (!url) return new Response("Lien de lecture indisponible", { status: 502 });
    return Response.redirect(url, 302);
  } catch (err) {
    console.error("[ecommerce/watch]", err);
    return new Response("Erreur Arcads", { status: 502 });
  }
}

async function freshUrl(v: EcomVideo): Promise<string | undefined> {
  if (v.backend === "mcp" && (await isArcadsMcpConnected())) {
    const asset = await mcpGetAsset(v.arcadsId);
    return asset.downloadUrl;
  }
  if (v.kind === "avatar") {
    return talkingActorWatchUrl(v.arcadsId).catch(() => undefined);
  }
  const asset = await getAsset(v.arcadsId);
  return asset.url ?? (await assetWatchUrl(v.arcadsId).catch(() => undefined));
}
