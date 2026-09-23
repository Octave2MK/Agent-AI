import fs from "node:fs/promises";
import path from "node:path";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";
import type { AgentSlug } from "@/lib/types";

export const runtime = "nodejs";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "sans-titre";
}

function nowDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const AGENT_LABELS: Record<string, string> = {
  strategiste: "Brief de campagne",
  "createur-contenu": "Contenu",
  designer: "Prompts images",
  presentateur: "Deck",
  analyste: "Rapport",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const agentSlug = body.agentSlug as string | undefined;
    const title = (body.title as string | undefined)?.trim() || "Livrable sans titre";
    const content = body.content as string | undefined;

    if (!agentSlug || !content) {
      return Response.json({ error: "agentSlug et content sont requis" }, { status: 400 });
    }

    const folder = DELIVERABLE_FOLDERS[agentSlug as AgentSlug];
    if (!folder) {
      return Response.json({ error: "Cet agent ne produit pas de livrables" }, { status: 400 });
    }

    const date = nowDateStr();
    const titleSlug = slugify(title);
    const filename = `${date}-Nonvi-Efa-${agentSlug}-${titleSlug}.md`;
    const absPath = path.join(folder.abs, filename);

    const frontmatter = [
      "---",
      `client: Nonvi-Efa`,
      `agent: ${agentSlug}`,
      `date: ${date}`,
      `version: 1`,
      `statut: draft`,
      `source: "Produit depuis la plateforme Nonvi-Efa"`,
      `titre: "${title.replace(/"/g, '\\"')}"`,
      "---",
      "",
    ].join("\n");

    // Assure qu'il y a un H1 en tête si pas déjà présent
    const hasH1 = /^#\s+/m.test(content);
    const body_md = hasH1
      ? content
      : `# ${AGENT_LABELS[agentSlug] ?? "Livrable"} — ${title}\n\n${content}`;

    await fs.mkdir(folder.abs, { recursive: true });
    await fs.writeFile(absPath, `${frontmatter}${body_md}\n`, "utf-8");

    return Response.json({
      success: true,
      filename,
      path: absPath,
      title,
    });
  } catch (err) {
    console.error("[api/deliverable/save]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
