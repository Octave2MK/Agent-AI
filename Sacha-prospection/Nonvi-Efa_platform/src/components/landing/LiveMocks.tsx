/**
 * Mocks d'interface pour les schémas de la page Coulisses (/live).
 * Reproductions SVG fidèles mais simplifiées de :
 *  - la fenêtre Claude Code (sidebar Nouvelle session / Artéfacts / Routines,
 *    titre "✳ Quoi de prévu, Zeyneb ?", barre de prompt, badge Opus 4.8)
 *  - le chat de la plateforme Nonvi-Efa (conversation avec un agent)
 *  - un panneau de dossiers/fichiers (façon Finder)
 * Composants serveur, à utiliser DANS un <svg> (ce sont des <g>).
 */

/** Une ligne d'un fichier affiché dans FileWindow. */
export interface FileLine {
  t: string; // texte
  c?: "head" | "dim" | "key" | "ok"; // couleur/type
}

/**
 * Fenêtre "éditeur de code" — un fichier dont les lignes s'écrivent une à une.
 * Sert à montrer les VRAIS fichiers de la plateforme (CLAUDE.md, MEMORY.md,
 * skills…) qui se remplissent, à côté de la métaphore.
 */
export function FileWindow({
  filename,
  lines,
  caption,
}: {
  filename: string;
  lines: FileLine[];
  caption?: string;
}) {
  const color = (c?: FileLine["c"]) =>
    c === "head" ? "#FF9F6B" : c === "dim" ? "#7C7597" : c === "key" ? "#8FD0FF" : c === "ok" ? "#7BE3A9" : "#E8E4FA";
  return (
    <div className="lv-file">
      <div className="lv-file-win">
        <div className="lv-file-bar">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
          <span className="lv-file-name">{filename}</span>
        </div>
        <div className="lv-file-body">
          {lines.map((ln, i) => (
            <div key={i} className="ln lv-in" style={{ ["--d" as string]: `${i * 0.22}s` }}>
              <span className="num">{i + 1}</span>
              <span style={{ color: color(ln.c), fontWeight: ln.c === "head" ? 700 : 400 }}>
                {ln.t || " "}
              </span>
            </div>
          ))}
          <div className="ln">
            <span className="num">{lines.length + 1}</span>
            <span className="lv-blink" style={{ color: "#E8A33D" }}>▌</span>
          </div>
        </div>
      </div>
      {caption && <p className="text-center mt-3 text-[13px] font-semibold text-[#5A5A5A]">{caption}</p>}
    </div>
  );
}

/** Avatars Funko des agents (PNG détourés dans /public/avatars). */
const AVATARS: Record<string, string> = {
  orchestrateur: "/avatars/bearded-headset.png?v=5-cutout",
  strategiste: "/avatars/glasses-pen.png?v=5-cutout",
  "createur-contenu": "/avatars/beanie-notebook.png?v=5-cutout",
  designer: "/avatars/glasses-tablet.png?v=5-cutout",
  analyste: "/avatars/glasses-pen.png?v=5-cutout",
  presentateur: "/avatars/clean-headset.png?v=5-cutout",
  gmail: "/avatars/funko-curly-phone.png?v=5-cutout",
  fireflies: "/avatars/bearded-headset.png?v=5-cutout",
  cv: "/avatars/suit-headset.png?v=5-cutout",
};

/** Petit avatar d'agent à poser dans un schéma SVG. */
export function AgentPic({ slug, x, y, size = 60 }: { slug: string; x: number; y: number; size?: number }) {
  return (
    <image
      href={AVATARS[slug] ?? AVATARS.orchestrateur}
      x={x}
      y={y}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

type WinProps = {
  x: number;
  y: number;
  s?: number;
  /** Texte tapé dans la barre de prompt (avec curseur qui clignote). */
  prompt?: React.ReactNode;
  /** Légende affichée sous la fenêtre. */
  caption?: string;
  /** Contenu de la zone principale (coordonnées 185→545 / 100→270). */
  children?: React.ReactNode;
};

/** Fenêtre Claude Code — base 560 × 350. */
export function ClaudeWin({ x, y, s = 1, prompt, caption, children }: WinProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* fenêtre */}
      <rect width="560" height="350" rx="18" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      {/* feux macOS */}
      <circle cx="28" cy="26" r="6" fill="#FF5F57" />
      <circle cx="50" cy="26" r="6" fill="#FEBC2E" />
      <circle cx="72" cy="26" r="6" fill="#28C840" />
      {/* sidebar */}
      <rect x="14" y="46" width="152" height="290" rx="12" fill="#F6F5F1" />
      <rect x="24" y="58" width="132" height="30" rx="8" fill="#FFFFFF" stroke="#E4E2DB" strokeWidth="1.5" />
      <text x="36" y="78" fontSize="13" fontWeight="700" fill="#241F1A">+ Nouvelle session</text>
      <text x="36" y="112" fontSize="13" fill="#5A564E">Artéfacts</text>
      <text x="36" y="140" fontSize="13" fill="#5A564E">Routines</text>
      <text x="36" y="168" fontSize="13" fill="#5A564E">Personnaliser</text>
      <text x="36" y="196" fontSize="13" fill="#8A867C">Plus…</text>
      <text x="36" y="322" fontSize="12" fill="#8A867C">Zeyneb · Max</text>
      {/* titre principal */}
      <text x="188" y="86" fontSize="21" fontWeight="700" fill="#241F1A">
        <tspan fill="#E0764B">✳ </tspan>Quoi de prévu, Zeyneb ?
      </text>
      {/* zone de contenu (bulles, lignes de progression…) */}
      {children}
      {/* barre de prompt */}
      <rect x="184" y="282" width="358" height="42" rx="12" fill="#FFFFFF" stroke="#C8C5BD" strokeWidth="2" />
      <text x="198" y="309" fontSize="14.5" fill="#241F1A">
        {prompt ?? <tspan fill="#8A867C">Décrivez une tâche ou posez une question.</tspan>}
      </text>
      <text x="540" y="344" textAnchor="end" fontSize="11" fill="#8A867C">Opus 4.8 · Élevé</text>
      {caption && (
        <text x="280" y="382" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F0F0F">
          {caption}
        </text>
      )}
    </g>
  );
}

