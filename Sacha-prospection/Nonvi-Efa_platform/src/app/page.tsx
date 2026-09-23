import Link from "next/link";
import { redirect } from "next/navigation";
import { listAgents, ownedSlug } from "@/lib/agents";
import { countDeliverables } from "@/lib/deliverables";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Icon } from "@/components/Icon";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import {
  ShapeSphere,
  ShapePyramid,
  ShapeStar,
  ShapeBlob,
  ShapeCylinder,
  ShapeCube,
  ShapeCubeBlue,
} from "@/components/landing/Shapes";
import type { AgentMeta } from "@/lib/types";

/**
 * Nonvi-Efa · Homepage — Edition Bronx (juillet 2026).
 *
 * Refonte type template Framer "Roxy/Bronx" : fond blanc pur, nav pill
 * centrée (actif orange-rouge), hero avec marquee typographique géant qui
 * défile derrière la carte avatar violette, formes 3D colorées flottantes,
 * flip-cards équipe, services à numéros fantômes, footer wordmark géant.
 * Parcours : landing → Studio (/dashboard, le SaaS agents+chat) →
 * Coulisses (/live, la visualisation de la plateforme pour le live).
 */
// MODE TEMPLATE : l'agent débloqué est lu au runtime (OWNED_AGENT) → pas de figé.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // MODE TEMPLATE (offre séparée) : ouvre directement l'agent débloqué.
  const owned = ownedSlug();
  if (owned) redirect(`/agents/${owned}`);

  const agents = await listAgents();
  const counts = await Promise.all(
    agents.map(async (a) =>
      a.status === "active" && a.slug !== "orchestrateur" ? await countDeliverables(a.slug) : 0
    )
  );
  const totalDeliverables = counts.reduce((s, c) => s + c, 0);
  const team = agents.filter((a) => a.slug !== "orchestrateur");

  return (
    <div className="bronx-page min-h-screen w-full">
      <LandingNav />
      <ScrollReveal />

      {/* ================= HERO ================= */}
      <section id="accueil" className="relative flex flex-col items-center px-6 pt-28 sm:pt-32 pb-24 min-h-screen justify-center">
        {/* Marquee typographique géant — derrière la carte avatar */}
        <div
          className="bronx-marquee absolute left-0 right-0 z-0"
          style={{ top: "48%", transform: "translateY(-50%)" }}
        >
          <div className="bronx-marquee-inner">
            {[0, 1].map((i) => (
              <span key={i} className="bronx-marquee-text" style={{ fontSize: "clamp(110px, 15vw, 240px)" }}>
                ÉQUIPE&nbsp;IA&nbsp;✦&nbsp;EMPLOYÉS&nbsp;IA&nbsp;✦&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* Formes 3D flottantes */}
        <ShapePyramid className="bronx-shape bronx-float-a hidden sm:block" style={{ top: "16%", left: "12%" }} size={150} />
        <ShapeStar className="bronx-shape bronx-float-b hidden sm:block" style={{ top: "14%", right: "11%" }} size={155} />
        <ShapeSphere className="bronx-shape bronx-float-c hidden sm:block" style={{ top: "40%", left: "17%" }} size={135} />
        <ShapeBlob className="bronx-shape bronx-float-a hidden sm:block" style={{ top: "42%", right: "18%" }} size={125} />
        <ShapeCylinder className="bronx-shape bronx-float-b hidden sm:block" style={{ bottom: "14%", left: "20%" }} size={150} />
        <ShapeCube className="bronx-shape bronx-float-c hidden sm:block" style={{ bottom: "13%", right: "16%" }} size={145} />

        {/* Contenu central */}
        <div className="relative z-10 flex flex-col items-center text-center bronx-fade-up">
          <h1 className="bronx-hero-title">
            Salut, on est <em>Nonvi-Efa</em>&nbsp;!
          </h1>
          <div className="bronx-rotator mt-2 w-[320px]">
            <span>Agents IA sur mesure</span>
            <span>Automatisations n8n</span>
            <span>Connectés à vos outils</span>
            <span>Une équipe qui ne dort jamais</span>
          </div>

          {/* Carte avatar violette (Noam, l'orchestrateur) — dit hello au survol */}
          <div className="bronx-avatar-card group mt-7 flex items-end justify-center">
            <span className="bronx-hello-bubble" style={{ top: 16 }}>
              Hello, moi c&apos;est Noam&nbsp;👋
            </span>
            <div className="bronx-hello-target" style={{ marginBottom: -26 }}>
              <AgentAvatar slug="orchestrateur" size={385} priority cutout zen aura={false} />
            </div>
          </div>

          {/* Trust signal — cluster d'agents */}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center">
              {(["strategiste", "designer", "createur-contenu"] as const).map((slug, i) => (
                <span
                  key={slug}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white"
                  style={{
                    background: ["#BEEBD2", "#F6CEDD", "#CEDFF6"][i],
                    marginLeft: i === 0 ? 0 : -8,
                  }}
                >
                  <AgentAvatar slug={slug} size={36} animate={false} cutout aura={false} crop="head" />
                </span>
              ))}
            </div>
            <span className="text-[13.5px] font-semibold text-[#3A3A3A]">
              {team.length + 1} employés IA en ligne · {totalDeliverables}+ livrables
            </span>
          </div>

          {/* CTA */}
          <Link href="/dashboard" className="bronx-cta mt-7">
            Entrer dans le studio
            <span className="bronx-cta-arrow">
              <Icon name="ArrowRight" size={17} />
            </span>
          </Link>
        </div>
      </section>

      {/* ================= À PROPOS ================= */}
      <section id="apropos" className="relative px-6 py-28">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="bronx-h2 mb-16" data-reveal>À propos</h2>
          <div className="relative mx-auto max-w-[760px]" data-reveal style={{ transitionDelay: "120ms" }}>
            <div className="bronx-about-blob" aria-hidden />
            <div className="bronx-about-card px-8 sm:px-14 py-12 sm:py-14">
              <p className="bronx-body" style={{ fontSize: "clamp(16px, 1.4vw, 19px)" }}>
                Nonvi-Efa est une <strong>agence d&apos;ingénierie d&apos;agents IA</strong>. On conçoit,
                déploie et transmet des agents connectés à vos vrais outils — CRM, boîte mail,
                Drive, YouTube — et des automatisations n8n qui exécutent le travail répétitif
                pendant que vous dormez. Pas de POC abandonné&nbsp;: après le hand-off, vous
                gardez les clefs et vous opérez en autonomie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ÉQUIPE (flip-cards) ================= */}
      <section id="equipe" className="relative px-6 py-28">
        {/* Cube vert flottant derrière la grille (comme la section Stack) */}
        <ShapeStar className="bronx-shape bronx-float-b hidden lg:block" style={{ top: "8%", right: "7%", opacity: 0.9 }} size={110} />
        <div className="mx-auto max-w-[1150px]">
          <div className="text-center mb-14" data-reveal>
            <h2 className="bronx-h2">
              L&apos;équipe — <em>onze employés IA</em>
            </h2>
            <p className="bronx-body mt-4 mx-auto max-w-[520px]">
              Chaque employé IA a un rôle, ses outils et son panneau de contrôle.
              Survolez pour retourner la carte, cliquez pour l&apos;ouvrir.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {team.map((agent, i) => (
              <TeamFlipCard key={agent.slug} agent={agent} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="relative px-6 py-28">
        <ShapeCubeBlue className="bronx-shape bronx-float-c hidden lg:block" style={{ top: "34%", left: "48%" }} size={110} />
        <ShapeSphere className="bronx-shape bronx-float-a hidden lg:block" style={{ top: "68%", right: "9%", opacity: 0.85 }} size={90} />
        <div className="mx-auto max-w-[1100px]">
          <h2 className="bronx-h2 text-center mb-20" data-reveal>Services</h2>

          <div className="flex flex-col gap-24">
            <ServiceRow
              num="01"
              title="Agents IA sur mesure"
              text="Des agents connectés à vos vrais outils, chacun avec un rôle précis, des règles métier et des garde-fous. Pas de chatbot gadget : un collègue numérique qui produit des livrables — briefs, posts, rapports, decks."
            />
            <ServiceRow
              num="02"
              title="Automatisations n8n"
              text="Des workflows qui relient vos applications entre elles et exécutent le travail répétitif : synchronisation de données, relances, reporting. Ça tourne 24/7, sans intervention humaine."
            />
            <ServiceRow
              num="03"
              title="Intégrations & données"
              text="Gmail, Google Drive, YouTube, Fireflies… vos données alimentent les agents en direct, sans copier-coller. Chaque livrable s'appuie sur vos vraies données, jamais sur des chiffres inventés."
            />
            <ServiceRow
              num="04"
              title="Une équipe d'employés IA"
              text="Un studio complet comme celui-ci : chat avec chaque employé IA, livrables archivés, analytics, calendrier de production. Toute votre équipe IA au même endroit."
            />
            <ServiceRow
              num="05"
              title="Formation & hand-off"
              text="Documentation, formation de votre équipe, transfert complet des clefs. Après 30 jours d'accompagnement, vous opérez en autonomie totale."
            />
          </div>
        </div>
      </section>

      {/* ================= PLATEFORME (style Projects) ================= */}
      <section id="plateforme" className="relative px-6 py-28">
        <div className="mx-auto max-w-[1150px]">
          <div className="text-center mb-14" data-reveal>
            <h2 className="bronx-h2">
              La plateforme, <em>en vrai</em>
            </h2>
            <p className="bronx-body mt-4 mx-auto max-w-[520px]">
              Pas de mockup : ces pages tournent en live. Entrez dans le studio,
              ou regardez comment tout a été construit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <ProjectCard
              href="/dashboard"
              label="Le SaaS"
              name="Le Studio — agents, chats & livrables"
              variant="studio"
              index={0}
            />
            <ProjectCard
              href="/live"
              label="Behind the scenes"
              name="Coulisses — comment c'est construit"
              variant="coulisses"
              index={1}
            />
            <ProjectCard
              href="/calendrier"
              label="Production"
              name="Calendrier — la semaine planifiée"
              variant="calendrier"
              index={2}
            />
            <ProjectCard
              href="/settings"
              label="Intégrations"
              name="Connexions — Google, YouTube, Fireflies"
              variant="connexions"
              index={3}
            />
          </div>
        </div>
      </section>

      {/* ================= FOOTER / CONTACT ================= */}
      <footer id="contact" className="relative px-6 pt-24 pb-0">
        <div className="mx-auto max-w-[1150px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10" data-reveal>
            <div>
              <div className="bronx-footer-h mb-5">Contact</div>
              <div className="flex flex-col gap-3">
                <a href="mailto:moreloctave1@gmail.com" className="bronx-footer-link">Réserver un call</a>
                <a href="mailto:moreloctave1@gmail.com" className="bronx-footer-link">Nonvi-Efaagency@gmail.com</a>
              </div>
            </div>
            <div>
              <div className="bronx-footer-h mb-5">Liens utiles</div>
              <div className="flex flex-col gap-3">
                <Link href="/dashboard" className="bronx-footer-link">Studio</Link>
                <Link href="/live" className="bronx-footer-link">Coulisses</Link>
                <Link href="/calendrier" className="bronx-footer-link">Calendrier</Link>
                <Link href="/settings" className="bronx-footer-link">Connexions</Link>
              </div>
            </div>
            <div>
              <div className="bronx-footer-h mb-5">Social</div>
              <div className="flex flex-col gap-3">
                <a href="#" className="bronx-footer-link">LinkedIn</a>
                <a href="#" className="bronx-footer-link">YouTube</a>
                <a href="#" className="bronx-footer-link">Instagram</a>
              </div>
            </div>
            <div>
              <div className="bronx-footer-h mb-5">Légal</div>
              <div className="flex flex-col gap-3">
                <a href="#" className="bronx-footer-link">Confidentialité</a>
                <a href="#" className="bronx-footer-link">Mentions légales</a>
              </div>
            </div>
          </div>

          <div className="mt-16 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[13px] text-[#8A8A8A]">
            <span>© 2026 Nonvi-Efa L.L.C-FZ · Dubaï</span>
            <span>Conçu par l&apos;équipe Nonvi-Efa</span>
          </div>
        </div>

        {/* Wordmark géant coupé en bas (signature du template) */}
        <div className="overflow-hidden">
          <div className="bronx-giant-word text-center" style={{ transform: "translateY(26%)", fontSize: "clamp(60px, 11vw, 190px)" }}>
            ÉQUIPE&nbsp;IA
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =================================================================
   ★ COMPOSANTS — Bronx
   ================================================================= */

/** Palette pastel des cartes équipe — un fond coloré par agent (vibe vidéo). */
const TEAM_CARD_COLORS = [
  "#EDE9FF", // lilas
  "#FFE9DC", // pêche
  "#DFF6EA", // menthe
  "#FFE3EE", // rose
  "#E0F0FF", // ciel
  "#FFF3D1", // vanille
  "#EAF9DF", // citron vert pâle
  "#F3E8FF", // mauve
];

/** Carte équipe : recto avatar + nom, verso rôle + tagline (flip au survol). */
function TeamFlipCard({ agent, index }: { agent: AgentMeta; index: number }) {
  const bg = TEAM_CARD_COLORS[index % TEAM_CARD_COLORS.length];
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group block bronx-tile"
      data-reveal
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      <div className="bronx-flip">
        <div className="bronx-flip-inner">
          <div className="bronx-flip-face" style={{ background: bg, borderColor: bg }}>
            <div className="bronx-agent-float">
              <AgentAvatar slug={agent.slug} size={150} animate={false} cutout aura={false} />
            </div>
            <div className="bronx-name mt-4">{agent.name}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8A8A]">
              {agent.role}
            </div>
          </div>
          <div className="bronx-flip-face bronx-flip-back">
            {/* L'agent dit hello côté verso : petit avatar qui salue + bulle */}
            <div className="bronx-hello-target -mt-1">
              <AgentAvatar slug={agent.slug} size={82} animate={false} cutout aura={false} />
            </div>
            <div className="bronx-name mt-2" style={{ fontSize: 17 }}>
              Hello, moi c&apos;est {agent.name}&nbsp;👋
            </div>
            <p className="mt-2 text-center text-[12.5px] leading-[1.55] text-[#5A5A5A]">
              {agent.tagline}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F5411C] px-4 py-2 text-[12.5px] font-bold text-white">
              Ouvrir l&apos;agent
              <Icon name="ArrowRight" size={13} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Rangée service : numéro fantôme géant + titre à gauche, texte à droite. */
function ServiceRow({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-16" data-reveal>
      <div className="relative">
        <div className="bronx-ghost-num">{num}</div>
        <div className="bronx-service-title absolute bottom-2 left-1">{title}</div>
      </div>
      <p className="bronx-body" style={{ transitionDelay: "100ms" }}>{text}</p>
    </div>
  );
}

/** Carte "projet" avec mini-mockup CSS de la page réelle. */
function ProjectCard({
  href,
  label,
  name,
  variant,
  index = 0,
}: {
  href: string;
  label: string;
  name: string;
  variant: "studio" | "coulisses" | "calendrier" | "connexions";
  index?: number;
}) {
  return (
    <Link
      href={href}
      className="bronx-project group"
      data-reveal
      style={{ transitionDelay: `${(index % 2) * 100}ms` }}
    >
      <div className="bronx-project-shot">
        <MiniShot variant={variant} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bronx-view-pill">
            Voir la page
            <span className="dot-arrow">
              <Icon name="ArrowRight" size={14} />
            </span>
          </span>
        </div>
      </div>
      <div className="px-3 pt-5 pb-3">
        <div className="bronx-project-label">{label}</div>
        <div className="bronx-project-name mt-1.5">{name}</div>
      </div>
    </Link>
  );
}

/** Mini-mockups CSS des vraies pages (pas d'images à maintenir). */
function MiniShot({ variant }: { variant: "studio" | "coulisses" | "calendrier" | "connexions" }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col">
      {/* Barre fenêtre */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
      </div>

      {variant === "studio" && (
        <div className="flex-1 flex gap-3">
          <div className="w-12 flex flex-col gap-2">
            {["#5B4DEE", "#F5411C", "#7DDFD3", "#F7BC55", "#B87FF5"].map((c) => (
              <span key={c} className="h-8 w-8 rounded-xl" style={{ background: c, opacity: 0.9 }} />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-2.5 pt-1">
            <span className="h-3 w-2/5 rounded-full bg-white/25" />
            <span className="h-10 w-4/5 rounded-2xl bg-white/12" />
            <span className="h-10 w-3/5 self-end rounded-2xl bg-[#5B4DEE]/80" />
            <span className="h-10 w-2/3 rounded-2xl bg-white/12" />
          </div>
        </div>
      )}

      {variant === "coulisses" && (
        <div className="flex-1 flex flex-col justify-center gap-3.5 px-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5411C] text-[11px] font-bold text-white">
                {n}
              </span>
              <span className="h-2.5 rounded-full bg-white/20" style={{ width: `${78 - n * 12}%` }} />
            </div>
          ))}
        </div>
      )}

      {variant === "calendrier" && (
        <div className="flex-1 grid grid-cols-7 gap-1.5 content-center px-1">
          {Array.from({ length: 21 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-md"
              style={{
                background:
                  i % 6 === 2 ? "rgba(245,65,28,0.85)" : i % 8 === 5 ? "rgba(91,77,238,0.85)" : "rgba(255,255,255,0.10)",
              }}
            />
          ))}
        </div>
      )}

      {variant === "connexions" && (
        <div className="flex-1 flex flex-col justify-center gap-3 px-2">
          {[
            ["Google", "#28C840"],
            ["YouTube", "#FF5F57"],
            ["Fireflies", "#B87FF5"],
          ].map(([name, color]) => (
            <div key={name} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="text-[12px] font-semibold text-white/85">{name}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/70">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color as string }} />
                Connecté
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
