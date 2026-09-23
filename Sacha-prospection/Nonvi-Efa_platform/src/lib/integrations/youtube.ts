import { getValidAccessToken } from "./google";

/**
 * YouTube Data API v3 + YouTube Analytics API — client natif.
 * Doc :
 *   - https://developers.google.com/youtube/v3/docs
 *   - https://developers.google.com/youtube/analytics/reference/reports/query
 */

export interface YTChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnailUrl?: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
}

export interface YTVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl?: string;
  durationIso: string;
  views: number;
  likes: number;
  comments: number;
}

export interface YTAnalytics {
  periodStart: string;
  periodEnd: string;
  totals: {
    views: number;
    minutesWatched: number;
    averageViewDurationSec: number;
    subscribersGained: number;
    subscribersLost: number;
  };
  dailySeries: { date: string; views: number; minutesWatched: number }[];
  topVideos: { videoId: string; title: string; views: number; minutesWatched: number }[];
}

export interface YTSnapshot {
  channel: YTChannel;
  videos: YTVideo[];
  analytics: YTAnalytics;
  fetchedAt: string;
}

async function googleGet<T>(url: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status} (${url}) : ${body.slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchChannel(): Promise<YTChannel> {
  type ChannelResp = {
    items?: {
      id: string;
      snippet: {
        title: string;
        description: string;
        customUrl?: string;
        publishedAt: string;
        thumbnails?: { default?: { url: string }; high?: { url: string } };
      };
      statistics: { viewCount: string; subscriberCount: string; videoCount: string };
    }[];
  };
  const data = await googleGet<ChannelResp>(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true"
  );
  const item = data.items?.[0];
  if (!item) throw new Error("Aucune chaîne YouTube trouvée pour ce compte.");

  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    customUrl: item.snippet.customUrl,
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
    subscribers: parseInt(item.statistics.subscriberCount, 10) || 0,
    totalViews: parseInt(item.statistics.viewCount, 10) || 0,
    videoCount: parseInt(item.statistics.videoCount, 10) || 0,
  };
}

