import { generateImage, isNanoBananaConfigured } from "@/lib/integrations/nanoBanana";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/nano-banana/generate
 * body: { prompt: string, slug?: string }
 * → retourne { filename, publicUrl, bytes } ou { error }
 */
export async function POST(req: Request) {
  if (!isNanoBananaConfigured()) {
    return Response.json(
      {
        error:
          "GEMINI_API_KEY absente. Obtenez une clé sur aistudio.google.com et ajoutez-la dans .env.local.",
      },
      { status: 412 }
    );
  }

  try {
    const { prompt, slug } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length < 10) {
      return Response.json({ error: "prompt (string, >=10 car.) requis" }, { status: 400 });
    }
    const result = await generateImage(prompt, { slug });
    return Response.json({
      success: true,
      filename: result.filename,
      publicUrl: result.publicUrl,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error("[nano-banana]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
