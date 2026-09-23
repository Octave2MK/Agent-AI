/**
 * Client Apify — scraping pour l'agent prospection (Sacha / IAcquisition™).
 *
 * Auth : APIFY_TOKEN dans .env.local (Apify → Settings → Integrations → API token).
 * Acteur utilisé pour la DÉTECTION : compass/crawler-google-places
 * (Google Maps : nom, téléphone, site, note, nombre d'avis — par niche + ville).
 *
 * Le run est asynchrone : on démarre l'acteur, on poll son statut, puis on
 * lit les items du dataset.
 */

const BASE = "https://api.apify.com/v2";
// Acteur Google Maps officiel du store Apify
const GMAPS_ACTOR = "compass~crawler-google-places";

export function apifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) {
    throw new Error(
      "APIFY_TOKEN absent : créez un token sur console.apify.com (Settings → API & Integrations) et ajoutez APIFY_TOKEN=... dans Nonvi-Efa-platform/.env.local, puis relancez le serveur."
    );
  }
  return t;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${token()}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Apify ${path.split("?")[0]} → ${res.status} : ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

export interface GmapsPlace {
  title?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  categoryName?: string;
  url?: string; // fiche Google Maps
  emails?: string[];
  instagrams?: string[];
  linkedIns?: string[];
  facebooks?: string[];
}

/**
 * DÉTECTION : lance le scraper Google Maps sur « {niche} {ville} » et attend
 * le résultat (poll toutes les 5 s, ~4 min max).
 */
export async function detectLeads(params: {
  niche: string;
  ville: string;
  max?: number;
}): Promise<GmapsPlace[]> {
  const input = {
    searchStringsArray: [`${params.niche} ${params.ville}`],
    maxCrawledPlacesPerSearch: Math.min(params.max ?? 10, 300),
    language: "fr",
    skipClosedPlaces: true,
    // récupère emails + réseaux sociaux depuis le site web des fiches
    scrapeContacts: true,
    scrapeDirectEmailAndPhone: true,
  };

  // 1. démarre le run
  const run = await api<{ data: { id: string; defaultDatasetId: string } }>(
    `/acts/${GMAPS_ACTOR}/runs`,
    { method: "POST", body: JSON.stringify(input) }
  );
  const runId = run.data.id;

  // 2. poll jusqu'à la fin (jusqu'à ~9 min pour les gros volumes)
  const deadline = Date.now() + 9 * 60_000;
  let datasetId = run.data.defaultDatasetId;
  for (;;) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await api<{ data: { status: string; defaultDatasetId: string } }>(
      `/actor-runs/${runId}`
    );
    datasetId = st.data.defaultDatasetId ?? datasetId;
    if (st.data.status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(st.data.status)) {
      throw new Error(`Le scraping Apify a échoué (statut ${st.data.status}).`);
    }
    if (Date.now() > deadline) {
      // on abandonne le run pour ne pas consommer inutilement
      await api(`/actor-runs/${runId}/abort`, { method: "POST" }).catch(() => undefined);
      throw new Error("Scraping trop long — réduisez le nombre de résultats.");
    }
  }

  // 3. lit les résultats
  const items = await api<GmapsPlace[]>(`/datasets/${datasetId}/items?clean=true&limit=300`);
  return items;
}
