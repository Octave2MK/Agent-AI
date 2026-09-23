import { NextResponse } from "next/server";
import { transcribeReels } from "@/lib/integrations/instagram";
import { readPosts, updatePost } from "@/lib/veille/store";

export const maxDuration = 300;

/**
 * POST /api/veille/transcribe
 * { id } pour un seul reel, ou { ids: [...] } pour un lot.
 * Un lot = UN seul appel Apify (bien plus rapide que N appels).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; ids?: string[] };
    const ids = body.ids?.length ? body.ids : body.id ? [body.id] : [];
    if (!ids.length) return NextResponse.json({ error: "id ou ids requis" }, { status: 400 });

    const all = await readPosts();
    const targets = all.filter((p) => ids.includes(p.id));
    if (!targets.length) return NextResponse.json({ error: "Aucun post trouvé" }, { status: 404 });

    await Promise.all(
      targets.map((p) => updatePost(p.id, { scriptStatus: "en-cours", scriptError: undefined }))
    );

    const results = await transcribeReels(targets.map((p) => p.url));

    // on rapproche par shortcode (l'ordre de sortie n'est pas garanti)
    const byCode = new Map(results.map((r) => [r.shortCode ?? codeOf(r.url), r]));

    let ok = 0;
    for (const p of targets) {
      const r = byCode.get(p.shortCode);
      if (!r) {
        await updatePost(p.id, { scriptStatus: "erreur", scriptError: "Aucun résultat renvoyé." });
        continue;
      }
      if (r.text) {
        await updatePost(p.id, {
          script: r.text,
          scriptStatus: "ok",
          scriptError: undefined,
          // l'acteur renvoie aussi une vignette : on en profite pour combler
          // les posts qui n'en avaient pas
          ...(r.thumbnail && !p.thumbnailUrl ? { thumbnailUrl: r.thumbnail } : {}),
        });
        ok++;
      } else {
        await updatePost(p.id, {
          scriptStatus: "erreur",
          scriptError: r.error || "Aucune parole détectée dans cette vidéo.",
          ...(r.thumbnail && !p.thumbnailUrl ? { thumbnailUrl: r.thumbnail } : {}),
        });
      }
    }

    return NextResponse.json({ ok: true, transcrits: ok, total: targets.length, posts: await readPosts() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transcription impossible" },
      { status: 500 }
    );
  }
}

function codeOf(url: string): string {
  return url.match(/\/reel\/([^/?]+)/)?.[1] ?? "";
}
