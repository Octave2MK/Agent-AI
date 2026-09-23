import fs from "node:fs/promises";
import path from "node:path";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";
import { sendEmail } from "@/lib/integrations/gmailSend";
import { loadTokens } from "@/lib/integrations/google";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/propositions/send  { filename, to, subject?, message? }
 * Envoie la proposition (PDF) au prospect en pièce jointe via Gmail.
 */
export async function POST(req: Request) {
  try {
    const { filename, to, subject, message } = (await req.json()) as {
      filename?: string;
      to?: string;
      subject?: string;
      message?: string;
    };
    if (!filename || !to) return Response.json({ error: "filename et to requis" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to))
      return Response.json({ error: "Email du prospect invalide" }, { status: 400 });
    if (!(await loadTokens()))
      return Response.json(
        { error: "Gmail non connecté. Connecte Google dans Réglages → Connexions." },
        { status: 412 }
      );

    const safe = path.basename(filename);
    const abs = path.join(DELIVERABLE_FOLDERS.proposition.abs, safe);
    const buf = await fs.readFile(abs).catch(() => null);
    if (!buf) return Response.json({ error: "PDF introuvable — régénère la proposition." }, { status: 404 });

    const body =
      (message?.trim() ||
        `Bonjour,\n\nComme convenu suite à notre échange, vous trouverez en pièce jointe notre proposition.\nJe reste à votre disposition pour en discuter.\n\nBien à vous,`) + "\n";

    const res = await sendEmail({
      to: to.trim(),
      subject: subject?.trim() || "Notre proposition",
      body,
      isHtml: false,
      attachments: [{ filename: safe, content: buf.toString("base64"), mimeType: "application/pdf" }],
    });

    return Response.json({ success: true, messageId: res.messageId, sentAt: res.sentAt });
  } catch (err) {
    console.error("[propositions/send]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Envoi impossible" }, { status: 500 });
  }
}
