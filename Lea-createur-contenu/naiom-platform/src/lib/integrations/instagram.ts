/**
 * Veille Instagram — trouve les Reels les plus performants d'une niche,
 * puis transcrit leur bande son.
 *
 * SOURCE (choix issu de tests réels sur l'API Apify) :
 * On utilise la RECHERCHE Instagram (`instagram-search-reels`) et non le flux
 * hashtag (`instagram-hashtag-scraper`). Deux raisons mesurées :
 *   1. Le flux hashtag renvoie les posts RÉCENTS (échantillon faible et
 *      arbitraire) ; la recherche est classée par l'algorithme Instagram et
 *      remonte les gros performeurs (jusqu'au million de vues).
 *   2. Sur le flux hashtag, Instagram MASQUE les likes (`likesCount` = 0 / -1).
 *      Via la recherche, `like_count` est réel (ex. 32 955).
 * Le marché (US / FR) se cible par la LANGUE de la requête.
 */

const APIFY_BASE = "https://api.apify.com/v2";
const SEARCH_ACTOR = "patient_discovery~instagram-search-reels";
// Reels d'un profil précis (recherche « par créateur »). Acteur officiel Apify :
// prend une liste de `username` et renvoie leurs reels avec vraies vues/likes.
const PROFILE_REELS_ACTOR = "apify~instagram-reel-scraper";
// Reels RÉCENTS d'un hashtag (seule source qui remonte du récent, avec vrais
// likes). L'acteur `instagram-search-reels` classe par popularité et ne renvoie
// quasiment que des reels anciens — inutilisable pour la fraîcheur.
const HASHTAG_ACTOR = "apify~instagram-hashtag-scraper";
const TRANSCRIPT_ACTOR = "apple_yang~instagram-transcripts-scraper";

/** Reel normalisé, indépendant du format brut de l'API Instagram. */
export interface Reel {
  id: string;
  shortCode: string;
  url: string;
  caption: string;
  hashtags: string[];
  views: number;
  likes: number;
  comments: number;
  shares: number;
  /** (likes + commentaires + partages) / vues × 100 */
  engagementRate: number;
  durationSec?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  author: string;
  authorName?: string;
  authorFollowers?: number;
  postedAt?: string;
  /** langue devinée à partir de la légende : "fr" | "en" | "autre" */
  market: string;
}

/* Objet brut renvoyé par l'acteur (API Instagram interne, très verbeuse). */
interface RawReel {
  pk?: string;
  id?: string;
  code?: string;
  caption?: { text?: string; hashtags?: string[] };
  play_count?: number;
  ig_play_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  video_duration?: number;
  video_versions?: { url?: string }[];
  // vérifié sur la sortie réelle : c'est `thumbnail_url` (chaîne directe),
  // pas `image_versions2.candidates` comme sur l'API publique classique.
  thumbnail_url?: string;
  image_versions?: { additional_items?: { first_frame?: { url?: string } } };
  taken_at?: number;
  user?: { username?: string; full_name?: string; follower_count?: number };
}

function apifyToken(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN manquant dans .env.local");
  return t;
}

/** Devine le marché à partir de la légende (heuristique volontairement simple). */
function guessMarket(caption: string): string {
  const c = caption.toLowerCase();
  if (/[àâçéèêëîïôùûœ]/.test(c) || /\b(le|la|les|des|pour|avec|vous|votre|tu|est|dans|sur|qui|plus)\b/.test(c)) {
    // quelques mots anglais très fréquents pour éviter les faux positifs
    const en = (c.match(/\b(the|you|your|this|with|how|and|for|that|are)\b/g) ?? []).length;
    const fr = (c.match(/\b(le|la|les|des|pour|avec|vous|votre|est|dans|qui|plus)\b/g) ?? []).length;
    return fr >= en ? "fr" : "en";
  }
  if (/\b(the|you|your|this|with|how|and|for)\b/.test(c)) return "en";
  return "autre";
}

