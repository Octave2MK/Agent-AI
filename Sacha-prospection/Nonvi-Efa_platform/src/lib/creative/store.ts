/**
 * Store JSON du Creative Strategist (Mia) : brand kit + créatives générées + programmation.
 * Fichier : creatives/store.json à la racine du repo.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "@/lib/paths";

const STORE = path.join(PATHS.creatives, "store.json");

export interface BrandKit {
  name: string;
  logoDataUrl: string | null; // data URL (petit logo)
  palette: string[]; // hex
  font: string; // ex. "Archivo", "Playfair Display"
  univers: string; // mood / direction artistique (ex. "minimaliste premium, lumière douce")
  notes: string; // interdictions, éléments obligatoires
  updatedAt: string;
}

export interface Creative {
  id: string;
  idea: string;
  format: string; // "1:1" | "9:16" | "16:9" | "4:5"
  prompt: string;
  negativePrompt?: string;
  status: "pending" | "done" | "error";
  imageUrl: string | null;
  thumbUrl: string | null;
  requestId?: string;
  statusUrl?: string | null;
  error?: string;
  createdAt: string;
  schedule?: { platform: string; at: string; status: "scheduled" | "posted" } | null;
}

export interface CreativeStore {
  brandKit: BrandKit;
  creatives: Creative[];
}

const DEFAULT_KIT: BrandKit = {
  name: "Nonvi-Efa",
  logoDataUrl: null,
  palette: ["#F5411C", "#5B4DEE", "#111111", "#FFFFFF"],
  font: "Archivo",
  univers: "",
  notes: "",
  updatedAt: new Date().toISOString(),
};

export async function readStore(): Promise<CreativeStore> {
  try {
    const raw = await fs.readFile(STORE, "utf-8");
    const j = JSON.parse(raw) as Partial<CreativeStore>;
    return { brandKit: { ...DEFAULT_KIT, ...(j.brandKit ?? {}) }, creatives: j.creatives ?? [] };
  } catch {
    return { brandKit: DEFAULT_KIT, creatives: [] };
  }
}

export async function writeStore(s: CreativeStore): Promise<void> {
  await fs.mkdir(PATHS.creatives, { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(s, null, 2), "utf-8");
}

export async function saveBrandKit(patch: Partial<BrandKit>): Promise<BrandKit> {
  const s = await readStore();
  s.brandKit = { ...s.brandKit, ...patch, updatedAt: new Date().toISOString() };
  await writeStore(s);
  return s.brandKit;
}

export async function addCreative(c: Creative): Promise<void> {
  const s = await readStore();
  s.creatives.unshift(c);
  await writeStore(s);
}

export async function updateCreative(id: string, patch: Partial<Creative>): Promise<Creative | null> {
  const s = await readStore();
  const i = s.creatives.findIndex((x) => x.id === id);
  if (i < 0) return null;
  s.creatives[i] = { ...s.creatives[i], ...patch };
  await writeStore(s);
  return s.creatives[i];
}
