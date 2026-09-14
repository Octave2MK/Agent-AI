"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";
import { AgentChat } from "./AgentChat";
import { cn } from "@/lib/utils";
import type { AgentUsageStats } from "@/lib/analytics/usage";

type TabKey = "chat" | "miniatures" | "creative" | "content" | "studio-video" | "pipeline" | "veille" | "propositions" | "compta" | "analytics" | "files" | "history";

interface AgentTabsProps {
  agentSlug: string;
  agentName: string;
  accent: "marine" | "nude" | "muted";
  suggestions?: string[];
  disabled?: boolean;
  deliverablesCount: number;
  filesPanel: React.ReactNode; // pré-rendu côté serveur (DeliverablesPanel)
  contextPanel?: React.ReactNode; // InboxPreview / MeetingsPreview / CandidatesPreview (optionnel)
  thumbnailPanel?: React.ReactNode; // ThumbnailStudio — uniquement pour le Designer (Mia)
  videoPanel?: React.ReactNode; // EcommerceStudio — uniquement pour l'agente e-commerce (Emma)
  pipelinePanel?: React.ReactNode;
  veillePanel?: React.ReactNode; // VeilleStudio — uniquement pour l'agente veille (Nina) // ProspectionStudio — uniquement pour l'agent prospection (Sacha)
  proposalPanel?: React.ReactNode; // PropositionStudio — uniquement pour Victor (proposition)
  comptaPanel?: React.ReactNode; // ComptaStudio — uniquement pour Chloé (comptabilite)
  creativePanel?: React.ReactNode; // CreativeStudio — uniquement pour Mia (designer / Creative Strategist)
  contentPanel?: React.ReactNode; // ContentStudio — uniquement pour Léa (createur-contenu)
}

export function AgentTabs({
  agentSlug,
  agentName,
  accent,
  suggestions,
  disabled,
  deliverablesCount,
  filesPanel,
  contextPanel,
  thumbnailPanel,
  videoPanel,
  pipelinePanel,
  veillePanel,
  proposalPanel,
  comptaPanel,
  creativePanel,
  contentPanel,
}: AgentTabsProps) {
  const [tab, setTab] = useState<TabKey>("chat");

  const tabs: { key: TabKey; label: string; icon: string; badge?: string }[] = [
    { key: "chat", label: "Chat", icon: "MessageCircle" },
    ...(creativePanel ? [{ key: "creative" as TabKey, label: "Studio créa", icon: "Palette" }] : []),
    ...(contentPanel ? [{ key: "content" as TabKey, label: "Studio contenu", icon: "LayoutGrid" }] : []),
    ...(thumbnailPanel ? [{ key: "miniatures" as TabKey, label: "Miniatures", icon: "Image" }] : []),
    ...(videoPanel ? [{ key: "studio-video" as TabKey, label: "Studio vidéo", icon: "Clapperboard" }] : []),
    ...(pipelinePanel ? [{ key: "pipeline" as TabKey, label: "Pipeline", icon: "Radar" }] : []),
    ...(veillePanel ? [{ key: "veille" as TabKey, label: "Veille", icon: "TrendingUp" }] : []),
    ...(proposalPanel ? [{ key: "propositions" as TabKey, label: "Propositions", icon: "FileSignature" }] : []),
    ...(comptaPanel ? [{ key: "compta" as TabKey, label: "Dashboard", icon: "LayoutDashboard" }] : []),
    { key: "analytics", label: "Analytics", icon: "LineChart" },
    { key: "files", label: "Fichiers", icon: "FolderOpen", badge: deliverablesCount > 0 ? String(deliverablesCount) : undefined },
    { key: "history", label: "Historique", icon: "Clock" },
  ];

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--color-line)] overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors",
                active
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              )}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
              {t.badge && (
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black",
                  active
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-white/10 text-[var(--color-ink-dim)]"
                )}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {tab === "chat" && (
          <div className="h-[calc(100vh-180px)] min-h-[700px]">
            <AgentChat
              agentSlug={agentSlug}
              agentName={agentName}
              accent={accent}
              suggestions={suggestions}
              disabled={disabled}
            />
          </div>
        )}
        {tab === "creative" && creativePanel}
        {tab === "content" && contentPanel}
        {tab === "miniatures" && thumbnailPanel}
        {tab === "studio-video" && videoPanel}
        {tab === "pipeline" && pipelinePanel}
        {tab === "veille" && veillePanel}
        {tab === "propositions" && proposalPanel}
        {tab === "compta" && comptaPanel}
        {tab === "analytics" && <AnalyticsTab agentSlug={agentSlug} />}
        {tab === "files" && (
          <div className="space-y-4">
            {contextPanel}
            <div className="h-[calc(100vh-180px)] min-h-[700px]">{filesPanel}</div>
          </div>
        )}
        {tab === "history" && <HistoryTab agentSlug={agentSlug} onResume={() => setTab("chat")} />}
      </div>
    </div>
  );
}

