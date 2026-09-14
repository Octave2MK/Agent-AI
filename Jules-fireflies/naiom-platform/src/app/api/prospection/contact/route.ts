import { sendEmail } from "@/lib/integrations/gmailSend";
import { getGoogleStatus } from "@/lib/integrations/google";
import { readLeads, updateLead } from "@/lib/prospection/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/prospection/contact — ÉTAPE 4 · CONTACT (Prêt → Contacté)
 * body: { leadId, to?: string }
 * Envoie l'email personnalisé via Gmail (compte Google connecté).
 * `to` permet de corriger/choisir l'adresse si plusieurs ont été trouvées.
 */
export async function POST(req: Request) {
  try {
    const { leadId, to } = await req.json();
    const lead = (await readLeads()).find((l) => l.id === leadId);
    if (!lead) return Response.json({ error: "Lead introuvable" }, { status: 404 });
    if (!lead.outreach) {
      return Response.json({ error: "Générez d'abord le message (étape Personnalisation)." }, { status: 422 });
    }

    const google = await getGoogleStatus();
    if (!google.connected) {
      return Response.json(
        { error: "Gmail non connecté — allez dans Connexions pour lier votre compte Google." },
        { status: 412 }
      );
    }

    const recipient = (to || lead.emails?.[0])?.trim();
    if (!recipient) {
      return Response.json(
        { error: "Aucune adresse email pour ce lead — renseignez-en une." },
        { status: 422 }
      );
    }

    const result = await sendEmail({
      to: recipient,
      subject: lead.outreach.subject,
      body: lead.outreach.email,
    });

    const updated = await updateLead(leadId, {
      status: "contacte",
      contactedAt: result.sentAt,
    });
    return Response.json({ success: true, lead: updated, sentTo: recipient });
  } catch (err) {
    console.error("[prospection/contact]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
