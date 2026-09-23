import fs from "node:fs/promises";
import path from "node:path";
import { DECKS_DIR } from "@/lib/presentations/generate";

export const runtime = "nodejs";

/**
 * GET /api/presentations/file/<filename>
 * Sert le PDF généré dans decks/.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9._-]+\.pdf$/.test(filename)) {
    return new Response("Nom de fichier invalide", { status: 400 });
  }
  const absPath = path.join(DECKS_DIR, filename);
  try {
    const data = await fs.readFile(absPath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("PDF introuvable", { status: 404 });
  }
}
