import { NextResponse } from "next/server";
import { searchReels, creatorReels, hashtagReels } from "@/lib/integrations/instagram";
import { upsertPosts, readPosts, type VeillePost } from "@/lib/veille/store";

export const maxDuration = 300;

/**
 * POST /api/veille/scrape
 * Mode « sujet »   : { mode?: "sujet", queries: string[], pages, minViews, minEngagement, market }
 * Mode « créateur » : { mode: "createur", creators: string[], limit, minViews, minEngagement, market }
 * Cherche les reels les plus performants, filtre, et enregistre.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode?: "sujet" | "createur" | "hashtag";
      queries?: string[];
      query?: string;
      creators?: string[];
      hashtags?: string[];
      limit?: number;
      pages?: number;
      minViews?: number;
      minEngagement?: number;
      market?: string;
      maxAgeDays?: number;
    };

    // Fenêtre de fraîcheur : quand elle est active, on abaisse le plancher de
    // vues (les reels récents n'ont pas encore eu le temps de cumuler des vues).
    const maxAgeDays = body.maxAgeDays && body.maxAgeDays > 0 ? body.maxAgeDays : undefined;
    const rawMinViews = body.minViews ?? 0;
    const minViews = maxAgeDays ? Math.min(rawMinViews, 15_000) : rawMinViews;

    let reels;
    let label: string;

    if (body.mode === "hashtag") {
      const hashtags = (body.hashtags ?? []).map((h) => h.trim()).filter(Boolean);
      if (!hashtags.length) {
        return NextResponse.json({ error: "Indiquez au moins un hashtag." }, { status: 400 });
      }
      reels = await hashtagReels(hashtags, {
        limit: body.limit ?? 40,
        minViews,
        minEngagement: body.minEngagement ?? 0,
        market: body.market ?? "tous",
        maxAgeDays,
      });
      label = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" | ");
    } else if (body.mode === "createur") {
      const creators = (body.creators ?? [])
        .map((c) => c.trim())
        .filter(Boolean);
      if (!creators.length) {
        return NextResponse.json({ error: "Indiquez au moins un compte Instagram." }, { status: 400 });
      }
      reels = await creatorReels(creators, {
        limit: body.limit ?? 30,
        minViews,
        minEngagement: body.minEngagement ?? 0,
        market: body.market ?? "tous",
        maxAgeDays,
      });
      label = creators.map((c) => (c.startsWith("@") ? c : `@${c}`)).join(" | ");
    } else {
      const queries = (body.queries?.length ? body.queries : [body.query ?? ""])
        .map((q) => q.trim())
        .filter(Boolean);
      if (!queries.length) {
        return NextResponse.json({ error: "Indiquez au moins une recherche." }, { status: 400 });
      }
      reels = await searchReels(queries, {
        pages: body.pages ?? 3,
        minViews,
        minEngagement: body.minEngagement ?? 0,
        market: body.market ?? "tous",
        maxAgeDays,
      });
      label = queries.join(" | ");
    }

    const now = new Date().toISOString();
    const posts: VeillePost[] = reels.map((r) => ({
      id: r.id,
      shortCode: r.shortCode,
      url: r.url,
      hashtag: label,
      query: label,
      caption: r.caption,
      hashtags: r.hashtags,
      views: r.views,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      engagementRate: r.engagementRate,
      market: r.market,
      authorFollowers: r.authorFollowers,
      durationSec: r.durationSec,
      thumbnailUrl: r.thumbnailUrl,
      videoUrl: r.videoUrl,
      author: r.author,
      authorName: r.authorName,
      postedAt: r.postedAt,
      scriptStatus: "absent",
      scrapedAt: now,
    }));

    const added = await upsertPosts(posts);
    return NextResponse.json({
      ok: true,
      found: posts.length,
      added,
      posts: await readPosts(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recherche impossible" },
      { status: 500 }
    );
  }
}