function normalize(r: RawReel): Reel | null {
  const code = r.code;
  if (!code) return null;
  const caption = r.caption?.text ?? "";
  const views = r.play_count ?? r.ig_play_count ?? 0;
  const likes = typeof r.like_count === "number" ? r.like_count : -1;
  const comments = r.comment_count ?? 0;
  const shares = r.share_count ?? 0;
  const eng = views > 0 ? ((Math.max(likes, 0) + comments + shares) / views) * 100 : 0;

  return {
    id: r.pk ?? r.id ?? code,
    shortCode: code,
    url: `https://www.instagram.com/reel/${code}/`,
    caption,
    hashtags: r.caption?.hashtags ?? (caption.match(/#[\wÀ-ſ]+/g) ?? []).map((h) => h.slice(1)),
    views,
    likes,
    comments,
    shares,
    engagementRate: Number(eng.toFixed(2)),
    durationSec: r.video_duration,
    thumbnailUrl: r.thumbnail_url ?? r.image_versions?.additional_items?.first_frame?.url,
    videoUrl: r.video_versions?.[0]?.url,
    author: r.user?.username ?? "",
    authorName: r.user?.full_name,
    authorFollowers: r.user?.follower_count,
    postedAt: r.taken_at ? new Date(r.taken_at * 1000).toISOString() : undefined,
    market: guessMarket(caption),
  };
}

export interface SearchOptions {
  /** nombre de pages (12 reels par page) */
  pages?: number;
  minViews?: number;
  /** taux d'engagement minimum, en % */
  minEngagement?: number;
  /** "fr" | "en" | "tous" */
  market?: string;
  /** ne garder que les reels publiés il y a ≤ N jours (0/undefined = pas de filtre) */
  maxAgeDays?: number;
}

/** true si le reel a été publié dans la fenêtre de fraîcheur demandée. */
function withinAge(postedAt: string | undefined, maxAgeDays?: number): boolean {
  if (!maxAgeDays) return true;
  if (!postedAt) return false; // on exige une date connue quand on filtre par fraîcheur
  const ts = Date.parse(postedAt);
  if (Number.isNaN(ts)) return false;
  return ts >= Date.now() - maxAgeDays * 86_400_000;
}

/**
 * Cherche les reels d'une niche sur plusieurs requêtes, fusionne, filtre et
 * classe par vues. Passer plusieurs requêtes (une FR, une EN) permet de
 * couvrir les deux marchés en une fois.
 */
export async function searchReels(queries: string[], opts: SearchOptions = {}): Promise<Reel[]> {
  const { pages = 3, minViews = 0, minEngagement = 0, market = "tous", maxAgeDays } = opts;
  const cleaned = queries.map((q) => q.trim()).filter(Boolean);
  if (!cleaned.length) throw new Error("Aucune requête fournie");

  const runs = await Promise.all(
    cleaned.map(async (query) => {
      const res = await fetch(
        `${APIFY_BASE}/acts/${SEARCH_ACTOR}/run-sync-get-dataset-items?token=${apifyToken()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, maxPages: Math.min(Math.max(pages, 1), 10) }),
          signal: AbortSignal.timeout(280_000),
        }
      );
      if (!res.ok) {
        throw new Error(`Apify a répondu ${res.status} : ${(await res.text()).slice(0, 160)}`);
      }
      const items = (await res.json()) as RawReel[];
      return Array.isArray(items) ? items : [];
    })
  );

  // fusion + dédoublonnage par shortcode (une même vidéo peut sortir sur 2 requêtes)
  const seen = new Set<string>();
  const all: Reel[] = [];
  for (const raw of runs.flat()) {
    const r = normalize(raw);
    if (!r || seen.has(r.shortCode)) continue;
    seen.add(r.shortCode);
    all.push(r);
  }

  return all
    .filter((r) => r.views >= minViews)
    .filter((r) => r.engagementRate >= minEngagement)
    .filter((r) => market === "tous" || r.market === market)
    .filter((r) => withinAge(r.postedAt, maxAgeDays))
    .sort((a, b) => b.views - a.views);
}

/* ---- Recherche par créateur (reels d'un ou plusieurs profils) ------------ */

/** Format brut de l'acteur `apify~instagram-reel-scraper` (différent du search). */
interface RawProfileReel {
  id?: string;
  shortCode?: string;
  url?: string;
  caption?: string;
  hashtags?: string[];
  commentsCount?: number;
  likesCount?: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  igPlayCount?: number;
  videoDuration?: number;
  timestamp?: string;
  displayUrl?: string;
  videoUrl?: string;
  ownerUsername?: string;
  ownerFullName?: string;
}

/** Nettoie une saisie utilisateur ("@handle", une URL de profil…) en handle nu. */
function cleanHandle(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "")
    .trim();
}

function normalizeProfileReel(r: RawProfileReel): Reel | null {
  const code = r.shortCode;
  if (!code) return null;
  const caption = r.caption ?? "";
  const views = r.videoPlayCount ?? r.videoViewCount ?? r.igPlayCount ?? 0;
  const likes = typeof r.likesCount === "number" ? r.likesCount : -1;
  const comments = r.commentsCount ?? 0;
  const eng = views > 0 ? ((Math.max(likes, 0) + comments) / views) * 100 : 0;

  return {
    id: r.id ?? code,
    shortCode: code,
    url: r.url ?? `https://www.instagram.com/reel/${code}/`,
    caption,
    hashtags: r.hashtags ?? (caption.match(/#[\wÀ-ſ]+/g) ?? []).map((h) => h.slice(1)),
    views,
    likes,
    comments,
    shares: 0,
    engagementRate: Number(eng.toFixed(2)),
    durationSec: r.videoDuration,
    thumbnailUrl: r.displayUrl,
    videoUrl: r.videoUrl,
    author: r.ownerUsername ?? "",
    authorName: r.ownerFullName,
    postedAt: r.timestamp,
    market: guessMarket(caption),
  };
}

export interface CreatorOptions {
  /** nombre max de reels récupérés par créateur */
  limit?: number;
  minViews?: number;
  minEngagement?: number;
  market?: string;
  /** ne garder que les reels publiés il y a ≤ N jours */
  maxAgeDays?: number;
}

/**
 * Récupère les reels de un ou plusieurs comptes Instagram (recherche « par
 * créateur »), fusionne, filtre et classe par vues.
 */
export async function creatorReels(usernames: string[], opts: CreatorOptions = {}): Promise<Reel[]> {
  const { limit = 30, minViews = 0, minEngagement = 0, market = "tous", maxAgeDays } = opts;
  const handles = [...new Set(usernames.map(cleanHandle).filter(Boolean))];
  if (!handles.length) throw new Error("Aucun créateur fourni");

  const res = await fetch(
    `${APIFY_BASE}/acts/${PROFILE_REELS_ACTOR}/run-sync-get-dataset-items?token=${apifyToken()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: handles, resultsLimit: Math.min(Math.max(limit, 1), 200) }),
      signal: AbortSignal.timeout(280_000),
    }
  );
  if (!res.ok) {
    throw new Error(`Apify a répondu ${res.status} : ${(await res.text()).slice(0, 160)}`);
  }
  const items = (await res.json()) as RawProfileReel[];

  const seen = new Set<string>();
  const all: Reel[] = [];
  for (const raw of Array.isArray(items) ? items : []) {
    const r = normalizeProfileReel(raw);
    if (!r || seen.has(r.shortCode)) continue;
    seen.add(r.shortCode);
    all.push(r);
  }

  return all
    .filter((r) => r.views >= minViews)
    .filter((r) => r.engagementRate >= minEngagement)
    .filter((r) => market === "tous" || r.market === market)
    .filter((r) => withinAge(r.postedAt, maxAgeDays))
    .sort((a, b) => b.views - a.views);
}

/* ---- Recherche par hashtag (reels RÉCENTS) -------------------------------- */

/**
 * Récupère les reels RÉCENTS d'un ou plusieurs hashtags. Contrairement à la
 * recherche par sujet (classée par popularité → reels anciens), cette source
 * remonte du récent avec les vrais likes. Classe par date décroissante.
 */
export async function hashtagReels(hashtags: string[], opts: CreatorOptions = {}): Promise<Reel[]> {
  const { limit = 40, minViews = 0, minEngagement = 0, market = "tous", maxAgeDays } = opts;
  const tags = [
    ...new Set(
      hashtags
        .map((h) => h.trim().replace(/^#/, "").replace(/\s+/g, "").toLowerCase())
        .filter(Boolean)
    ),
  ];
  if (!tags.length) throw new Error("Aucun hashtag fourni");

  const res = await fetch(
    `${APIFY_BASE}/acts/${HASHTAG_ACTOR}/run-sync-get-dataset-items?token=${apifyToken()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hashtags: tags,
        resultsType: "reels",
        resultsLimit: Math.min(Math.max(limit, 1), 200),
      }),
      signal: AbortSignal.timeout(280_000),
    }
  );
  if (!res.ok) {
    throw new Error(`Apify a répondu ${res.status} : ${(await res.text()).slice(0, 160)}`);
  }
  const items = (await res.json()) as RawProfileReel[];

  const seen = new Set<string>();
  const all: Reel[] = [];
  for (const raw of Array.isArray(items) ? items : []) {
    const r = normalizeProfileReel(raw);
    if (!r || seen.has(r.shortCode)) continue;
    seen.add(r.shortCode);
    all.push(r);
  }

  return all
    .filter((r) => r.views >= minViews)
    .filter((r) => r.engagementRate >= minEngagement)
    .filter((r) => market === "tous" || r.market === market)
    .filter((r) => withinAge(r.postedAt, maxAgeDays))
    .sort((a, b) => (b.postedAt ? Date.parse(b.postedAt) : 0) - (a.postedAt ? Date.parse(a.postedAt) : 0));
}

/**
 * Transcrit plusieurs Reels EN UN SEUL appel, via un acteur Apify dédié.
 *
 * Pourquoi pas Gemini : le palier gratuit rend 429 « exceeded your current
 * quota » dès quelques vidéos (vérifié en direct sur l'API Google, hors app),
 * et chaque reel imposait un téléchargement puis un envoi inline lourd.
 * L'acteur ci-dessous prend une liste d'URLs, ne consomme pas le quota Google,
 * et renvoie en prime la vignette (`img`) et les compteurs.
 */
export interface TranscriptResult {
  url: string;
  shortCode?: string;
  text: string;
  thumbnail?: string;
  error?: string;
}

export async function transcribeReels(urls: string[]): Promise<TranscriptResult[]> {
  if (!urls.length) return [];

  const res = await fetch(
    `${APIFY_BASE}/acts/${TRANSCRIPT_ACTOR}/run-sync-get-dataset-items?token=${apifyToken()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulkUrls: urls }),
      signal: AbortSignal.timeout(280_000),
    }
  );
  if (!res.ok) {
    throw new Error(`Transcription indisponible (Apify ${res.status}) : ${(await res.text()).slice(0, 160)}`);
  }

  const items = (await res.json()) as {
    url?: string;
    code?: string;
    text?: string;
    img?: string;
    errMsg?: string;
  }[];
  if (!Array.isArray(items)) return [];

  return items.map((it) => ({
    url: it.url ?? "",
    shortCode: it.code,
    text: (it.text ?? "").trim(),
    thumbnail: it.img,
    error: it.errMsg || undefined,
  }));
}
