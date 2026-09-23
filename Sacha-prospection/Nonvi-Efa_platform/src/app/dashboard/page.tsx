import Link from "next/link";
import {
  YouTubeWidget,
  FirefliesWidget,
  GmailWidget,
  DriveWidget,
  RecentDeliverablesWidget,
} from "@/components/dashboard/Widgets";
import { Icon } from "@/components/Icon";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AppNav } from "@/components/landing/AppNav";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { ShapeStar, ShapeSphere, ShapeCubeBlue } from "@/components/landing/Shapes";
import {
  getInbox,
  getMeetings,
  getYouTubeSnapshot,
  getDriveSnapshot,
} from "@/lib/dataSources";
import { listAgents } from "@/lib/agents";
import { listAllDeliverables } from "@/lib/deliverables";
import { getGoogleStatus } from "@/lib/integrations/google";
import type { YTSnapshot } from "@/lib/integrations/youtube";
import type { DriveSnapshot } from "@/lib/integrations/drive";
import type { AgentMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Couleur pastel par agent — la grille du Studio est le hub coloré du SaaS. */
const AGENT_TILE_COLORS: Record<string, string> = {
  orchestrateur: "#5B4DEE",
  strategiste: "#EDE9FF",
  "createur-contenu": "#FFE9DC",
  designer: "#FFE3EE",
  analyste: "#E0F0FF",
  presentateur: "#FFF3D1",
  gmail: "#DFF6EA",
  fireflies: "#F3E8FF",
  cv: "#EAF9DF",
  ecommerce: "#FFEFD6",
  prospection: "#E4F0FE",
};

/**
 * Studio — Edition Bronx (juillet 2026). Le hub SaaS de la plateforme :
 * la grille des 9 agents (chat au clic) d'abord, puis les stats et les
 * quatre flux connectés (YouTube / Fireflies / Gmail / Drive) et les
 * livrables récents. Même langage visuel que la landing.
 */
export default async function DashboardPage() {
  const [inbox, meetings, yt, drive, deliverables, google, agents] = await Promise.all([
    getInbox(),
    getMeetings(),
    getYouTubeSnapshot(),
    getDriveSnapshot(),
    listAllDeliverables(),
    getGoogleStatus(),
    listAgents(),
  ]);

  const ytData = (yt.data as YTSnapshot | undefined) ?? null;
  const driveData = (drive.data as DriveSnapshot | undefined) ?? null;
  const pastMeetings = meetings.data.filter((m) => new Date(m.date) <= new Date());
  const urgentMails = inbox.data.filter((e) => e.urgency === "high").length;
  const deliverablesTotal = deliverables.length;
  const pdfsTotal = deliverables.filter((d) => d.filename.toLowerCase().endsWith(".pdf")).length;

  const orchestrateur = agents.find((a) => a.slug === "orchestrateur");
  const team = agents.filter((a) => a.slug !== "orchestrateur" && a.status === "active");

  return (
    <div className="bronx-page min-h-screen w-full">
      <AppNav active="studio" />
      <ScrollReveal />

      {/* ============ HERO STUDIO ============ */}
      <section className="relative px-6 sm:px-10 pt-28 sm:pt-32 pb-10">
        <ShapeStar className="bronx-shape bronx-float-b hidden lg:block" style={{ top: "22%", right: "8%" }} size={110} />
        <ShapeSphere className="bronx-shape bronx-float-c hidden lg:block" style={{ top: "40%", left: "6%", opacity: 0.9 }} size={90} />
        <div className="mx-auto max-w-[1400px] text-center">
          <div className="althea-eyebrow mb-3 justify-center flex">
            Studio · données {google.connected ? "live" : "mock"}
          </div>
          <h1 className="bronx-hero-title" style={{ fontSize: "clamp(38px, 4.5vw, 64px)" }}>
            Bienvenue au <em>studio</em>&nbsp;!
          </h1>
          <p className="bronx-body mx-auto mt-4 max-w-[560px]">
            Choisissez un employé IA pour lui parler et lancer un livrable, ou survolez
            les flux connectés plus bas. Tout ce qui se produit ici est réel.
          </p>
        </div>
      </section>

      {/* ============ GRILLE DES AGENTS (le cœur du SaaS) ============ */}
      <section className="relative px-6 sm:px-10 pb-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {/* Noam (orchestrateur) — tuile featured violette, 2 colonnes */}
            {orchestrateur && <OrchestratorTile agent={orchestrateur} />}
            {team.map((agent, i) => (
              <AgentTile
                key={agent.slug}
                agent={agent}
                color={AGENT_TILE_COLORS[agent.slug] ?? "#F7F6FC"}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ 4 STAT CARDS ============ */}
      <section className="relative px-6 sm:px-10 pb-14">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" data-reveal>
          <StatTile
            icon="Youtube"
            label="Abonnés YouTube"
            value={ytData ? ytData.channel.subscribers.toLocaleString("fr-FR") : "—"}
            hint={ytData ? `+${ytData.analytics.totals.subscribersGained} sur 30j` : "Non connecté"}
            href="/agents/analyste"
          />
          <StatTile
            icon="Mic"
            label="Calls analysés"
            value={pastMeetings.length}
            hint={`${pastMeetings.filter((m) => m.sentiment === "positive").length} positifs`}
            href="/agents/fireflies"
          />
          <StatTile
            icon="Mail"
            label="Emails urgents"
            value={urgentMails}
            hint={`sur ${inbox.data.length} dans l'inbox`}
            href="/agents/gmail"
          />
          <StatTile
            icon="Files"
            label="Livrables produits"
            value={deliverablesTotal}
            hint={`${pdfsTotal} PDF · ${deliverablesTotal - pdfsTotal} fichiers texte`}
            accent
            href="/agents/orchestrateur"
          />
        </div>
      </section>

      {/* ============ WIDGETS PRINCIPAUX ============ */}
      <section className="relative px-6 sm:px-10 pb-12">
        <ShapeCubeBlue className="bronx-shape bronx-float-a hidden lg:block" style={{ top: "-30px", right: "10%" }} size={90} />
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
            <div>
              <div className="althea-eyebrow mb-2">— 01 — Sources</div>
              <h2 className="bronx-h2">
                Quatre flux <em>connectés</em>
              </h2>
            </div>
            <p className="bronx-body max-w-xs text-right">
              YouTube, Fireflies, Gmail, Drive. Vos agents lisent ces sources et produisent les livrables ci-dessous.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CardWrap>
              <YouTubeWidget snapshot={ytData} live={yt.live} lastUpdated={yt.lastUpdated} />
            </CardWrap>
            <CardWrap>
              <FirefliesWidget meetings={meetings.data} live={meetings.live} lastUpdated={meetings.lastUpdated} />
            </CardWrap>
            <CardWrap>
              <GmailWidget emails={inbox.data} live={inbox.live} lastUpdated={inbox.lastUpdated} />
            </CardWrap>
            <CardWrap>
              <DriveWidget snapshot={driveData} live={drive.live} lastUpdated={drive.lastUpdated} />
            </CardWrap>
          </div>
        </div>
      </section>

      {/* ============ LIVRABLES RÉCENTS ============ */}
      <section className="relative px-6 sm:px-10 pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
            <div>
              <div className="althea-eyebrow mb-2">— 02 — Livrables</div>
              <h2 className="bronx-h2">
                Tout ce qui sort <em>du studio</em>
              </h2>
            </div>
            <Link href="/" className="althea-pill-cta text-[12px]">
              Retour à l&apos;accueil
              <Icon name="ArrowUpRight" size={12} />
            </Link>
          </div>
          <CardWrap>
            <RecentDeliverablesWidget items={deliverables} />
          </CardWrap>
        </div>
      </section>

      {/* ============ FOOTER mini ============ */}
      <footer className="relative px-6 sm:px-10 py-10 border-t border-[#EEEDF6]">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-3 text-[12px] text-[#8A8A8A]">
          <span className="althea-logo">Nonvi-Efa</span>
          <span>Nonvi-Efa L.L.C-FZ · Dubaï · © 2026</span>
        </div>
      </footer>
    </div>
  );
}

/* =================================================================
   COMPOSANTS LOCAUX — Bronx
   ================================================================= */

/** Tuile featured de Noam (orchestrateur) — violette, s'étend sur 2 colonnes. */
function OrchestratorTile({ agent }: { agent: AgentMeta }) {
  return (
    <Link
      href="/agents/orchestrateur"
      className="group relative col-span-2 overflow-hidden rounded-[28px] p-6 flex items-center gap-5 hover:-translate-y-1"
      data-reveal
      style={{
        background: "#5B4DEE",
        boxShadow: "0 24px 56px -22px rgba(91, 77, 238, 0.55)",
      }}
    >
      <span className="bronx-hello-bubble" style={{ top: 12, left: 100 }}>
        Hello&nbsp;👋
      </span>
      <div className="shrink-0 -mb-8 bronx-hello-target">
        <AgentAvatar slug="orchestrateur" size={150} cutout zen aura={false} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Chef d&apos;orchestre
          </span>
        </div>
        <div className="bronx-name mt-2" style={{ color: "#FFFFFF", fontSize: 26 }}>
          {agent.name}
        </div>
        <p className="mt-1 text-[13px] leading-snug text-white/75 line-clamp-2">
          Parlez-lui de n&apos;importe quoi : il route vers le bon agent et produit le livrable.
        </p>
        <span className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold text-white">
          Ouvrir le chat
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#5B4DEE] transition-transform duration-300 group-hover:rotate-[-45deg]">
            <Icon name="ArrowRight" size={13} />
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Tuile agent pastel — avatar flottant + "Hello 👋" au survol, clic = chat. */
function AgentTile({ agent, color, index }: { agent: AgentMeta; color: string; index: number }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group relative rounded-[28px] p-5 pb-4 flex flex-col items-center text-center hover:-translate-y-1"
      data-reveal
      style={{
        background: color,
        boxShadow: "0 16px 40px -22px rgba(15, 15, 15, 0.18)",
        // stagger d'apparition : les tuiles de la rangée arrivent en cascade
        transitionDelay: `${(index % 5) * 70}ms`,
      }}
    >
      <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
      <span className="bronx-hello-bubble" style={{ top: -2 }}>
        Hello&nbsp;👋
      </span>
      <div className="bronx-agent-float">
        <div className="bronx-hello-target">
          <AgentAvatar slug={agent.slug} size={110} animate={false} cutout aura={false} />
        </div>
      </div>
      <div className="bronx-name mt-2.5" style={{ fontSize: 18 }}>{agent.name}</div>
      <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#6A6A6A]">
        {agent.role}
      </div>
      <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#0F0F0F] opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        Ouvrir le chat <Icon name="ArrowRight" size={11} />
      </span>
    </Link>
  );
}

/** Enveloppe carte blanche Bronx autour des widgets data (non modifiés). */
function CardWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="althea-card overflow-hidden" style={{ borderRadius: 24 }} data-reveal>
      {children}
    </div>
  );
}

/** StatTile — carte stat avec gros chiffre display bold (Bronx). */
function StatTile({
  icon,
  label,
  value,
  hint,
  accent,
  href,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  href?: string;
}) {
  const content = (
    <div className="althea-card p-6 h-full flex flex-col justify-between gap-7">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: accent ? "rgba(245, 65, 28, 0.1)" : "#F7F6FC" }}
        >
          <Icon name={icon} size={18} className={accent ? "text-[#F5411C]" : "text-[#4A4A4A]"} />
        </div>
        {href && <Icon name="ArrowUpRight" size={14} className="text-[#8A8A8A]" />}
      </div>
      <div>
        <div className="althea-eyebrow mb-2">{label}</div>
        <div
          className="bronx-name"
          style={{ fontSize: "clamp(36px, 3.2vw, 52px)", lineHeight: 0.95, color: accent ? "#F5411C" : "#0F0F0F" }}
        >
          {value}
        </div>
        {hint && <div className="mt-2 text-[11px] text-[#8A8A8A]">{hint}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : <div className="h-full">{content}</div>;
}
