/**
 * Store JSON de l'agente e-commerce (Emma) — historique des vidéos générées
 * et catalogue local des produits (photo + ids Arcads).
 * Fichier : {repo}/ecommerce-videos/store.json — versionnable, lisible à la main.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "@/lib/paths";

export const ECOM_DIR = path.join(REPO_ROOT, "ecommerce-videos");
const STORE_FILE = path.join(ECOM_DIR, "store.json");

export interface EcomProduct {
  arcadsId: string;
  name: string;
  description?: string;
  /** URL locale de la photo (servie par /api/ecommerce/photo/...) */
  photoUrl?: string;
  /** filePath S3 Arcads de la photo (réutilisé pour les générations suivantes) */
  arcadsImagePath?: string;
  createdAt: string;
}

export interface EcomVideo {
  id: string; // id local
  kind: "avatar" | "showcase";
  /** Canal utilisé pour la génération : MCP (OAuth) ou API externe (clés). */
  backend?: "mcp" | "api";
  arcadsId: string; // id talking-actor ou asset
  title: string;
  productArcadsId: string;
  productName: string;
  script?: string;
  prompt?: string;
  actorName?: string;
  actorImageUrl?: string;
  aspectRatio?: string;
  status: "processing" | "completed" | "failed";
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: string;
  /** Programmation dans le calendrier éditorial */
  scheduled?: { day: string; time: string; channel: "Instagram"; caption?: string };
}

interface EcomStore {
  products: EcomProduct[];
  videos: EcomVideo[];
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(path.join(ECOM_DIR, "photos"), { recursive: true });
}

export async function readStore(): Promise<EcomStore> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const data = JSON.parse(raw) as EcomStore;
    return { products: data.products ?? [], videos: data.videos ?? [] };
  } catch {
    return { products: [], videos: [] };
  }
}

export async function writeStore(store: EcomStore): Promise<void> {
  await ensureDir();
  // écriture atomique : on écrit dans un tmp puis on renomme (évite un fichier
  // tronqué si deux écritures se chevauchent)
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, STORE_FILE);
}

/**
 * Verrou d'écriture : toute mutation lit → modifie → écrit SOUS le verrou,
 * en série. Sans ça, deux requêtes concurrentes (ex. le polling de
 * l'historique pendant une génération) lisent la même version et la dernière
 * écriture écrase l'autre → des vidéos disparaissaient de l'historique.
 */
let writeLock: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (store: EcomStore) => T | Promise<T>): Promise<T> {
  const run = writeLock.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });
  // le prochain mutate attend celui-ci (qu'il réussisse ou échoue)
  writeLock = run.catch(() => undefined);
  return run;
}

export async function upsertProduct(p: EcomProduct): Promise<void> {
  await mutate((store) => {
    const i = store.products.findIndex((x) => x.arcadsId === p.arcadsId);
    if (i >= 0) store.products[i] = { ...store.products[i], ...p };
    else store.products.unshift(p);
  });
}

/** Remplace l'identifiant d'un produit (migration local → produit Arcads réel). */
export async function replaceProductId(oldId: string, newId: string): Promise<void> {
  await mutate((store) => {
    const p = store.products.find((x) => x.arcadsId === oldId);
    if (p) p.arcadsId = newId;
    for (const v of store.videos) {
      if (v.productArcadsId === oldId) v.productArcadsId = newId;
    }
  });
}

export async function deleteVideo(id: string): Promise<boolean> {
  return mutate((store) => {
    const before = store.videos.length;
    store.videos = store.videos.filter((v) => v.id !== id);
    return store.videos.length < before;
  });
}

export async function deleteProduct(arcadsId: string): Promise<void> {
  await mutate((store) => {
    store.products = store.products.filter((p) => p.arcadsId !== arcadsId);
  });
}

export async function addVideo(v: EcomVideo): Promise<void> {
  await mutate((store) => {
    store.videos.unshift(v);
  });
}

export async function updateVideo(id: string, patch: Partial<EcomVideo>): Promise<EcomVideo | null> {
  return mutate((store) => {
    const i = store.videos.findIndex((x) => x.id === id);
    if (i < 0) return null;
    store.videos[i] = { ...store.videos[i], ...patch };
    return store.videos[i];
  });
}

/** Enregistre une photo produit en local et renvoie son URL de service. */
export async function savePhoto(buffer: Buffer, ext: string): Promise<string> {
  await ensureDir();
  const name = `photo-${Date.now()}.${ext.replace(/[^a-z0-9]/gi, "") || "png"}`;
  await fs.writeFile(path.join(ECOM_DIR, "photos", name), new Uint8Array(buffer));
  return `/api/ecommerce/photo/${name}`;
}

export async function readPhoto(name: string): Promise<Buffer | null> {
  // protège contre les traversées de chemin
  if (!/^[a-z0-9.-]+$/i.test(name)) return null;
  try {
    return await fs.readFile(path.join(ECOM_DIR, "photos", name));
  } catch {
    return null;
  }
}
