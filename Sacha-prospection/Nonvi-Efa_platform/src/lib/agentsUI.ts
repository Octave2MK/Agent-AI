/**
 * UI helpers agent-specific, utilisables côté client ET serveur.
 * (Pas de directive "use client" — pure fonctions utilitaires.)
 */

/**
 * Couleur halo / glow par agent, pour les cards et arrière-plans des avatars.
 * Palette Nonvi-Efa + variantes cohérentes par métier.
 */
export function agentGlow(slug: string): string {
  switch (slug) {
    case "orchestrateur":
      return "rgba(232, 70, 31, 0.35)"; // orange
    case "strategiste":
      return "rgba(180, 100, 211, 0.3)"; // purple
    case "createur-contenu":
      return "rgba(245, 116, 171, 0.3)"; // pink
    case "designer":
      return "rgba(245, 116, 68, 0.3)"; // orange clair
    case "analyste":
      return "rgba(96, 165, 250, 0.3)"; // sky
    case "presentateur":
      return "rgba(232, 70, 31, 0.3)";
    case "gmail":
      return "rgba(245, 158, 11, 0.3)"; // amber
    case "fireflies":
      return "rgba(180, 100, 211, 0.3)";
    case "cv":
      return "rgba(16, 185, 129, 0.3)"; // emerald
    case "proposition":
      return "rgba(16, 185, 129, 0.32)"; // emerald (deals gagnés)
    case "comptabilite":
      return "rgba(96, 165, 250, 0.3)"; // blue (chiffres)
    default:
      return "rgba(232, 70, 31, 0.3)";
  }
}

/**
 * Mapping agent → fichier avatar dans /public/avatars/.
 * Cache-bust via query `?v=` : bump à chaque remplacement d'image pour forcer
 * les navigateurs à recharger (sinon Safari/Chrome gardent la version précédente).
 */
const AVATAR_VERSION = "5-cutout"; // refonte Althea — figurines Funko Pop détourées par rembg (juin 2026)
const v = `?v=${AVATAR_VERSION}`;

export const AVATAR_MAP: Record<string, string> = {
  orchestrateur: `/avatars/bearded-headset.png${v}`,
  strategiste: `/avatars/glasses-pen.png${v}`,
  "createur-contenu": `/avatars/beanie-notebook.png${v}`,
  designer: `/avatars/glasses-tablet.png${v}`,
  analyste: `/avatars/glasses-pen.png${v}`, // partagé avec stratège
  presentateur: `/avatars/clean-headset.png${v}`,
  gmail: `/avatars/funko-curly-phone.png${v}`,
  fireflies: `/avatars/bearded-headset.png${v}`, // partagé avec orchestrateur
  cv: `/avatars/suit-headset.png${v}`,
  ecommerce: `/avatars/funko-curly-phone.png${v}`, // partagé avec gmail
  prospection: `/avatars/glasses-pen.png${v}`, // partagé avec stratège
  proposition: `/avatars/bearded-headset.png${v}`, // closer confiant
  comptabilite: `/avatars/suit-headset.png${v}`, // rigueur / chiffres
};

export const DEFAULT_AVATAR = `/avatars/funko-clean-wave.png${v}`;
