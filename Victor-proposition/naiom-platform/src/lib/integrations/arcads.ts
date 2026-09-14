/**
 * Client API Arcads (https://external-api.arcads.ai) — génération de vidéos
 * produit pour l'agente e-commerce (Emma).
 *
 * Auth : Basic (Client ID + Client Secret), à générer dans Arcads →
 * Settings → Public API, puis à poser dans .env.local :
 *   ARCADS_CLIENT_ID=...
 *   ARCADS_CLIENT_SECRET=...
 *
 * Deux modes de génération :
 *  - "avatar"   : un avatar IA présente le produit (POST /v2/talking-actors/generate)
 *  - "showcase" : mise en scène du produit à partir d'une photo
 *                 (POST /v1/presets/product-showcase/generate)
 */

const BASE = "https://external-api.arcads.ai";

export class ArcadsConfigError extends Error {
  constructor() {
    super(
      "Arcads n'est pas configuré : ajoutez ARCADS_CLIENT_ID et ARCADS_CLIENT_SECRET dans naiom-platform/.env.local (Arcads → Settings → Public API → Generate credentials), puis relancez le serveur."
    );
    this.name = "ArcadsConfigError";
  }
}

export function arcadsConfigured(): boolean {
  return Boolean(process.env.ARCADS_CLIENT_ID && process.env.ARCADS_CLIENT_SECRET);
}

function authHeader(): string {
  if (!arcadsConfigured()) throw new ArcadsConfigError();
  const raw = `${process.env.ARCADS_CLIENT_ID}:${process.env.ARCADS_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function api<T = unknown>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | number | undefined> }
): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(init?.searchParams ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Arcads ${init?.method ?? "GET"} ${path} → ${res.status} : ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================= Types (sous-ensemble utile de l'OpenAPI) ================= */

export interface ArcadsProduct {
  id: string;
  name: string;
  description?: string;
}

export interface ArcadsActor {
  id: string;
  name: string;
  gender: "Female" | "Male";
  age: "Young Adult" | "Adult" | "Senior";
  skinTone?: string;
  freeSpeech?: boolean;
  imageUrl: string;
}

export interface ArcadsSituation {
  id: string;
  actorId?: string;
  actor?: ArcadsActor | null;
  previewUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface ArcadsAsset {
  id: string;
  type?: string;
  url?: string;
  sdUrl?: string;
  thumbnailUrl?: string;
  status?: "created" | "pending" | "generated" | "failed" | "uploaded";
  error?: string;
}

export interface TalkingActorStatus {
  id: string;
  status: "processing" | "completed" | "failed";
  error?: string;
}

/* ================= Produits ================= */

export async function listProducts(): Promise<ArcadsProduct[]> {
  const res = await api<{ items?: ArcadsProduct[] } | ArcadsProduct[]>("/v1/products", {
    searchParams: { pageSize: 50 },
  });
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function createProduct(name: string, description?: string): Promise<ArcadsProduct> {
  return api<ArcadsProduct>("/v1/products", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

/* ================= Acteurs / avatars ================= */

export async function listActors(filters?: {
  gender?: string;
  age?: string;
  pageSize?: number;
}): Promise<ArcadsActor[]> {
  const res = await api<{ items?: ArcadsActor[] }>("/v1/actors", {
    searchParams: {
      pageSize: filters?.pageSize ?? 24,
      gender: filters?.gender,
      age: filters?.age,
      freeSpeech: "true", // requis pour lire un script libre
    },
  });
  return res.items ?? [];
}

/** Situations disponibles pour un acteur (une situation = décor + cadrage). */
export async function actorSituations(actorId: string): Promise<ArcadsSituation[]> {
  const res = await api<{ items?: ArcadsSituation[] } | ArcadsSituation[]>(
    `/v1/actors/${actorId}/situations`
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

/** Templates du preset Product Showcase (ambiances de mise en scène). */
export async function showcaseTemplates(): Promise<ArcadsSituation[]> {
  const res = await api<{ items?: ArcadsSituation[] } | ArcadsSituation[]>(
    "/v1/presets/product-showcase/templates"
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

/* ================= Upload de photo produit ================= */

/** Upload une image et renvoie son filePath Arcads (S3), à passer en referenceImages. */
export async function uploadImage(buffer: Buffer, mime: string): Promise<{ filePath: string }> {
  const presign = await api<{ presignedUrl: string; filePath: string }>(
    "/v1/file-upload/get-presigned-url",
    { method: "POST", body: JSON.stringify({ fileType: mime }) }
  );
  const put = await fetch(presign.presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: new Uint8Array(buffer),
  });
  if (!put.ok) throw new Error(`Upload S3 Arcads → ${put.status}`);
  return { filePath: presign.filePath };
}

/* ================= Génération ================= */

/** Mode "avatar" : un avatar IA lit le script devant la caméra. */
export async function generateTalkingActor(params: {
  productId: string;
  script: string;
  situationId: string;
}): Promise<{ id: string }> {
  const res = await api<Array<{ id: string; status: string }>>("/v2/talking-actors/generate", {
    method: "POST",
    body: JSON.stringify({
      model: "arcads_1.0",
      productId: params.productId,
      script: params.script,
      actors: [{ situationId: params.situationId }],
      autoAddScriptEmotion: true,
    }),
  });
  const first = Array.isArray(res) ? res[0] : (res as { id?: string });
  if (!first?.id) throw new Error("Arcads n'a pas renvoyé d'identifiant de génération.");
  return { id: first.id };
}

export async function talkingActorStatus(id: string): Promise<TalkingActorStatus> {
  return api<TalkingActorStatus>(`/v2/talking-actors/${id}`);
}

export async function talkingActorWatchUrl(id: string): Promise<string | undefined> {
  const res = await api<{ url?: string; watchUrl?: string } | string>(
    `/v2/talking-actors/${id}/watch`
  );
  if (typeof res === "string") return res;
  return res.url ?? res.watchUrl;
}

/** Mode "showcase" : mise en scène vidéo du produit à partir de sa photo. */
export async function generateProductShowcase(params: {
  productId: string;
  situationId: string;
  referenceImagePath: string;
  prompt: string;
  aspectRatio?: "9:16" | "1:1" | "16:9" | "4:3" | "3:4";
}): Promise<{ id: string }> {
  const res = await api<ArcadsAsset | ArcadsAsset[] | { id?: string; assetId?: string }>(
    "/v1/presets/product-showcase/generate",
    {
      method: "POST",
      body: JSON.stringify({
        productId: params.productId,
        situationId: params.situationId,
        referenceImages: [params.referenceImagePath],
        prompt: params.prompt,
        aspectRatio: params.aspectRatio ?? "9:16",
      }),
    }
  );
  const obj = Array.isArray(res) ? res[0] : res;
  const id = (obj as { id?: string; assetId?: string })?.id ?? (obj as { assetId?: string })?.assetId;
  if (!id) throw new Error("Arcads n'a pas renvoyé d'identifiant d'asset showcase.");
  return { id };
}

export async function getAsset(id: string): Promise<ArcadsAsset> {
  return api<ArcadsAsset>(`/v1/assets/${id}`);
}

export async function assetWatchUrl(id: string): Promise<string | undefined> {
  const res = await api<{ url?: string; watchUrl?: string } | string>(`/v1/assets/${id}/watch`);
  if (typeof res === "string") return res;
  return res.url ?? res.watchUrl;
}
