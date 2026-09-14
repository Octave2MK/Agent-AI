import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAgentBySlug, listAgents, ownedSlug } from "@/lib/agents";
import { SetupTools } from "@/components/SetupTools";
import { countDeliverables, listDeliverables } from "@/lib/deliverables";
import { getAgentUsage } from "@/lib/analytics/usage";
import { DeliverablesPanel } from "@/components/DeliverablesPanel";
import { InboxPreview, MeetingsPreview, CandidatesPreview } from "@/components/OpsContextPanels";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentTabs } from "@/components/AgentTabs";
import { ThumbnailStudio } from "@/components/ThumbnailStudio";
import { EcommerceStudio } from "@/components/EcommerceStudio";
import { ProspectionStudio } from "@/components/ProspectionStudio";
import { VeilleStudio } from "@/components/VeilleStudio";
import { PropositionStudio } from "@/components/PropositionStudio";
import { ComptaStudio } from "@/components/ComptaStudio";
import { CreativeStudio } from "@/components/CreativeStudio";
import { ContentStudio } from "@/components/ContentStudio";
import { getMeetings } from "@/lib/dataSources";
import { Icon } from "@/components/Icon";
import type { AgentSlug } from "@/lib/types";

const SUGGESTIONS: Partial<Record<AgentSlug, string[]>> = {
  orchestrateur: [
    "Je veux lancer une campagne autour de Lina (agent IA content)",
    "Prépare un post LinkedIn pour l'annonce de la Masterclass",
    "Qui devrait produire un deck pour pitcher Davide à un prospect ?",
  ],
  strategiste: [
    "Produis un brief pour lancer Lina (AI Content Creator) sur LinkedIn",
    "ICP détaillé pour les agences immobilières intéressées par Davide",
    "Positionnement concurrentiel vs Webconversion sur l'IA marketing",
  ],
  "createur-contenu": [
    "1 post LinkedIn long pour Maxim sur 'ChatGPT outil vs Davide collègue'",
    "3 hooks à tester pour une campagne Sophia (AI Executive Assistant)",
    "Un email de nurturing post-Masterclass (J+1)",
  ],
  designer: [
    "Une campagne créative complète (Higgsfield) à partir de ma marque",
    "Décline ce concept en 1:1, 4:5 et 9:16",
    "3 angles créatifs pour mon prochain lancement + plan de publication",
  ],
  analyste: [
    "Rapport LinkedIn des posts de la semaine dernière",
    "Plan d'optim 30j pour Zeyneb sur YouTube",
    "Quels KPIs prioritaires pour tracker le lancement Davide ?",
  ],
  presentateur: [
    "Deck 10 slides pour pitcher Alex à une SaaS e-commerce",
    "Deck interne 'Roadmap Q3 NAIOM' pour le board",
    "Pitch investisseur 5 slides (Problem/Solution/Market/Why now/Ask)",
  ],
  gmail: [
    "Donne-moi ma to-do du jour, priorités en tête",
    "Rédige un brouillon de réponse pour Julie Lefort (Agence Lefort)",
    "Quels prospects chauds à relancer aujourd'hui ?",
  ],
  fireflies: [
    "Résume mes calls de la semaine avec un plan d'action équipe",
    "Score BANT pour mes prospects actifs",
    "Les points de blocage qui reviennent en rendez-vous",
  ],
  proposition: [
    "Transforme mon dernier call en proposition commerciale",
    "Une proposition béton après le rendez-vous, avec 3 options chiffrées",
    "Reprends les besoins du call et prépare le PDF à envoyer au prospect",
  ],
  cv: [
    "Score les 3 candidats reçus pour le poste AI Engineer",
    "Rédige-moi un mail de refus pour Camille Durand",
    "Classe les candidats du poste Account Executive",
  ],
  ecommerce: [
    "Écris-moi un script UGC de 20 secondes pour une gourde isotherme",
    "Quel type d'avatar choisir pour vendre à des mamans 30-45 ans ?",
    "Donne-moi 3 hooks pour une vidéo Instagram sur un produit skincare",
  ],
  prospection: [
    "Aide-moi à définir mon ICP pour vendre des agents IA à des PME",
    "Améliore cet email de prospection : [colle ton email]",
    "Quelle cadence de relance pour un prospect qui n'a pas répondu ?",
  ],
  comptabilite: [
    "Fais le point de trésorerie du mois",
    "Rapport comptable du mois avec les alertes et la TVA à payer",
    "Qui me doit de l'argent et depuis quand ?",
  ],
};

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();
  // MODE TEMPLATE : accès refusé aux agents verrouillés → page « Débloquer ».
  if (agent.status === "locked") redirect("/decouvrir");

  const isPlaceholder = agent.status === "coming-soon";
  const allAgents = await listAgents();
  // On montre les autres agents dans la barre : actifs (cliquables) ET verrouillés
  // (grisés + cadenas → /decouvrir). En mode template, les autres sont "locked".
  const otherAgents = allAgents
    .filter((a) => a.slug !== agent.slug && (a.status === "active" || a.status === "locked"))
    .slice(0, 8);

  const [count, usage30d] = await Promise.all([
    agent.status === "active" && agent.slug !== "orchestrateur"
      ? countDeliverables(agent.slug)
      : Promise.resolve(0),
    getAgentUsage(agent.slug, { days: 30 }),
  ]);

  const lastDeliverable = count > 0
    ? (await listDeliverables(agent.slug as AgentSlug))[0]
    : null;

  const contextPanel =
    agent.slug === "gmail" ? <InboxPreview /> :
    agent.slug === "fireflies" ? <MeetingsPreview /> :
    agent.slug === "cv" ? <CandidatesPreview /> :
    null;

  // Studio Proposition (Victor) : branché aux calls Fireflies.
  const proposalPanel =
    agent.slug === "proposition"
      ? (
          <PropositionStudio
            calls={(await getMeetings()).data.map((m) => ({
              id: m.id,
              title: m.title,
              date: m.date,
              type: m.type,
              participants: m.participants,
              summary: m.summary,
            }))}
          />
        )
      : undefined;

  const owned = ownedSlug();

  return (
    <div className="relative min-h-screen w-full overflow-x-clip">
      {/* ============ HEADER ALTHEA (identique home / dashboard) ============ */}
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4 px-6 sm:px-10 py-6">
          <Link href="/" className="althea-logo hover:opacity-70 transition">
            naiom
          </Link>

          {/* Nav agents : ronds détourés avec head-crop, hover scale */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Autres agents">
            {otherAgents.map((a) => {
              const locked = a.status === "locked";
              return (
              <Link
                key={a.slug}
                href={locked ? "/decouvrir" : `/agents/${a.slug}`}
                className={`agent-nav-chip group relative flex items-center justify-center rounded-full h-11 w-11 shrink-0 overflow-hidden transition-transform duration-200 ease-out hover:scale-110 hover:z-50${locked ? " opacity-45 grayscale hover:opacity-70" : ""}`}
                style={{ background: "rgba(255,255,255,0.6)" }}
                aria-label={locked ? `${a.name} — verrouillé` : `${a.name} — ${a.role}`}
              >
                <AgentAvatar slug={a.slug} size={44} animate={false} aura={false} crop="head" />
                {locked && <span className="absolute inset-0 flex items-center justify-center text-[13px]">🔒</span>}
                <span className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/60 althea-card px-3 py-1.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none z-50">
                  <span className="block text-[12px] font-black tracking-tight text-[var(--color-ink)]">
                    {a.name}
                  </span>
                  <span className="block text-[10px] font-medium text-[var(--color-ink-soft)]">
                    {locked ? "Verrouillé — débloquer" : a.role}
                  </span>
                </span>
              </Link>
            );})}
          </nav>

          <div className="flex items-center gap-2">
            {/* MODE TEMPLATE : bouton pour (ré)ouvrir la config des clés à tout moment. */}
            {owned && <SetupTools slug={agent.slug} />}
            <Link href="/" className="althea-pill-cta">
              <Icon name="ArrowLeft" size={12} />
              Accueil
            </Link>
          </div>
        </div>
      </header>

      {/* ============ Layout 2 colonnes : avatar gauche sticky, panneau droite ============ */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-10 items-start">

          {/* ============ Colonne gauche : avatar + identité + stats ============ */}
          <aside className="lg:sticky lg:top-24 space-y-5">
            {/* Bloc avatar : althea-card blanche avec halo lumineux derrière le sujet */}
            <div className="relative althea-card p-6 text-center overflow-hidden">
              {/* Halo lumineux blanc Althea (remplace l'ancien halo vert) */}
              <div
                className="althea-halo"
                style={{ width: 360, height: 360, left: "50%", top: "44%" }}
                aria-hidden
              />

              <div className="relative flex justify-center" style={{ zIndex: 2 }}>
                <AgentAvatar slug={agent.slug} size={240} priority cutout zen bottomFade aura={false} />
              </div>

              <div className="relative mt-2 flex items-center justify-center gap-2 flex-wrap">
                {isPlaceholder ? (
                  <span className="chip amber">
                    <Icon name="Clock" size={10} /> Bientôt
                  </span>
                ) : (
                  <span className="chip emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En ligne
                  </span>
                )}
                <span className="chip">
                  <Icon name="Cpu" size={10} /> {agent.model}
                </span>
              </div>

              <div className="relative mt-4">
                <div className="althea-eyebrow justify-center" style={{ display: "flex" }}>
                  — {agent.role}
                </div>
                <h1 className="althea-headline mt-2" style={{ fontSize: "clamp(40px, 4vw, 56px)", lineHeight: 0.95 }}>
                  {agent.name}
                </h1>
                <p className="althea-lede mt-3 max-w-[280px] mx-auto">
                  {agent.tagline}
                </p>
              </div>
            </div>

            {/* Bloc stats compact */}
            <div className="relative althea-card p-5">
              <div className="grid grid-cols-2 gap-4">
                <StatBlock value={count.toString()} label="Livrables" />
                <StatBlock value={formatCompact(usage30d.totalTokens)} label="Tokens · 30j" />
                <StatBlock
                  value={`$ ${usage30d.totalCostUsd.toFixed(2)}`}
                  label="Coût · 30j"
                  accent
                />
                <StatBlock
                  value={
                    usage30d.messagesCount > 0
                      ? `${Math.round(usage30d.successRate * 100)} %`
                      : "—"
                  }
                  label="Succès"
                  emerald={usage30d.successRate >= 0.95 && usage30d.messagesCount > 0}
                />
              </div>
              {(lastDeliverable || usage30d.lastActivity) && (
                <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-[11px] text-[var(--color-ink-dim)]">
                  {usage30d.lastActivity && (
                    <div className="flex items-center gap-2">
                      <Icon name="Clock" size={11} />
                      <span>Actif {formatRelativeDate(usage30d.lastActivity)}</span>
                    </div>
                  )}
                  {lastDeliverable && (
                    <div className="flex items-center gap-2">
                      <Icon name="FileText" size={11} className="shrink-0" />
                      <span className="truncate">« {lastDeliverable.title} »</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon name="Wrench" size={11} />
                    <span>{agent.tools.length} outil{agent.tools.length > 1 ? "s" : ""}</span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ============ Colonne droite : tabs chat/analytics/fichiers/historique ============ */}
          <main>
            <AgentTabs
              agentSlug={agent.slug}
              agentName={agent.name}
              accent={agent.accent}
              suggestions={SUGGESTIONS[agent.slug as AgentSlug]}
              disabled={isPlaceholder}
              deliverablesCount={count}
              filesPanel={<DeliverablesPanel agentSlug={agent.slug as AgentSlug} />}
              contextPanel={contextPanel}
              thumbnailPanel={agent.slug === "designer" ? <ThumbnailStudio /> : undefined}
              videoPanel={agent.slug === "ecommerce" ? <EcommerceStudio /> : undefined}
              pipelinePanel={agent.slug === "prospection" ? <ProspectionStudio /> : undefined}
              veillePanel={agent.slug === "veille" ? <VeilleStudio /> : undefined}
              proposalPanel={proposalPanel}
              comptaPanel={agent.slug === "comptabilite" ? <ComptaStudio /> : undefined}
              creativePanel={agent.slug === "designer" ? <CreativeStudio /> : undefined}
              contentPanel={agent.slug === "createur-contenu" ? <ContentStudio /> : undefined}
            />
          </main>
        </div>
      </div>

      {/* ============ Footer Althea ============ */}
      <footer className="relative px-6 sm:px-10 py-10 border-t border-[var(--color-line)]">
        <div className="mx-auto max-w-[1400px] flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--color-ink-soft)]">
          <span className="althea-logo" style={{ fontSize: 22 }}>naiom</span>
          <span>NAIOM L.L.C-FZ · Dubaï · © 2026</span>
          <Link href="/" className="hover:text-[var(--color-ink)] transition">
            Retour à l&apos;accueil
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ================= Composants UI ================= */

function StatBlock({
  value,
  label,
  accent,
  emerald,
}: {
  value: string;
  label: string;
  accent?: boolean;
  emerald?: boolean;
}) {
  return (
    <div>
      <div
        className={
          "text-[26px] leading-none h-display truncate " +
          (accent ? "text-[var(--color-accent)]" : emerald ? "text-emerald-300" : "text-[var(--color-ink)]")
        }
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-dim)]">
        {label}
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + " k";
  return n.toString();
}

function formatRelativeDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
