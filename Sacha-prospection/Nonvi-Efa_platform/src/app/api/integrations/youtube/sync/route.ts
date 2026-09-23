import fs from "node:fs/promises";
import path from "node:path";
import { fetchYouTubeSnapshot } from "@/lib/integrations/youtube";
import { loadTokens } from "@/lib/integrations/google";

export const runtime = "nodejs";
export const maxDuration = 90;

const LIVE_YOUTUBE_FILE = path.join(process.cwd(), "src", "data", "live-youtube.json");

export async function POST(req: Request) {
  const tokens = await loadTokens();
  if (!tokens) {
    return Response.json(
      {
        error:
          "Google non connecté. Visitez /api/integrations/google/start pour autoriser l'accès YouTube + Gmail.",
      },
      { status: 412 }
    );
  }

  const url = new URL(req.url);
  const days = Math.min(365, parseInt(url.searchParams.get("days") ?? "30", 10));
  const videos = Math.min(50, parseInt(url.searchParams.get("videos") ?? "20", 10));

  try {
    const snapshot = await fetchYouTubeSnapshot({ days, videos });
    await fs.writeFile(LIVE_YOUTUBE_FILE, JSON.stringify(snapshot, null, 2), "utf-8");
    return Response.json({
      success: true,
      synced: {
        videos: snapshot.videos.length,
        subscribers: snapshot.channel.subscribers,
        viewsInPeriod: snapshot.analytics.totals.views,
      },
      wroteTo: LIVE_YOUTUBE_FILE,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[youtube/sync]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stat = await fs.stat(LIVE_YOUTUBE_FILE);
    return Response.json({ live: true, lastUpdated: stat.mtime.toISOString() });
  } catch {
    return Response.json({ live: false });
  }
}
