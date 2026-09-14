import { getValidAccessToken } from "./google";
import type { MockEmail } from "@/data/mockInbox";

/**
 * Client Gmail natif — API REST Google directe.
 * Doc : https://developers.google.com/gmail/api/reference/rest/v1/users.messages
 */

interface GmailMessageMetadata {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string; // epoch ms en string
  payload?: {
    headers?: { name: string; value: string }[];
    parts?: { body?: { data?: string }; mimeType?: string }[];
    body?: { data?: string };
    mimeType?: string;
  };
}

async function gmailGet<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API ${res.status} (${path}) : ${body.slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}

function decodeBase64UrlSafe(input: string): string {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  try {
    return Buffer.from(s + pad, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractBody(payload: GmailMessageMetadata["payload"]): string {
  if (!payload) return "";
  // 1) Body direct
  if (payload.body?.data) return decodeBase64UrlSafe(payload.body.data);
  // 2) Parts : on cherche un text/plain d'abord, sinon text/html
  const parts = payload.parts ?? [];
  const plain = parts.find((p) => p.mimeType === "text/plain" && p.body?.data);
  if (plain?.body?.data) return decodeBase64UrlSafe(plain.body.data);
  const html = parts.find((p) => p.mimeType === "text/html" && p.body?.data);
  if (html?.body?.data) {
    const raw = decodeBase64UrlSafe(html.body.data);
    // strip HTML basique
    return raw
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1500);
  }
  return "";
}

function parseFromHeader(value?: string): { name: string; email: string } {
  if (!value) return { name: "?", email: "?" };
  const m = value.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: value, email: value };
}

function categorize(labels: string[] | undefined, subject: string, from: string): MockEmail["category"] {
  const all = (labels ?? []).join(",").toLowerCase();
  if (all.includes("category_personal") || all.includes("personal")) return "admin";
  if (all.includes("category_promotions") || all.includes("promotions")) return "newsletter";
  if (all.includes("category_updates")) return "admin";
  if (all.includes("category_forums")) return "newsletter";
  const s = (subject + " " + from).toLowerCase();
  if (s.includes("newsletter") || s.includes("digest") || s.includes("linkedin")) return "newsletter";
  if (s.includes("urssaf") || s.includes("facture") || s.includes("impot")) return "admin";
  return "client"; // default pour le reste
}

function detectUrgency(subject: string, body: string, labels?: string[]): MockEmail["urgency"] {
  const combined = (subject + " " + body).toLowerCase();
  if (labels?.includes("IMPORTANT") || labels?.includes("STARRED")) return "high";
  if (/urgent|asap|critical|bloquant|avant \d|deadline/.test(combined)) return "high";
  if (/demande|question|call|meeting|rdv|rendez|devis|propos/.test(combined)) return "medium";
  return "low";
}

export async function fetchGmailInbox(maxResults = 20): Promise<MockEmail[]> {
  // Étape 1 : liste des IDs (boîte principale, non lus prioritaires + récents)
  const listResp = await gmailGet<{ messages?: { id: string }[] }>(
    `/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent("in:inbox newer_than:14d")}`
  );
  const ids = (listResp.messages ?? []).map((m) => m.id);
  if (ids.length === 0) return [];

  // Étape 2 : détails en parallèle
  // Type explicite : sans lui, `starred` est inféré requis (boolean | undefined)
  // alors qu'il est optionnel dans MockEmail → le prédicat du .filter() plus bas
  // devient invalide et le build de production échoue.
  const results: (MockEmail | null)[] = await Promise.all(
    ids.map(async (id): Promise<MockEmail | null> => {
      try {
        const msg = await gmailGet<GmailMessageMetadata>(
          `/users/me/messages/${id}?format=full`
        );
        const headers = msg.payload?.headers ?? [];
        const fromHdr = headers.find((h) => h.name.toLowerCase() === "from")?.value;
        const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value ?? "(sans objet)";
        const dateHdr = headers.find((h) => h.name.toLowerCase() === "date")?.value;
        const from = parseFromHeader(fromHdr);
        const body = extractBody(msg.payload).slice(0, 1200);
        const receivedAt = msg.internalDate
          ? new Date(parseInt(msg.internalDate, 10)).toISOString()
          : dateHdr
          ? new Date(dateHdr).toISOString()
          : new Date().toISOString();

        const preview = (msg.snippet ?? body).slice(0, 220);
        const category = categorize(msg.labelIds, subject, from.email);
        const urgency = detectUrgency(subject, body, msg.labelIds);
        const requiresReply = category !== "newsletter" && urgency !== "low";
        const starred = msg.labelIds?.includes("STARRED");

        return {
          id: msg.id,
          from: from.name,
          fromEmail: from.email,
          subject,
          receivedAt,
          preview,
          body,
          category,
          urgency,
          requiresReply,
          starred,
        } satisfies MockEmail;
      } catch {
        return null;
      }
    })
  );

  return results.filter((m): m is MockEmail => m !== null);
}
