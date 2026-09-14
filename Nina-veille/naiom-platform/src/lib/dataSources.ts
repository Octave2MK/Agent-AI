import fs from "node:fs/promises";
import path from "node:path";
import { MOCK_INBOX, type MockEmail } from "@/data/mockInbox";
import { MOCK_MEETINGS, type MockMeeting } from "@/data/mockMeetings";
import {
  MOCK_CANDIDATES,
  MOCK_JOBS,
  type MockCandidate,
  type MockJobPosting,
} from "@/data/mockCandidates";
import { isFirefliesConfigured, fetchFirefliesMeetings } from "@/lib/integrations/fireflies";
import { loadTokens } from "@/lib/integrations/google";
import { fetchYouTubeSnapshot } from "@/lib/integrations/youtube";
import { fetchGmailInbox } from "@/lib/integrations/gmail";
import { fetchRecentDriveFiles } from "@/lib/integrations/drive";

/**
 * Layer de données NAIOM.
 *
 * Chaque source lit en priorité un fichier "live-*.json" alimenté par un workflow
 * n8n (via POST /api/sync/...). Si le fichier est absent, fallback sur le mock
 * embarqué — la plateforme reste démo-able sans connexion externe.
 */

const DATA_DIR = path.join(process.cwd(), "src", "data");
export const LIVE_FILES = {
  inbox: path.join(DATA_DIR, "live-inbox.json"),
  meetings: path.join(DATA_DIR, "live-meetings.json"),
  candidates: path.join(DATA_DIR, "live-candidates.json"),
};
export const LIVE_YOUTUBE_FILE = path.join(DATA_DIR, "live-youtube.json");
export const LIVE_DRIVE_FILE = path.join(DATA_DIR, "live-drive.json");

export interface SourceResult<T> {
  data: T;
  live: boolean;
  lastUpdated?: string;
}

async function readLiveOrFallback<T>(liveFile: string, fallback: T): Promise<SourceResult<T>> {
  try {
    const raw = await fs.readFile(liveFile, "utf-8");
    const parsed = JSON.parse(raw);
    const stat = await fs.stat(liveFile);
    return { data: parsed as T, live: true, lastUpdated: stat.mtime.toISOString() };
  } catch {
    return { data: fallback, live: false };
  }
}

// ---- Auto-refresh en arrière-plan ----
// Pour éviter de re-déclencher un fetch en parallèle à chaque page load, on garde
// une trace des sources en cours de rafraîchissement.
const refreshInFlight = new Set<string>();

/**
 * Déclenche un refresh en tâche de fond si le fichier live est périmé (ou absent).
 * Ne bloque jamais la réponse — les données fraîches arriveront au prochain page load.
 */
