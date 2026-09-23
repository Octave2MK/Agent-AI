import { apifyConfigured } from "@/lib/integrations/apify";
import { readLeads, deleteLead } from "@/lib/prospection/store";

export const runtime = "nodejs";

/** GET /api/prospection/leads → { leads, configured } */
export async function GET() {
  const leads = await readLeads();
  return Response.json({ leads, configured: apifyConfigured() });
}

/** DELETE /api/prospection/leads — body: { leadId } */
export async function DELETE(req: Request) {
  try {
    const { leadId } = await req.json();
    if (!leadId) return Response.json({ error: "leadId requis" }, { status: 400 });
    const ok = await deleteLead(leadId);
    if (!ok) return Response.json({ error: "Lead introuvable" }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
