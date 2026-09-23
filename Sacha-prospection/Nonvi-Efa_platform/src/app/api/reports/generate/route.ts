import { generateReportPDF } from "@/lib/reports/generate";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";

export const runtime = "nodejs";
export const maxDuration = 90;

const REPORT_CATEGORIES: Record<string, { category: string; subtitle: string }> = {
  analyste: {
    category: "RAPPORT D'ANALYSE",
    subtitle: "Analyse des performances et recommandations stratégiques.",
  },
  fireflies: {
    category: "SYNTHÈSE DE CALLS",
    subtitle: "Résumé des conversations et plan d'action équipe.",
  },
  strategiste: {
    category: "BRIEF DE CAMPAGNE",
    subtitle: "Positionnement, ICP et angles de contenu.",
  },
  "createur-contenu": {
    category: "DOSSIER CONTENU",
    subtitle: "Pièces de contenu rédigées et prêtes à publier.",
  },
  gmail: { category: "TO-DO GMAIL", subtitle: "Priorisation des emails et plan d'action." },
  cv: { category: "DOSSIER RH", subtitle: "Scoring candidats et recommandations." },
};

/**
 * POST /api/reports/generate
 * body: { agentSlug, title?, subtitle?, markdown }
 * → génère un PDF dans le dossier de l'agent, retourne { filename, downloadUrl }
 */
export async function POST(req: Request) {
  try {
    const { agentSlug, title, subtitle, markdown } = await req.json();
    if (!agentSlug || !markdown) {
      return Response.json({ error: "agentSlug et markdown sont requis" }, { status: 400 });
    }
    if (!DELIVERABLE_FOLDERS[agentSlug]) {
      return Response.json({ error: `agentSlug invalide : ${agentSlug}` }, { status: 400 });
    }

    // Déduit le titre depuis le 1er H1 si non fourni
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    const effectiveTitle = title ?? h1Match?.[1].trim() ?? "Rapport Nonvi-Efa";

    const meta = REPORT_CATEGORIES[agentSlug] ?? { category: "RAPPORT", subtitle: "" };

    const { filename, bytes } = await generateReportPDF(
      {
        title: effectiveTitle,
        subtitle: subtitle ?? meta.subtitle,
        category: meta.category,
        markdown,
      },
      { agentSlug }
    );

    return Response.json({
      success: true,
      filename,
      bytes,
      downloadUrl: `/api/reports/file/${encodeURIComponent(agentSlug)}/${encodeURIComponent(filename)}`,
    });
  } catch (err) {
    console.error("[reports/generate]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
