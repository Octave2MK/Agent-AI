import { getMeetings } from "@/lib/dataSources";
import { generateProposal } from "@/lib/propositions/proposal";
import { generateProposalPDF } from "@/lib/propositions/proposalPdf";

export const runtime = "nodejs";
export const maxDuration = 120;

const INTERNAL = /zeyneb|maxim|naiom/i;

/**
 * POST /api/propositions/generate { callId }
 * Victor reprend le call (Fireflies) → proposition STRUCTURÉE → PDF pro (schémas + prix).
 * Renvoie le PDF (downloadUrl) + l'email d'accompagnement SÉPARÉ.
 */
export async function POST(req: Request) {
  try {
    const { callId } = (await req.json()) as { callId?: string };
    if (!callId) return Response.json({ error: "callId requis" }, { status: 400 });

    const { data: calls } = await getMeetings();
    const call = calls.find((c) => c.id === callId);
    if (!call) return Response.json({ error: "Call introuvable" }, { status: 404 });

    const prospect =
      call.participants.find((p) => !INTERNAL.test(p)) ??
      call.title.replace(/^.*?—\s*/, "").split("(")[0].trim();

    if (!process.env.ANTHROPIC_API_KEY)
      return Response.json({ error: "ANTHROPIC_API_KEY absente dans .env.local." }, { status: 412 });

    const proposal = await generateProposal(
      {
        title: call.title, date: call.date, participants: call.participants, type: call.type,
        sentiment: call.sentiment, summary: call.summary, keyPoints: call.keyPoints,
        actionItems: call.actionItems, transcript: call.transcript,
      },
      prospect
    );

    const { filename, bytes } = await generateProposalPDF(proposal);

    return Response.json({
      success: true,
      prospect: proposal.prospect,
      reference: proposal.reference,
      filename,
      bytes,
      downloadUrl: `/api/reports/file/proposition/${encodeURIComponent(filename)}`,
      email: proposal.email,
    });
  } catch (err) {
    console.error("[propositions/generate]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
