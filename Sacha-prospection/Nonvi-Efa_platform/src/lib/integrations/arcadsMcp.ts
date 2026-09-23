/**
 * Client MCP Arcads (https://mcp.arcads.ai) — OAuth 2.0 + JSON-RPC.
 *
 * Arcads n'expose pas de clés API statiques : on se connecte comme depuis
 * l'appli, en OAuth (enregistrement dynamique du client + PKCE + refresh).
 * Flow identique à l'intégration Google de la plateforme :
 *   1. /api/integrations/arcads/start    → écran de connexion Arcads
 *   2. /api/integrations/arcads/callback → échange code → tokens persistés
 *   3. getValidAccessToken() rafraîchit automatiquement
 *
 * Ensuite, chaque fonction appelle un outil MCP (tools/call) sur
 * https://mcp.arcads.ai en Streamable HTTP (réponses JSON ou SSE).
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const MCP_URL = "https://mcp.arcads.ai";
const OAUTH_BASE = "https://api.arcads.ai";
const SCOPES = "mcp offline_access";
const AUTH_FILE = path.join(process.cwd(), "src", "data", "arcads-tokens.json");

interface ArcadsAuth {
  client_id?: string;
  redirect_uri?: string;
  pending?: { state: string; verifier: string };
  tokens?: { access_token: string; refresh_token?: string; expires_at: number };
}

/* ================= Persistance ================= */

async function readAuth(): Promise<ArcadsAuth> {
  try {
    return JSON.parse(await fs.readFile(AUTH_FILE, "utf-8")) as ArcadsAuth;
  } catch {
    return {};
  }
}

async function writeAuth(auth: ArcadsAuth): Promise<void> {
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(auth, null, 2), "utf-8");
}

export async function isArcadsMcpConnected(): Promise<boolean> {
  const auth = await readAuth();
  return Boolean(auth.tokens?.access_token);
}

export async function disconnectArcadsMcp(): Promise<void> {
  const auth = await readAuth();
  delete auth.tokens;
  delete auth.pending;
  await writeAuth(auth);
}

/* ================= OAuth ================= */

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Enregistre (une fois) la plateforme comme client OAuth public chez Arcads. */
async function ensureClient(redirectUri: string): Promise<{ client_id: string }> {
  const auth = await readAuth();
  if (auth.client_id && auth.redirect_uri === redirectUri) return { client_id: auth.client_id };

  const res = await fetch(`${OAUTH_BASE}/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Nonvi-Efa Platform",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: SCOPES,
    }),
  });
  if (!res.ok) throw new Error(`Arcads OAuth register → ${res.status} : ${await res.text()}`);
  const data = (await res.json()) as { client_id: string };
  auth.client_id = data.client_id;
  auth.redirect_uri = redirectUri;
  await writeAuth(auth);
  return { client_id: data.client_id };
}

/** Construit l'URL de connexion Arcads (PKCE S256) et mémorise state+verifier. */
export async function buildArcadsAuthUrl(origin: string): Promise<string> {
  const redirectUri = `${origin}/api/integrations/arcads/callback`;
  const { client_id } = await ensureClient(redirectUri);

  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = b64url(crypto.randomBytes(24));

  const auth = await readAuth();
  auth.pending = { state, verifier };
  await writeAuth(auth);

  const url = new URL(`${OAUTH_BASE}/oauth/authorize`);
  url.searchParams.set("client_id", client_id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** Callback OAuth : échange le code contre les tokens. */
export async function handleArcadsCallback(code: string, state: string): Promise<void> {
  const auth = await readAuth();
  if (!auth.pending || auth.pending.state !== state) {
    throw new Error("State OAuth invalide — relancez la connexion.");
  }
  if (!auth.client_id || !auth.redirect_uri) throw new Error("Client OAuth non enregistré.");

  const res = await fetch(`${OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: auth.redirect_uri,
      client_id: auth.client_id,
      code_verifier: auth.pending.verifier,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Arcads token exchange → ${res.status} : ${await res.text()}`);
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  auth.tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };
  delete auth.pending;
  await writeAuth(auth);
}

async function getValidAccessToken(): Promise<string> {
  const auth = await readAuth();
  if (!auth.tokens) throw new Error("Arcads non connecté — cliquez sur « Connecter Arcads ».");
  if (Date.now() < auth.tokens.expires_at) return auth.tokens.access_token;

  if (!auth.tokens.refresh_token || !auth.client_id) {
    throw new Error("Session Arcads expirée — reconnectez-vous.");
  }
  const res = await fetch(`${OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: auth.tokens.refresh_token,
      client_id: auth.client_id,
    }).toString(),
  });
  if (!res.ok) {
    // refresh mort → on force la reconnexion
    await disconnectArcadsMcp();
    throw new Error("Session Arcads expirée — reconnectez-vous.");
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  auth.tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? auth.tokens.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };
  await writeAuth(auth);
  return auth.tokens.access_token;
}

