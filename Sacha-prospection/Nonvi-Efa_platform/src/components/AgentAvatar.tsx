"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { AVATAR_MAP, DEFAULT_AVATAR, agentGlow } from "@/lib/agentsUI";

// Re-export helper (consommateurs legacy)
export { agentGlow } from "@/lib/agentsUI";

interface AvatarProps {
  slug: string;
  size?: number;
  className?: string;
  /** Animation "alive" : respiration + wave périodique. Par défaut true. */
  animate?: boolean;
  /** Aura verte pulsante derrière l'avatar. Par défaut true pour les gros avatars (size ≥ 100). */
  aura?: boolean;
  priority?: boolean;
  /**
   * Détoure les PNG Funko à fond blanc via mix-blend-mode (le blanc devient
   * invisible sur n'importe quel fond pastel). Par défaut true — la refonte
   * Althea attend des sujets sans rectangle blanc autour.
   */
  cutout?: boolean;
  /**
   * Fait fondre le bas de l'avatar dans le fond (mask-image gradient).
   * Réservé au hero où le sujet doit se dissoudre, comme dans la vidéo Althea.
   */
  bottomFade?: boolean;
  /**
   * Animation calme façon Althea (respiration 7s sans wave). Si activé,
   * remplace l'animation "alive" plus expressive.
   */
  zen?: boolean;
  /**
   * Cadrage : "full" (pleine figurine, par défaut) ou "head" (visage seul,
   * pour les petits avatars en cluster / chip — la figurine est zoomée et
   * recadrée pour ne montrer que la tête, comme les profile pics Althea).
   */
  crop?: "full" | "head";
}

export function AgentAvatar({
  slug,
  size = 120,
  className,
  animate = true,
  aura,
  priority,
  cutout = true,
  bottomFade = false,
  zen = false,
  crop = "full",
}: AvatarProps) {
  const src = AVATAR_MAP[slug] ?? DEFAULT_AVATAR;
  // L'aura verte est désactivée par défaut quand on détoure (la palette
  // Althea n'a pas de halo coloré derrière le sujet).
  const showAura = aura ?? (size >= 100 && !cutout);

  // Les PNG Funko sont maintenant VRAIMENT détourés (background transparent
  // via rembg, voir public/avatars/funko-*.png). Plus besoin de mix-blend-mode :
  // le sujet est déjà isolé proprement avec son alpha-channel. La prop
  // `cutout` reste pour la compat (et désactive la drop-shadow par défaut).
  //
  // z-index: 1 + position: relative garantit que l'avatar passe AU-DESSUS
  // d'un halo lumineux frère (`.althea-halo` est en z-index: 0 et son centre
  // blanc opaque effacerait sinon le visage du Funko).
  const outerStyle: React.CSSProperties = {
    width: size,
    height: size,
    position: "relative",
    zIndex: 1,
    ...(crop === "head" ? { overflow: "hidden" } : null),
  };

  // En mode head-crop, on zoome sur la tête et on la recadre au CENTRE du
  // wrapper. La tête des Funko (image 3:2 landscape, rendue letterboxée par
  // object-contain) se trouve naturellement vers y=37% du wrapper. Pour
  // l'amener à y=50% en zoomant ×S, il faut translateY(T) avec T = (50−37)×S
  // EN APPLIQUANT scale AVANT translate (= ordre CSS `translateY(...) scale(...)`,
  // qui matriciellement applique scale d'abord puis translate sur le point).
  //
  // Bug précédent : `scale(S) translateY(-22%)` faisait translate-EN-PREMIER
  // (multiplié par le scale ensuite), donc la tête finissait hors-écran et il
  // ne restait visibles que les pieds.
  const innerCropStyle: React.CSSProperties =
    crop === "head"
      ? {
          // S = 2.8 (zoom assez serré pour bien voir la tête) ; T = 13 × 2.8 ≈ 36 %
          transform: "translateY(36%) scale(2.8)",
          transformOrigin: "50% 50%",
        }
      : { transformOrigin: "50% 85%" };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={outerStyle}
    >
      {showAura && (
        <div
          className="avatar-aura-green pointer-events-none absolute rounded-full"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center w-full h-full",
          // En mode head-crop, on ne joue pas la zen breathing (la scale du crop
          // est dominante, l'animation serait à peine visible et risquerait de
          // découper la tête en dehors du wrapper)
          animate && crop !== "head" && (zen ? "avatar-zen" : "avatar-alive")
        )}
        style={{ ...innerCropStyle }}
      >
        <Image
          src={src}
          alt={`Avatar ${slug}`}
          width={size}
          height={size}
          priority={priority}
          className={cn(
            "object-contain",
            !cutout && "drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]",
            bottomFade && "avatar-bottom-fade"
          )}
          style={{
            width: size,
            height: size,
          }}
        />
      </div>
    </div>
  );
}
