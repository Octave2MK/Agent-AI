/**
 * Store JSON de l'agent veille (Nina) — les Reels Instagram récupérés.
 * Fichier : {repo}/veille/store.json.
 * Même pattern que prospection/ecommerce : verrou d'écriture + écriture
 * atomique, pour ne pas perdre de posts quand deux requêtes écrivent en
 * même temps (ex. transcription pendant un scraping).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "@/lib/paths";

export const VEILLE_DIR = path.join(REPO_ROOT, "veille");
const STORE_FILE = path.join(VEILLE_DIR, "store.json");

export interface VeillePost {
  id: string;
  shortCode: string;
  url: string;
  hashtag: string;
  caption: string;
  hashtags: string[];
  /** vues — classement principal */
  views: number;
  /** likes — -1 signifie « masqué par Instagram » */
  likes: number;
  comments: number;
  shares: number;
  /** (likes + commentaires + partages) / vues × 100 */
  engagementRate: number;
  /** marché deviné d'après la langue de la légende : fr | en | autre */
  market: string;
  authorFollowers?: number;
  /** requête qui a fait remonter ce reel */
  query: string;
  durationSec?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  author: string;
  authorName?: string;
  music?: string;
  postedAt?: string;
  /** script parlé, extrait par transcription */
  script?: string;
  scriptStatus: "absent" | "en-cours" | "ok" | "erreur";
  scriptError?: string;
  /** traduction française du script (si l'original n'est pas en FR) */
  scriptFr?: string;
  /** short illustré (schémas animés) généré à partir du script — MP4 9:16 */
  shortStatus?: "absent" | "en-cours" | "ok" | "erreur";
  shortUrl?: string;
  shortError?: string;
  scrapedAt: string;
}

interface VeilleStore {
  posts: VeillePost[];
}

export async function readPosts(): Promise<VeillePost[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return (JSON.parse(raw) as VeilleStore).posts ?? [];
  } catch {
    return [];
  }
}

async function writePosts(posts: VeillePost[]): Promise<void> {
  await fs.mkdir(VEILLE_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ posts }, null, 2), "utf-8");
  await fs.rename(tmp, STORE_FILE);
}

let writeLock: Promise<unknown> = Promise.resolve();
function mutate<T>(
  fn: (posts: VeillePost[]) => { posts: VeillePost[]; result: T }
): Promise<T> {
  const run = writeLock.then(async () => {
    const current = await readPosts();
    const { posts, result } = fn(current);
    await writePosts(posts);
    return result;
  });
  writeLock = run.catch(() => undefined);
  return run;
}

/** Ajoute les nouveaux posts, met à jour les métriques de ceux déjà connus. */
export async function upsertPosts(fresh: VeillePost[]): Promise<number> {
  return mutate((posts) => {
    const byCode = new Map(posts.map((p) => [p.shortCode, p]));
    let added = 0;
    for (const f of fresh) {
      const known = byCode.get(f.shortCode);
      if (known) {
        // on rafraîchit les compteurs mais on garde le script déjà transcrit
        Object.assign(known, {
          views: f.views,
          likes: f.likes,
          comments: f.comments,
          shares: f.shares,
          engagementRate: f.engagementRate,
          thumbnailUrl: f.thumbnailUrl,
          videoUrl: f.videoUrl,
          scrapedAt: f.scrapedAt,
        });
      } else {
        posts.unshift(f);
        added++;
      }
    }
    posts.sort((a, b) => b.views - a.views);
    return { posts, result: added };
  });
}

export async function updatePost(
  id: string,
  patch: Partial<VeillePost>
): Promise<VeillePost | null> {
  return mutate((posts) => {
    const i = posts.findIndex((p) => p.id === id);
    if (i < 0) return { posts, result: null };
    posts[i] = { ...posts[i], ...patch };
    return { posts, result: posts[i] };
  });
}

export async function deletePost(id: string): Promise<boolean> {
  return mutate((posts) => {
    const next = posts.filter((p) => p.id !== id);
    return { posts: next, result: next.length < posts.length };
  });
}

export async function clearHashtag(hashtag: string): Promise<number> {
  return mutate((posts) => {
    const next = posts.filter((p) => p.hashtag !== hashtag);
    return { posts: next, result: posts.length - next.length };
  });
}
