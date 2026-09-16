import fs from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { getAIModel, getAIProvider } from "@/lib/ai/provider";
import { getAgentBySlug } from "@/lib/agents";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";
import { getMeetings } from "@/lib/dataSources";
import { generateProposal } from "@/lib/propositions/proposal";
import { generateProposalPDF } from "@/lib/propositions/proposalPdf";

export const runtime = "nodejs";
export const maxDuration = 180;

const INTERNAL = /zeyneb|maxim|naiom|camille|sam/i;

interface Msg { role: string; parts?: { type: string; text?: string }[]; content?: string }
function convoText(messages: Msg[]): string {
  return (messages ?? [])
    .map((m) => {
      const txt = m.parts?.filter((p) => p.type === "text").map((p) => p.text).join(" ") ?? m.content ?? "";
      return `${m.role === "user" ? "Utilisateur" : "Agent"} : ${txt}`;
    })
    .filter((l) => l.length > 12)
    .join("\n\n");
}

const slug2 = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/**
 * POST /api/agents/create { agentSlug, messages }
 * Après approbation du plan dans le chat → l'agent CRÉE son vrai livrable.
 *  - proposition (Victor) → PDF de proposition (depuis le dernier call prospect).
 *  - autres agents document → livrable complet en markdown, sauvegardé + téléchargeable.
 */
export async function POST(req: Request) {
  try {
    const { agentSlug, messages } = (await req.json()) as { agentSlug?: string; messages?: Msg[] };
    if (!agentSlug) return Response.json({ error: "agentSlug requis" }, { status: 400 });

    try {
      if (getAIProvider() === "gemini" && !process.env.GEMINI_API_KEY) {
        return Response.json({ error: "GEMINI_API_KEY absente." }, { status: 412 });
      }
      if (getAIProvider() === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
        return Response.json({ error: "ANTHROPIC_API_KEY absente." }, { status: 412 });
      }
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Configuration IA invalide." }, { status: 412 });
    }

    const agent = await getAgentBySlug(agentSlug);
    if (!agent) return Response.json({ error: "Agent inconnu" }, { status: 404 });

    // ---- Victor : vraie proposition PDF depuis le dernier call prospect ----
    if (agentSlug === "proposition") {
      const { data: calls } = await getMeetings();
      if (!calls.length) return Response.json({ error: "Aucun call disponible — connecte Fireflies ou colle un call." }, { status: 400 });
      // dernier call PROSPECT (participant non-interne), sinon le plus récent
      const call = calls.find((c) => c.participants.some((p) => !INTERNAL.test(p))) ?? calls[0];
      const prospect = call.participants.find((p) => !INTERNAL.test(p)) ?? call.title.replace(/^.*?—\s*/, "").split("(")[0].trim();
      const proposal = await generateProposal(
        { title: call.title, date: call.date, participants: call.participants, type: call.type, sentiment: call.sentiment, summary: call.summary, keyPoints: call.keyPoints, actionItems: call.actionItems, transcript: call.transcript },
        prospect
      );
      const { filename } = await generateProposalPDF(proposal);
      return Response.json({
        kind: "pdf",
        title: `Proposition — ${proposal.prospect}`,
        filename,
        url: `/api/reports/file/proposition/${encodeURIComponent(filename)}`,
        note: `Basée sur le call « ${call.title} ».`,
      });
    }

    // ---- Autres agents : livrable complet en markdown, sauvegardé ----
    const folder = DELIVERABLE_FOLDERS[agentSlug];
    const modelId = /opus/i.test(agent.model) ? "claude-opus-5" : "claude-sonnet-5";
    const { text } = await generateText({
      model: getAIModel(modelId),
      maxOutputTokens: 8000,
      system: `${agent.systemPrompt || `Tu es ${agent.name}.`}\n\nProduis MAINTENANT le livrable complet, final, prêt à l'emploi, en Markdown propre. Pas de préambule ("voici…"), pas de plan : le livrable lui-même. Respecte le format attendu de ton rôle.`,
      prompt: `Voici la conversation (l'utilisateur a approuvé le plan). Produis le livrable final complet.\n\n${convoText(messages ?? [])}`,
    });

    const title = (text.match(/^#\s+(.+)$/m)?.[1] ?? `Livrable ${agent.name}`).slice(0, 80);
    const filename = `${new Date().toISOString().slice(0, 10)}-${slug2(title)}.md`;
    if (folder) {
      await fs.mkdir(folder.abs, { recursive: true });
      await fs.writeFile(path.join(folder.abs, filename), text, "utf-8");
      return Response.json({
        kind: "file",
        title,
        filename,
        url: `/api/reports/file/${agentSlug}/${encodeURIComponent(filename)}`,
        markdown: text,
      });
    }
    // pas de dossier dédié → on renvoie juste le contenu
    return Response.json({ kind: "text", title, markdown: text });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
