/**
 * Formes 3D décoratives de la landing "Bronx" — SVG avec rendu "clay 3D" :
 * dégradés multi-stops, reflets spéculaires floutés, ombres internes
 * (core shadow) clipées dans la forme, lumière réfléchie en contre-jour.
 * Zéro asset externe, composants serveur.
 */

type ShapeProps = { size?: number; className?: string; style?: React.CSSProperties };

export function ShapeSphere({ size = 140, className, style }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="sph-b" cx="34%" cy="26%" r="85%">
          <stop offset="0%" stopColor="#F3E6FF" />
          <stop offset="28%" stopColor="#CFA1FA" />
          <stop offset="60%" stopColor="#A264EC" />
          <stop offset="88%" stopColor="#7434C8" />
          <stop offset="100%" stopColor="#5F259F" />
        </radialGradient>
        <radialGradient id="sph-rim" cx="50%" cy="88%" r="55%">
          <stop offset="0%" stopColor="#C89DF7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#C89DF7" stopOpacity="0" />
        </radialGradient>
        <filter id="sph-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id="sph-clip"><circle cx="50" cy="50" r="46" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#sph-b)" />
      {/* lumière réfléchie en bas (bounce light) */}
      <circle cx="50" cy="50" r="46" fill="url(#sph-rim)" />
      {/* core shadow interne côté droit */}
      <g clipPath="url(#sph-clip)">
        <ellipse cx="72" cy="66" rx="34" ry="38" fill="#4A1B80" opacity="0.35" filter="url(#sph-blur)" />
      </g>
      {/* reflet spéculaire principal + secondaire */}
      <ellipse cx="35" cy="27" rx="15" ry="9.5" fill="#FFFFFF" opacity="0.85" transform="rotate(-28 35 27)" filter="url(#sph-blur)" />
      <ellipse cx="27" cy="41" rx="4.5" ry="2.6" fill="#FFFFFF" opacity="0.5" transform="rotate(-40 27 41)" filter="url(#sph-blur)" />
    </svg>
  );
}

export function ShapePyramid({ size = 150, className, style }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="pyr-l" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#FFCE9E" />
          <stop offset="42%" stopColor="#FF9A4D" />
          <stop offset="100%" stopColor="#F0670F" />
        </linearGradient>
        <linearGradient id="pyr-r" x1="0" y1="0" x2="1" y2="0.9">
          <stop offset="0%" stopColor="#E05A08" />
          <stop offset="60%" stopColor="#B84205" />
          <stop offset="100%" stopColor="#8F3103" />
        </linearGradient>
        <linearGradient id="pyr-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE7CB" />
          <stop offset="100%" stopColor="#FF9A4D" stopOpacity="0" />
        </linearGradient>
        <filter id="pyr-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <clipPath id="pyr-clip"><path d="M52 5 L13 79 L52 93 L91 71 Z" /></clipPath>
      </defs>
      {/* face gauche éclairée */}
      <path d="M52 5 L13 79 L52 93 Z" fill="url(#pyr-l)" />
      {/* face droite ombrée */}
      <path d="M52 5 L91 71 L52 93 Z" fill="url(#pyr-r)" />
      <g clipPath="url(#pyr-clip)">
        {/* ombre portée interne le long de l'arête centrale */}
        <path d="M52 5 L58 93 L52 93 Z" fill="#7A2A02" opacity="0.4" filter="url(#pyr-blur)" />
        {/* rebond de lumière sur le bas de la face gauche */}
        <path d="M13 79 L52 93 L52 82 Z" fill="#FFD9AE" opacity="0.5" filter="url(#pyr-blur)" />
      </g>
      {/* arête lumineuse au sommet */}
      <path d="M52 5 L49 26 L52 34 L55 24 Z" fill="url(#pyr-edge)" opacity="0.9" filter="url(#pyr-blur)" />
    </svg>
  );
}

