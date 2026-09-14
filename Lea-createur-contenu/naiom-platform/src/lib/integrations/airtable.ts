/**
 * Intégration Airtable pour l'agent Comptabilité (Chloé).
 * Deux bases :
 *   - FINANCES  (Revenus/Dépenses/Catégories/Rapports)  → AIRTABLE_BASE
 *   - CLIENTS   (Clients/Factures/Paiements)            → AIRTABLE_CLIENTS_BASE
 * Nécessite un Personal Access Token AIRTABLE_TOKEN (.env.local) avec les scopes
 * data.records:read + data.records:write + schema.bases:read sur ces bases.
 */

export const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || "appbPZA132gTrGjty";
export const AIRTABLE_CLIENTS_BASE = process.env.AIRTABLE_CLIENTS_BASE_ID || "apppsXvVrZiZHPXqN";
const API = "https://api.airtable.com/v0";

export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_TOKEN);
}

function token(): string {
  const t = process.env.AIRTABLE_TOKEN;
  if (!t) throw new Error("AIRTABLE_TOKEN absent — ajoute ton Personal Access Token Airtable dans .env.local.");
  return t;
}

async function at<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable ${res.status} : ${body.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

export interface AirtableField {
  id: string;
  name: string;
  type: string;
}
export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
}

/** Liste les tables + champs d'une base (Metadata API). */
export async function listTables(base = AIRTABLE_BASE): Promise<AirtableTable[]> {
  const j = await at<{ tables: AirtableTable[] }>(`/meta/bases/${base}/tables`);
  return j.tables ?? [];
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

/** Récupère tous les enregistrements d'une table (pagination gérée). */
export async function getRecords(
  tableIdOrName: string,
  opts: { base?: string; maxPages?: number } = {}
): Promise<AirtableRecord[]> {
  const base = opts.base ?? AIRTABLE_BASE;
  const maxPages = opts.maxPages ?? 10;
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const q = new URLSearchParams({ pageSize: "100" });
    if (offset) q.set("offset", offset);
    const j = await at<{ records: AirtableRecord[]; offset?: string }>(
      `/${base}/${encodeURIComponent(tableIdOrName)}?${q.toString()}`
    );
    out.push(...(j.records ?? []));
    if (!j.offset) break;
    offset = j.offset;
  }
  return out;
}

/** Récupère un enregistrement unique. */
export async function getRecord(tableId: string, recordId: string, base = AIRTABLE_CLIENTS_BASE): Promise<AirtableRecord> {
  return at<AirtableRecord>(`/${base}/${encodeURIComponent(tableId)}/${recordId}`);
}

/** Met à jour les champs d'un enregistrement (PATCH). */
export async function updateRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
  base = AIRTABLE_CLIENTS_BASE
): Promise<AirtableRecord> {
  return at<AirtableRecord>(`/${base}/${encodeURIComponent(tableId)}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

/** Somme d'un champ numérique sur une liste d'enregistrements. */
export function sumField(records: AirtableRecord[], field: string): number {
  return records.reduce((t, r) => {
    const v = r.fields[field];
    return t + (typeof v === "number" ? v : 0);
  }, 0);
}
