import type { Browser } from "puppeteer";
import { generateImage, isNanoBananaConfigured } from "@/lib/integrations/nanoBanana";
import { pickReferenceFace, readReferenceInline } from "@/lib/thumbnails/references";
import { buildThumbnailPrompts } from "@/lib/thumbnails/prompts";
import { composeThumbnail, puppeteer } from "@/lib/thumbnails/compose";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/youtube-thumbnail/generate
 * body: { title: string, angle?: string, count?: number, referenceName?: string }
 *
 * Pour chaque composition :
 *   1) Nano Banana compose le VISUEL (vrai visage de la photo MINIATURE + scène, sans texte)
 *   2) Puppeteer incruste le titre par-dessus (texte 100 % net) → PNG 1280×720
 *
 * → { success, reference, thumbnails: [{ label, visualUrl, finalUrl, prompt }] }
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

  let title: string;
  let angle: string | undefined;
  let count: number | undefined;
  let referenceName: string | undefined;
  try {
    const body = await req.json();
    title = body.title;
    angle = body.angle;
    count = body.count;
    referenceName = body.referenceName;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!title || typeof title !== "string" || title.trim().length < 2) {
    return Response.json({ error: "title (string, ≥ 2 car.) requis" }, { status: 400 });
  }

  // Charge le visage de référence depuis MINIATURE.
  const face = await pickReferenceFace(referenceName);
  if (!face) {
    return Response.json(
      {
        error:
          "Aucune photo de référence trouvée dans le dossier MINIATURE. Ajoutez-y votre portrait (JPG/PNG).",
      },
      { status: 404 }
    );
  }

  let reference;
  try {
    reference = await readReferenceInline(face);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Lecture de la photo impossible" },
      { status: 400 }
    );
  }

  const specs = buildThumbnailPrompts({ title, angle, count });

  let browser: Browser | null = null;
  const thumbnails: {
    label: string;
    visualUrl: string;
    finalUrl: string;
    prompt: string;
  }[] = [];
  const errors: { label: string; error: string }[] = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    // Séquentiel : évite les rate limits Gemini + un seul Chromium réutilisé.
    for (const spec of specs) {
      try {
        const visual = await generateImage(spec.prompt, {
          slug: `miniature-${spec.label}`,
          references: [reference],
        });
        const final = await composeThumbnail(visual.absPath, title, spec.textSide, {
          browser,
          slug: `miniature-${spec.label}`,
        });
        thumbnails.push({
          label: spec.label,
          visualUrl: visual.publicUrl,
          finalUrl: final.publicUrl,
          prompt: spec.prompt,
        });
      } catch (err) {
        errors.push({
          label: spec.label,
          error: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    }
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Échec du moteur de rendu" },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }

  if (thumbnails.length === 0) {
    // On remonte la VRAIE cause (souvent quota image Gemini = 0) au lieu d'un
    // message générique, pour que l'UI l'affiche directement.
    const firstErr = errors[0]?.error;
    return Response.json(
      {
        error: firstErr
          ? `Aucune miniature générée — ${firstErr}`
          : "Aucune miniature générée.",
        details: errors,
      },
      { status: 502 }
    );
  }

  return Response.json({
    success: true,
    reference: face.name,
    title,
    thumbnails,
    errors: errors.length > 0 ? errors : undefined,
  });
}
