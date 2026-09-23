/**
 * Store JSON des posts créés par Léa (agent contenu).
 * Fichier : content/store.json à la racine du repo.
 * Persiste les générations (on garde la session précédente) + programmation.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "@/lib/paths";
import type { ContentResult, Platform, Format } from "./generate";
import type { T1Content } from "./type1";

const DIR = path.join(REPO_ROOT, "content");
const STORE = path.join(DIR, "store.json");

export interface SlideJob { index: number; jobId: string }
export interface ContentPost {
  id: string;
  platform: Platform;
  format: Format;
  idea: string;
  template?: string; // nom DA (aperçu texte)
  refId?: string; // template de référence choisi (li-3, ig-type2…)
  tools?: string[]; // logos/outils du sujet (champ dédié)
  t1?: T1Content; // contenu structuré pour rendu hybride Type 1
  result: ContentResult;
  visuals?: { jobs: SlideJob[]; images: (string | null)[]; done: boolean };
  status: "draft" | "scheduled" | "posted";
  schedule?: { at: string } | null;
  createdAt: string;
}

interface Store { posts: ContentPost[] }

async function read(): Promise<Store> {
  try { return JSON.parse(await fs.readFile(STORE, "utf-8")) as Store; }
  catch { return { posts: [] }; }
}
async function write(s: Store): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(s, null, 2), "utf-8");
}

export async function listPosts(): Promise<ContentPost[]> {
  const s = await read();
  return s.posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getPost(id: string): Promise<ContentPost | null> {
  const s = await read();
  return s.posts.find((p) => p.id === id) ?? null;
}

export async function addPost(p: Omit<ContentPost, "id" | "createdAt" | "status">): Promise<ContentPost> {
  const s = await read();
  const post: ContentPost = { ...p, id: `post-${Date.now().toString(36)}`, status: "draft", createdAt: new Date().toISOString() };
  s.posts.unshift(post);
  await write(s);
  return post;
}

export async function updatePost(id: string, patch: Partial<ContentPost>): Promise<ContentPost | null> {
  const s = await read();
  const i = s.posts.findIndex((p) => p.id === id);
  if (i < 0) return null;
  s.posts[i] = { ...s.posts[i], ...patch };
  await write(s);
  return s.posts[i];
}

export async function deletePost(id: string): Promise<void> {
  const s = await read();
  s.posts = s.posts.filter((p) => p.id !== id);
  await write(s);
}