export function ShapeStar({ size = 150, className, style }: ShapeProps) {
  const starPath = "M50 7 L60.5 35.5 L92 37.5 L67.5 57.5 L76 88 L50 71 L24 88 L32.5 57.5 L8 37.5 L39.5 35.5 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="star-b" cx="36%" cy="28%" r="90%">
          <stop offset="0%" stopColor="#E4FBF6" />
          <stop offset="35%" stopColor="#9DEBDF" />
          <stop offset="70%" stopColor="#54CDBC" />
          <stop offset="100%" stopColor="#2A9C8C" />
        </radialGradient>
        <filter id="star-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <clipPath id="star-clip">
          <path d={starPath} stroke="#000" strokeWidth="14" strokeLinejoin="round" />
        </clipPath>
      </defs>
      {/* épaisseur : silhouette décalée plus sombre (extrusion) */}
      <path
        d={starPath}
        fill="#1F7A6E"
        stroke="#1F7A6E"
        strokeWidth="14"
        strokeLinejoin="round"
        transform="translate(2.5 4)"
      />
      {/* corps puffy (stroke round épais = coins gonflés) */}
      <path d={starPath} fill="url(#star-b)" stroke="url(#star-b)" strokeWidth="14" strokeLinejoin="round" />
      <g clipPath="url(#star-clip)">
        {/* core shadow bas-droite */}
        <ellipse cx="68" cy="74" rx="34" ry="26" fill="#187568" opacity="0.4" filter="url(#star-blur)" />
        {/* reflet spéculaire haut-gauche */}
        <ellipse cx="36" cy="26" rx="16" ry="9" fill="#FFFFFF" opacity="0.8" transform="rotate(-18 36 26)" filter="url(#star-blur)" />
      </g>
    </svg>
  );
}

export function ShapeBlob({ size = 130, className, style }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="blob-b" cx="33%" cy="24%" r="95%">
          <stop offset="0%" stopColor="#F2FCB8" />
          <stop offset="35%" stopColor="#CEEC5F" />
          <stop offset="72%" stopColor="#9FC92B" />
          <stop offset="100%" stopColor="#6E9410" />
        </radialGradient>
        <filter id="blob-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <clipPath id="blob-clip">
          <rect x="9" y="9" width="82" height="82" rx="34" transform="rotate(12 50 50)" />
        </clipPath>
      </defs>
      {/* extrusion */}
      <rect x="9" y="9" width="82" height="82" rx="34" fill="#5C7C0C" transform="rotate(12 52 54) translate(2.5 4)" />
      <rect x="9" y="9" width="82" height="82" rx="34" fill="url(#blob-b)" transform="rotate(12 50 50)" />
      <g clipPath="url(#blob-clip)">
        <ellipse cx="70" cy="74" rx="34" ry="28" fill="#557609" opacity="0.4" filter="url(#blob-blur)" />
        <ellipse cx="34" cy="26" rx="15" ry="8.5" fill="#FFFFFF" opacity="0.75" transform="rotate(-14 34 26)" filter="url(#blob-blur)" />
      </g>
    </svg>
  );
}

export function ShapeCylinder({ size = 150, className, style }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        {/* bande spéculaire verticale : sombre → claire → sombre */}
        <linearGradient id="cyl-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1A55A6" />
          <stop offset="22%" stopColor="#4E9BE8" />
          <stop offset="40%" stopColor="#9DCCF9" />
          <stop offset="62%" stopColor="#4E9BE8" />
          <stop offset="100%" stopColor="#123F80" />
        </linearGradient>
        <linearGradient id="cyl-top" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#D8EDFD" />
          <stop offset="60%" stopColor="#8FC4F4" />
          <stop offset="100%" stopColor="#5FA4E4" />
        </linearGradient>
        <filter id="cyl-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <g transform="rotate(-16 50 50)">
        <path d="M23 27 L23 73 A27 13.5 0 0 0 77 73 L77 27 Z" fill="url(#cyl-body)" />
        {/* lumière réfléchie sur le bas du fût */}
        <path d="M23 66 L23 73 A27 13.5 0 0 0 77 73 L77 66 A27 13.5 0 0 1 23 66 Z" fill="#7FB8F2" opacity="0.45" filter="url(#cyl-blur)" />
        {/* face du dessus + ombre du rebord interne */}
        <ellipse cx="50" cy="27" rx="27" ry="13.5" fill="url(#cyl-top)" />
        <ellipse cx="50" cy="27" rx="27" ry="13.5" fill="none" stroke="#2F6FB8" strokeWidth="1.6" opacity="0.55" />
        <ellipse cx="44" cy="24" rx="13" ry="4.5" fill="#FFFFFF" opacity="0.65" filter="url(#cyl-blur)" />
      </g>
    </svg>
  );
}

