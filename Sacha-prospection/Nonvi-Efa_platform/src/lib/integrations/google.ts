import fs from "node:fs/promises";
import path from "node:path";

/**
 * Google OAuth 2.0 — natif, pas de SDK tiers.
 *
 * Flow :
 *   1. User → /api/integrations/google/start → redirect vers Google consent
 *   2. Google → /api/integrations/google/callback?code=xxx → exchange code → tokens
 *   3. Tokens persistés dans src/data/google-tokens.json (gitignore)
 *   4. getValidAccessToken() rafraîchit automatiquement si expiré
 */

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope: string;
  token_type: string;
  id_token?: string;
}

const TOKENS_FILE = path.join(process.cwd(), "src", "data", "google-tokens.json");

// Scopes nécessaires pour YouTube + Gmail + Drive (union — un seul consent)
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send", // envoi d'emails
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

export function buildAuthUrl(state?: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent"); // force refresh_token retour
  url.searchParams.set("include_granted_scopes", "true");
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange ${res.status} : ${body}`);
  }

  const data = await res.json();
  const now = Date.now();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: now + (data.expires_in ?? 3600) * 1000 - 60_000, // marge 1 min
    scope: data.scope,
    token_type: data.token_type,
    id_token: data.id_token,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<Partial<GoogleTokens>> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google refresh ${res.status} : ${body}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
    scope: data.scope,
    token_type: data.token_type,
  };
}

export async function saveTokens(tokens: GoogleTokens): Promise<void> {
  await fs.mkdir(path.dirname(TOKENS_FILE), { recursive: true });
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

export async function loadTokens(): Promise<GoogleTokens | null> {
  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf-8");
    return JSON.parse(raw) as GoogleTokens;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error(
      "Aucun token Google enregistré. Connectez-vous via /api/integrations/google/start."
    );
  }

  const now = Date.now();
  if (tokens.expires_at > now) {
    return tokens.access_token;
  }

  // Refresh
  if (!tokens.refresh_token) {
    throw new Error("Token Google expiré et pas de refresh_token. Reconnectez-vous.");
  }

  const refreshed = await refreshAccessToken(tokens.refresh_token);
  const merged: GoogleTokens = {
    ...tokens,
    access_token: refreshed.access_token!,
    expires_at: refreshed.expires_at!,
    scope: refreshed.scope ?? tokens.scope,
  };
  await saveTokens(merged);
  return merged.access_token;
}

export async function getGoogleStatus(): Promise<{
  connected: boolean;
  email?: string;
  scopes?: string[];
  connectedAt?: string;
}> {
  const tokens = await loadTokens();
  if (!tokens) return { connected: false };
  let email: string | undefined;
  try {
    const token = await getValidAccessToken();
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      email = data.email;
    }
  } catch {
    // ignore
  }
  try {
    const stat = await fs.stat(TOKENS_FILE);
    return {
      connected: true,
      email,
      scopes: tokens.scope?.split(" "),
      connectedAt: stat.mtime.toISOString(),
    };
  } catch {
    return { connected: true, email };
  }
}
