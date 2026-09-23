import { isAirtableConfigured, AIRTABLE_CLIENTS_BASE } from "@/lib/integrations/airtable";
import { getComptaClients, relanceLevel } from "@/lib/compta/clients";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/compta/relances
 * Dashboard relances & facturation depuis la base clients Airtable.
 * KPIs + factures à relancer (pire retard d'abord) + factures à confirmer.
 */
export async function GET() {
  if (!isAirtableConfigured()) return Response.json({ configured: false, base: AIRTABLE_CLIENTS_BASE });
  try {
    const data = await getComptaClients();
    const relances = data.relances.map((i) => ({ ...i, relance: relanceLevel(i.daysOverdue) }));
    return Response.json({
      configured: true,
      base: AIRTABLE_CLIENTS_BASE,
      kpis: data.kpis,
      relances,
      aFacturer: data.aFacturer,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ configured: true, error: err instanceof Error ? err.message : "Erreur Airtable" }, { status: 500 });
  }
}
