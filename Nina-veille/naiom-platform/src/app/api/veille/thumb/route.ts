import { NextResponse } from "next/server";

/**
 * GET /api/veille/thumb?u=<url> — proxy des vignettes Instagram.
 * Le CDN d'Instagram refuse les requêtes venant d'un autre domaine : on
 * récupère l'image côté serveur et on la re-sert.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get("u");
  if (!u) return NextResponse.json({ error: "u requis" }, { status: 400 });

  // on n'autorise que le CDN Instagram/Facebook
  let host: string;
  try {
    host = new URL(u).hostname;
  } catch {
    return NextResponse.json({ error: "url invalide" }, { status: 400 });
  }
  if (!/(^|\.)(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(host)) {
    return NextResponse.json({ error: "domaine non autorisé" }, { status: 403 });
  }

  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return new NextResponse(null, { status: 404 });
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 504 });
  }
}
