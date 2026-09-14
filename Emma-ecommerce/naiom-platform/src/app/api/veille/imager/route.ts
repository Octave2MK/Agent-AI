import { NextResponse } from "next/server";
import { generateShortDeck, renderDeckToMp4 } from "@/lib/veille/imager";
import { readPosts, updatePost } from "@/lib/veille/store";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/veille/imager
 * { id }
 * Transforme le script d'un reel en short animé (schémas Bronx, MP4 9:16).
 */
export async function POST(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const post = (await readPosts()).find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Reel introuvable" }, { status: 404 });
  if (post.scriptStatus !== "ok" || !post.script?.trim()) {
    return NextResponse.json(
      { error: "Transcris d'abord le script de ce reel." },
      { status: 400 }
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY absente dans .env.local." },
      { status: 412 }
    );
  }

  await updatePost(id, { shortStatus: "en-cours", shortError: undefined });
  try {
    const slides = await generateShortDeck(post);
    const { publicUrl } = await renderDeckToMp4(slides, post.shortCode);
    await updatePost(id, { shortStatus: "ok", shortUrl: publicUrl, shortError: undefined });
    return NextResponse.json({ ok: true, shortUrl: publicUrl, posts: await readPosts() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Génération impossible";
    await updatePost(id, { shortStatus: "erreur", shortError: msg });
    return NextResponse.json({ error: msg, posts: await readPosts() }, { status: 500 });
  }
}