/* =========================================================
   ANALYTICS TAB
   ========================================================= */

interface AnalyticsApiResponse {
  slug: string;
  d7: AgentUsageStats;
  d30: AgentUsageStats;
}

function AnalyticsTab({ agentSlug }: { agentSlug: string }) {
  const [data, setData] = useState<AnalyticsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetch(`/api/analytics/agent/${encodeURIComponent(agentSlug)}`)
      .then((r) => r.json())
      .then((json: AnalyticsApiResponse | { error?: string }) => {
        if (cancelled) return;
        if ("error" in json && json.error) {
          setErr(json.error);
        } else if ("d30" in json) {
          setData(json);
        }
      })
      .catch((e) => !cancelled && setErr(e instanceof Error ? e.message : "Erreur"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [agentSlug]);

  if (loading) return <AnalyticsSkeleton />;
  if (err) return <div className="chip red">Erreur : {err}</div>;
  if (!data) return null;

  const empty = data.d30.messagesCount === 0;

  return (
    <div className="space-y-4">
      {empty ? (
        <div className="glass-brutal rounded-2xl p-8 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-white/[0.06] border border-[var(--color-line)]">
            <Icon name="LineChart" size={20} />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Pas encore d&apos;activité</h3>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
            Envoyez quelques messages à cet agent pour voir apparaître les métriques de consommation ici.
          </p>
        </div>
      ) : (
        <>
          {/* Rangée 4 KPI principaux */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiBlock
              label="Tokens · input"
              value={formatCompact(data.d30.inputTokens)}
              sub="prompts + contexte"
            />
            <KpiBlock
              label="Tokens · output"
              value={formatCompact(data.d30.outputTokens)}
              sub="réponses agent"
            />
            <KpiBlock
              label="Coût · 30j"
              value={`$ ${data.d30.totalCostUsd.toFixed(2)}`}
              sub={`${data.d30.messagesCount} appel${data.d30.messagesCount > 1 ? "s" : ""}`}
              accent
            />
            <KpiBlock
              label="Cache hits"
              value={formatCompact(data.d30.cacheReadTokens)}
              sub={`économie $ ${data.d30.cacheSavingsUsd.toFixed(2)}`}
              emerald
            />
          </div>

          {/* Rangée 4 KPI performance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiBlock
              label="Taux succès"
              value={`${Math.round(data.d30.successRate * 100)} %`}
              sub={`${data.d30.successCount}/${data.d30.messagesCount} requêtes`}
              emerald={data.d30.successRate >= 0.95}
            />
            <KpiBlock
              label="Latence moy."
              value={`${(data.d30.avgLatencyMs / 1000).toFixed(1)} s`}
              sub="temps de réponse"
            />
            <KpiBlock
              label="Tool calls"
              value={data.d30.toolCallsTotal.toString()}
              sub="web_search · web_fetch"
            />
            <KpiBlock
              label="7 derniers jours"
              value={data.d7.messagesCount.toString()}
              sub={`$ ${data.d7.totalCostUsd.toFixed(2)} dépensés`}
            />
          </div>

          {/* Chart tokens par jour */}
          <div className="glass-brutal rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)]">
                  Tokens consommés · 30 jours
                </h3>
                <p className="mt-1 text-lg h-display">
                  {formatCompact(data.d30.totalTokens)}{" "}
                  <span className="text-sm text-[var(--color-ink-soft)]">total</span>
                </p>
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded bg-[var(--color-accent)]" />
                  Input
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded bg-[#F57444]" />
                  Output
                </span>
              </div>
            </div>
            <DailyBarsChart series={data.d30.dailySeries} />
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-soft rounded-2xl h-[86px] animate-pulse" />
        ))}
      </div>
      <div className="glass-soft rounded-2xl h-[260px] animate-pulse" />
    </div>
  );
}

function KpiBlock({
  label,
  value,
  sub,
  accent,
  emerald,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  emerald?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-soft rounded-xl px-4 py-3",
        accent && "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.06]",
        emerald && "border-emerald-500/25 bg-emerald-500/[0.04]"
      )}
    >
      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 h-display text-[22px] leading-none",
          accent && "text-[var(--color-accent)]",
          emerald && "text-emerald-300"
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 text-[10px] font-semibold text-[var(--color-ink-dim)] truncate">
          {sub}
        </div>
      )}
    </div>
  );
}