type ChatProps = {
  x: number;
  y: number;
  s?: number;
  agent?: string;
  /** Slug de l'avatar affiché dans le header (défaut : Noam/orchestrateur). */
  slug?: string;
  caption?: string;
  /** Bulles du chat (coordonnées 0→460 / 60→255). */
  children?: React.ReactNode;
};

/** Chat de la plateforme Nonvi-Efa — base 460 × 330. */
export function ChatWin({ x, y, s = 1, agent = "Noam", slug = "orchestrateur", caption, children }: ChatProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect width="460" height="330" rx="20" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      {/* header : avatar de l'agent + statut en ligne */}
      <line x1="0" y1="52" x2="460" y2="52" stroke="#EEEDF6" strokeWidth="2" />
      <AgentPic slug={slug} x={14} y={5} size={44} />
      <circle cx="52" cy="40" r="5" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="68" y="32" fontSize="15" fontWeight="700" fill="#0F0F0F">Conversation avec {agent}</text>
      {/* bulles */}
      {children}
      {/* barre d'envoi */}
      <rect x="16" y="268" width="360" height="44" rx="12" fill="#F7F6FC" />
      <text x="30" y="295" fontSize="13" fill="#8A8A8A">Demandez à {agent}…</text>
      <circle cx="416" cy="290" r="20" fill="#F5411C" />
      <text x="416" y="296" textAnchor="middle" fontSize="16" fill="#FFFFFF">➤</text>
      {caption && (
        <text x="230" y="362" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F0F0F">
          {caption}
        </text>
      )}
    </g>
  );
}

/** Bulle utilisateur (violette, alignée à droite) pour ChatWin. */
export function ChatBubbleMe({ y, w, children }: { y: number; w: number; children: React.ReactNode }) {
  return (
    <g>
      <rect x={444 - w} y={y} width={w} height="46" rx="16" fill="#5B4DEE" />
      <text x={444 - w / 2} y={y + 29} textAnchor="middle" fontSize="14" fontWeight="600" fill="#FFFFFF">
        {children}
      </text>
    </g>
  );
}

/** Bulle agent (grise, alignée à gauche) pour ChatWin.
 *  `slug` : affiche le petit avatar de l'agent qui parle, à gauche de la bulle. */
export function ChatBubbleBot({ y, w, slug, children }: { y: number; w: number; slug?: string; children: React.ReactNode }) {
  const bx = slug ? 58 : 16;
  return (
    <g>
      {slug && <AgentPic slug={slug} x={12} y={y + 2} size={42} />}
      <rect x={bx} y={y} width={w} height="46" rx="16" fill="#F1F0F7" />
      <text x={bx + w / 2} y={y + 29} textAnchor="middle" fontSize="14" fontWeight="600" fill="#0F0F0F">
        {children}
      </text>
    </g>
  );
}

type FolderProps = {
  x: number;
  y: number;
  s?: number;
  title: string;
  caption?: string;
  /** Lignes de fichiers : { name, em: surligné, d: délai d'apparition } */
  items: { name: string; em?: boolean; d?: string }[];
};

/** Panneau dossiers/fichiers façon Finder — base 350 × (70 + 44·n). */
export function FolderPanel({ x, y, s = 1, title, caption, items }: FolderProps) {
  const h = 70 + items.length * 44;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect width="350" height={h} rx="18" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="22" y="40" fontSize="18" fontWeight="700" fill="#0F0F0F">📁 {title}</text>
      <line x1="0" y1="56" x2="350" y2="56" stroke="#EEEDF6" strokeWidth="2" />
      {items.map((it, i) => {
        const ry = 68 + i * 44;
        const row = (
          <g key={it.name}>
            {it.em && <rect x="10" y={ry - 4} width="330" height="38" rx="10" fill="#FFD9C7" />}
            <text x="24" y={ry + 21} fontSize="15" fontWeight={it.em ? 700 : 500} fill={it.em ? "#0F0F0F" : "#5A5A5A"}>
              {it.name}
            </text>
          </g>
        );
        return it.d != null ? (
          <g key={it.name} className="lv-seq" style={{ ["--d" as string]: it.d }}>
            {row}
          </g>
        ) : (
          row
        );
      })}
      {caption && (
        <text x="175" y={h + 34} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F0F0F">
          {caption}
        </text>
      )}
    </g>
  );
}
