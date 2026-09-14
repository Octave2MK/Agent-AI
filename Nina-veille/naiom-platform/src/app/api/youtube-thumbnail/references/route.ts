import { listReferenceFaces, resolveMiniatureDir } from "@/lib/thumbnails/references";

export const runtime = "nodejs";

/**
 * GET /api/youtube-thumbnail/references
 * → liste les photos de référence disponibles dans le dossier MINIATURE.
 */
export async function GET() {
  const dir = await resolveMiniatureDir();
  if (!dir) {
    return Response.json(
      {
        found: false,
        faces: [],
        error:
          "Dossier MINIATURE introuvable. Placez votre photo (visage) dans le dossier MINIATURE à la racine du projet.",
      },
      { status: 200 }
    );
  }

  const faces = await listReferenceFaces();
  return Response.json({
    found: true,
    dir,
    faces: faces.map((f) => ({ name: f.name, sizeLabel: f.sizeLabel, bytes: f.bytes })),
  });
}
