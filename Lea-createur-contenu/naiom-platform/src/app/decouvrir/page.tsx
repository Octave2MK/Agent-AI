import Link from "next/link";
import { listAgents, ownedSlug } from "@/lib/agents";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Icon } from "@/components/Icon";
import { BrainGate } from "./BrainGate";

/**
 * Page « Débloquer les autres agents ».
 * Roadmap de sortie : certains agents sont OFFERTS à une date, les autres se
 * débloquent en rejoignant brAIn. (Aucun lien email.)
 */

// Agents offerts gratuitement à une date (les autres → rejoindre brAIn)
const RELEASE: Record<string, string> = {
  "createur-contenu": "13 septembre", // Léa
  ecommerce: "13 septembre",           // Emma
  prospection: "14 septembre",         // Sacha
  fireflies: "14 septembre",           // Jules
  proposition: "14 septembre",         // Victor
  veille: "14 septembre",              // Nina
};

export default async function DecouvrirPage() {
  const agents = await listAgents();
  const owned = ownedSlug();
  const mine = agents.find((a) => a.slug === owned) ?? null;
  const others = agents.filter((a) => a.slug !== owned);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip">
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4 px-6 sm:px-10 py-6">
          <Link href="/" className="althea-logo hover:opacity-70 transition">naiom</Link>
          {mine && (
            <Link href={`/agents/${mine.slug}`} className="althea-pill-cta">
              <Icon name="ArrowLeft" size={12} />
              Retour à {mine.name}
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-20">
        {/* Intro */}
        <section className="pt-6 pb-10 text-center max-w-3xl mx-auto">
          <span className="chip emerald mx-auto"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ton équipe IA</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-[var(--color-ink)]">
            Une équipe complète d&apos;employés IA
          </h1>
          <p className="mt-4 text-[15px] text-[var(--color-ink-soft)]">
            Tu as débloqué <b className="text-[var(--color-ink)]">{mine ? mine.name : "un agent"}</b>. De nouveaux agents
            sont <b className="text-[var(--color-ink)]">offerts les 13 et 14 septembre</b> — les autres se débloquent en
            rejoignant <b className="text-[var(--color-accent)]">brAIn</b>.
          </p>
        </section>

        {/* Ton agent — actif */}
        {mine && (
          <section className="mb-10">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)] mb-3 px-1">
              Ton agent — débloqué
            </div>
            <Link href={`/agents/${mine.slug}`} className="block althea-card p-6 hover-lift border-2 border-[var(--color-accent)]/40">
              <div className="flex items-center gap-5">
                <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-white/60">
                  <AgentAvatar slug={mine.slug} size={80} crop="head" aura={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-[var(--color-ink)]">{mine.name}</span>
                    <span className="chip emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En ligne</span>
                  </div>
                  <div className="text-[13px] font-bold text-[var(--color-accent)]">{mine.role}</div>
                  <div className="text-[13px] text-[var(--color-ink-soft)] mt-0.5">{mine.tagline}</div>
                </div>
                <Icon name="ArrowRight" size={20} />
              </div>
            </Link>
          </section>
        )}

        {/* Les autres */}
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)] mb-3 px-1">
          Les autres agents
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {others.map((a) => {
            const date = RELEASE[a.slug];
            return (
              <div key={a.slug} className="relative althea-card p-5 overflow-hidden">
                <div className="flex items-center gap-4 opacity-55 grayscale">
                  <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-white/50">
                    <AgentAvatar slug={a.slug} size={64} crop="head" aura={false} animate={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-black tracking-tight text-[var(--color-ink)] truncate">{a.name}</div>
                    <div className="text-[12px] font-bold text-[var(--color-ink-soft)]">{a.role}</div>
                    <div className="text-[12px] text-[var(--color-muted)] truncate">{a.tagline}</div>
                  </div>
                </div>

                {date ? (
                  <>
                    <div className="absolute top-3 right-3 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">OFFERT</div>
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 px-4 py-2.5 text-[13px] font-bold text-[var(--color-accent)]">
                      <Icon name="Calendar" size={14} /> Disponible le {date}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-black/5 text-[15px] shadow-sm">🔒</div>
                    <BrainGate />
                  </>
                )}
              </div>
            );
          })}
        </section>

        <p className="mt-10 text-center text-[12px] text-[var(--color-muted)]">
          Agents offerts les 13 &amp; 14 septembre. Les autres se débloquent en rejoignant brAIn.
        </p>
      </main>
    </div>
  );
}
