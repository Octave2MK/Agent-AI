"use client";

import { useEffect } from "react";

/**
 * Révèle au scroll tous les éléments portant [data-reveal] : la classe
 * `revealed` déclenche la transition définie dans globals.css.
 * À monter une fois par page (rend null). Un délai de stagger peut être
 * donné en inline style via `transitionDelay`.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
