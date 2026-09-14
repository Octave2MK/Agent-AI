import Link from "next/link";
import { Icon } from "../Icon";
import { cn } from "@/lib/utils";
import type { MockEmail } from "@/data/mockInbox";
import type { MockMeeting } from "@/data/mockMeetings";
import type { YTSnapshot } from "@/lib/integrations/youtube";
import type { DriveSnapshot } from "@/lib/integrations/drive";
import { labelForMime } from "@/lib/integrations/drive";

const ORANGE = "#E8461F";

// ---- Stat card (hero) ----

export function StatCard({
  icon,
  label,
  value,
  hint,
  tint = "marine",
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  tint?: "marine" | "orange" | "nude" | "emerald";
  href?: string;
}) {
  const tintClass = {
    marine: "bg-[#0a1410] text-white",
    orange: "text-white",
    nude: "bg-[var(--color-nude-200)] text-[#1e3a2c]",
    emerald: "bg-emerald-600 text-white",
  }[tint];
  const tintStyle = tint === "orange" ? { background: ORANGE } : undefined;

  const content = (
    <div className="flex flex-col justify-between h-full rounded-xl border border-[var(--color-line)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tintClass)} style={tintStyle}>
          <Icon name={icon} size={18} />
        </div>
        {href && <Icon name="ArrowUpRight" size={14} className="text-[var(--color-muted)]" />}
      </div>
      <div className="mt-6">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </div>
        <div className="mt-1 text-4xl font-bold text-[#0a1410] leading-none">
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-[var(--color-muted)]">{hint}</div>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full hover:opacity-95 transition-opacity">
      {content}
    </Link>
  ) : (
    <div className="h-full">{content}</div>
  );
}

// ---- Mini line chart (inline SVG, cohérent avec le template PDF) ----

