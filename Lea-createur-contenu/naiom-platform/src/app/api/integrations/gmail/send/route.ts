import { sendEmail, archiveSentEmail, type SendEmailParams } from "@/lib/integrations/gmailSend";
import { loadTokens } from "@/lib/integrations/google";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/integrations/gmail/send
 * body: { to, subject, body, isHtml?, archiveFolder? ("gmail" | "hiring" | "meetings"), tag? }
 */
export async function POST(req: Request) {
  const tokens = await loadTokens();
  if (!tokens) {
    return Response.json(
      { error: "Google non connecté. Reconnectez-vous via /settings." },
      { status: 412 }
    );
  }

  try {
    const {
      to,
      subject,
      body,
      isHtml,
      cc,
      bcc,
      replyToMessageId,
      threadId,
      archiveFolder,
      tag,
    } = await req.json();

    if (!to || !subject || !body) {
      return Response.json(
        { error: "to, subject et body sont requis" },
        { status: 400 }
      );
    }

    const params: SendEmailParams = { to, subject, body, isHtml, cc, bcc, replyToMessageId, threadId };
    const result = await sendEmail(params);

    let archiveFilename: string | undefined;
    if (archiveFolder && ["gmail", "hiring", "meetings"].includes(archiveFolder)) {
      archiveFilename = await archiveSentEmail(params, result, archiveFolder, tag);
    }

    return Response.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
      sentAt: result.sentAt,
      archivedAs: archiveFilename,
    });
  } catch (err) {
    console.error("[gmail/send]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