function DailyBarsChart({ series }: { series: AgentUsageStats["dailySeries"] }) {
  const max = useMemo(
    () => Math.max(1, ...series.map((d) => d.inputTokens + d.outputTokens)),
    [series]
  );
  const W = 600;
  const H = 160;
  const PAD_L = 10;
  const PAD_B = 20;
  const plotH = H - PAD_B;
  const n = series.length;
  const barW = (W - PAD_L * 2) / n / 2.3; // deux bars par jour
  const groupW = (W - PAD_L * 2) / n;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[160px]">
        {/* Grid lines */}
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
          <line x1="0" y1={plotH * 0.25} x2={W} y2={plotH * 0.25} />
          <line x1="0" y1={plotH * 0.5} x2={W} y2={plotH * 0.5} />
          <line x1="0" y1={plotH * 0.75} x2={W} y2={plotH * 0.75} />
        </g>
        {/* Bars */}
        {series.map((d, i) => {
          const x = PAD_L + i * groupW + groupW / 2;
          const inputH = (d.inputTokens / max) * plotH;
          const outputH = (d.outputTokens / max) * plotH;
          return (
            <g key={d.date}>
              <rect
                x={x - barW - 1}
                y={plotH - inputH}
                width={barW}
                height={inputH}
                fill="#E8461F"
                rx={barW < 4 ? 0 : 2}
              />
              <rect
                x={x + 1}
                y={plotH - outputH}
                width={barW}
                height={outputH}
                fill="#F57444"
                rx={barW < 4 ? 0 : 2}
              />
            </g>
          );
        })}
        {/* Labels min/max sous forme de 3 marks */}
        <g fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="600">
          <text x="4" y={H - 6}>{series[0]?.date.slice(5)}</text>
          {n > 1 && (
            <text x={W / 2} y={H - 6} textAnchor="middle">
              {series[Math.floor(n / 2)]?.date.slice(5)}
            </text>
          )}
          <text x={W - 4} y={H - 6} textAnchor="end">
            {series[n - 1]?.date.slice(5)}
          </text>
        </g>
      </svg>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + " k";
  return n.toString();
}

/* =========================================================
   HISTORY TAB — lit les conversations sauvegardées en localStorage
   ========================================================= */

interface HistoryEntry {
  id: string;
  role: "user" | "assistant" | "system";
  createdAt?: string;
  text: string;
}