export function MiniLineChart({
  data,
  height = 90,
  color = ORANGE,
}: {
  data: { x: string; y: number }[];
  height?: number;
  color?: string;
}) {
  if (data.length < 2) {
    return <div className="text-xs text-[var(--color-muted)]">Pas assez de points.</div>;
  }
  const w = 600;
  const h = height;
  const pad = 8;
  const ys = data.map((d) => d.y);
  const maxY = Math.max(...ys, 1);
  const minY = Math.min(...ys, 0);
  const range = maxY - minY || 1;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad + i * step,
    y: pad + (h - pad * 2) * (1 - (d.y - minY) / range),
  }));
  // smooth
  const d = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");
  const areaPath = `${d} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- YouTube widget ----

export function YouTubeWidget({
  snapshot,
  live,
  lastUpdated,
}: {
  snapshot: YTSnapshot | null;
  live: boolean;
  lastUpdated?: string;
}) {
  if (!snapshot) {
    return (
      <WidgetCard title="YouTube" icon="Youtube" href="/agents/analyste">
        <EmptyState text="Pas encore synchronisé." ctaLabel="Connecter" ctaHref="/settings" />
      </WidgetCard>
    );
  }
  const { channel, analytics, videos } = snapshot;
  const dailyData = analytics.dailySeries.slice(-30).map((d) => ({ x: d.date, y: d.views }));

  return (
    <WidgetCard
      title="YouTube"
      icon="Youtube"
      subtitle={channel.title}
      href="/agents/analyste"
      badgeLive={live}
      lastUpdated={lastUpdated}
    >
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Abonnés" value={channel.subscribers.toLocaleString("fr-FR")} />
        <Stat label="Vues / 30j" value={analytics.totals.views.toLocaleString("fr-FR")} />
        <Stat label="Nouveaux abonnés" value={`+${analytics.totals.subscribersGained}`} accent={ORANGE} />
      </div>
      {dailyData.length > 1 && <MiniLineChart data={dailyData} />}
      <div className="mt-4 border-t border-[var(--color-line)] pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)] mb-2">
          Dernières vidéos
        </div>
        <ul className="space-y-1.5">
          {videos.slice(0, 3).map((v) => (
            <li key={v.id} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate flex-1 font-medium text-[#0a1410]">{v.title}</span>
              <span className="shrink-0 text-[var(--color-muted)] font-mono">
                {v.views.toLocaleString("fr-FR")} vues
              </span>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
}

// ---- Fireflies widget ----

export function FirefliesWidget({
  meetings,
  live,
  lastUpdated,
}: {
  meetings: MockMeeting[];
  live: boolean;
  lastUpdated?: string;
}) {
  const past = meetings.filter((m) => new Date(m.date) <= new Date());
  const positives = past.filter((m) => m.sentiment === "positive").length;

  return (
    <WidgetCard
      title="Fireflies"
      icon="Mic"
      subtitle="Pipeline calls"
      href="/agents/fireflies"
      badgeLive={live}
      lastUpdated={lastUpdated}
    >
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Calls" value={past.length.toString()} />
        <Stat label="Positifs" value={positives.toString()} accent="#16A34A" />
        <Stat label="À suivre" value={past.filter((m) => m.actionItems.length > 0).length.toString()} />
      </div>
      <ul className="space-y-2">
        {past.slice(0, 3).map((m) => (
          <li key={m.id} className="border-l-2 pl-3 py-0.5" style={{
            borderColor: m.sentiment === "positive" ? "#16A34A" : m.sentiment === "negative" ? "#DC2626" : "#9CA3AF",
          }}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-[#0a1410] truncate">{m.title}</span>
              <span className="shrink-0 text-[10px] text-[var(--color-muted)]">
                {new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-muted)] line-clamp-1">{m.summary}</p>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

// ---- Gmail widget ----

export function GmailWidget({
  emails,
  live,
  lastUpdated,
}: {
  emails: MockEmail[];
  live: boolean;
  lastUpdated?: string;
}) {
  const urgent = emails.filter((e) => e.urgency === "high");
  const medium = emails.filter((e) => e.urgency === "medium");

  return (
    <WidgetCard
      title="Gmail"
      icon="Mail"
      subtitle="Inbox du jour"
      href="/agents/gmail"
      badgeLive={live}
      lastUpdated={lastUpdated}
    >
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Total" value={emails.length.toString()} />
        <Stat label="Urgents" value={urgent.length.toString()} accent="#DC2626" />
        <Stat label="Importants" value={medium.length.toString()} accent={ORANGE} />
      </div>
      <ul className="space-y-1.5">
        {[...urgent, ...medium].slice(0, 4).map((e) => (
          <li key={e.id} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                "mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                e.urgency === "high" ? "bg-red-500" : "bg-[var(--color-nude-500)]"
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-[#0a1410]">{e.from}</div>
              <div className="truncate text-[11px] text-[var(--color-muted)]">{e.subject}</div>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

// ---- Drive widget ----

export function DriveWidget({
  snapshot,
  live,
  lastUpdated,
}: {
  snapshot: DriveSnapshot | null;
  live: boolean;
  lastUpdated?: string;
}) {
  if (!snapshot || !snapshot.files.length) {
    return (
      <WidgetCard title="Drive" icon="HardDrive" href="/settings">
        <EmptyState text="Pas encore synchronisé." ctaLabel="Connecter" ctaHref="/settings" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Drive"
      icon="HardDrive"
      subtitle={`${snapshot.files.length} fichiers récents`}
      href="/settings"
      badgeLive={live}
      lastUpdated={lastUpdated}
    >
      <ul className="space-y-1.5">
        {snapshot.files.slice(0, 6).map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-xs">
            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded bg-[#0a1410]/10 text-[#0a1410] text-[9px] font-bold uppercase">
              {labelForMime(f.mimeType).slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
              {f.webViewLink ? (
                <a
                  href={f.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-[#0a1410] hover:text-[#0a1410] hover:underline"
                >
                  {f.name}
                </a>
              ) : (
                <span className="block truncate text-[#0a1410]">{f.name}</span>
              )}
              <div className="text-[10px] text-[var(--color-muted)]">
                {new Date(f.modifiedTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

// ---- Recent deliverables widget ----

export function RecentDeliverablesWidget({
  items,
}: {
  items: { slug: string; filename: string; title: string; folder: string; modifiedAt: string; agentSlug: string }[];
}) {
  const agentLabel: Record<string, string> = {
    strategiste: "Stratège",
    "createur-contenu": "Créateur",
    designer: "Designer",
    presentateur: "Présentateur",
    analyste: "Analyste",
    gmail: "Gmail",
    fireflies: "Fireflies",
    cv: "CV",
  };

  return (
    <WidgetCard title="Livrables récents" icon="FolderOpen">
      {items.length === 0 ? (
        <EmptyState text="Aucun livrable encore produit." />
      ) : (
        <ul className="divide-y divide-[var(--color-line)]">
          {items.slice(0, 7).map((d) => {
            const pdf = d.filename.toLowerCase().endsWith(".pdf");
            const href = pdf
              ? `/api/reports/file/${encodeURIComponent(d.agentSlug)}/${encodeURIComponent(d.filename)}`
              : `/agents/${d.agentSlug}`;
            return (
              <li key={d.filename} className="py-2 first:pt-0 last:pb-0">
                <a href={href} target={pdf ? "_blank" : undefined} rel={pdf ? "noopener noreferrer" : undefined} className="flex items-start gap-2 hover:opacity-75">
                  <span
                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white"
                    style={{ background: pdf ? ORANGE : "#0a1410" }}
                  >
                    {pdf ? "PDF" : "MD"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-[#0a1410]">
                      {d.title}
                    </div>
                    <div className="text-[10px] text-[var(--color-muted)]">
                      {agentLabel[d.agentSlug] ?? d.agentSlug} ·{" "}
                      {new Date(d.modifiedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

// ---- Helpers ----

function WidgetCard({
  title,
  icon,
  subtitle,
  href,
  badgeLive,
  lastUpdated,
  children,
}: {
  title: string;
  icon: string;
  subtitle?: string;
  href?: string;
  badgeLive?: boolean;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-[var(--color-line)] bg-white overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-5 py-3 border-b border-[var(--color-line)]">
        <div className="flex items-start gap-2 min-w-0">
          <Icon name={icon} size={16} className="text-[#0a1410] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#0a1410]">{title}</div>
            {subtitle && <div className="text-[11px] text-[var(--color-muted)] truncate">{subtitle}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {badgeLive === true && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
              <span className="inline-block h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          )}
          {badgeLive === false && (
            <span className="rounded-full bg-[var(--color-nude-100)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-nude-500)]">
              DÉMO
            </span>
          )}
          {href && (
            <Link
              href={href}
              className="text-[10px] text-[#0a1410] hover:underline flex items-center gap-0.5"
            >
              Ouvrir <Icon name="ArrowUpRight" size={10} />
            </Link>
          )}
        </div>
      </header>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        {label}
      </div>
      <div className="text-xl font-bold leading-tight" style={{ color: accent ?? "#0a1410" }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ text, ctaLabel, ctaHref }: { text: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <Icon name="Inbox" size={20} className="text-[var(--color-muted)]" />
      <p className="text-xs text-[var(--color-muted)]">{text}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="text-[11px] font-medium text-[#0a1410] hover:underline">
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
