"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Nav pill centrée façon template "Bronx" : les items suivent le scroll
 * (IntersectionObserver) et l'item actif porte une pill orange-rouge.
 * Les deux derniers items sont des liens de page (Studio / Coulisses).
 */
const SECTIONS = [
  { id: "accueil", label: "Accueil" },
  { id: "apropos", label: "À propos" },
  { id: "equipe", label: "Équipe" },
  { id: "services", label: "Services" },
  { id: "plateforme", label: "Plateforme" },
  { id: "contact", label: "Contact" },
] as const;

export function LandingNav() {
  const [active, setActive] = useState<string>("accueil");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // On prend la section visible la plus haute dans le viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 pointer-events-none">
      <nav className="bronx-nav pointer-events-auto max-w-[94vw] overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`bronx-nav-item ${active === s.id ? "active" : ""}`}
          >
            {s.label}
          </a>
        ))}
        <Link href="/dashboard" className="bronx-nav-item">
          Studio
        </Link>
      </nav>
    </header>
  );
}