export function ShapeCube({ size = 140, className, style }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="cube-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFEFC2" />
          <stop offset="55%" stopColor="#FFCE6B" />
          <stop offset="100%" stopColor="#F5AE38" />
        </linearGradient>
        <linearGradient id="cube-l" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#F6A82E" />
          <stop offset="60%" stopColor="#DE8712" />
          <stop offset="100%" stopColor="#BE6C06" />
        </linearGradient>
        <linearGradient id="cube-r" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#D98A14" />
          <stop offset="55%" stopColor="#B36A06" />
          <stop offset="100%" stopColor="#8D5002" />
        </linearGradient>
        <filter id="cube-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <g strokeLinejoin="round">
        {/* faces avec stroke round épais = arêtes adoucies (clay) */}
        <path d="M50 9 L87 28.5 L50 48 L13 28.5 Z" fill="url(#cube-top)" stroke="url(#cube-top)" strokeWidth="6" />
        <path d="M13 28.5 L50 48 L50 89 L13 69.5 Z" fill="url(#cube-l)" stroke="url(#cube-l)" strokeWidth="6" />
        <path d="M87 28.5 L87 69.5 L50 89 L50 48 Z" fill="url(#cube-r)" stroke="url(#cube-r)" strokeWidth="6" />
      </g>
      {/* reflet sur la face du dessus + arête lumineuse */}
      <ellipse cx="42" cy="26" rx="14" ry="6" fill="#FFFFFF" opacity="0.55" transform="rotate(-8 42 26)" filter="url(#cube-blur)" />
      <path d="M50 46 L50 89" stroke="#FFDD9A" strokeWidth="1.8" opacity="0.5" filter="url(#cube-blur)" />
    </svg>
  );
}

/** Cube bleu ciel de la section Services (comme la vidéo). */
export function ShapeCubeBlue({ size = 110, className, style }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="cubeb-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF6FE" />
          <stop offset="60%" stopColor="#AEDBF8" />
          <stop offset="100%" stopColor="#7FC0EE" />
        </linearGradient>
        <linearGradient id="cubeb-l" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#8FC9EF" />
          <stop offset="100%" stopColor="#5498CE" />
        </linearGradient>
        <linearGradient id="cubeb-r" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#6FB2E0" />
          <stop offset="100%" stopColor="#3B7DB4" />
        </linearGradient>
        <filter id="cubeb-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <g strokeLinejoin="round">
        <path d="M50 9 L87 28.5 L50 48 L13 28.5 Z" fill="url(#cubeb-top)" stroke="url(#cubeb-top)" strokeWidth="6" />
        <path d="M13 28.5 L50 48 L50 89 L13 69.5 Z" fill="url(#cubeb-l)" stroke="url(#cubeb-l)" strokeWidth="6" />
        <path d="M87 28.5 L87 69.5 L50 89 L50 48 Z" fill="url(#cubeb-r)" stroke="url(#cubeb-r)" strokeWidth="6" />
      </g>
      <ellipse cx="42" cy="26" rx="14" ry="6" fill="#FFFFFF" opacity="0.6" transform="rotate(-8 42 26)" filter="url(#cubeb-blur)" />
    </svg>
  );
}
