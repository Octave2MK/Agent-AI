import fs from "node:fs/promises";
import path from "node:path";
import { getValidAccessToken } from "./google";

/**
 * Envoi de mails via Gmail API (scope gmail.send).
 * Archive chaque envoi dans hiring/ ou gmail/ selon le contexte.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string; // texte brut ou HTML
  isHtml?: boolean;
  cc?: string[];
  bcc?: string[];
  replyToMessageId?: string; // In-Reply-To header
  threadId?: string;
  /** Pièces jointes (content = base64). Ex. une proposition en PDF. */
  attachments?: { filename: string; content: string; mimeType?: string }[];
}

export interface SendEmailResult {
  messageId: string;
  threadId: string;
  sentAt: string;
}

function encodeRfc2047(s: string): string {
  // Encode non-ASCII dans header (UTF-8 Q-encoded)
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  const b64 = Buffer.from(s, "utf-8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function buildMimeMessage(p: SendEmailParams, from: string): string {
  const boundary = `Nonvi-Efa-${Date.now()}`;
  const headers: string[] = [
    `From: ${from}`,
    `To: ${p.to}`,
    ...(p.cc?.length ? [`Cc: ${p.cc.join(", ")}`] : []),
    ...(p.bcc?.length ? [`Bcc: ${p.bcc.join(", ")}`] : []),
    `Subject: ${encodeRfc2047(p.subject)}`,
    "MIME-Version: 1.0",
    ...(p.replyToMessageId
      ? [`In-Reply-To: ${p.replyToMessageId}`, `References: ${p.replyToMessageId}`]
      : []),
  ];

  // Avec pièces jointes → multipart/mixed (corps + fichiers).
  if (p.attachments?.length) {
    const mixed = `mixed-${boundary}`;
    const parts: string[] = [
      ...headers,
      `Content-Type: multipart/mixed; boundary="${mixed}"`,
      "",
      `--${mixed}`,
      `Content-Type: ${p.isHtml ? "text/html" : "text/plain"}; charset=UTF-8`,
      "Content-Transfer-Encoding: 8bit",
      "",
      p.body,
      "",
    ];
    for (const a of p.attachments) {
      const b64 = a.content.replace(/(.{76})/g, "$1\r\n");
      parts.push(
        `--${mixed}`,
        `Content-Type: ${a.mimeType ?? "application/octet-stream"}; name="${a.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${a.filename}"`,
        "",
        b64,
        ""
      );
    }
    parts.push(`--${mixed}--`);
    return parts.join("\r\n");
  }

  if (p.isHtml) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const plain = p.body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
    return [
      ...headers,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      plain,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      p.body,
      "",
      `--${boundary}--`,
    ].join("\r\n");
  }

  return [
    ...headers,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    p.body,
  ].join("\r\n");
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getUserEmail(): Promise<string> {
  const token = await getValidAccessToken();
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return "me";
  const data = await res.json();
  return data.email || "me";
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const token = await getValidAccessToken();
  const from = await getUserEmail();
  const mime = buildMimeMessage(params, from);
  const raw = base64UrlEncode(Buffer.from(mime, "utf-8"));

  const body: { raw: string; threadId?: string } = { raw };
  if (params.threadId) body.threadId = params.threadId;

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail send ${res.status} : ${errText.slice(0, 400)}`);
  }
  const data = await res.json();
  return {
    messageId: data.id,
    threadId: data.threadId,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Archive chaque envoi dans un fichier markdown dédié pour traçabilité.
 * Dossier cible : gmail/ ou hiring/ selon le contexte.
 */
export async function archiveSentEmail(
  params: SendEmailParams,
  result: SendEmailResult,
  folder: "gmail" | "hiring" | "meetings",
  tag?: string
): Promise<string> {
  const repoRoot = path.resolve(process.cwd(), "..");
  const dir = path.join(repoRoot, folder);
  await fs.mkdir(dir, { recursive: true });

  const date = result.sentAt.slice(0, 10);
  const slug = params.to.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30);
  const filename = `${date}-envoi-${slug}-${Date.now()}.md`;
  const absPath = path.join(dir, filename);

  const content = `---
type: email-sent
to: ${params.to}
subject: "${params.subject.replace(/"/g, '\\"')}"
sentAt: ${result.sentAt}
messageId: ${result.messageId}
threadId: ${result.threadId}
tag: ${tag ?? "manual"}
---

# Email envoyé à ${params.to}

**Objet** : ${params.subject}

**Envoyé le** : ${new Date(result.sentAt).toLocaleString("fr-FR")}

${tag ? `**Contexte** : ${tag}\n` : ""}

---

${params.body}
`;
  await fs.writeFile(absPath, content, "utf-8");
  return filename;
}
