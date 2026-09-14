import { generateCarousel } from "@/lib/carousels/generate";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/carousels/generate
 * body: { markdown: string, ratio?: "1:1" | "4:5" | "9:16", slug?: string }
 * → produit N PNGs (1 par slide) via Puppeteer, texte 100 % fidèle.
 */
export async function POST(req: Request) {
  try {
    const { markdown, ratio, slug } = await req.json();
    if (!markdown || typeof markdown !== "string") {
      return Response.json({ error: "markdown (string) requis" }, { status: 400 });
    }
    const allowed = new Set(["1:1", "4:5", "9:16"]);
    if (ratio && !allowed.has(ratio)) {
      return Response.json({ error: "ratio doit être 1:1, 4:5 ou 9:16" }, { status: 400 });
    }

    const result = await generateCarousel(markdown, { ratio, slug });

    return Response.json({
      success: true,
      title: result.title,
      ratio: result.ratio,
      total: result.total,
      slides: result.slides.map((s) => ({
        index: s.index,
        filename: s.filename,
        publicUrl: s.publicUrl,
        bytes: s.bytes,
      })),
    });
  } catch (err) {
    console.error("[carousels/generate]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
