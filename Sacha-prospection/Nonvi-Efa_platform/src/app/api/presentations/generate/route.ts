import { parseDeckMarkdown } from "@/lib/presentations/parseMarkdown";
import { generatePresentationPDF } from "@/lib/presentations/generate";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * POST /api/presentations/generate
 * body: { markdown: string, title?: string, agentSlug?: string }
 * → produit un PDF visuel (1920×1080) dans le dossier de l'agent (si agentSlug fourni)
 *   ou dans decks/ par défaut. Retourne { filename, path, downloadUrl, slidesCount }.
 */
export async function POST(req: Request) {
  try {
    const { markdown, title, agentSlug } = await req.json();
    if (!markdown || typeof markdown !== "string") {
      return Response.json({ error: "markdown (string) requis" }, { status: 400 });
    }
    if (agentSlug && !DELIVERABLE_FOLDERS[agentSlug]) {
      return Response.json({ error: `agentSlug invalide : ${agentSlug}` }, { status: 400 });
    }

    const presentation = parseDeckMarkdown(markdown, title || "Présentation");
    const { filename, path: absPath, bytes, folderSlug } = await generatePresentationPDF(
      presentation,
      { agentSlug: agentSlug || undefined }
    );

    // URL de téléchargement : utilise l'endpoint générique /api/reports/file/[agent]/[filename]
    // qui sert depuis n'importe quel DELIVERABLE_FOLDERS. Pour le presentateur
    // (pas d'agentSlug), on utilise l'endpoint dédié decks.
    const downloadUrl = agentSlug
      ? `/api/reports/file/${encodeURIComponent(folderSlug)}/${encodeURIComponent(filename)}`
      : `/api/presentations/file/${encodeURIComponent(filename)}`;

    return Response.json({
      success: true,
      filename,
      path: absPath,
      bytes,
      slidesCount: presentation.slides.length,
      downloadUrl,
    });
  } catch (err) {
    console.error("[presentations/generate]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
