import Link from "next/link";
import { AppNav } from "@/components/landing/AppNav";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Icon } from "@/components/Icon";
import { ClaudeWin, ChatWin, ChatBubbleMe, ChatBubbleBot, FolderPanel, AgentPic, FileWindow } from "@/components/landing/LiveMocks";
import { FigTabs } from "@/components/landing/FigTabs";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Coulisses · naiom",
  description:
    "Comment j'ai construit mon équipe d'employés IA — expliqué en 8 schémas animés, simples à comprendre.",
};

/**
 * /live — Coulisses en slides animées (refonte juillet 2026).
 *
 * Présentation plein écran (scroll-snap) pour le live : chaque étape de la
 * construction de la plateforme est expliquée par UN schéma SVG animé
 * (flèches pointillées qui défilent, reveals séquencés, ❌→✅, compteur
 * d'essais, curseur qui clignote) + un encadré "💡 pourquoi ça compte".
 * Zéro jargon : chaque slide se comprend en 10 secondes.
 * Style : système Bronx (blanc, Archivo, orange #F5411C, violet #5B4DEE).
 */
export default function LivePage() {
  return (
    <div className="bronx-page lv-snap min-h-screen w-full">
      <AppNav active="coulisses" />

      {/* ============ SLIDE 0 — COVER + SOMMAIRE ============ */}
      <section className="lv-slide" id="lv-top">
        <div className="lv-board lav items-center justify-center text-center" style={{ gap: "2.4vh" }}>
          <div className="lv-eyebrow">Live · Behind the scenes</div>
          <h1
            className="bronx-hero-title"
            style={{ fontSize: "clamp(32px, 4.4vw, 64px)", maxWidth: "22ch", lineHeight: 1.1 }}
          >
            Comment j&apos;ai construit mon{" "}
            <span className="lv-mark">équipe d&apos;employés IA</span>
            <br />
            en <span className="lv-mark m2">8 étapes</span> — sans savoir coder
          </h1>
          <p className="bronx-body" style={{ maxWidth: 560 }}>
            Une conversation, quelques fichiers texte, et une équipe de 11 employés IA
            qui travaille pour de vrai. Chaque étape est expliquée avec une
            comparaison de la vie de tous les jours — zéro mot technique.
          </p>
          <nav className="lv-toc">
            <a href="#lv1"><span className="n">01</span>L&apos;idée — sur Claude Chat</a>
            <a href="#lv2"><span className="n">02</span>Le plan — par Claude Code</a>
            <a href="#lv3"><span className="n">03</span>Le manuel — CLAUDE.md</a>
            <a href="#lv4"><span className="n">04</span>Le carnet — MEMORY.md</a>
            <a href="#lv5"><span className="n">05</span>Le trousseau — .env</a>
            <a href="#lv6"><span className="n">06</span>Les recettes — les skills</a>
            <a href="#lv7"><span className="n">07</span>La construction (enfin&nbsp;!)</a>
            <a href="#lv8"><span className="n">08</span>La plateforme</a>
          </nav>
          <p className="bronx-body" style={{ maxWidth: 620, fontSize: 14 }}>
            L&apos;ordre compte : on <b>prépare tous les bons fichiers d&apos;abord</b>, et on ne
            construit qu&apos;à l&apos;étape 7. Préparer le terrain, c&apos;est construire sans se tromper.
          </p>
          <div className="text-[13px] text-[#8A8A8A]">
            Navigue avec <Kbd>↓</Kbd> <Kbd>↑</Kbd> — chaque schéma tourne en boucle
          </div>
        </div>
      </section>

      {/* ============ SLIDE 1 — L'IDÉE ============ */}
      <section className="lv-slide" id="lv1">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 01 · Le brainstorm — <span className="lv-mt">Claude Chat</span></div>
          <h2 className="lv-h2">
            Tout part d&apos;une <span className="lv-mark">discussion</span>
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : clarifier l&apos;idée en discutant — rien de technique</div>
            <div className="lv-analog">💬 sur Claude Chat, je brainstorme ce que je veux, comme avec un associé</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ar1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* la vraie fenêtre Claude : je tape ma demande dans la barre */}
              <ClaudeWin
                x={45}
                y={45}
                s={1.06}
                caption="l'application Claude — je tape ma demande en bas"
                prompt={
                  <>
                    Je veux une équipe d&apos;employés IA pour NAIOM
                    <tspan className="lv-blink">▌</tspan>
                  </>
                }
              >
                {/* sa réponse apparaît dans la fenêtre */}
                <g className="lv-fo" style={{ ["--d" as string]: "0s" }}>
                  <rect x="188" y="118" width="345" height="140" rx="18" fill="#F6F5F1" />
                  <text x="206" y="152" fontSize="16" fontWeight="700" fill="#241F1A">
                    <tspan fill="#E0764B">✳</tspan> Génial. On pourrait imaginer :
                  </text>
                  <text x="206" y="184" fontSize="15" fill="#5A564E">· des agents, un par métier</text>
                  <text x="206" y="212" fontSize="15" fill="#5A564E">· un chef qui distribue le travail</text>
                  <text x="206" y="240" fontSize="15" fill="#5A564E">· connectés à tes vrais outils</text>
                </g>
              </ClaudeWin>
              {/* flèche vers l'idée clarifiée */}
              <line x1="660" y1="250" x2="880" y2="250" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar1)" />
              {/* l'idée clarifiée */}
              <g className="lv-seq" style={{ ["--d" as string]: "2.2s" }}>
                <rect x="892" y="130" width="255" height="240" rx="24" fill="#FFF3EB" stroke="#0F0F0F" strokeWidth="3.5" />
                <text x="1019" y="178" textAnchor="middle" fontSize="40">💡</text>
                <text x="1019" y="224" textAnchor="middle" fontSize="23" fontWeight="700" fill="#F5411C" className="lv-mt">L&apos;IDÉE</text>
                <text x="1019" y="254" textAnchor="middle" fontSize="23" fontWeight="700" fill="#F5411C" className="lv-mt">EST CLAIRE</text>
                <text x="1019" y="300" textAnchor="middle" fontSize="15" fill="#5A5A5A">on sait quoi construire…</text>
                <text x="1019" y="326" textAnchor="middle" fontSize="15" fontWeight="700" fill="#188A5C">mais pas encore comment</text>
                <text x="1019" y="352" textAnchor="middle" fontSize="15" fill="#5A5A5A">→ direction Claude Code</text>
              </g>
            </svg>
          </div>
          <div className="lv-why">
            💡 Première étape sur <b>Claude Chat</b> : je brainstorme l&apos;idée, sans rien de
            technique — juste « voilà ce que je veux ». Une fois l&apos;idée claire,
            <b> je la donne à Claude Code</b>, qui va, lui, préparer le vrai plan (étape 2).
          </div>
        </div>
      </section>

      {/* ============ SLIDE 2 — LE PLAN (Claude Code) ============ */}
      <section className="lv-slide" id="lv2">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Étape 02 · Le plan — <span className="lv-mt">Claude Code</span></div>
          <h2 className="lv-h2">
            Je donne l&apos;idée à Claude Code, qui prépare <span className="lv-mark m2">le plan</span>
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 surtout : on ne construit PAS encore — on prépare le terrain</div>
            <div className="lv-analog">📐 comme un architecte : les plans d&apos;abord, les murs bien plus tard</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* je colle l'idée dans Claude Code */}
              <ClaudeWin
                x={35}
                y={45}
                s={0.98}
                caption="Claude Code — je lui donne l'idée"
                prompt={<>Voici l&apos;idée. Fais-moi un plan.<tspan className="lv-blink">▌</tspan></>}
              >
                <g className="lv-fo" style={{ ["--d" as string]: "0s" }}>
                  <rect x="188" y="118" width="345" height="120" rx="18" fill="#F6F5F1" />
                  <text x="206" y="150" fontSize="15.5" fontWeight="700" fill="#241F1A">
                    <tspan fill="#E0764B">✳</tspan> D&apos;accord. On NE code pas tout de suite —
                  </text>
                  <text x="206" y="178" fontSize="14.5" fill="#5A564E">d&apos;abord je prépare les bons fichiers,</text>
                  <text x="206" y="204" fontSize="14.5" fill="#5A564E">dans le bon ordre. Voici le plan :</text>
                </g>
              </ClaudeWin>
              <line x1="650" y1="230" x2="700" y2="230" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar2)" />
              {/* le plan : une liste ordonnée, chaque ligne apparaît */}
              <rect x="712" y="55" width="440" height="410" rx="24" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="740" y="102" fontSize="21" fontWeight="800" fill="#F5411C" className="lv-mt">📋 LE PLAN</text>
              <line x1="712" y1="120" x2="1152" y2="120" stroke="#EEEDF6" strokeWidth="2" />
              <PlanStep y={158} n="1" t="Écrire le manuel — CLAUDE.md" d="0.4s" />
              <PlanStep y={206} n="2" t="La mémoire — MEMORY.md" d="0.9s" />
              <PlanStep y={254} n="3" t="Les clés d'accès — .env" d="1.4s" />
              <PlanStep y={302} n="4" t="Les recettes — les skills" d="1.9s" />
              <g className="lv-in" style={{ ["--d" as string]: "2.5s" }}>
                <rect x="736" y="342" width="392" height="88" rx="16" fill="#FFEBE4" stroke="#F5411C" strokeWidth="2.5" strokeDasharray="7 6" />
                <text x="762" y="376" fontSize="17" fontWeight="800" fill="#F5411C">7. SEULEMENT LÀ : construire</text>
                <text x="762" y="404" fontSize="14" fill="#B5651B">(une fois le terrain prêt — étape 7)</text>
              </g>
            </svg>
          </div>
          <div className="lv-why">
            💡 L&apos;erreur classique : se jeter sur la construction. Ici, <b>Claude Code commence par
            un plan</b> et installe d&apos;abord les bons fichiers, dans le bon ordre. La construction,
            c&apos;est pour la fin (étape 7). Bien préparer le terrain = construire sans se tromper.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 3 — CLAUDE.MD ============ */}
      <section className="lv-slide" id="lv3">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 03 · Le manuel d&apos;accueil — <span className="lv-mt">CLAUDE.md</span></div>
          <h2 className="lv-h2">
            Le <span className="lv-mark">manuel du nouvel employé</span> : un simple document
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : qu&apos;il connaisse NAIOM par cœur, dès le premier jour</div>
            <div className="lv-analog">📖 cliquez sur les onglets : la métaphore, puis le vrai fichier</div>
          </div>

          <FigTabs
            tabs={[
              {
                id: "meta",
                label: "📖 La métaphore",
                node: (
                  <svg viewBox="0 0 1200 480">
                    <defs>
                      <marker id="ar3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                      </marker>
                    </defs>
                    <FolderPanel
                      x={70}
                      y={40}
                      title="Dossier NAIOM"
                      caption="le manuel d'accueil, dans mes dossiers"
                      items={[
                        { name: "📄 LE MANUEL (un doc texte)", em: true },
                        { name: "📁 les textes écrits" },
                        { name: "📁 les plans de campagne" },
                        { name: "📁 les présentations" },
                      ]}
                    />
                    <line x1="440" y1="180" x2="545" y2="180" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar3)" />
                    <circle cx="740" cy="180" r="96" fill="#5B4DEE" />
                    <text x="740" y="168" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700">L&apos;employé IA</text>
                    <text x="740" y="198" textAnchor="middle" fill="#DCD3FF" fontSize="16">lit le manuel</text>
                    <text x="740" y="220" textAnchor="middle" fill="#DCD3FF" fontSize="16">avant de commencer</text>
                    <text x="600" y="330" textAnchor="middle" fontSize="22" fill="#5A5A5A">
                      comme un livret d&apos;accueil : <tspan fontWeight="700" fill="#188A5C">qui on est, comment on travaille</tspan>
                    </text>
                  </svg>
                ),
              },
              {
                id: "fichier",
                label: "📄 Le fichier CLAUDE.md",
                node: (
                  <FileWindow
                    filename="CLAUDE.md"
                    caption="le vrai fichier — lisible et modifiable par n'importe qui, comme un doc Word"
                    lines={[
                      { t: "# NAIOM — Mon équipe d'employés IA", c: "head" },
                      { t: "Langue de travail : français par défaut", c: "dim" },
                      { t: "" },
                      { t: "## Mes employés IA", c: "head" },
                      { t: "- Antoine  → briefs, ICP, positionnement" },
                      { t: "- Léa      → posts, scripts, emails" },
                      { t: "- Mia      → prompts d'images" },
                      { t: "- Léo      → rapports de performance" },
                      { t: "- … 11 employés IA au total", c: "dim" },
                      { t: "" },
                      { t: "## Règles absolues", c: "head" },
                      { t: "- Vouvoiement B2B avec les clients" },
                      { t: "- Jamais de chiffres inventés" },
                      { t: "- Toujours citer le framework utilisé" },
                    ]}
                  />
                ),
              },
              {
                id: "relit",
                label: "🔁 Claude le relit",
                node: (
                  <svg viewBox="0 0 1200 480">
                    <defs>
                      <marker id="ar3b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                      </marker>
                    </defs>
                    {/* le fichier à gauche */}
                    <rect x="60" y="70" width="230" height="300" rx="18" fill="#191627" />
                    <text x="82" y="108" fontSize="16" fontWeight="700" fill="#B9F0C5" className="lv-mt">CLAUDE.md</text>
                    <rect x="82" y="130" width="186" height="10" rx="5" fill="#FF9F6B" />
                    <rect x="82" y="156" width="150" height="9" rx="4.5" fill="#4E4866" />
                    <rect x="82" y="180" width="170" height="9" rx="4.5" fill="#4E4866" />
                    <rect x="82" y="204" width="140" height="9" rx="4.5" fill="#4E4866" />
                    <rect x="82" y="240" width="186" height="10" rx="5" fill="#FF9F6B" />
                    <rect x="82" y="266" width="160" height="9" rx="4.5" fill="#4E4866" />
                    <rect x="82" y="290" width="175" height="9" rx="4.5" fill="#4E4866" />
                    <line x1="290" y1="200" x2="400" y2="200" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar3b)" />
                    {/* Claude le lit à chaque session */}
                    <ClaudeWin x={415} y={40} s={0.98} caption="à chaque nouvelle session, automatiquement">
                      <text x="196" y="138" fontSize="16" fill="#5A564E" className="lv-fx" style={{ ["--d" as string]: "0s" }}>📖 je relis le manuel…</text>
                      <g className="lv-fo" style={{ ["--d" as string]: "0s" }}>
                        <rect x="188" y="110" width="345" height="132" rx="18" fill="#F6F5F1" />
                        <text x="206" y="144" fontSize="15.5" fontWeight="700" fill="#188A5C">✓ C&apos;est bon, je sais que :</text>
                        <text x="206" y="174" fontSize="14.5" fill="#5A564E">· NAIOM construit des employés IA</text>
                        <text x="206" y="200" fontSize="14.5" fill="#5A564E">· on vouvoie les clients</text>
                        <text x="206" y="226" fontSize="14.5" fill="#5A564E">· jamais de chiffres inventés</text>
                      </g>
                    </ClaudeWin>
                  </svg>
                ),
              },
            ]}
          />

          <div className="lv-why">
            💡 Quand on embauche quelqu&apos;un, on lui donne un livret d&apos;accueil. Ici c&apos;est
            un fichier qui s&apos;appelle <b>CLAUDE.md</b> : Claude le relit au début de chaque
            session pour se rappeler qui est NAIOM et comment travailler. <b>Un simple document
            texte, que n&apos;importe qui peut modifier.</b>
          </div>
        </div>
      </section>

      {/* ============ SLIDE 4 — MEMORY.MD ============ */}
      <section className="lv-slide" id="lv4">
        <div className="lv-board ciel">
          <div className="lv-eyebrow">Étape 04 · Le carnet de notes — <span className="lv-mt">MEMORY.md</span></div>
          <h2 className="lv-h2">
            Le <span className="lv-mark m2">carnet de notes</span> : il retient d&apos;une fois sur l&apos;autre
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : ne jamais répéter deux fois la même consigne</div>
            <div className="lv-analog">☕ cliquez sur les onglets : la métaphore, puis le vrai carnet</div>
          </div>

          <FigTabs
            tabs={[
              {
                id: "meta4",
                label: "☕ La métaphore",
                node: (
            <svg viewBox="0 0 1200 480">
              <defs>
                <marker id="ar4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* LUNDI : je donne ma préférence dans la barre de prompt */}
              <text x="230" y="48" textAnchor="middle" fontSize="22" fontWeight="700" fill="#5B4DEE" className="lv-mt">LUNDI</text>
              <ClaudeWin
                x={28}
                y={62}
                s={0.72}
                prompt={<>les rapports : toujours en visuel<tspan className="lv-blink">▌</tspan></>}
              >
                <g className="lv-fo" style={{ ["--d" as string]: "0s" }}>
                  <rect x="188" y="150" width="330" height="52" rx="16" fill="#F6F5F1" />
                  <text x="206" y="183" fontSize="17" fontWeight="700" fill="#188A5C">✏️ Noté dans le carnet, pour toujours</text>
                </g>
              </ClaudeWin>
              {/* le carnet au centre */}
              <path d="M 440 300 Q 470 330 490 330" fill="none" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar4)" />
              <g className="lv-pop">
                <path d="M 505 250 h 80 l 28 28 h 105 a20 20 0 0 1 20 20 v 90 a20 20 0 0 1 -20 20 H 505 a20 20 0 0 1 -20 -20 v -118 a20 20 0 0 1 20 -20 z" fill="#C6EEDB" stroke="#0F0F0F" strokeWidth="3.5" />
                <text x="613" y="330" textAnchor="middle" fontSize="24" fontWeight="700">LE CARNET 📝</text>
                <text x="613" y="362" textAnchor="middle" fontSize="16" fill="#5A5A5A">✏️ noté, pour toujours</text>
              </g>
              <path d="M 740 330 Q 770 330 790 300" fill="none" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar4)" />
              {/* MARDI : il s'en souvient tout seul */}
              <text x="965" y="48" textAnchor="middle" fontSize="22" fontWeight="700" fill="#F5411C" className="lv-mt">MARDI</text>
              <ClaudeWin
                x={765}
                y={62}
                s={0.72}
                prompt={<>fais le rapport YouTube<tspan className="lv-blink">▌</tspan></>}
              >
                <g className="lv-fo" style={{ ["--d" as string]: "0s" }}>
                  <rect x="188" y="130" width="345" height="90" rx="16" fill="#F6F5F1" />
                  <text x="206" y="164" fontSize="16" fontWeight="700" fill="#241F1A">
                    <tspan fill="#E0764B">✳</tspan> Je m&apos;en souviens :
                  </text>
                  <text x="206" y="196" fontSize="15.5" fontWeight="700" fill="#188A5C">→ en visuel, comme tu préfères ✓</text>
                </g>
              </ClaudeWin>
              <text x="600" y="455" textAnchor="middle" fontSize="22" fill="#5A5A5A">dit une fois le lundi → appliqué tout seul le mardi, et tous les jours d&apos;après</text>
            </svg>
                ),
              },
              {
                id: "carnet4",
                label: "📝 Le fichier MEMORY.md",
                node: (
                  <FileWindow
                    filename="MEMORY.md"
                    caption="chaque préférence donnée une fois est ajoutée ici, pour toujours"
                    lines={[
                      { t: "# Mémoire du projet NAIOM", c: "head" },
                      { t: "" },
                      { t: "- Rapports → toujours en présentation visuelle", c: "ok" },
                      { t: "  (deck avec graphiques, jamais un dump de texte)", c: "dim" },
                      { t: "- Décks → slides auto-portantes, zéro jargon", c: "ok" },
                      { t: "- Carrousels → texte via HTML→PNG, pas dans l'image", c: "ok" },
                      { t: "- NAIOM ≠ agence marketing : ingénierie d'agents IA", c: "ok" },
                      { t: "- Chat → cacher le markdown, montrer une barre de progrès", c: "ok" },
                      { t: "" },
                      { t: "→ Claude relit ce carnet et applique tout, tout seul.", c: "dim" },
                    ]}
                  />
                ),
              },
            ]}
          />
          <div className="lv-why">
            💡 Le bon serveur de votre café n&apos;a pas besoin qu&apos;on lui redise « sans sucre »
            chaque matin. Ici, ce carnet s&apos;appelle <b>MEMORY.md</b> : chaque préférence donnée
            une fois y est <b>notée et appliquée pour toujours</b>. Plus je l&apos;utilise, plus il
            travaille comme moi.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 5 — .ENV / LES CLÉS ============ */}
      <section className="lv-slide" id="lv5">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 05 · Le trousseau de clés — <span className="lv-mt">.env</span></div>
          <h2 className="lv-h2">
            Le <span className="lv-mark">trousseau de clés</span>, toujours dans ma poche
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : ouvrir mes comptes (mail, YouTube…) sans donner mes mots de passe</div>
            <div className="lv-analog">🔑 cliquez sur les onglets : la métaphore, le fichier, et où trouver les clés</div>
          </div>

          <FigTabs
            tabs={[
              {
                id: "meta6",
                label: "🔑 La métaphore",
                node: (
            <svg viewBox="0 0 1200 470">
              <defs>
                <marker id="ar6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* coffre */}
              <g className="lv-pop">
                <rect x="480" y="150" width="240" height="190" rx="26" fill="#191627" />
                <circle cx="600" cy="230" r="38" fill="none" stroke="#E8A33D" strokeWidth="7" />
                <circle cx="600" cy="230" r="9" fill="#E8A33D" />
                <rect x="594" y="233" width="12" height="34" rx="6" fill="#E8A33D" />
                <text x="600" y="318" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="700">mes clés 🔐</text>
              </g>
              <ServiceBox x={70} y={70} d="0s" label="Gmail" />
              <ServiceBox x={70} y={300} d="0.8s" label="Google Drive" />
              <ServiceBox x={890} y={70} d="1.6s" label="YouTube" />
              <ServiceBox x={890} y={300} d="2.4s" label="Fireflies" />
              <line x1="310" y1="112" x2="470" y2="188" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar6)" />
              <line x1="310" y1="342" x2="470" y2="290" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar6)" />
              <line x1="885" y1="112" x2="730" y2="188" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar6)" />
              <line x1="885" y1="342" x2="730" y2="290" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar6)" />
              <text x="600" y="420" textAnchor="middle" fontSize="22" fill="#5A5A5A">
                chaque clé ouvre une porte — <tspan fontWeight="700" fill="#F5411C">jamais partagée</tspan>, elle reste sur mon ordi
              </text>
            </svg>
                ),
              },
              {
                id: "fichier6",
                label: "📄 Le fichier .env",
                node: (
                  <FileWindow
                    filename=".env.local"
                    caption="chaque clé collée sur sa ligne · ce fichier ne quitte jamais mon ordinateur"
                    lines={[
                      { t: "# Le trousseau de clés — jamais partagé", c: "dim" },
                      { t: "" },
                      { t: "ANTHROPIC_API_KEY=sk-ant-••••••••••", c: "ok" },
                      { t: "GOOGLE_CLIENT_ID=••••••.apps.google.com", c: "ok" },
                      { t: "GOOGLE_CLIENT_SECRET=GOCSPX-••••••••", c: "ok" },
                      { t: "FIREFLIES_API_KEY=••••••••••••••••", c: "ok" },
                      { t: "APIFY_TOKEN=apify_api_••••••••", c: "ok" },
                      { t: "ARCADS_CLIENT_ID=••••••••", c: "ok" },
                      { t: "" },
                      { t: "# ← gauche : le nom · droite : la clé collée", c: "dim" },
                    ]}
                  />
                ),
              },
              {
                id: "trouver6",
                label: "🔎 Où trouver la clé (Fireflies)",
                node: (
                  <div className="lv-file" style={{ maxWidth: 960 }}>
                    {/* reconstitution de l'écran Fireflies · Settings */}
                    <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#0F0F0F] bg-white shadow-[0_18px_44px_-22px_rgba(15,15,15,0.4)]">
                      {/* barre de fenêtre */}
                      <div className="flex items-center gap-2 border-b border-[#E6E4EE] bg-[#F3F2F7] px-4 py-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                        <span className="ml-2 font-mono text-[12.5px] font-bold text-[#5A5A5A]">app.fireflies.ai › Settings</span>
                      </div>
                      <div className="flex text-left">
                        {/* sidebar */}
                        <div className="w-[188px] shrink-0 border-r border-[#EEEDF6] bg-[#FBFAFE] p-3">
                          <div className="mb-2.5 text-[13px] font-black text-[#0F0F0F]">Settings</div>
                          {[
                            "Recording & Privacy",
                            "Email Assistant",
                            "AI settings",
                            "MCP & Dev Tools",
                            "Billing",
                            "Account",
                          ].map((it) => {
                            const active = it === "MCP & Dev Tools";
                            return (
                              <div
                                key={it}
                                className={cn(
                                  "mb-0.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold",
                                  active ? "bg-[#EDE9FF] text-[#5B4DEE]" : "text-[#5A5A5A]"
                                )}
                              >
                                {active && <span className="mr-1 font-mono">&lt;/&gt;</span>}
                                {it}
                              </div>
                            );
                          })}
                        </div>
                        {/* panneau principal */}
                        <div className="flex-1 p-5">
                          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
                            Developer Settings
                          </div>
                          {/* la carte API Key, mise en évidence */}
                          <div
                            className="lv-in relative rounded-xl border-2 border-dashed border-[#F5411C] bg-[#FFF8F5] p-4"
                            style={{ ["--d" as string]: "0.2s" }}
                          >
                            <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-[#F5411C] px-2.5 py-1 text-[11px] font-black text-white shadow">
                              👉 votre clé API est ici
                            </span>
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-mono text-[15px] font-black text-[#5B4DEE]">&lt;/&gt;</span>
                              <span className="text-[14px] font-black text-[#0F0F0F]">API Key</span>
                            </div>
                            <p className="mb-3 text-[12px] leading-snug text-[#8A8A8A]">
                              Intégrez Fireflies à vos outils. Copiez cette clé et collez-la dans votre <b>.env</b>.
                            </p>
                            <div className="flex items-center gap-2.5 rounded-lg border border-[#E4E1F5] bg-white px-3 py-2.5">
                              <span className="flex-1 truncate font-mono text-[13px] tracking-[0.25em] text-[#5A5A5A]">
                                ••••••••••••••••••••••••••••
                              </span>
                              <span className="text-[15px] text-[#8A8A8A]">👁</span>
                              <span className="text-[14px] text-[#8A8A8A]">↻</span>
                              <span className="flex h-7 items-center gap-1 rounded-md bg-[#F5411C] px-2 text-[11px] font-bold text-white">
                                ⧉ copier
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* on la colle dans .env */}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#191627] px-3 py-1.5 font-mono text-[12.5px] font-bold text-[#B9F0C5]">
                        FIREFLIES_API_KEY=<span className="text-[#7C7597]">votre-clé-collée</span>
                      </span>
                      <span className="text-[13px] font-semibold text-[#5A5A5A]">
                        → collée dans <span className="lv-mt">.env</span> · <b className="text-[#188A5C]">branché pour de bon</b>
                      </span>
                    </div>
                    <p className="mt-2 text-center text-[12.5px] text-[#8A8A8A]">
                      même principe pour chaque service (YouTube, Apify, Arcads…) : une clé dans les réglages → collée dans <span className="lv-mt">.env</span>
                    </p>
                  </div>
                ),
              },
            ]}
          />

          <div className="lv-why">
            💡 Chaque service (Gmail, YouTube, Fireflies, Apify…) donne une <b>clé API</b> dans ses
            réglages : on la copie une fois et on la colle dans le fichier <span className="lv-mt">.env</span>,
            une ligne par service. Ce trousseau <b>ne quitte jamais mon ordinateur</b> — personne
            d&apos;autre ne peut s&apos;en servir.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 6 — LES SKILLS ============ */}
      <section className="lv-slide" id="lv6">
        <div className="lv-board peach">
          <div className="lv-eyebrow">Étape 06 · Les recettes — <span className="lv-mt">les skills</span></div>
          <h2 className="lv-h2">
            Une <span className="lv-mark m3">recette de cuisine</span>, écrite une seule fois
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : le même résultat parfait, à chaque fois</div>
            <div className="lv-analog">🍰 cliquez sur les onglets : la métaphore, puis les vrais fichiers</div>
          </div>

          <FigTabs
            tabs={[
              {
                id: "meta5",
                label: "🍰 La métaphore",
                node: (
            <svg viewBox="0 0 1200 480">
              <defs>
                <marker id="ar5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* je demande dans Claude, avec mes mots (les demandes défilent) */}
              <ClaudeWin
                x={25}
                y={45}
                s={0.92}
                caption="je demande, avec mes mots"
                prompt={
                  <>
                    <tspan className="lv-ph" style={{ ["--d" as string]: "0s" }} x="198">Prépare la campagne<tspan className="lv-blink">▌</tspan></tspan>
                    <tspan className="lv-ph" style={{ ["--d" as string]: "2s" }} x="198">Écris-moi un post<tspan className="lv-blink">▌</tspan></tspan>
                    <tspan className="lv-ph" style={{ ["--d" as string]: "4s" }} x="198">Fais la présentation<tspan className="lv-blink">▌</tspan></tspan>
                  </>
                }
              >
                <g className="lv-fo" style={{ ["--d" as string]: "0s" }}>
                  <rect x="188" y="150" width="320" height="52" rx="16" fill="#F6F5F1" />
                  <text x="206" y="183" fontSize="16" fontWeight="700" fill="#241F1A">
                    <tspan fill="#E0764B">✳</tspan> Je suis la recette, étape par étape…
                  </text>
                </g>
              </ClaudeWin>
              {/* la recette */}
              <line x1="545" y1="210" x2="590" y2="210" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar5)" />
              <g className="lv-pop">
                <rect x="600" y="115" width="245" height="185" rx="24" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
                <text x="722" y="158" textAnchor="middle" fontSize="21" fontWeight="700" fill="#F5411C" className="lv-mt">LA RECETTE 📋</text>
                <text x="618" y="196" fontSize="15.5" fill="#5A5A5A">1. relire les règles de la marque</text>
                <text x="618" y="228" fontSize="15.5" fill="#5A5A5A">2. suivre les étapes, dans l&apos;ordre</text>
                <text x="618" y="260" fontSize="15.5" fill="#5A5A5A">3. ranger au bon endroit</text>
              </g>
              <line x1="845" y1="210" x2="885" y2="210" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar5)" />
              {/* les fichiers apparaissent dans mes dossiers */}
              <FolderPanel
                x={895}
                y={80}
                s={0.86}
                title="Mes dossiers"
                caption="les fichiers arrivent ici, tout seuls"
                items={[
                  { name: "📄 plan-campagne.pdf", d: "1s" },
                  { name: "📄 post-linkedin.txt", d: "2.4s" },
                  { name: "📄 presentation.pdf", d: "3.8s" },
                ]}
              />
              <text x="480" y="455" textAnchor="middle" fontSize="22" fill="#5A5A5A">la méthode est dans la recette — pas dans ma tête</text>
            </svg>
                ),
              },
              {
                id: "fichier5",
                label: "📄 Le fichier /brief",
                node: (
                  <FileWindow
                    filename=".claude/commands/brief.md"
                    caption="une recette = un fichier. Écrite une fois, suivie à l'identique à chaque fois"
                    lines={[
                      { t: "# Recette : produire un brief de campagne", c: "head" },
                      { t: "" },
                      { t: "Quand j'écris /brief, suis ces étapes :", c: "dim" },
                      { t: "1. Lire clients/naiom/brand.md (ton, cible, règles)", c: "key" },
                      { t: "2. Construire l'ICP (persona + douleurs + gains)" },
                      { t: "3. Appliquer le framework StoryBrand + JTBD" },
                      { t: "4. Rédiger : contexte, message, KPIs, calendrier" },
                      { t: "5. Ranger dans briefs/AAAA-MM-JJ-naiom-....md", c: "key" },
                      { t: "" },
                      { t: "Règles : français, zéro chiffre inventé.", c: "dim" },
                    ]}
                  />
                ),
              },
              {
                id: "dossier5",
                label: "📁 Toutes les recettes",
                node: (
                  <svg viewBox="0 0 1200 480">
                    <FolderPanel
                      x={330}
                      y={30}
                      title=".claude/commands/"
                      caption="une commande par métier — je tape le nom, il suit la recette"
                      items={[
                        { name: "📄 brief.md      → un brief de campagne", d: "0s" },
                        { name: "📄 post.md       → un post LinkedIn", d: "0.5s" },
                        { name: "📄 visuel.md     → des prompts d'images", d: "1s" },
                        { name: "📄 deck.md       → une présentation", d: "1.5s" },
                        { name: "📄 analyse.md    → un rapport de perf", d: "2s" },
                        { name: "📄 campagne.md   → tout, de A à Z", d: "2.5s" },
                      ]}
                    />
                  </svg>
                ),
              },
            ]}
          />
          <div className="lv-why">
            💡 Le gâteau de votre grand-mère est réussi à chaque fois parce que la recette est
            écrite, pas improvisée. Ici, ces recettes s&apos;appellent des <b>skills</b> (des
            fichiers comme <span className="lv-mt">/brief</span>, <span className="lv-mt">/post</span>) :
            <b> ma façon de faire est écrite une fois pour toutes</b> — bon résultat à tous les coups,
            même quand je ne surveille pas.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 7 — LA CONSTRUCTION ============ */}
      <section className="lv-slide" id="lv7">
        <div className="lv-board lav">
          <div className="lv-eyebrow">Étape 07 · La construction — <span className="lv-mt">enfin&nbsp;!</span></div>
          <h2 className="lv-h2">
            Le terrain est prêt : <span className="lv-mark">il construit</span>
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : les pages, le code, les 11 employés IA — assemblés à partir des fichiers</div>
            <div className="lv-analog">🧱 comme le maçon : il ne pose les briques qu&apos;une fois les plans validés</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ar7" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* les fichiers préparés (étapes 3 à 6) = les fondations */}
              <text x="140" y="70" textAnchor="middle" fontSize="16" fontWeight="700" fill="#5A5A5A">les fichiers prêts</text>
              <BuildChip y={90} icon="📄" t="CLAUDE.md" d="0s" />
              <BuildChip y={150} icon="📝" t="MEMORY.md" d="0.3s" />
              <BuildChip y={210} icon="🔑" t=".env" d="0.6s" />
              <BuildChip y={270} icon="📋" t="les skills" d="0.9s" />
              <line x1="262" y1="200" x2="315" y2="200" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar7)" />
              {/* Claude Code construit à partir des fichiers */}
              <ClaudeWin
                x={330}
                y={70}
                s={0.66}
                caption="il s'appuie sur les fichiers pour tout assembler"
                prompt={<>Maintenant, construis tout<tspan className="lv-blink">▌</tspan></>}
              >
                <text x="196" y="132" fontSize="17" fill="#5A564E" className="lv-ph" style={{ ["--d" as string]: "0s" }}>→ je lis les fichiers…</text>
                <text x="196" y="170" fontSize="17" fill="#5A564E" className="lv-ph" style={{ ["--d" as string]: "1.2s" }}>→ je construis les pages…</text>
                <text x="196" y="208" fontSize="17" fill="#5A564E" className="lv-ph" style={{ ["--d" as string]: "2.4s" }}>→ je crée les 11 employés IA…</text>
                <text x="196" y="246" fontSize="17" fontWeight="700" fill="#188A5C" className="lv-ph" style={{ ["--d" as string]: "3.6s" }}>✓ en ligne, va voir !</text>
              </ClaudeWin>
              <line x1="712" y1="200" x2="775" y2="200" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar7)" />
              {/* le résultat : la plateforme + ses agents */}
              <g className="lv-pop">
                <rect x="788" y="80" width="360" height="245" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
                <circle cx="812" cy="106" r="5" fill="#FF5F57" /><circle cx="830" cy="106" r="5" fill="#FEBC2E" /><circle cx="848" cy="106" r="5" fill="#28C840" />
                <rect x="812" y="126" width="150" height="22" rx="8" fill="#5B4DEE" />
                {/* tuiles agents avec avatars */}
                <rect x="812" y="162" width="96" height="72" rx="14" fill="#5B4DEE" />
                <AgentPic slug="orchestrateur" x={822} y={168} size={62} />
                <rect x="920" y="162" width="52" height="72" rx="12" fill="#FFD9C7" />
                <AgentPic slug="createur-contenu" x={924} y={176} size={44} />
                <rect x="984" y="162" width="52" height="72" rx="12" fill="#C6EEDB" />
                <AgentPic slug="designer" x={988} y={176} size={44} />
                <rect x="1048" y="162" width="52" height="72" rx="12" fill="#DCD3FF" />
                <AgentPic slug="analyste" x={1052} y={176} size={44} />
                <rect x="812" y="248" width="288" height="14" rx="7" fill="#0F0F0F" opacity="0.35" />
                <rect x="812" y="272" width="220" height="14" rx="7" fill="#0F0F0F" opacity="0.2" />
                <text x="968" y="312" textAnchor="middle" fontSize="20" fontWeight="700" fill="#188A5C">l'équipe est en ligne ✓</text>
              </g>
              {/* boucle corrective */}
              <path d="M 968 380 Q 968 470 560 470 Q 400 470 400 342" fill="none" stroke="#F5411C" strokeWidth="4" className="lv-flow" markerEnd="url(#ar7)" />
              <rect x="430" y="440" width="380" height="56" rx="18" fill="#F5411C" />
              <text x="620" y="477" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">pas comme je voulais ? je lui redis</text>
            </svg>
          </div>
          <div className="lv-why">
            💡 On a attendu l&apos;étape 7 pour construire — <b>exprès</b>. Avec le manuel, la mémoire,
            les clés et les recettes déjà en place, Claude Code assemble vite et juste : les pages,
            le code, les 11 employés IA. Préparer le terrain, c&apos;est <b>construire sans se tromper</b>.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 8 — LA PLATEFORME ============ */}
      <section className="lv-slide" id="lv8">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Étape 08 · La plateforme — le résultat</div>
          <h2 className="lv-h2">
            La <span className="lv-mark m2">boutique</span> que vous visitez, là
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 le but : que tout soit visible et utilisable par n&apos;importe qui</div>
            <div className="lv-analog">🏪 c&apos;est comme un magasin : la vitrine, l&apos;atelier, et le comptoir</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ar8" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* landing */}
              <g className="lv-seq" style={{ ["--d" as string]: "0s" }}>
                <rect x="60" y="120" width="310" height="230" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
                <rect x="145" y="145" width="140" height="24" rx="12" fill="#F5411C" opacity="0.9" />
                <text x="215" y="230" textAnchor="middle" fontSize="30" fontWeight="800" opacity="0.85">ÉQUIPE IA</text>
                <rect x="170" y="255" width="90" height="60" rx="16" fill="#5B4DEE" />
                <text x="215" y="380" textAnchor="middle" fontSize="21" fontWeight="700">la vitrine : le site</text>
              </g>
              <line x1="370" y1="235" x2="425" y2="235" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar8)" />
              {/* studio */}
              <g className="lv-seq" style={{ ["--d" as string]: "1.4s" }}>
                <rect x="440" y="120" width="310" height="230" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
                <rect x="465" y="150" width="120" height="80" rx="16" fill="#5B4DEE" />
                <AgentPic slug="orchestrateur" x={493} y={158} size={64} />
                <rect x="597" y="150" width="60" height="80" rx="14" fill="#DCD3FF" />
                <AgentPic slug="strategiste" x={602} y={165} size={50} />
                <rect x="665" y="150" width="60" height="80" rx="14" fill="#FFD9C7" />
                <AgentPic slug="createur-contenu" x={670} y={165} size={50} />
                <rect x="465" y="242" width="60" height="80" rx="14" fill="#C6EEDB" />
                <AgentPic slug="gmail" x={470} y={257} size={50} />
                <rect x="533" y="242" width="60" height="80" rx="14" fill="#FFE9DC" />
                <AgentPic slug="designer" x={538} y={257} size={50} />
                <rect x="601" y="242" width="60" height="80" rx="14" fill="#EFF6FF" />
                <AgentPic slug="analyste" x={606} y={257} size={50} />
                <rect x="669" y="242" width="56" height="80" rx="14" fill="#F3E8FF" />
                <AgentPic slug="cv" x={672} y={257} size={50} />
                <text x="595" y="380" textAnchor="middle" fontSize="21" fontWeight="700">l&apos;atelier : les 9 spécialistes</text>
              </g>
              <line x1="750" y1="235" x2="805" y2="235" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ar8)" />
              {/* chat */}
              <g className="lv-seq" style={{ ["--d" as string]: "2.8s" }}>
                <ChatWin x={822} y={112} s={0.68} agent="Noam">
                  <ChatBubbleMe y={66} w={250}>Écris-moi un post</ChatBubbleMe>
                  <ChatBubbleBot y={124} w={230}>✅ Le voilà !</ChatBubbleBot>
                </ChatWin>
                <text x="978" y="380" textAnchor="middle" fontSize="21" fontWeight="700">le comptoir : on discute</text>
              </g>
              <text x="600" y="465" textAnchor="middle" fontSize="24" fill="#5A5A5A">
                rien n&apos;est un mockup — <tspan fontWeight="700" fill="#188A5C">tout ce que vous voyez tourne en vrai</tspan>
              </text>
            </svg>
          </div>
          <div className="lv-why">
            💡 Comme un magasin : la <b>vitrine</b> donne envie d&apos;entrer, l&apos;<b>atelier</b> c&apos;est
            là où l&apos;équipe travaille, et au <b>comptoir</b> on passe commande en discutant.
            Pas besoin de savoir ce qui se passe derrière : on demande, on reçoit.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 9 — FINALE (dark) ============ */}
      <section className="lv-slide" id="lv9">
        <div className="lv-board dark">
          <div className="lv-eyebrow" style={{ color: "#FF8867" }}>Et maintenant</div>
          <h2 className="lv-h2">Pendant que je dors, l&apos;équipe travaille</h2>
          <div className="lv-analog" style={{ marginLeft: 0 }}>
            🧺 c&apos;est comme un lave-linge lancé avant de se coucher : au réveil, c&apos;est fait
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <text x="80" y="90" fontSize="30" fill="#B7AEE8" fontWeight="700">🔁 en boucle, toute la nuit :</text>
              <g className="lv-mt" fontSize="27" fill="#FFFFFF">
                <g className="lv-night" style={{ ["--d" as string]: "0s" }}>
                  <AgentPic slug="strategiste" x={140} y={124} size={48} />
                  <text x="205" y="160">→ plan de campagne <tspan fill="#7BE3A9">✓</tspan> <tspan fill="#B7AEE8" fontSize="19">Antoine</tspan></text>
                </g>
                <g className="lv-night" style={{ ["--d" as string]: "1.2s" }}>
                  <AgentPic slug="createur-contenu" x={140} y={186} size={48} />
                  <text x="205" y="222">→ 3 posts LinkedIn <tspan fill="#7BE3A9">✓</tspan> <tspan fill="#B7AEE8" fontSize="19">Léa</tspan></text>
                </g>
                <g className="lv-night" style={{ ["--d" as string]: "2.4s" }}>
                  <AgentPic slug="designer" x={140} y={248} size={48} />
                  <text x="205" y="284">→ visuels de la campagne <tspan fill="#7BE3A9">✓</tspan> <tspan fill="#B7AEE8" fontSize="19">Mia</tspan></text>
                </g>
                <g className="lv-night" style={{ ["--d" as string]: "3.6s" }}>
                  <AgentPic slug="analyste" x={140} y={310} size={48} />
                  <text x="205" y="346">→ rapport YouTube <tspan fill="#7BE3A9">✓</tspan> <tspan fill="#B7AEE8" fontSize="19">Léo</tspan></text>
                </g>
                <g className="lv-night" style={{ ["--d" as string]: "4.8s" }}>
                  <AgentPic slug="presentateur" x={140} y={372} size={48} />
                  <text x="205" y="408">→ présentation client <tspan className="lv-blink" fill="#E8A33D">▌</tspan> <tspan fill="#B7AEE8" fontSize="19">Hugo</tspan></text>
                </g>
              </g>
              <text x="960" y="140" fontSize="72" className="lv-float">🌙</text>
              <rect x="830" y="300" width="290" height="130" rx="28" fill="#FFFFFF" />
              <text x="975" y="362" textAnchor="middle" fontSize="42">😴</text>
              <text x="975" y="404" textAnchor="middle" fontSize="23" fontWeight="700" fill="#191627">moi, je dors</text>
            </svg>
          </div>
          <div className="lv-why">
            💡 Comme un lave-linge qu&apos;on lance avant de se coucher : au réveil, c&apos;est fait.
            <b> Je pose ma liste le soir, le travail est prêt le matin</b> — je n&apos;ai plus
            qu&apos;à vérifier et valider.
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="bronx-cta-solid">
              Ouvrir le studio
              <Icon name="ArrowRight" size={15} />
            </Link>
            <a href="#lv-top" className="althea-pill-cta">
              Revoir depuis le début ↑
            </a>
            <span className="ml-auto hidden sm:flex items-center">
              <AgentAvatar slug="orchestrateur" size={90} animate zen cutout aura={false} />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =================================================================
   PETITS COMPOSANTS
   ================================================================= */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-[#0F0F0F] bg-white px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </kbd>
  );
}