function HistoryTab({ agentSlug, onResume }: { agentSlug: string; onResume: () => void }) {
  const [msgs, setMsgs] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`naiom-chat:${agentSlug}`);
      if (!raw) {
        setMsgs([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setMsgs([]);
        return;
      }
      const entries: HistoryEntry[] = parsed.map((m, i) => {
        const text = Array.isArray(m.parts)
          ? m.parts
              .map((p: { type?: string; text?: string }) =>
                p.type === "text" && typeof p.text === "string" ? p.text : ""
              )
              .join("")
              .trim()
          : "";
        return {
          id: m.id ?? `msg-${i}`,
          role: m.role ?? "user",
          createdAt: m.createdAt,
          text,
        };
      });
      setMsgs(entries);
    } catch {
      setMsgs([]);
    }
  }, [agentSlug]);

  if (msgs === null) return <AnalyticsSkeleton />;

  if (msgs.length === 0) {
    return (
      <div className="glass-brutal rounded-2xl p-8 text-center">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-white/[0.06] border border-[var(--color-line)]">
          <Icon name="Clock" size={20} />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Aucune conversation</h3>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
          L&apos;historique des conversations avec cet agent apparaîtra ici une fois que vous aurez échangé avec lui.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="btn-accent mt-5 inline-flex items-center gap-2 text-sm"
        >
          <Icon name="MessageCircle" size={13} />
          Démarrer une conversation
        </button>
      </div>
    );
  }

  const firstUserMsg = msgs.find((m) => m.role === "user");
  const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
  const totalMessages = msgs.length;
  const userMessages = msgs.filter((m) => m.role === "user").length;

  return (
    <div className="space-y-4">
      <div className="glass-brutal rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white border border-[var(--color-line)]">
            <Icon name="Clock" size={15} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">
              Conversation en cours
            </div>
            <div className="text-[11px] text-[var(--color-ink-dim)]">
              {totalMessages} message{totalMessages > 1 ? "s" : ""} · {userMessages} de vous
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onResume}
          className="btn-accent inline-flex items-center gap-2 text-xs"
        >
          Reprendre <Icon name="ArrowRight" size={12} />
        </button>
      </div>

      <div className="glass-soft rounded-2xl p-5 space-y-4">
        {firstUserMsg && (
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)] mb-2">
              Premier message
            </div>
            <p className="text-sm text-[var(--color-ink)] line-clamp-3">
              &quot;{firstUserMsg.text.slice(0, 280)}{firstUserMsg.text.length > 280 ? "…" : ""}&quot;
            </p>
          </div>
        )}
        {lastAssistant && (
          <div className="pt-3 border-t border-[var(--color-line)]">
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--color-ink-dim)] mb-2">
              Dernière réponse de l&apos;agent
            </div>
            <p className="text-sm text-[var(--color-ink-soft)] line-clamp-5">
              {lastAssistant.text.slice(0, 400)}{lastAssistant.text.length > 400 ? "…" : ""}
            </p>
          </div>
        )}
      </div>

      <details className="glass-soft rounded-2xl">
        <summary className="cursor-pointer list-none px-5 py-3 flex items-center gap-2 text-[12px] font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
          <Icon name="ChevronDown" size={12} />
          Voir les {totalMessages} messages
        </summary>
        <div className="max-h-[50vh] overflow-y-auto px-5 pb-5 space-y-3">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-lg px-3 py-2 text-[12px]",
                m.role === "user"
                  ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-ink)] ml-8"
                  : "bg-white/[0.04] border border-[var(--color-line)] text-[var(--color-ink-soft)] mr-8"
              )}
            >
              <div className="text-[9px] font-black uppercase tracking-wider opacity-70 mb-1">
                {m.role === "user" ? "Vous" : "Agent"}
              </div>
              <div className="whitespace-pre-wrap line-clamp-6">{m.text || <em className="opacity-50">(message vide)</em>}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
