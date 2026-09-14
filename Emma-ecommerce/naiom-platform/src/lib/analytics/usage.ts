import fs from "node:fs/promises";
import path from "node:path";

/**
 * Tracking simple de la consommation par agent.
 * Chaque ligne = un appel /api/chat complété. Écrit en JSONL dans
 * `analytics/usage/{slug}.jsonl` (sous le dossier racine du projet, pas naiom-platform).
 *
 * Pricing Claude Sonnet 4.6 (USD / 1M tokens) — à ajuster si tarifs changent :
 *   input          : $3.00
 *   output         : $15.00
 *   cache read     : $0.30  (90 % de réduction)
 *   cache creation : $3.75  (25 % de surcoût)
 */

const PRICE_PER_MTOKEN = {
  input: 3.0,
  output: 15.0,
  cacheRead: 0.3,
  cacheCreation: 3.75,
};

export interface UsageRecord {
  timestamp: string; // ISO
  agentSlug: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  latencyMs: number;
  success: boolean;
  toolCalls: number; // nb de web_search + web_fetch combinés
}

// Le dossier analytics/usage/ est à la racine du monorepo (pas dans naiom-platform/)
function usageDir(): string {
  // process.cwd() en dev = /Users/.../naiom-platform — on remonte d'un cran
  return path.resolve(process.cwd(), "..", "analytics", "usage");
}

function usageFile(slug: string): string {
  // Sanitize slug pour éviter path traversal
  const safe = slug.replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  return path.join(usageDir(), `${safe}.jsonl`);
}

export async function appendUsage(record: UsageRecord): Promise<void> {
  try {
    await fs.mkdir(usageDir(), { recursive: true });
    const line = JSON.stringify(record) + "\n";
    await fs.appendFile(usageFile(record.agentSlug), line, "utf-8");
  } catch (err) {
    // En silence — le tracking ne doit jamais casser le chat
    console.error("[analytics/usage] append failed:", err);
  }
}

export interface AgentUsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalCostUsd: number;
  cacheSavingsUsd: number;
  messagesCount: number;
  successCount: number;
  errorCount: number;
  successRate: number; // 0..1
  avgLatencyMs: number;
  toolCallsTotal: number;
  dailySeries: { date: string; inputTokens: number; outputTokens: number; costUsd: number }[];
  lastActivity: string | null; // ISO ou null
}

function emptyStats(): AgentUsageStats {
  return {
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalCostUsd: 0,
    cacheSavingsUsd: 0,
    messagesCount: 0,
    successCount: 0,
    errorCount: 0,
    successRate: 1,
    avgLatencyMs: 0,
    toolCallsTotal: 0,
    dailySeries: [],
    lastActivity: null,
  };
}

function computeCost(r: Pick<UsageRecord, "inputTokens" | "outputTokens" | "cacheReadTokens" | "cacheCreationTokens">): number {
  return (
    (r.inputTokens / 1_000_000) * PRICE_PER_MTOKEN.input +
    (r.outputTokens / 1_000_000) * PRICE_PER_MTOKEN.output +
    (r.cacheReadTokens / 1_000_000) * PRICE_PER_MTOKEN.cacheRead +
    (r.cacheCreationTokens / 1_000_000) * PRICE_PER_MTOKEN.cacheCreation
  );
}

function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

export async function getAgentUsage(slug: string, opts: { days?: number } = {}): Promise<AgentUsageStats> {
  const days = opts.days ?? 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  let raw: string;
  try {
    raw = await fs.readFile(usageFile(slug), "utf-8");
  } catch {
    return emptyStats();
  }

  const records: UsageRecord[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const rec = JSON.parse(t) as UsageRecord;
      if (new Date(rec.timestamp).getTime() >= cutoff) records.push(rec);
    } catch {
      /* ignore corrupted line */
    }
  }

  if (records.length === 0) return emptyStats();

  const stats = emptyStats();
  const dailyMap: Record<string, { inputTokens: number; outputTokens: number; costUsd: number }> = {};
  let lastTs = 0;

  for (const r of records) {
    stats.inputTokens += r.inputTokens || 0;
    stats.outputTokens += r.outputTokens || 0;
    stats.cacheReadTokens += r.cacheReadTokens || 0;
    stats.cacheCreationTokens += r.cacheCreationTokens || 0;
    stats.messagesCount += 1;
    if (r.success) stats.successCount += 1;
    else stats.errorCount += 1;
    stats.avgLatencyMs += r.latencyMs || 0;
    stats.toolCallsTotal += r.toolCalls || 0;

    const cost = computeCost(r);
    stats.totalCostUsd += cost;

    // Économie cache : ce qu'on aurait payé en input normal vs cache read
    const savings = (r.cacheReadTokens / 1_000_000) * (PRICE_PER_MTOKEN.input - PRICE_PER_MTOKEN.cacheRead);
    stats.cacheSavingsUsd += savings;

    const day = isoDay(r.timestamp);
    if (!dailyMap[day]) dailyMap[day] = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
    dailyMap[day].inputTokens += r.inputTokens || 0;
    dailyMap[day].outputTokens += r.outputTokens || 0;
    dailyMap[day].costUsd += cost;

    const ts = new Date(r.timestamp).getTime();
    if (ts > lastTs) lastTs = ts;
  }

  stats.totalTokens = stats.inputTokens + stats.outputTokens + stats.cacheReadTokens + stats.cacheCreationTokens;
  stats.avgLatencyMs = Math.round(stats.avgLatencyMs / stats.messagesCount);
  stats.successRate = stats.successCount / stats.messagesCount;
  stats.lastActivity = lastTs ? new Date(lastTs).toISOString() : null;

  // Série journalière complétée (jours vides = 0)
  const today = new Date();
  const series: AgentUsageStats["dailySeries"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = dailyMap[key] ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
    series.push({ date: key, ...entry });
  }
  stats.dailySeries = series;

  return stats;
}

/**
 * Pricing public (pour affichage "coût estimé").
 */
export function getPricing() {
  return PRICE_PER_MTOKEN;
}
