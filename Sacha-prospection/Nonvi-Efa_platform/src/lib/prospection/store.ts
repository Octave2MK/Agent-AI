/**
 * Store JSON de l'agent prospection (Sacha) — le pipeline IAcquisition™.
 * Fichier : {repo}/prospection/store.json.
 *
 * Statuts du pipeline : detecte (Ciblé) → enrichi (Profilé) → pret (Prêt) → contacte.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "@/lib/paths";

export const PROSPECTION_DIR = path.join(REPO_ROOT, "prospection");
const STORE_FILE = path.join(PROSPECTION_DIR, "store.json");

export type LeadStatus = "detecte" | "enrichi" | "pret" | "contacte";

export interface Lead {
  id: string;
  name: string;
  niche: string;
  ville: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  rating?: number;
  reviewsCount?: number;
  emails?: string[];
  /** Vrai si au moins un email a un domaine avec enregistrement MX (délivrable). */
  emailVerified?: boolean;
  socials?: string[];
  /** Résumé de ce qu'on sait (description du site, signaux) */
  insights?: string;
  status: LeadStatus;
  outreach?: {
    subject: string;
    email: string;
    linkedin: string;
    generatedAt: string;
  };
  createdAt: string;
  enrichedAt?: string;
  contactedAt?: string;
}

interface ProspectionStore {
  leads: Lead[];
}

export async function readLeads(): Promise<Lead[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return (JSON.parse(raw) as ProspectionStore).leads ?? [];
  } catch {
    return [];
  }
}

async function writeLeads(leads: Lead[]): Promise<void> {
  await fs.mkdir(PROSPECTION_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ leads }, null, 2), "utf-8");
  await fs.rename(tmp, STORE_FILE);
}

/** Verrou d'écriture (voir ecommerce/store.ts) : mutations en série pour ne
 *  pas perdre de leads quand plusieurs requêtes écrivent en même temps. */
let writeLock: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (leads: Lead[]) => { leads: Lead[]; result: T } | Promise<{ leads: Lead[]; result: T }>): Promise<T> {
  const run = writeLock.then(async () => {
    const current = await readLeads();
    const { leads, result } = await fn(current);
    await writeLeads(leads);
    return result;
  });
  writeLock = run.catch(() => undefined);
  return run;
}

export async function addLeads(newLeads: Lead[]): Promise<Lead[]> {
  return mutate((leads) => {
    // dédoublonnage par nom+ville (un même commerce peut ressortir deux fois)
    const seen = new Set(leads.map((l) => `${l.name.toLowerCase()}::${l.ville.toLowerCase()}`));
    const fresh = newLeads.filter(
      (l) => !seen.has(`${l.name.toLowerCase()}::${l.ville.toLowerCase()}`)
    );
    return { leads: [...fresh, ...leads], result: fresh };
  });
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null> {
  return mutate((leads) => {
    const i = leads.findIndex((l) => l.id === id);
    if (i < 0) return { leads, result: null };
    leads[i] = { ...leads[i], ...patch };
    return { leads, result: leads[i] };
  });
}

export async function deleteLead(id: string): Promise<boolean> {
  return mutate((leads) => {
    const next = leads.filter((l) => l.id !== id);
    return { leads: next, result: next.length < leads.length };
  });
}
