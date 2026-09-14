import fs from "node:fs/promises";
import path from "node:path";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";
import { sendEmail } from "@/lib/integrations/gmailSend";
import { getInvoice, FACTURES_TABLE } from "@/lib/compta/clients";
import { generateInvoicePDF } from "@/lib/compta/invoice";
import { updateRecord } from "@/lib/integrations/airtable";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/compta/relance/send
 *   { invoiceId, to, subject, message, markPaid? }
 * Approbation : joint la facture PDF et envoie l'email (relance ou envoi de facture).
 * markPaid → marque la facture Payée dans Airtable (facture auto « payé »).
 */
export async function POST(req: Request) {
  try {
    const { invoiceId, to, subject, message, markPaid } = (await req.json()) as {
      invoiceId?: string; to?: string; subject?: string; message?: string; markPaid?: boolean;
    };
    if (!invoiceId || !to || !subject || !message)
      return Response.json({ error: "invoiceId, to, subject, message requis" }, { status: 400 });

    const inv = await getInvoice(invoiceId);
    if (!inv) return Response.json({ error: "Facture introuvable" }, { status: 404 });

    // (re)génère le PDF pour garantir qu'il est présent et à jour
    const { filename } = await generateInvoicePDF(markPaid ? { ...inv, status: "Paid" } : inv);
    const abs = path.join(DELIVERABLE_FOLDERS.comptabilite.abs, filename);
    const pdf = await fs.readFile(abs);

    const result = await sendEmail({
      to,
      subject,
      body: message,
      attachments: [{ filename, content: pdf.toString("base64"), mimeType: "application/pdf" }],
    });

    let marked = false;
    if (markPaid) {
      try {
        await updateRecord(FACTURES_TABLE, invoiceId, {
          "Payment Status": "Paid",
          "Payment Date": new Date().toISOString().slice(0, 10),
        });
        marked = true;
      } catch (e) {
        console.error("[compta/relance/send] markPaid", e);
      }
    }

    return Response.json({ success: true, messageId: result.messageId, sentAt: result.sentAt, marked });
  } catch (err) {
    console.error("[compta/relance/send]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Erreur envoi" }, { status: 500 });
  }
}
