import fs from "node:fs/promises";
import path from "node:path";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";

export const runtime = "nodejs";

/**
 * GET /api/reports/file/<agent>/<filename>
 * Sert un PDF rapport depuis le dossier de livrables de l'agent.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agent: string; filename: string }> }
) {
  const { agent, filename } = await params;
  if (!DELIVERABLE_FOLDERS[agent]) {
    return new Response("Agent inconnu", { status: 404 });
  }
  if (!/^[a-zA-Z0-9._-]+\.(pdf|md)$/.test(filename)) {
    return new Response("Nom de fichier invalide", { status: 400 });
  }
  const absPath = path.join(DELIVERABLE_FOLDERS[agent].abs, filename);
  const isMd = filename.endsWith(".md");
  try {
    const data = await fs.readFile(absPath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": isMd ? "text/markdown; charset=utf-8" : "application/pdf",
        "Content-Disposition": `${isMd ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("Fichier introuvable", { status: 404 });
  }
}
