import Link from "next/link";
import { listAgents } from "@/lib/agents";
import { countDeliverables } from "@/lib/deliverables";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";
import type { AgentMeta } from "@/lib/types";

export async function Sidebar({ activeSlug }: { activeSlug?: string }) {
  const agents = await listAgents();
  const counts = await Promise.all(
    agents.map(async (a) =>
      a.status === "active" && a.slug !== "orchestrateur" ? await countDeliverables(a.slug) : 0
    )
  );

  return (
    <aside className="sticky top-4 h-[calc(100vh-2rem)] w-72 shrink-0 ml-4 flex flex-col overflow-hidden rounded-3xl glass-brutal z-20">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white font-black text-xl border border-white/10 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
          N
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-black tracking-tight text-[var(--color-ink)]">NAIOM</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Multi-Agent Platform
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <SidebarSection title="Orchestration">
          <AgentLink agent={agents[0]} count={0} activeSlug={activeSlug} />
        </SidebarSection>

        <SidebarSection title="Agents marketing">
          {agents.slice(1, 6).map((a, i) => (
            <AgentLink key={a.slug} agent={a} count={counts[i + 1]} activeSlug={activeSlug} />
          ))}
        </SidebarSection>

        <SidebarSection title="Agents opérations">
          {agents.slice(6).map((a, i) => (
            <AgentLink key={a.slug} agent={a} count={counts[i + 6]} activeSlug={activeSlug} />
          ))}
        </SidebarSection>

        <SidebarSection title="Outils">
          <ToolLink
            href="/dashboard"
            icon="LayoutDashboard"
            label="Tableau de bord"
            active={activeSlug === "dashboard"}
          />
          <ToolLink href="/calendrier" icon="Calendar" label="Calendrier éditorial" />
          <ToolLink href="/settings" icon="Settings" label="Connexions" />
        </SidebarSection>
      </nav>

      <div className="border-t border-white/10 bg-white/[0.03] px-5 py-3 text-[11px] leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-bold text-[var(--color-ink)]">Plateforme en ligne</span>
        </div>
        <div className="mt-0.5 text-[var(--color-muted)]">Propulsée par Claude + n8n</div>
      </div>
    </aside>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-3 first:pt-0">
      <div className="px-3 pb-1.5 text-[9px] font-black tracking-[0.16em] uppercase text-[var(--color-muted)]">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ToolLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all hover-lift",
        active
          ? "bg-[var(--color-accent)] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
          : "text-[var(--color-ink)] hover:bg-white/[0.06] border border-transparent hover:border-white/10"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md",
          active ? "bg-white/20 text-white border border-white/30" : "bg-white/[0.06] text-[var(--color-ink)] border border-white/10"
        )}
      >
        <Icon name={icon} size={14} />
      </span>
      <span>{label}</span>
    </Link>
  );
}

function AgentLink({ agent, count, activeSlug }: { agent: AgentMeta; count: number; activeSlug?: string }) {
  const locked = agent.status === "locked";
  const disabled = agent.status === "coming-soon";
  const active = agent.slug === activeSlug;

  const iconBg = active
    ? "bg-[var(--color-accent)] text-white border border-white/10"
    : agent.accent === "marine"
    ? "bg-[var(--color-bg)] text-[var(--color-ink)] border border-white/10"
    : agent.accent === "nude"
    ? "bg-[var(--color-nude-200)] text-[#0a1410] border border-white/10"
    : "bg-white text-[#0a1410] border border-white/10";

  const content = (
    <>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]", iconBg)}>
        <Icon name={agent.icon} size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn(
          "block truncate text-[13px] font-bold tracking-tight",
          "text-[var(--color-ink)]"
        )}>
          {agent.name}
        </span>
        <span className={cn(
          "block truncate text-[10.5px]",
          active ? "text-[var(--color-ink-soft)]" : "text-[var(--color-muted)]"
        )}>
          {agent.tagline}
        </span>
      </span>
      {count > 0 && (
        <span className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black border",
          active
            ? "bg-[var(--color-accent)]/20 text-[var(--color-accent-soft)] border-[var(--color-accent)]/40"
            : "bg-white/[0.06] text-[var(--color-ink)] border-white/10"
        )}>
          {count}
        </span>
      )}
      {disabled && (
        <span className="shrink-0 rounded-full bg-[var(--color-nude-100)] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]">
          SOON
        </span>
      )}
      {locked && <span className="shrink-0 text-[13px]">🔒</span>}
    </>
  );

  // MODE TEMPLATE : agent verrouillé → grisé, mène à la page « Débloquer ».
  if (locked) {
    return (
      <a href="/decouvrir" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 opacity-50 grayscale transition hover:opacity-75">
        {content}
      </a>
    );
  }

  if (disabled) {
    return (
      <div
        aria-disabled
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 opacity-55 cursor-not-allowed"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all hover-lift border",
        active
          ? "bg-[var(--color-bg-soft)] border-[var(--color-accent)]/40 shadow-[0_8px_24px_-8px_rgba(232,70,31,0.25)]"
          : "border-transparent hover:bg-white/[0.04] hover:border-white/10"
      )}
    >
      {content}
    </Link>
  );
}
