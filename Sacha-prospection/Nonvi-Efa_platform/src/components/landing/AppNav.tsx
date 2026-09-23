import Link from "next/link";

/**
 * Nav pill des pages internes (Studio, Coulisses, Calendrier, Connexions,
 * pages agents) — même langage que la nav de la landing : pill blanche
 * flottante centrée, item actif en orange-rouge Bronx.
 * Composant serveur : l'état actif est passé en prop (pas de scroll-spy ici).
 */
const LINKS = [
  { href: "/", label: "Accueil", key: "accueil" },
  { href: "/dashboard", label: "Studio", key: "studio" },
  { href: "/bases", label: "Les bases", key: "bases" },
  { href: "/live", label: "Coulisses", key: "coulisses" },
  { href: "/calendrier", label: "Calendrier", key: "calendrier" },
  { href: "/install", label: "Installer", key: "install" },
  { href: "/vps", label: "Héberger", key: "vps" },
  { href: "/settings", label: "Connexions", key: "connexions" },
] as const;

export type AppNavKey = (typeof LINKS)[number]["key"] | "agents";

export function AppNav({ active }: { active: AppNavKey }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 pointer-events-none">
      <nav className="bronx-nav pointer-events-auto max-w-[94vw] overflow-x-auto no-scrollbar">
        {LINKS.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className={`bronx-nav-item ${active === l.key ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