export async function fetchRecentVideos(channelId: string, maxResults = 20): Promise<YTVideo[]> {
  type SearchResp = {
    items?: {
      id: { videoId: string };
      snippet: { title: string; description: string; publishedAt: string; thumbnails?: { high?: { url: string } } };
    }[];
  };
  const search = await googleGet<SearchResp>(
    `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&part=snippet`
  );
  const ids = (search.items ?? []).map((it) => it.id.videoId).filter(Boolean);
  if (ids.length === 0) return [];

  type VideosResp = {
    items?: {
      id: string;
      snippet: { title: string; description: string; publishedAt: string; thumbnails?: { high?: { url: string } } };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }[];
  };
  const stats = await googleGet<VideosResp>(
    `https://www.googleapis.com/youtube/v3/videos?id=${ids.join(",")}&part=snippet,statistics,contentDetails`
  );

  return (stats.items ?? []).map((v) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    publishedAt: v.snippet.publishedAt,
    thumbnailUrl: v.snippet.thumbnails?.high?.url,
    durationIso: v.contentDetails.duration,
    views: parseInt(v.statistics.viewCount ?? "0", 10),
    likes: parseInt(v.statistics.likeCount ?? "0", 10),
    comments: parseInt(v.statistics.commentCount ?? "0", 10),
  }));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function fetchAnalytics(days = 30): Promise<YTAnalytics> {
  const periodStart = daysAgoISO(days);
  const periodEnd = todayISO();

  // Totals + daily series
  type AnalyticsResp = {
    columnHeaders?: { name: string }[];
    rows?: (string | number)[][];
  };
  const dailyUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${periodStart}&endDate=${periodEnd}&metrics=views,estimatedMinutesWatched&dimensions=day&sort=day`;
  let daily: AnalyticsResp = { rows: [] };
  try {
    daily = await googleGet<AnalyticsResp>(dailyUrl);
  } catch {
    // Continuer même si analytics pas dispo (nouvelle chaîne, etc.)
  }

  const summaryUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${periodStart}&endDate=${periodEnd}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost`;
  let summary: AnalyticsResp = { rows: [] };
  try {
    summary = await googleGet<AnalyticsResp>(summaryUrl);
  } catch {
    // idem
  }

  const topVideosUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${periodStart}&endDate=${periodEnd}&metrics=views,estimatedMinutesWatched&dimensions=video&sort=-views&maxResults=5`;
  let top: AnalyticsResp = { rows: [] };
  try {
    top = await googleGet<AnalyticsResp>(topVideosUrl);
  } catch {
    // idem
  }

  const s = summary.rows?.[0] ?? [];
  const totals = {
    views: Number(s[0] ?? 0),
    minutesWatched: Number(s[1] ?? 0),
    averageViewDurationSec: Number(s[2] ?? 0),
    subscribersGained: Number(s[3] ?? 0),
    subscribersLost: Number(s[4] ?? 0),
  };

  const dailySeries = (daily.rows ?? []).map((r) => ({
    date: String(r[0]),
    views: Number(r[1] ?? 0),
    minutesWatched: Number(r[2] ?? 0),
  }));

  const topVideos = (top.rows ?? []).map((r) => ({
    videoId: String(r[0]),
    title: "", // enrichi plus tard
    views: Number(r[1] ?? 0),
    minutesWatched: Number(r[2] ?? 0),
  }));

  return { periodStart, periodEnd, totals, dailySeries, topVideos };
}

export async function fetchYouTubeSnapshot(options?: { days?: number; videos?: number }): Promise<YTSnapshot> {
  const days = options?.days ?? 30;
  const maxVideos = options?.videos ?? 20;

  const channel = await fetchChannel();
  const videos = await fetchRecentVideos(channel.id, maxVideos);
  const analytics = await fetchAnalytics(days);

  // Enrichir les titres des topVideos
  const titleMap = new Map(videos.map((v) => [v.id, v.title]));
  analytics.topVideos = analytics.topVideos.map((tv) => ({
    ...tv,
    title: titleMap.get(tv.videoId) ?? tv.videoId,
  }));

  return { channel, videos, analytics, fetchedAt: new Date().toISOString() };
}

/** Rendu markdown compact pour injecter dans le prompt de l'Analyste. */
export function renderYouTubeForPrompt(snap: YTSnapshot): string {
  const c = snap.channel;
  const a = snap.analytics;
  const topList = a.topVideos
    .slice(0, 5)
    .map(
      (tv, i) =>
        `  ${i + 1}. "${tv.title}" — ${tv.views.toLocaleString("fr-FR")} vues · ${tv.minutesWatched.toLocaleString("fr-FR")} min visionnées`
    )
    .join("\n");

  const recentVideos = snap.videos
    .slice(0, 5)
    .map(
      (v, i) =>
        `  ${i + 1}. [${new Date(v.publishedAt).toLocaleDateString("fr-FR")}] "${v.title}" — ${v.views.toLocaleString("fr-FR")} vues, ${v.likes} likes, ${v.comments} commentaires`
    )
    .join("\n");

  return `## Chaîne YouTube (données live)

- **Titre** : ${c.title}
- **Abonnés** : ${c.subscribers.toLocaleString("fr-FR")}
- **Vues cumulées** : ${c.totalViews.toLocaleString("fr-FR")}
- **Nombre de vidéos** : ${c.videoCount}

### Analytics sur les ${a.periodStart} → ${a.periodEnd}

- Vues : ${a.totals.views.toLocaleString("fr-FR")}
- Minutes visionnées : ${a.totals.minutesWatched.toLocaleString("fr-FR")}
- Durée moyenne de visionnage : ${Math.round(a.totals.averageViewDurationSec)}s
- Abonnés gagnés : +${a.totals.subscribersGained} (perdus : -${a.totals.subscribersLost}, net : ${a.totals.subscribersGained - a.totals.subscribersLost})

### Top 5 vidéos de la période

${topList || "  (aucune donnée)"}

### 5 dernières vidéos publiées

${recentVideos || "  (aucune vidéo récente)"}`;
}