function scheduleRefresh<T>(
  liveFile: string,
  ttlMinutes: number,
  fetchFn: () => Promise<T>,
  label: string
): void {
  if (refreshInFlight.has(liveFile)) return;
  (async () => {
    try {
      const stat = await fs.stat(liveFile).catch(() => null);
      if (stat) {
        const ageMin = (Date.now() - stat.mtime.getTime()) / 60000;
        if (ageMin < ttlMinutes) return; // frais, rien à faire
      }
      refreshInFlight.add(liveFile);
      const data = await fetchFn();
      await fs.writeFile(liveFile, JSON.stringify(data, null, 2), "utf-8");
      console.log(`[auto-refresh] ${label} mis à jour (TTL ${ttlMinutes}min)`);
    } catch (err) {
      // Silencieux — si non configuré ou API down, on garde le cache
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[auto-refresh] ${label} : ${msg.slice(0, 120)}`);
    } finally {
      refreshInFlight.delete(liveFile);
    }
  })();
}

/**
 * Lit le cache s'il est frais, SINON fetch en direct (attendu) et met en cache.
 * → quand un outil est connecté, ses vraies données apparaissent immédiatement.
 */
async function getCachedOrFetch<T>(
  liveFile: string,
  ttlMinutes: number,
  fetchFn: () => Promise<T>
): Promise<{ data: T; lastUpdated: string }> {
  try {
    const stat = await fs.stat(liveFile);
    const ageMin = (Date.now() - stat.mtime.getTime()) / 60000;
    if (ageMin < ttlMinutes) {
      const raw = await fs.readFile(liveFile, "utf-8");
      return { data: JSON.parse(raw) as T, lastUpdated: stat.mtime.toISOString() };
    }
  } catch { /* pas de cache → on fetch */ }
  const data = await fetchFn();
  try { await fs.writeFile(liveFile, JSON.stringify(data, null, 2), "utf-8"); } catch { /* */ }
  return { data, lastUpdated: new Date().toISOString() };
}

// Helpers pour savoir si une source est branchée
async function hasGoogleTokens(): Promise<boolean> {
  const t = await loadTokens();
  return !!t;
}

export async function getInbox(): Promise<SourceResult<MockEmail[]>> {
  // Gmail connecté (OAuth) → tes vrais emails apparaissent (fetch attendu + cache 15 min).
  if (await hasGoogleTokens()) {
    try {
      const { data, lastUpdated } = await getCachedOrFetch(LIVE_FILES.inbox, 15, () => fetchGmailInbox(20));
      return { data, live: true, lastUpdated };
    } catch (err) {
      console.warn(`[Gmail] ${err instanceof Error ? err.message : err}`);
      return { data: [], live: true, lastUpdated: new Date().toISOString() };
    }
  }
  // Pas connecté → démo.
  return { data: MOCK_INBOX, live: false, lastUpdated: new Date().toISOString() };
}

export async function getMeetings(): Promise<SourceResult<MockMeeting[]>> {
  // DÉMO forcée (FIREFLIES_MOCK=1) : calls fictifs présentés comme live (jamais les vrais).
  if (process.env.FIREFLIES_MOCK === "1") {
    return { data: MOCK_MEETINGS, live: true, lastUpdated: new Date().toISOString() };
  }
  // Clé Fireflies connectée → on affiche TES vrais calls (fetch attendu + cache 30 min).
  if (isFirefliesConfigured()) {
    try {
      const { data, lastUpdated } = await getCachedOrFetch(LIVE_FILES.meetings, 30, () => fetchFirefliesMeetings(20));
      return { data, live: true, lastUpdated };
    } catch (err) {
      console.warn(`[Fireflies] ${err instanceof Error ? err.message : err}`);
      return { data: [], live: true, lastUpdated: new Date().toISOString() }; // connecté mais 0 call / erreur → pas de mock trompeur
    }
  }
  // Pas de clé → démo (calls d'exemple).
  return { data: MOCK_MEETINGS, live: false, lastUpdated: new Date().toISOString() };
}

export async function getCandidates(): Promise<SourceResult<{ candidates: MockCandidate[]; jobs: MockJobPosting[] }>> {
  // Pas de fetch réel pour l'instant (source à définir)
  return readLiveOrFallback(LIVE_FILES.candidates, { candidates: MOCK_CANDIDATES, jobs: MOCK_JOBS });
}

// ---- Rendus pour prompts agents (async, utilisent dataSources) ----

export async function renderInbox(): Promise<string> {
  const { data } = await getInbox();
  return data
    .map(
      (e) =>
        `### Email ${e.id} — ${e.urgency.toUpperCase()} ${e.requiresReply ? "[à répondre]" : ""}
- De : ${e.from} <${e.fromEmail}>
- Reçu : ${e.receivedAt}
- Sujet : ${e.subject}
- Catégorie : ${e.category}
- Corps : ${e.body}`
    )
    .join("\n\n");
}

export async function renderMeetings(): Promise<string> {
  const { data } = await getMeetings();
  return data
    .map(
      (m) =>
        `### Call ${m.id} — ${m.title}
- Date : ${m.date} (${m.durationMin} min)
- Type : ${m.type} · Sentiment : ${m.sentiment}
- Participants : ${m.participants.join(", ")}

**Résumé :** ${m.summary}

**Points clés :**
${m.keyPoints.map((k) => `  - ${k}`).join("\n")}

**Action items :**
${m.actionItems.map((a) => `  - ${a}`).join("\n")}

**Extrait :** ${m.transcript || "(pas d'extrait disponible)"}`
    )
    .join("\n\n");
}

export async function getYouTubeSnapshot(): Promise<{ live: boolean; lastUpdated?: string; data?: unknown }> {
  // TTL 60 min · YouTube Data + Analytics
  if (await hasGoogleTokens()) {
    scheduleRefresh(
      LIVE_YOUTUBE_FILE,
      60,
      () => fetchYouTubeSnapshot({ days: 30, videos: 20 }),
      "YouTube"
    );
  }
  try {
    const raw = await fs.readFile(LIVE_YOUTUBE_FILE, "utf-8");
    const stat = await fs.stat(LIVE_YOUTUBE_FILE);
    return { live: true, lastUpdated: stat.mtime.toISOString(), data: JSON.parse(raw) };
  } catch {
    return { live: false };
  }
}

export async function renderYouTube(): Promise<string> {
  const snap = await getYouTubeSnapshot();
  if (!snap.live || !snap.data) return "";
  const { renderYouTubeForPrompt } = await import("@/lib/integrations/youtube");
  return renderYouTubeForPrompt(snap.data as Parameters<typeof renderYouTubeForPrompt>[0]);
}

export async function getDriveSnapshot(): Promise<{ live: boolean; lastUpdated?: string; data?: unknown }> {
  // TTL 30 min · Google Drive metadata
  if (await hasGoogleTokens()) {
    scheduleRefresh(LIVE_DRIVE_FILE, 30, () => fetchRecentDriveFiles(30), "Drive");
  }
  try {
    const raw = await fs.readFile(LIVE_DRIVE_FILE, "utf-8");
    const stat = await fs.stat(LIVE_DRIVE_FILE);
    return { live: true, lastUpdated: stat.mtime.toISOString(), data: JSON.parse(raw) };
  } catch {
    return { live: false };
  }
}

export async function renderDrive(): Promise<string> {
  const snap = await getDriveSnapshot();
  if (!snap.live || !snap.data) return "";
  const { renderDriveForPrompt } = await import("@/lib/integrations/drive");
  return renderDriveForPrompt(snap.data as Parameters<typeof renderDriveForPrompt>[0]);
}

export async function renderCandidatesFull(): Promise<string> {
  const { data } = await getCandidates();
  const jobsBlock = data.jobs
    .map(
      (j) =>
        `### Poste ${j.id} — ${j.title} (${j.seniority})
- Skills : ${j.skills.join(", ")}
- Localisation : ${j.location}
- Salaire : ${j.salaryRange}`
    )
    .join("\n\n");
  const candidatesBlock = data.candidates
    .map((c) => {
      const job = data.jobs.find((j) => j.id === c.appliedFor);
      return `### Candidat ${c.id} — ${c.fullName}
- Postule pour : ${job?.title ?? c.appliedFor}
- Reçu : ${c.receivedAt}
- XP : ${c.yearsXp} ans · Actuel : ${c.currentRole} @ ${c.currentCompany}
- Skills : ${c.skills.join(", ")}
- Forces : ${c.highlights.map((h) => `\n  - ${h}`).join("")}
- Réserves : ${c.redFlags.map((r) => `\n  - ${r}`).join("")}
- Prétention : ${c.salaryExpectation}
- Dispo : ${c.availability}
- Résumé : ${c.cvSummary}`;
    })
    .join("\n\n");
  return `## Postes ouverts\n\n${jobsBlock}\n\n## Candidats reçus\n\n${candidatesBlock}`;
}
