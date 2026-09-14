import Link from "next/link";
import { CalendarGrid } from "@/components/CalendarGrid";
import { Icon } from "@/components/Icon";
import { readStore } from "@/lib/ecommerce/store";
import type { CalendarSlot } from "@/lib/types";

export const metadata = {
  title: "Calendrier · naiom",
  description:
    "Calendrier éditorial multi-canal : programmation, cohérence campagne, validation avant envoi.",
};

export const dynamic = "force-dynamic";

/**
 * /calendrier — Vue calendrier éditorial. Refonte Althea (juin 2026) :
 * top nav identique aux autres pages, titre serif éditorial, althea-cards
 * avec aura lumineuse autour du grid + 3 info-cards.
 */
export default async function CalendrierPage() {
  // Vidéos Instagram programmées depuis le Studio vidéo (agente e-commerce)
  const ecomStore = await readStore();
  const videoSlots: CalendarSlot[] = ecomStore.videos
    .filter((v) => v.scheduled)
    .map((v) => ({
      day: v.scheduled!.day,
      channel: "Instagram" as const,
      time: v.scheduled!.time,
      title: `🎬 ${v.title}`,
      author: "Emma",
      status: "programmé" as const,
    }));

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* ============ HEADER (identique home / dashboard / live) ============ */}
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4 px-6 sm:px-10 py-6">
          <Link href="/" className="althea-logo hover:opacity-70 transition">
            naiom
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="althea-nav-link">Accueil</Link>
            <Link href="/live" className="althea-nav-link">Coulisses</Link>
            <Link href="/dashboard" className="althea-nav-link">Studio</Link>
            <Link href="/calendrier" className="althea-nav-link" aria-current="page">Calendrier</Link>
          </nav>
          <Link href="/dashboard" className="althea-pill-cta">
            Ouvrir le studio
          </Link>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative px-6 sm:px-10 pt-10 sm:pt-16 pb-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="althea-eyebrow mb-3">— Calendrier · multi-canal</div>
          <h1 className="althea-headline althea-text-halo" style={{ fontSize: "clamp(40px, 6vw, 88px)" }}>
            Calendrier <em>éditorial.</em>
          </h1>
          <p className="althea-lede mt-5 max-w-[560px]">
            Programmation des publications LinkedIn, YouTube et email — une vue qui suit la cadence du brief Stratège.
            Aperçu en lecture seule pour l&apos;instant.
          </p>
        </div>
      </section>

      {/* ============ CALENDAR GRID ============ */}
      <section className="relative px-6 sm:px-10 pb-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="relative">
            <div
              className="althea-halo"
              style={{ width: "60%", height: "60%", left: "50%", top: "50%", opacity: 0.5 }}
              aria-hidden
            />
            <div className="relative althea-card p-4 sm:p-6 overflow-hidden" style={{ borderRadius: 22 }}>
              <CalendarGrid extraSlots={videoSlots} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ 3 INFO-CARDS (Althea style) ============ */}
      <section className="relative px-6 sm:px-10 pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
            <div>
              <div className="althea-eyebrow mb-3">— Comment ça marche</div>
              <h2 className="althea-headline" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
                Trois principes <em>simples.</em>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InfoCard
              num="01"
              icon="Send"
              title="Publication automatique"
              body="Les publications marquées « Programmé » seront bientôt poussées automatiquement vers LinkedIn, YouTube et l'email."
            />
            <InfoCard
              num="02"
              icon="GitBranch"
              title="Cohérence campagne"
              body="Le calendrier reprend la cadence recommandée dans le brief de campagne produit par le Stratège — tout s'enchaîne."
            />
            <InfoCard
              num="03"
              icon="ClipboardCheck"
              title="Validation avant envoi"
              body="Rien ne part sans votre validation : chaque publication passe de « Brouillon » à « Programmé » sur approbation."
            />
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
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

/* =================================================================
   COMPOSANTS LOCAUX
   ================================================================= */

function InfoCard({
  num,
  icon,
  title,
  body,
}: {
  num: string;
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative">
      <div
        className="althea-halo"
        style={{ width: "85%", height: "85%", left: "50%", top: "50%", opacity: 0.6 }}
        aria-hidden
      />
      <div className="relative althea-card p-7 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "rgba(244, 240, 252, 0.9)" }}
          >
            <Icon name={icon} size={18} className="text-[var(--color-ink-soft)]" />
          </div>
          <span className="althea-step-num" style={{ fontSize: 22, margin: 0 }}>{num}</span>
        </div>
        <h3 className="althea-headline" style={{ fontSize: "clamp(22px, 2vw, 28px)" }}>
          {title}
        </h3>
        <p className="althea-lede mt-3 flex-1" style={{ fontSize: 14 }}>
          {body}
        </p>
      </div>
    </div>
  );
}
