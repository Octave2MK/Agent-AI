import Link from "next/link";
import { AppNav } from "@/components/landing/AppNav";
import { Icon } from "@/components/Icon";

export const metadata = {
  title: "Les bases · naiom",
  description:
    "C'est quoi un LLM, une automatisation, un agent IA ? La différence expliquée simplement, avec des schémas animés.",
};

/**
 * /bases — Introduction aux agents IA, en slides animées (même langage que
 * /live) : LLM, automatisation (déterministe), agent IA (interprète et
 * décide), la différence côte à côte, et quand utiliser quoi.
 * Zéro jargon : une comparaison de la vie courante par slide.
 */
export default function BasesPage() {
  return (
    <div className="bronx-page lv-snap min-h-screen w-full">
      <AppNav active="bases" />

      {/* ============ SLIDE 0 — COVER ============ */}
      <section className="lv-slide" id="b-top">
        <div className="lv-board lav items-center justify-center text-center" style={{ gap: "2.4vh" }}>
          <div className="lv-eyebrow">Les bases · avant la démo</div>
          <h1
            className="bronx-hero-title"
            style={{ fontSize: "clamp(32px, 4.4vw, 64px)", maxWidth: "24ch", lineHeight: 1.1 }}
          >
            <span className="lv-mark">Agent IA</span> ou{" "}
            <span className="lv-mark m2">automatisation</span>&nbsp;?
            <br />
            Les bases, expliquées simplement
          </h1>
          <p className="bronx-body" style={{ maxWidth: 560 }}>
            Cinq idées à comprendre avant de voir l'équipe d'employés IA tourner — chacune
            avec un schéma animé et une comparaison de la vie de tous les jours.
          </p>
          <nav className="lv-toc">
            <a href="#b1"><span className="n">01</span>C&apos;est quoi un LLM</a>
            <a href="#b2"><span className="n">02</span>C&apos;est quoi une automatisation</a>
            <a href="#b3"><span className="n">03</span>C&apos;est quoi un agent IA</a>
            <a href="#b4"><span className="n">04</span>La différence, côte à côte</a>
            <a href="#b5"><span className="n">05</span>Quand utiliser quoi</a>
            <a href="#b6"><span className="n">06</span>Des exemples concrets</a>
          </nav>
          <div className="text-[13px] text-[#8A8A8A]">
            Navigue avec <Kbd>↓</Kbd> <Kbd>↑</Kbd> — chaque schéma tourne en boucle
          </div>
        </div>
      </section>

      {/* ============ SLIDE 1 — LE LLM ============ */}
      <section className="lv-slide" id="b1">
        <div className="lv-board">
          <div className="lv-eyebrow">01 · Le moteur</div>
          <h2 className="lv-h2">
            C&apos;est quoi un <span className="lv-mark">LLM</span> ?
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 à retenir : il lit du texte, il produit du texte — c&apos;est tout</div>
            <div className="lv-analog">📚 c&apos;est comme un cerveau qui a lu toute la bibliothèque… mais sans bras</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ba1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* demandes qui défilent */}
              <text x="205" y="95" textAnchor="middle" fontSize="20" fill="#8A8A8A">on lui écrit…</text>
              <g>
                <g className="lv-ph" style={{ ["--d" as string]: "0s" }}>
                  <rect x="40" y="120" width="330" height="66" rx="22" fill="#5B4DEE" />
                  <text x="205" y="162" textAnchor="middle" fill="#fff" fontSize="21" fontWeight="700">« Écris un post LinkedIn »</text>
                </g>
                <g className="lv-ph" style={{ ["--d" as string]: "2s" }}>
                  <rect x="40" y="120" width="330" height="66" rx="22" fill="#5B4DEE" />
                  <text x="205" y="162" textAnchor="middle" fill="#fff" fontSize="21" fontWeight="700">« Résume ce document »</text>
                </g>
                <g className="lv-ph" style={{ ["--d" as string]: "4s" }}>
                  <rect x="40" y="120" width="330" height="66" rx="22" fill="#5B4DEE" />
                  <text x="205" y="162" textAnchor="middle" fill="#fff" fontSize="21" fontWeight="700">« Réponds à ce client »</text>
                </g>
              </g>
              <line x1="375" y1="153" x2="460" y2="200" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ba1)" />
              {/* le cerveau LLM */}
              <circle cx="580" cy="260" r="110" fill="#5B4DEE" />
              <text x="580" y="238" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800">LLM</text>
              <text x="580" y="268" textAnchor="middle" fill="#DCD3FF" fontSize="14.5">il a « lu » des milliards</text>
              <text x="580" y="288" textAnchor="middle" fill="#DCD3FF" fontSize="14.5">de textes et prédit</text>
              <text x="580" y="308" textAnchor="middle" fill="#DCD3FF" fontSize="14.5">les mots suivants</text>
              {/* livres qui flottent autour */}
              <text x="450" y="140" fontSize="34" className="lv-float">📚</text>
              <text x="700" y="130" fontSize="30" className="lv-float" style={{ animationDelay: "-1.5s" }}>📖</text>
              <text x="710" y="390" fontSize="30" className="lv-float" style={{ animationDelay: "-2.5s" }}>📚</text>
              <line x1="695" y1="270" x2="790" y2="230" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ba1)" />
              {/* sortie texte */}
              <g className="lv-pop">
                <rect x="805" y="120" width="330" height="230" rx="24" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
                <text x="970" y="160" textAnchor="middle" fontSize="21" fontWeight="700" fill="#188A5C">…il répond en texte</text>
                <rect x="835" y="186" width="250" height="13" rx="6" fill="#0F0F0F" opacity="0.7" />
                <rect x="835" y="214" width="270" height="13" rx="6" fill="#0F0F0F" opacity="0.4" />
                <rect x="835" y="242" width="230" height="13" rx="6" fill="#0F0F0F" opacity="0.4" />
                <rect x="835" y="270" width="255" height="13" rx="6" fill="#0F0F0F" opacity="0.4" />
                <text x="835" y="322" fontSize="24" className="lv-blink">▌</text>
              </g>
              <text x="600" y="475" textAnchor="middle" fontSize="24" fill="#5A5A5A">
                seul, il ne <tspan fontWeight="700" fill="#F5411C">fait </tspan> rien : il ne clique pas, n&apos;envoie rien, ne range rien
              </text>
            </svg>
          </div>
          <div className="lv-why">
            💡 Un LLM (ChatGPT, Claude…), c&apos;est le <b>cerveau</b> : brillant pour comprendre
            et rédiger, mais sans bras ni jambes. Pour qu&apos;il <b>fasse</b> des choses, il faut
            lui donner des outils — c&apos;est là qu&apos;arrivent les agents.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 2 — L'AUTOMATISATION ============ */}
      <section className="lv-slide" id="b2">
        <div className="lv-board mint">
          <div className="lv-eyebrow">02 · Exemple : la facturation</div>
          <h2 className="lv-h2">
            Une <span className="lv-mark m2">automatisation</span>, concrètement
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 à retenir : chaque donnée est recopiée par une règle fixe — zéro décision</div>
            <div className="lv-analog">🧾 exemple : je remplis un formulaire → la facture se crée, se range, s&apos;envoie</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ba2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>

              {/* ---------- LE FORMULAIRE (entrée) ---------- */}
              <rect x="20" y="52" width="272" height="420" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="156" y="88" textAnchor="middle" fontSize="19" fontWeight="800">📝 Le formulaire</text>
              <line x1="20" y1="102" x2="292" y2="102" stroke="#EEEDF6" strokeWidth="2" />
              <FormField y={118} label="Nom du client" value="Boulangerie Martin" color="#5B4DEE" d="0s" />
              <FormField y={202} label="Prestation" value="Création site web" color="#8B5CF6" d="0.4s" />
              <FormField y={286} label="Montant HT" value="2 400 €" color="#F5411C" d="0.8s" />
              <FormField y={370} label="Date" value="15 juil. 2026" color="#188A5C" d="1.2s" />

              {/* ---------- LES FLÈCHES DE MAPPING (le cœur) ---------- */}
              <text x="430" y="42" textAnchor="middle" fontSize="15" fontWeight="700" fill="#8A8A8A" className="lv-mt">
                MAPPING · chaque champ recopié au bon endroit
              </text>
              {/* client → facturé à (bleu) */}
              <path d="M 292 152 C 400 152 460 158 566 158" fill="none" stroke="#5B4DEE" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba2)" />
              {/* prestation → désignation (violet) */}
              <path d="M 292 236 C 400 236 460 232 566 232" fill="none" stroke="#8B5CF6" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba2)" />
              {/* montant → total HT (orange) */}
              <path d="M 292 320 C 400 320 460 306 566 306" fill="none" stroke="#F5411C" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba2)" />
              {/* date → N° facture (vert, remonte) */}
              <path d="M 292 404 C 410 404 430 122 566 122" fill="none" stroke="#188A5C" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba2)" />

              {/* ---------- LA FACTURE (sortie) ---------- */}
              <rect x="566" y="55" width="322" height="415" rx="18" fill="#FBFAFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="586" y="120" fontSize="20" fontWeight="800" fill="#0F0F0F">FACTURE</text>
              <text x="872" y="120" textAnchor="end" fontSize="15" fontWeight="700" fill="#188A5C" className="lv-mt">N° 2026-042</text>
              <MapRow y={150} label="Facturé à" value="Boulangerie Martin" color="#5B4DEE" d="1.8s" />
              <MapRow y={224} label="Désignation" value="Création site web" color="#8B5CF6" d="2.2s" />
              <line x1="586" y1="266" x2="868" y2="266" stroke="#EEEDF6" strokeWidth="2" />
              <MapRow y={298} label="Total HT" value="2 400 €" color="#F5411C" d="2.6s" />
              {/* champs CALCULÉS par règle fixe */}
              <MapRow y={352} label="TVA 20 %" value="480 €" color="#0F0F0F" d="3s" auto="× 0,20" />
              <MapRow y={410} label="Total TTC" value="2 880 €" color="#0F0F0F" d="3.4s" auto="HT × 1,20" bold />

              {/* ---------- LES SORTIES : Drive + Email ---------- */}
              <path d="M 888 200 C 930 200 950 150 986 150" fill="none" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ba2)" />
              <path d="M 888 330 C 930 330 950 380 986 380" fill="none" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ba2)" />
              <g className="lv-in" style={{ ["--d" as string]: "3.8s" }}>
                <rect x="992" y="112" width="188" height="80" rx="20" fill="#DFF6EA" stroke="#0F0F0F" strokeWidth="3" />
                <text x="1086" y="150" textAnchor="middle" fontSize="26">📁</text>
                <text x="1086" y="178" textAnchor="middle" fontSize="16" fontWeight="700">rangée dans Drive ✓</text>
              </g>
              <g className="lv-in" style={{ ["--d" as string]: "4.2s" }}>
                <rect x="992" y="340" width="188" height="80" rx="20" fill="#EDEBFF" stroke="#0F0F0F" strokeWidth="3" />
                <text x="1086" y="378" textAnchor="middle" fontSize="26">✉️</text>
                <text x="1086" y="406" textAnchor="middle" fontSize="16" fontWeight="700">envoyée au client ✓</text>
              </g>
            </svg>
          </div>
          <div className="lv-why">
            💡 Chaque case du formulaire est <b>recopiée toujours au même endroit</b>, et la TVA
            est un simple calcul (× 1,20). Aucune décision : même formulaire → même facture, à
            l&apos;euro près. C&apos;est ça, une automatisation (ici avec n8n) — fiable et rapide,
            mais si un cas sort du cadre prévu, elle s&apos;arrête au lieu d&apos;improviser.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 3 — L'AGENT IA ============ */}
      <section className="lv-slide" id="b3">
        <div className="lv-board peach">
          <div className="lv-eyebrow">03 · L&apos;employé qui comprend</div>
          <h2 className="lv-h2">
            C&apos;est quoi un <span className="lv-mark m3">agent IA</span> ?
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 à retenir : on lui donne le but, pas les étapes</div>
            <div className="lv-analog">🧑‍🍳 c&apos;est comme un bon employé : il interprète la consigne et se débrouille</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ba3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* la boucle de l'agent */}
              <path id="agentloop" d="M 520 105 A 210 165 0 1 1 519.9 105" fill="none" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" />
              <circle r="14" fill="#F5411C" stroke="#0F0F0F" strokeWidth="3">
                <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#agentloop" /></animateMotion>
              </circle>
              {/* étapes de la boucle */}
              <rect x="400" y="55" width="240" height="80" rx="22" fill="#5B4DEE" />
              <text x="520" y="90" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="700">🎯 Tu donnes</text>
              <text x="520" y="118" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="700">un objectif</text>
              <rect x="660" y="220" width="230" height="80" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="775" y="255" textAnchor="middle" fontSize="22" fontWeight="700">il interprète</text>
              <text x="775" y="283" textAnchor="middle" fontSize="17" fill="#5A5A5A">« qu&apos;est-ce qu&apos;on me demande ? »</text>
              <rect x="400" y="390" width="240" height="80" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="520" y="425" textAnchor="middle" fontSize="22" fontWeight="700">il décide & agit</text>
              <text x="520" y="453" textAnchor="middle" fontSize="17" fill="#5A5A5A">il choisit le bon outil</text>
              <rect x="130" y="220" width="230" height="80" rx="22" fill="#F5411C" />
              <text x="245" y="255" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">il vérifie</text>
              <text x="245" y="283" textAnchor="middle" fill="#FFD9C7" fontSize="17">pas bon ? il recommence</text>
              {/* ses outils */}
              <text x="950" y="95" fontSize="21" fontWeight="700" fill="#5A5A5A">ses outils :</text>
              <g fontSize="30">
                <text x="950" y="145" className="lv-seq" style={{ ["--d" as string]: "0s" }}>✉️ <tspan fontSize="19" fill="#5A5A5A">envoyer un email</tspan></text>
                <text x="950" y="195" className="lv-seq" style={{ ["--d" as string]: "0.8s" }}>📅 <tspan fontSize="19" fill="#5A5A5A">lire l&apos;agenda</tspan></text>
                <text x="950" y="245" className="lv-seq" style={{ ["--d" as string]: "1.6s" }}>📁 <tspan fontSize="19" fill="#5A5A5A">ranger un fichier</tspan></text>
                <text x="950" y="295" className="lv-seq" style={{ ["--d" as string]: "2.4s" }}>🔍 <tspan fontSize="19" fill="#5A5A5A">chercher une info</tspan></text>
              </g>
              <text x="1000" y="400" textAnchor="middle" fontSize="21" fill="#5A5A5A">= un LLM (le cerveau)</text>
              <text x="1000" y="428" textAnchor="middle" fontSize="21" fontWeight="700" fill="#F5411C">+ des outils (les bras)</text>
              <text x="1000" y="456" textAnchor="middle" fontSize="21" fill="#5A5A5A">+ une boucle (il insiste)</text>
            </svg>
          </div>
          <div className="lv-why">
            💡 À un employé, on ne dit pas « lève le bras droit, saisis le téléphone… » —
            on dit <b>« occupe-toi de ce client »</b> et il se débrouille. L&apos;agent, c&apos;est
            pareil : un LLM avec des outils, qui interprète, choisit, agit, vérifie — et
            recommence jusqu&apos;à ce que ce soit bon.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 4 — LA DIFFÉRENCE ============ */}
      <section className="lv-slide" id="b4">
        <div className="lv-board">
          <div className="lv-eyebrow">04 · Face à face</div>
          <h2 className="lv-h2">
            <span className="lv-mark m2">Rails</span> ou <span className="lv-mark m3">boussole</span> : la vraie différence
          </h2>
          <div className="flex flex-wrap gap-y-2">
            <div className="lv-goal">🎯 à retenir : l&apos;automatisation exécute, l&apos;agent décide</div>
            <div className="lv-analog">🚂🧭 le train suit ses rails · le guide choisit son chemin selon la météo</div>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ba4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* séparateur */}
              <line x1="600" y1="30" x2="600" y2="490" stroke="#EEEDF6" strokeWidth="3" />
              {/* ------- gauche : automatisation ------- */}
              <text x="300" y="55" textAnchor="middle" fontSize="25" fontWeight="800" fill="#188A5C">🚂 AUTOMATISATION</text>
              {/* 3 entrées différentes → même chemin */}
              <g fontSize="17" fontWeight="600">
                <rect x="60" y="100" width="180" height="52" rx="16" fill="#C6EEDB" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="150" y="132" textAnchor="middle">email d&apos;un client</text>
                <rect x="60" y="200" width="180" height="52" rx="16" fill="#C6EEDB" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="150" y="232" textAnchor="middle">email d&apos;un collègue</text>
                <rect x="60" y="300" width="180" height="52" rx="16" fill="#C6EEDB" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="150" y="332" textAnchor="middle">spam</text>
              </g>
              <line x1="240" y1="126" x2="330" y2="216" stroke="#0F0F0F" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba4)" />
              <line x1="240" y1="226" x2="330" y2="226" stroke="#0F0F0F" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba4)" />
              <line x1="240" y1="326" x2="330" y2="236" stroke="#0F0F0F" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba4)" />
              <rect x="342" y="196" width="200" height="60" rx="18" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
              <text x="442" y="233" textAnchor="middle" fontSize="19" fontWeight="700">même traitement</text>
              <text x="442" y="300" textAnchor="middle" fontSize="18" fill="#5A5A5A">peu importe le contenu :</text>
              <text x="442" y="326" textAnchor="middle" fontSize="18" fontWeight="700" fill="#188A5C">règle fixe, résultat prévisible</text>
              <text x="300" y="470" textAnchor="middle" fontSize="20" fontWeight="700" fill="#188A5C">déterministe = zéro surprise</text>
              {/* ------- droite : agent ------- */}
              <text x="900" y="55" textAnchor="middle" fontSize="25" fontWeight="800" fill="#F5411C">🧭 AGENT IA</text>
              <g fontSize="17" fontWeight="600">
                <rect x="660" y="100" width="180" height="52" rx="16" fill="#FFD9C7" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="750" y="132" textAnchor="middle">email d&apos;un client</text>
                <rect x="660" y="200" width="180" height="52" rx="16" fill="#FFD9C7" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="750" y="232" textAnchor="middle">email d&apos;un collègue</text>
                <rect x="660" y="300" width="180" height="52" rx="16" fill="#FFD9C7" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="750" y="332" textAnchor="middle">spam</text>
              </g>
              {/* losange décision */}
              <path d="M 920 176 L 985 226 L 920 276 L 855 226 Z" fill="#5B4DEE" />
              <text x="920" y="222" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">il lit et</text>
              <text x="920" y="242" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">interprète</text>
              <line x1="840" y1="126" x2="880" y2="196" stroke="#0F0F0F" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba4)" />
              <line x1="840" y1="226" x2="850" y2="226" stroke="#0F0F0F" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba4)" />
              <line x1="840" y1="326" x2="880" y2="258" stroke="#0F0F0F" strokeWidth="3.5" className="lv-flow" markerEnd="url(#ba4)" />
              {/* 3 sorties différentes, séquencées */}
              <g className="lv-seq" style={{ ["--d" as string]: "0s" }}>
                <line x1="988" y1="200" x2="1030" y2="140" stroke="#F5411C" strokeWidth="3.5" markerEnd="url(#ba4)" />
                <rect x="1035" y="105" width="150" height="56" rx="16" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="1110" y="128" textAnchor="middle" fontSize="14.5" fontWeight="700">répond vite +</text>
                <text x="1110" y="148" textAnchor="middle" fontSize="14.5" fontWeight="700">prévient l&apos;équipe</text>
              </g>
              <g className="lv-seq" style={{ ["--d" as string]: "1.6s" }}>
                <line x1="990" y1="226" x2="1030" y2="226" stroke="#F5411C" strokeWidth="3.5" markerEnd="url(#ba4)" />
                <rect x="1035" y="198" width="150" height="56" rx="16" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="1110" y="221" textAnchor="middle" fontSize="14.5" fontWeight="700">planifie un</text>
                <text x="1110" y="241" textAnchor="middle" fontSize="14.5" fontWeight="700">point demain</text>
              </g>
              <g className="lv-seq" style={{ ["--d" as string]: "3.2s" }}>
                <line x1="988" y1="252" x2="1030" y2="310" stroke="#F5411C" strokeWidth="3.5" markerEnd="url(#ba4)" />
                <rect x="1035" y="290" width="150" height="56" rx="16" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
                <text x="1110" y="313" textAnchor="middle" fontSize="14.5" fontWeight="700">supprime,</text>
                <text x="1110" y="333" textAnchor="middle" fontSize="14.5" fontWeight="700">sans déranger</text>
              </g>
              <text x="900" y="470" textAnchor="middle" fontSize="20" fontWeight="700" fill="#F5411C">il choisit selon la situation</text>
            </svg>
          </div>
          <div className="lv-why">
            💡 Même entrée, deux mondes : l&apos;automatisation applique <b>la même règle à
            tout</b> (prévisible, parfait pour le répétitif) ; l&apos;agent <b>lit, comprend et
            choisit</b> une réponse différente selon le contexte — comme le ferait un humain.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 5 — QUAND UTILISER QUOI ============ */}
      <section className="lv-slide" id="b5">
        <div className="lv-board ciel">
          <div className="lv-eyebrow">05 · En pratique</div>
          <h2 className="lv-h2">
            Quand utiliser <span className="lv-mark m2">l&apos;un</span>, quand utiliser <span className="lv-mark m3">l&apos;autre</span> ?
          </h2>
          <div className="lv-analog" style={{ marginLeft: 0 }}>
            🏗️ c&apos;est comme un chantier : les machines font le répétitif, le chef de chantier décide
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 520">
              <defs>
                <marker id="ba5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* colonne automatisation */}
              <rect x="60" y="50" width="460" height="280" rx="26" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="290" y="95" textAnchor="middle" fontSize="23" fontWeight="800" fill="#188A5C">🚂 Automatisation si…</text>
              <g fontSize="19" fill="#3A3A3A">
                <text x="100" y="145" className="lv-seq" style={{ ["--d" as string]: "0s" }}>✓ c&apos;est répétitif et identique</text>
                <text x="100" y="190" className="lv-seq" style={{ ["--d" as string]: "0.6s" }}>✓ les règles sont claires (si X → Y)</text>
                <text x="100" y="235" className="lv-seq" style={{ ["--d" as string]: "1.2s" }}>✓ zéro jugement nécessaire</text>
                <text x="100" y="290" fontSize="17" fill="#8A8A8A">ex. classer les factures, sauvegarder,</text>
                <text x="100" y="315" fontSize="17" fill="#8A8A8A">envoyer le rappel du lundi matin</text>
              </g>
              {/* colonne agent */}
              <rect x="680" y="50" width="460" height="280" rx="26" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
              <text x="910" y="95" textAnchor="middle" fontSize="23" fontWeight="800" fill="#F5411C">🧭 Agent IA si…</text>
              <g fontSize="19" fill="#3A3A3A">
                <text x="720" y="145" className="lv-seq" style={{ ["--d" as string]: "0.3s" }}>✓ chaque cas est différent</text>
                <text x="720" y="190" className="lv-seq" style={{ ["--d" as string]: "0.9s" }}>✓ il faut lire, comprendre, juger</text>
                <text x="720" y="235" className="lv-seq" style={{ ["--d" as string]: "1.5s" }}>✓ il faut produire du contenu</text>
                <text x="720" y="290" fontSize="17" fill="#8A8A8A">ex. répondre à un client mécontent,</text>
                <text x="720" y="315" fontSize="17" fill="#8A8A8A">écrire un post, trier des candidatures</text>
              </g>
              {/* le duo gagnant */}
              <line x1="290" y1="335" x2="510" y2="415" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ba5)" />
              <line x1="910" y1="335" x2="690" y2="415" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#ba5)" />
              <g className="lv-pop">
                <rect x="410" y="400" width="380" height="90" rx="24" fill="#5B4DEE" />
                <text x="600" y="438" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="700">🤝 Le duo gagnant :</text>
                <text x="600" y="468" textAnchor="middle" fill="#DCD3FF" fontSize="18">l&apos;agent décide, les automatisations exécutent</text>
              </g>
            </svg>
          </div>
          <div className="lv-why">
            💡 Ce n&apos;est pas l&apos;un OU l&apos;autre : le meilleur système, c&apos;est <b>l&apos;agent
            qui pilote des automatisations</b> — le chef de chantier et ses machines.
            C&apos;est exactement ce que NAIOM construit : des agents IA + des automatisations n8n.
          </div>
        </div>
      </section>

      {/* ============ SLIDE 6 — EXEMPLES CONCRETS ============ */}
      <section className="lv-slide" id="b6">
        <div className="lv-board">
          <div className="lv-eyebrow">06 · Dans la vraie vie</div>
          <h2 className="lv-h2">
            Des exemples <span className="lv-mark">concrets</span>, métier par métier
          </h2>
          <div className="lv-goal">🎯 le même métier, les deux outils — chacun à sa place</div>

          <div className="lv-fig items-start overflow-y-auto">
            <div className="w-full pt-3">
              {/* en-tête */}
              <div className="grid grid-cols-[150px_1fr_1fr] gap-3 mb-2 max-sm:grid-cols-1">
                <div />
                <div className="rounded-xl bg-[#C6EEDB] border-2 border-[#0F0F0F] px-4 py-2 text-center font-black text-[15px] text-[#0F5138]">
                  🚂 Automatisation (n8n)
                </div>
                <div className="rounded-xl bg-[#FFD9C7] border-2 border-[#0F0F0F] px-4 py-2 text-center font-black text-[15px] text-[#A32B08]">
                  🧭 Agent IA
                </div>
              </div>

              <ExampleRow
                d="0s"
                domain="🎯 Prospection"
                autom={[
                  "chaque nouveau lead entre tout seul dans le CRM",
                  "relances envoyées à J+3 et J+7, automatiquement",
                ]}
                agent={[
                  "lit le site du prospect et écrit un premier message personnalisé",
                  "qualifie le lead (budget, besoin, urgence) après le call",
                ]}
              />
              <ExampleRow
                d="0.9s"
                domain="📣 Marketing"
                autom={[
                  "publie le post programmé chaque lundi à 8 h",
                  "ajoute chaque inscrit webinaire à la newsletter",
                ]}
                agent={[
                  "analyse les stats du mois et propose le plan du mois suivant",
                  "adapte le message par audience (dirigeant vs équipe)",
                ]}
              />
              <ExampleRow
                d="1.8s"
                domain="✍️ Contenu"
                autom={[
                  "redimensionne les visuels dans tous les formats",
                  "transforme le post publié en brouillon de newsletter",
                ]}
                agent={[
                  "écrit le post à partir du brief, dans le ton de la marque",
                  "décline une vidéo en 3 hooks différents et choisit le meilleur",
                ]}
              />
              <ExampleRow
                d="2.7s"
                domain="🤝 Onboarding client"
                autom={[
                  "contrat signé → dossier créé, accès envoyés, facture émise",
                  "rappel automatique si le questionnaire n'est pas rempli",
                ]}
                agent={[
                  "lit les réponses au questionnaire et adapte le plan d'onboarding",
                  "répond aux questions du client pendant tout le démarrage",
                ]}
              />
              <ExampleRow
                d="3.6s"
                domain="🛟 Service client"
                autom={[
                  "accusé de réception immédiat + ticket créé",
                  "enquête de satisfaction envoyée à la clôture",
                ]}
                agent={[
                  "lit la demande : répond seul, ou escalade si c'est grave",
                  "détecte un client mécontent et prévient l'équipe en priorité",
                ]}
              />
            </div>
          </div>

          <div className="lv-why">
            💡 La règle est toujours la même : <b>si l&apos;étape est identique à chaque fois →
            automatisation ; s&apos;il faut lire, comprendre ou rédiger → agent</b>. Et le
            meilleur système enchaîne les deux : l&apos;agent qualifie le lead, l&apos;automatisation
            l&apos;enregistre et programme la relance.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href="/live" className="bronx-cta-solid">
              Voir comment j'ai construit mon équipe d'employés IA
              <Icon name="ArrowRight" size={15} />
            </Link>
            <Link href="/dashboard" className="althea-pill-cta">
              Ouvrir le studio
            </Link>
            <a href="#b-top" className="althea-pill-cta">
              Revoir depuis le début ↑
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Ligne d'exemples : un domaine, automatisations à gauche, agent à droite. */
function ExampleRow({
  d, domain, autom, agent,
}: {
  d: string; domain: string; autom: string[]; agent: string[];
}) {
  return (
    <div className="lv-in grid grid-cols-[150px_1fr_1fr] gap-3 py-2 border-b border-[#EEEDF6] last:border-0 max-sm:grid-cols-1" style={{ ["--d" as string]: d }}>
      <div className="font-black text-[14.5px] pt-1.5">{domain}</div>
      <ul className="space-y-1">
        {autom.map((a) => (
          <li key={a} className="text-[13px] leading-snug text-[#3A3A3A] flex gap-1.5">
            <span className="text-[#188A5C] font-black shrink-0">✓</span>
            {a}
          </li>
        ))}
      </ul>
      <ul className="space-y-1">
        {agent.map((a) => (
          <li key={a} className="text-[13px] leading-snug text-[#3A3A3A] flex gap-1.5">
            <span className="text-[#F5411C] font-black shrink-0">✓</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= Petits composants ================= */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-[#0F0F0F] bg-white px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </kbd>
  );
}

/** Champ du formulaire (slide 02) — libellé + valeur saisie qui apparaît. */
function FormField({
  y, label, value, color, d,
}: {
  y: number; label: string; value: string; color: string; d: string;
}) {
  return (
    <g className="lv-in" style={{ ["--d" as string]: d }}>
      <text x={44} y={y + 14} fontSize={13.5} fontWeight={700} fill="#8A8A8A">{label}</text>
      <rect x={44} y={y + 24} width={224} height={40} rx={10} fill="#F7F6FC" stroke={color} strokeWidth={2} />
      <circle cx={60} cy={y + 44} r={4} fill={color} />
      <text x={76} y={y + 49} fontSize={15} fontWeight={700} fill="#0F0F0F">{value}</text>
    </g>
  );
}

/** Ligne de la facture (slide 02) — reçoit une donnée mappée (ou calculée). */
function MapRow({
  y, label, value, color, d, auto, bold,
}: {
  y: number; label: string; value: string; color: string; d: string; auto?: string; bold?: boolean;
}) {
  return (
    <g className="lv-in" style={{ ["--d" as string]: d }}>
      <text x={586} y={y} fontSize={15} fontWeight={700} fill="#5A5A5A">{label}</text>
      <text x={868} y={y} textAnchor="end" fontSize={bold ? 20 : 16} fontWeight={bold ? 800 : 700} fill={color}>
        {value}
      </text>
      {/* pastille couleur = provenance du champ (mappé) */}
      {!auto && <circle cx={576} cy={y - 5} r={4} fill={color} />}
      {/* badge « calcul auto » pour les champs déterministes */}
      {auto && (
        <>
          <rect x={640} y={y - 15} width={78} height={19} rx={9} fill="#0F0F0F" />
          <text x={679} y={y - 1} textAnchor="middle" fontSize={11} fontWeight={700} fill="#FFD9C7" className="lv-mt">{auto}</text>
        </>
      )}
    </g>
  );
}