/* ================= JSON-RPC / Streamable HTTP ================= */

let rpcId = 1;

async function mcpPost(
  token: string,
  body: unknown,
  sessionId?: string
): Promise<{ json: unknown; sessionId?: string }> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  const newSession = res.headers.get("mcp-session-id") ?? sessionId;
  const ctype = res.headers.get("content-type") ?? "";
  if (!res.ok) throw new Error(`Arcads MCP → ${res.status} : ${(await res.text()).slice(0, 300)}`);
  if (res.status === 202) return { json: null, sessionId: newSession }; // notification

  const text = await res.text();
  if (ctype.includes("text/event-stream")) {
    // SSE : on prend le dernier message JSON-RPC complet
    const datas = text
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .filter(Boolean);
    for (let i = datas.length - 1; i >= 0; i--) {
      try {
        return { json: JSON.parse(datas[i]), sessionId: newSession };
      } catch {
        /* fragment non-JSON → on remonte */
      }
    }
    throw new Error("Réponse SSE Arcads illisible.");
  }
  return { json: text ? JSON.parse(text) : null, sessionId: newSession };
}

interface McpToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
}

/** Appelle un outil MCP Arcads et renvoie son résultat (texte + structuré). */
export async function mcpCallTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ text: string; structured?: unknown }> {
  const token = await getValidAccessToken();

  // 1. initialize (ouvre une session)
  const init = await mcpPost(token, {
    jsonrpc: "2.0",
    id: rpcId++,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "Nonvi-Efa-platform", version: "1.0.0" },
    },
  });
  const session = init.sessionId;

  // 2. notifications/initialized (certains serveurs l'exigent)
  await mcpPost(token, { jsonrpc: "2.0", method: "notifications/initialized" }, session).catch(
    () => undefined
  );

  // 3. tools/call
  const call = await mcpPost(
    token,
    { jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name, arguments: args } },
    session
  );
  const rpc = call.json as { result?: McpToolResult; error?: { message: string } };
  if (rpc?.error) throw new Error(`Arcads ${name} : ${rpc.error.message}`);
  const result = rpc?.result;
  if (result?.isError) {
    const msg = result.content?.map((c) => c.text).join(" ") ?? "erreur outil";
    throw new Error(`Arcads ${name} : ${msg.slice(0, 300)}`);
  }
  const text = result?.content?.map((c) => c.text ?? "").join("\n") ?? "";
  return { text, structured: result?.structuredContent };
}