/** Ligne ordonnée du plan (slide 02). */
function PlanStep({ y, n, t, d }: { y: number; n: string; t: string; d: string }) {
  return (
    <g className="lv-in" style={{ ["--d" as string]: d }}>
      <circle cx={758} cy={y - 5} r={15} fill="#5B4DEE" />
      <text x={758} y={y} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">{n}</text>
      <text x={786} y={y} fontSize={17} fontWeight={700} fill="#0F0F0F">{t}</text>
    </g>
  );
}

/** Fichier-fondation qui se pose (slide 07 construction). */
function BuildChip({ y, icon, t, d }: { y: number; icon: string; t: string; d: string }) {
  return (
    <g className="lv-in" style={{ ["--d" as string]: d }}>
      <rect x={40} y={y} width={220} height={48} rx={14} fill="#FFFFFF" stroke="#0F0F0F" strokeWidth={2.5} />
      <text x={64} y={y + 31} fontSize={22}>{icon}</text>
      <text x={98} y={y + 31} fontSize={17} fontWeight={700} className="lv-mt" fill="#0F0F0F">{t}</text>
    </g>
  );
}

/** Boîte service (slide 06) — rect + label, reveal séquencé. */
function ServiceBox({ x, y, d, label }: { x: number; y: number; d: string; label: string }) {
  return (
    <g className="lv-seq" style={{ ["--d" as string]: d }}>
      <rect x={x} y={y} width={240} height={90} rx={22} fill="#FFFFFF" stroke="#0F0F0F" strokeWidth={3.5} />
      <text x={x + 120} y={y + 55} textAnchor="middle" fontSize={25} fontWeight={700}>
        {label}
      </text>
    </g>
  );
}
