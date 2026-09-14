import { getInvoice } from "@/lib/compta/clients";
import { generateInvoicePDF } from "@/lib/compta/invoice";
import { draftEmail } from "@/lib/compta/emails";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/compta/facture  { invoiceId }
 * Génère la facture PDF de marque + le brouillon d'email (relance ou envoi),
 * prêts à approuver. N'ENVOIE RIEN.
 */
export async function POST(req: Request) {
  try {
    const { invoiceId } = (await req.json()) as { invoiceId?: string };
    if (!invoiceId) return Response.json({ error: "invoiceId requis" }, { status: 400 });

    const inv = await getInvoice(invoiceId);
    if (!inv) return Response.json({ error: "Facture introuvable" }, { status: 404 });

    const { filename, bytes } = await generateInvoicePDF(inv);
    const email = draftEmail(inv);

    return Response.json({
      success: true,
      invoice: { number: inv.number, ttc: inv.ttc, status: inv.status, client: inv.client },
      filename,
      bytes,
      downloadUrl: `/api/reports/file/comptabilite/${encodeURIComponent(filename)}`,
      email: { to: inv.client?.email ?? "", subject: email.subject, body: email.body },
    });
  } catch (err) {
    console.error("[compta/facture]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