/* ================= Helpers de parsing ================= */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function parseJsonLoose<T>(text: string): T | null {
  // le texte peut contenir du JSON pur ou un bloc ```json ... ```
  const stripped = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const start = stripped.indexOf("{");
    const startArr = stripped.indexOf("[");
    const i = startArr >= 0 && (startArr < start || start < 0) ? startArr : start;
    if (i >= 0) {
      try {
        return JSON.parse(stripped.slice(i)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/* ================= API externe avec le token OAuth =================
   Le Bearer OAuth est aussi accepté par https://external-api.arcads.ai —
   ça débloque ce que le MCP n'expose pas (création de produit, voix). */

const EXTERNAL_API = "https://external-api.arcads.ai";

async function bearerFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${EXTERNAL_API}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Arcads API ${pathname} → ${res.status} : ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

/** Crée un VRAI produit dans le workspace Arcads (via le token OAuth). */
export async function bearerCreateProduct(
  name: string,
  description?: string
): Promise<{ id: string }> {
  return bearerFetch<{ id: string }>("/v1/products", {
    method: "POST",
    body: JSON.stringify({ name, ...(description ? { description } : {}) }),
  });
}

/** Supprime un produit du workspace Arcads (via le token OAuth). */
export async function bearerDeleteProduct(productId: string): Promise<void> {
  await bearerFetch(`/v1/products/${productId}`, { method: "DELETE" });
}

export interface ArcadsVoice {
  id: string;
  name: string;
  language?: string;
  audioUrl?: string;
}

/** Liste les voix « lisibles » du workspace (les clones nommés — ex. voix
    françaises Guillaume / Roland — pas les IDs bruts ElevenLabs). */
export async function bearerListVoices(): Promise<ArcadsVoice[]> {
  const out: ArcadsVoice[] = [];
  for (let page = 1; page <= 6; page++) {
    const d = await bearerFetch<{ items?: ArcadsVoice[]; count?: number }>(
      `/v1/voices?pageSize=100&page=${page}`
    );
    const items = d.items ?? [];
    out.push(...items);
    if (items.length < 100) break;
  }
  // garde les voix avec un vrai nom (pas un ID opaque de 20 caractères)
  const isOpaque = (n: string) => /^[A-Za-z0-9]{18,}$/.test(n) || /-.*-.*-.*-/.test(n);
  return out
    .filter((v) => v.name && !isOpaque(v.name.trim()))
    .map((v) => ({ id: v.id, name: v.name.trim(), language: v.language, audioUrl: v.audioUrl }));
}

/* ================= Fonctions haut niveau (mêmes formes que arcads.ts) ================= */

export interface McpProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export async function mcpListProducts(): Promise<McpProduct[]> {
  const { text, structured } = await mcpCallTool("arcads_list_products", {
    pageSize: 100,
    response_format: "json",
  });
  const data =
    (structured as { items?: McpProduct[]; products?: McpProduct[] } | undefined) ??
    parseJsonLoose<{ items?: McpProduct[]; products?: McpProduct[] } | McpProduct[]>(text);
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.products ?? [];
}

export interface McpSituation {
  id: string;
  actor?: { name?: string; gender?: string; age?: string; imageUrl?: string } | null;
  imageUrl?: string;
  previewUrl?: string;
  tags?: string[];
}

export async function mcpListSituations(params: {
  contentType?: string;
  actorGender?: "male" | "female";
  actorAge?: "adult" | "senior" | "young adult";
}): Promise<McpSituation[]> {
  const { text, structured } = await mcpCallTool("arcads_list_situations", {
    pageSize: 60,
    ...(params.contentType ? { contentType: params.contentType } : {}),
    ...(params.actorGender ? { actorGender: params.actorGender } : {}),
    ...(params.actorAge ? { actorAge: params.actorAge } : {}),
    ...(params.contentType === "talking_actor" || !params.contentType
      ? { actorFreeSpeech: true }
      : {}),
  });
  // la réponse est un JSON { total, page, situations: [...] }
  type Payload = { situations?: McpSituation[]; items?: McpSituation[] };
  const data =
    (structured as Payload | undefined) ?? parseJsonLoose<Payload | McpSituation[]>(text);
  if (Array.isArray(data)) return data;
  return data?.situations ?? data?.items ?? [];
}

/** Upload d'une image → filePath S3 Arcads. */
export async function mcpUploadImage(buffer: Buffer, mime: string): Promise<{ filePath: string }> {
  const { text, structured } = await mcpCallTool("arcads_get_upload_url", { mimeType: mime });
  const data =
    (structured as { presignedUrl?: string; filePath?: string } | undefined) ??
    parseJsonLoose<{ presignedUrl?: string; filePath?: string }>(text);
  const presignedUrl = data?.presignedUrl ?? text.match(/https:\/\/[^\s"')]+/)?.[0];
  const filePath = data?.filePath;
  if (!presignedUrl || !filePath) throw new Error("Upload Arcads : URL présignée introuvable.");
  const put = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: new Uint8Array(buffer),
  });
  if (!put.ok) throw new Error(`Upload S3 Arcads → ${put.status}`);
  return { filePath };
}

/** Enregistre une image uploadée comme asset d'un produit (best-effort). */
export async function mcpRegisterImage(imagePath: string, productId?: string): Promise<void> {
  await mcpCallTool("arcads_register_image", {
    imagePath,
    ...(productId ? { productId } : {}),
  }).catch(() => undefined);
}

/** Vidéo avatar (UGC) : l'acteur de la situation lit le script. → assetId */
export async function mcpAudioDriven(params: {
  productId?: string;
  situationId: string;
  script: string;
  voiceId?: string;
}): Promise<{ id: string }> {
  const { text, structured } = await mcpCallTool("arcads_audio_driven", {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.voiceId ? { voiceId: params.voiceId } : {}),
    situationId: params.situationId,
    script: params.script,
    autoAddScriptEmotion: true,
  });
  const id =
    (structured as { assetId?: string; id?: string } | undefined)?.assetId ??
    (structured as { id?: string } | undefined)?.id ??
    text.match(UUID_RE)?.[0];
  if (!id) throw new Error("Arcads n'a pas renvoyé d'identifiant d'asset.");
  return { id };
}

/** Vidéo showcase produit à partir de la photo. → assetId */
export async function mcpProductShowcase(params: {
  productId?: string;
  situationId: string;
  imagePath: string;
  prompt: string;
  aspectRatio?: "9:16" | "16:9";
}): Promise<{ id: string }> {
  const { text, structured } = await mcpCallTool("arcads_product_showcase", {
    ...(params.productId ? { productId: params.productId } : {}),
    situationId: params.situationId,
    imagePath: params.imagePath,
    prompt: params.prompt,
    aspectRatio: params.aspectRatio ?? "9:16",
  });
  const id =
    (structured as { assetId?: string; id?: string } | undefined)?.assetId ??
    (structured as { id?: string } | undefined)?.id ??
    text.match(UUID_RE)?.[0];
  if (!id) throw new Error("Arcads n'a pas renvoyé d'identifiant d'asset.");
  return { id };
}

/** Unboxing POV : la photo produit devient une vidéo d'unboxing réaliste. → assetId */
export async function mcpUnboxingPov(params: {
  productId?: string;
  situationId: string;
  imagePath: string;
}): Promise<{ id: string }> {
  const { text, structured } = await mcpCallTool("arcads_unboxing_pov", {
    ...(params.productId ? { productId: params.productId } : {}),
    situationId: params.situationId,
    imagePath: params.imagePath,
  });
  const id =
    (structured as { assetId?: string; id?: string } | undefined)?.assetId ??
    (structured as { id?: string } | undefined)?.id ??
    text.match(UUID_RE)?.[0];
  if (!id) throw new Error("Arcads n'a pas renvoyé d'identifiant d'asset.");
  return { id };
}

/** Statut + URL signée d'un asset. */
export async function mcpGetAsset(assetId: string): Promise<{
  status: "created" | "pending" | "generated" | "failed";
  downloadUrl?: string;
  error?: string;
}> {
  const { text, structured } = await mcpCallTool("arcads_get_asset", { assetId });
  const data =
    (structured as { status?: string; downloadUrl?: string; error?: string } | undefined) ??
    parseJsonLoose<{ status?: string; downloadUrl?: string; error?: string }>(text);
  let status = data?.status;
  let downloadUrl = data?.downloadUrl;
  if (!status) {
    const m = text.match(/\b(generated|failed|pending|created)\b/i);
    status = m?.[1]?.toLowerCase();
  }
  if (!downloadUrl) {
    downloadUrl = text.match(/https:\/\/[^\s"')`]+\.(mp4|mov|webm)[^\s"')`]*/i)?.[0];
  }
  return {
    status: (status as "created" | "pending" | "generated" | "failed") ?? "pending",
    downloadUrl,
    error: data?.error,
  };
}
