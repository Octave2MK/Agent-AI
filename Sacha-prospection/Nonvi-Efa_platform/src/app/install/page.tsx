import { AppNav } from "@/components/landing/AppNav";
import { ClaudeWin, FileWindow, AgentPic } from "@/components/landing/LiveMocks";
import { FigTabs } from "@/components/landing/FigTabs";

export const metadata = {
  title: "Installer · Nonvi-Efa",
  description:
    "Guide pas à pas pour installer ton équipe d'employés IA sur ton ordinateur avec Claude Code — pour débutants, sans écrire de code.",
};

/**
 * /install — Tutoriel d'installation pour débutants.
 * Zéro emoji : chaque écran est une VRAIE reconstitution d'interface (la fenêtre
 * Claude Code, les pages de réglages des outils, le navigateur). Le fil est
 * toujours le même : tu parles à Claude Code, il fait le travail.
 * Décompresser → ouvrir dans Claude Code → installer → créer le fichier de clés
 * .env.local → récupérer les clés API → lancer et voir (localhost).
 */
export default function InstallPage() {
  return (
    <div className="bronx-page lv-snap min-h-screen w-full">
      <AppNav active="install" />

      {/* ============ COVER ============ */}
      <section className="lv-slide" id="in-top">
        <div className="lv-board lav items-center justify-center text-center" style={{ gap: "2.2vh" }}>
          <div className="lv-eyebrow">Guide d&apos;installation · pour débutants</div>
          <h1 className="bronx-hero-title" style={{ fontSize: "clamp(30px, 4.2vw, 60px)", maxWidth: "22ch", lineHeight: 1.1 }}>
            Installe ton <span className="lv-mark">équipe d&apos;employés IA</span>
            <br />
            en 6 étapes, sur ton ordinateur
          </h1>
          <p className="bronx-body" style={{ maxWidth: 640 }}>
            Tu as reçu un dossier (un fichier <b>.zip</b>). Tu vas l&apos;installer avec
            <b> Claude Code</b> — sans écrire une seule ligne de code. Tu ne fais que
            <b> parler à Claude</b>, il s&apos;occupe du reste.
          </p>
          <nav className="lv-toc">
            <a href="#in1"><span className="n">01</span>Décompresse le dossier</a>
            <a href="#in2"><span className="n">02</span>Ouvre-le dans Claude Code</a>
            <a href="#in3"><span className="n">03</span>Demande à Claude d&apos;installer</a>
            <a href="#in4"><span className="n">04</span>Crée ton fichier de clés</a>
            <a href="#in5"><span className="n">05</span>Récupère tes clés API</a>
            <a href="#in6"><span className="n">06</span>Lance et regarde</a>
          </nav>
          <div className="text-[13px] text-[#8A8A8A]">
            Navigue avec <Kbd>↓</Kbd> <Kbd>↑</Kbd> — clique sur les onglets pour voir chaque écran
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 0 — CE QU'IL TE FAUT ============ */}
      <section className="lv-slide" id="in0">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Avant de commencer</div>
          <h2 className="lv-h2">Tu n&apos;as besoin que de <span className="lv-mark m2">deux choses</span></h2>
          <div className="flex flex-wrap gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">le dossier qu&apos;on t&apos;a envoyé, et l&apos;application Claude Code ouverte</span>
          </div>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 470">
              {/* le dossier reçu, dans le Finder */}
              <Finder x={70} y={70} title="Téléchargements" active="Nonvi-Efa.zip"
                items={["Nonvi-Efa.zip", "photo-produit.jpg", "facture.pdf"]} />
              <text x="255" y="430" textAnchor="middle" fontSize="19" fill="#5A5A5A">
                le dossier que <tspan fontWeight="700" fill="#188A5C">je t&apos;ai envoyé</tspan>
              </text>
              {/* Claude Code ouvert */}
              <ClaudeWin x={560} y={40} s={1.02} caption="Claude Code — là où tu parles à Claude" />
            </svg>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> <b>Claude Code</b>, c&apos;est l&apos;application où tu écris à Claude
            pour qu&apos;il installe et lance la plateforme. Si tu ne l&apos;as pas, télécharge-la sur
            <span className="lv-mt"> claude.ai/code</span>. Tout le reste se fait en discutant — pas de code à écrire.
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 1 — DÉCOMPRESSE ============ */}
      <section className="lv-slide" id="in1">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 01 · Le dossier</div>
          <h2 className="lv-h2">Décompresse le fichier <span className="lv-mark">.zip</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">transformer le .zip en un vrai dossier — un double-clic suffit</span>
          </div>
          <Todo
            items={[
              <>Ouvre le dossier <B>« Téléchargements »</B> de ton ordinateur (là où arrivent les fichiers reçus).</>,
              <>Repère <B>Nonvi-Efa.zip</B> et fais un <B>double-clic</B> dessus.</>,
              <>Un dossier <B>Nonvi-Efa-platform</B> apparaît juste à côté — c&apos;est lui qu&apos;on ouvrira à l&apos;étape suivante.</>,
            ]}
          />
          <div className="lv-fig">
            <svg viewBox="0 0 1200 460">
              <defs>
                <marker id="in1a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* le zip (fichier compressé) */}
              <Finder x={70} y={110} title="Téléchargements" active="Nonvi-Efa.zip" items={["Nonvi-Efa.zip"]} />
              <text x="235" y="330" textAnchor="middle" fontSize="15" fill="#5A5A5A">le fichier compressé</text>
              <line x1="420" y1="200" x2="510" y2="200" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#in1a)" />
              <text x="465" y="178" textAnchor="middle" fontSize="14" fill="#5A5A5A">double-clic</text>
              {/* le dossier ouvert */}
              <FolderSVG
                x={540}
                y={70}
                title="Nonvi-Efa-platform"
                items={[
                  { name: "CLAUDE.md — le manuel", d: "0.4s" },
                  { name: "README — le mode d'emploi", d: "0.9s" },
                  { name: "src — le code (n'y touche pas)", d: "1.4s" },
                  { name: "package.json", d: "1.9s" },
                ]}
              />
              <text x="720" y="440" textAnchor="middle" fontSize="15" fill="#5A5A5A">un vrai dossier, prêt à ouvrir</text>
            </svg>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> En double-cliquant sur le <b>.zip</b>, il se transforme en <b>dossier</b>.
            Retiens juste <b>où il se trouve</b> (souvent dans « Téléchargements ») — tu vas le donner à
            Claude Code juste après. Tu n&apos;as rien à ouvrir dedans toi-même.
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 2 — OUVRE DANS CLAUDE CODE ============ */}
      <section className="lv-slide" id="in2">
        <div className="lv-board ciel">
          <div className="lv-eyebrow">Étape 02 · Claude Code</div>
          <h2 className="lv-h2">Ouvre le dossier <span className="lv-mark m2">dans Claude Code</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">Claude « voit » ton dossier pour pouvoir travailler dedans</span>
          </div>
          <Todo
            items={[
              <>Ouvre l&apos;application <B>Claude Code</B>.</>,
              <>En haut, menu <B>« Fichier » → « Ouvrir le dossier »</B> (ou glisse le dossier dans la fenêtre).</>,
              <>Choisis <B>Nonvi-Efa-platform</B> → Claude confirme « dossier ouvert ». Tu peux lui parler.</>,
            ]}
          />
          <div className="lv-fig">
            <svg viewBox="0 0 1200 470">
              <defs>
                <marker id="in2a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* le dossier */}
              <g className="lv-pop">
                <path d="M 70 150 h 90 l 30 30 h 120 a20 20 0 0 1 20 20 v 120 a20 20 0 0 1 -20 20 H 70 a20 20 0 0 1 -20 -20 v -150 a20 20 0 0 1 20 -20 z" fill="#DCD3FF" stroke="#0F0F0F" strokeWidth="3.5" />
                <text x="160" y="278" textAnchor="middle" fontSize="16" fontWeight="700" className="lv-mt">Nonvi-Efa-platform</text>
              </g>
              <line x1="315" y1="255" x2="405" y2="255" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#in2a)" />
              <text x="360" y="233" textAnchor="middle" fontSize="14" fill="#5A5A5A">glisse-le</text>
              {/* Claude Code */}
              <ClaudeWin x={430} y={55} s={0.98} caption="Claude Code — ton dossier est ouvert">
                <text x="192" y="140" fontSize="15" fill="#5A564E">Menu « Fichier » → « Ouvrir le dossier »</text>
                <text x="192" y="168" fontSize="15" fill="#5A564E">…ou glisse le dossier dans la fenêtre.</text>
                <g className="lv-fo" style={{ ["--d" as string]: "0.4s" }}>
                  <rect x="188" y="196" width="330" height="42" rx="12" fill="#EDEBFF" />
                  <text x="204" y="223" fontSize="14.5" fontWeight="700" fill="#5B4DEE">✓ Dossier « Nonvi-Efa-platform » ouvert</text>
                </g>
              </ClaudeWin>
            </svg>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Dans Claude Code : <b>Fichier → Ouvrir le dossier</b> (ou glisse-le
            directement dans la fenêtre). Une fois ouvert, Claude peut lire et modifier tout ce qu&apos;il
            faut. Tu es prêt à lui parler.
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 3 — INSTALLE ============ */}
      <section className="lv-slide" id="in3">
        <div className="lv-board peach">
          <div className="lv-eyebrow">Étape 03 · L&apos;installation</div>
          <h2 className="lv-h2">Écris à Claude : <span className="lv-mark m3">« installe le projet »</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">Claude prépare tout, tout seul — toi, tu autorises et tu patientes</span>
            <span className="ml-2 self-center rounded-md border-2 border-[#F5411C] bg-white px-2 py-0.5 text-[13px] font-black text-[#F5411C]">
              DURÉE&nbsp;: 20 min ou plus
            </span>
          </div>
          <Todo
            items={[
              <>Clique dans la <B>barre du bas</B> de Claude Code (là où on écrit).</>,
              <>Copie-colle exactement : <B>« Installe ce projet et prépare-le à démarrer »</B>, puis appuie sur <B>Entrée</B>.</>,
              <>Pendant l&apos;install, Claude va <B>demander des autorisations</B> : dis toujours <B>oui</B> et choisis l&apos;option <B>« recommandée »</B>. C&apos;est ce qui lui permet d&apos;installer.</>,
              <>Laisse tourner : ça peut prendre <B>plus de 20 minutes</B>. C&apos;est normal — ne ferme rien.</>,
            ]}
          />
          <div className="lv-fig">
            <svg viewBox="0 0 1200 440">
              {/* fenêtre Claude Code avec une demande d'autorisation */}
              <ClaudeWin
                x={320}
                y={16}
                s={1.08}
                caption="quand Claude demande, choisis l'option « recommandée »"
                prompt={<>Installe ce projet et prépare-le à démarrer</>}
              >
                <text x="192" y="120" fontSize="14.5" fill="#5A564E">→ je lis le mode d&apos;emploi et j&apos;installe…</text>
                {/* boîte de permission — reste affichée (lv-in) */}
                <g className="lv-in" style={{ ["--d" as string]: "0.6s" }}>
                  <rect x="186" y="130" width="352" height="140" rx="14" fill="#FFF6F2" stroke="#F5411C" strokeWidth="2" />
                  <text x="202" y="156" fontSize="14.5" fontWeight="700" fill="#0F0F0F">Autoriser Claude à installer les dépendances ?</text>
                  {/* option recommandée, surlignée */}
                  <rect x="202" y="170" width="322" height="30" rx="9" fill="#0F0F0F" />
                  <text x="214" y="190" fontSize="13.5" fontWeight="700" fill="#FFFFFF">Oui, et ne plus redemander</text>
                  <text x="514" y="190" textAnchor="end" fontSize="10.5" fontWeight="700" fill="#7BE3A9">recommandé</text>
                  <text x="214" y="224" fontSize="13" fill="#8A867C">Autoriser une fois</text>
                  <text x="360" y="224" fontSize="13" fill="#8A867C">Refuser</text>
                  {/* pointeur "choisis celle-ci" */}
                  <g className="lv-blink">
                    <text x="214" y="252" fontSize="12" fontWeight="700" fill="#F5411C">↑ toujours celle du haut (recommandée)</text>
                  </g>
                </g>
              </ClaudeWin>
            </svg>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Claude ne peut rien casser : il te <b>demande la permission</b> avant
            chaque action. À chaque question, choisis l&apos;option <b>recommandée</b> (souvent « oui, ne plus
            redemander ») — sinon il reste bloqué et ne peut pas finir. L&apos;installation peut durer
            <b> plus de 20 minutes</b> : laisse la fenêtre ouverte, c&apos;est normal.
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 4 — LE FICHIER .ENV ============ */}
      <section className="lv-slide" id="in4">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 04 · Ton trousseau de clés · <span className="lv-mt">.env.local</span></div>
          <h2 className="lv-h2">Crée le fichier de tes <span className="lv-mark">clés secrètes</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">un fichier où coller tes clés — il reste sur ton ordinateur</span>
            <span className="ml-2 self-center text-[13px] text-[#8A8A8A]">clique sur les onglets</span>
          </div>

          <FigTabs
            tabs={[
              {
                id: "ask",
                label: "1 · Demande à Claude",
                node: (
                  <svg viewBox="0 0 1200 400">
                    <ClaudeWin
                      x={320}
                      y={20}
                      s={1.05}
                      caption="copie cette phrase dans la barre du bas"
                      prompt={<>Crée-moi un fichier .env.local pour mes clés<tspan className="lv-blink">▌</tspan></>}
                    >
                      <g className="lv-fo" style={{ ["--d" as string]: "0.3s" }}>
                        <rect x="188" y="120" width="345" height="120" rx="16" fill="#F6F5F1" />
                        <text x="206" y="152" fontSize="15" fontWeight="700" fill="#188A5C">✓ Fichier .env.local créé.</text>
                        <text x="206" y="182" fontSize="14" fill="#5A564E">J&apos;y ai mis les lignes à remplir.</text>
                        <text x="206" y="210" fontSize="14" fill="#5A564E">Colle tes clés à droite du signe =</text>
                      </g>
                    </ClaudeWin>
                  </svg>
                ),
              },
              {
                id: "file",
                label: "2 · Le fichier créé",
                node: (
                  <FileWindow
                    filename=".env.local"
                    caption="Claude a créé ce fichier · tu n'as qu'à coller tes clés après le signe ="
                    lines={[
                      { t: "# Colle chaque clé après le = (voir étape 5)", c: "dim" },
                      { t: "" },
                      { t: "ANTHROPIC_API_KEY=          # obligatoire", c: "ok" },
                      { t: "FIREFLIES_API_KEY=          # facultatif", c: "key" },
                      { t: "APIFY_TOKEN=                # facultatif", c: "key" },
                      { t: "GEMINI_API_KEY=             # facultatif", c: "key" },
                      { t: "GOOGLE_CLIENT_ID=           # facultatif", c: "key" },
                      { t: "GOOGLE_CLIENT_SECRET=       # facultatif", c: "key" },
                      { t: "" },
                      { t: "# ce fichier reste sur ton ordinateur", c: "dim" },
                    ]}
                  />
                ),
              },
            ]}
          />

          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Le <span className="lv-mt">.env.local</span>, c&apos;est ton <b>coffre à clés</b> :
            il ne quitte jamais ton ordinateur. Demande à Claude de le créer, puis colle tes clés (étape
            suivante). <b>Seule la clé Anthropic est obligatoire</b> pour démarrer.
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 5 — LES CLÉS API ============ */}
      <section className="lv-slide" id="in5">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Étape 05 · Les clés API</div>
          <h2 className="lv-h2">Va chercher tes <span className="lv-mark m2">clés API</span>, une par une</h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">une clé API = un mot de passe que l&apos;outil te donne. Seule celle d&apos;Anthropic est obligatoire.</span>
            <span className="ml-2 self-center text-[13px] text-[#8A8A8A]">clique sur un onglet ci-dessous — un onglet = un outil</span>
          </div>

          <FigTabs
            tabs={[
              {
                id: "anthropic",
                label: "Anthropic ★",
                node: (
                  <ToolGuide
                    required
                    name="Anthropic (Claude)"
                    envKey="ANTHROPIC_API_KEY"
                    steps={[
                      <>Ouvre ton navigateur, va sur <B>console.anthropic.com</B> et connecte-toi (ou crée un compte).</>,
                      <>En haut à droite, clique sur l&apos;icône de ton compte, puis dans le menu de gauche sur <B>« API keys »</B>.</>,
                      <>Clique sur le bouton noir <B>« Create Key »</B>, donne un nom (ex. <i>Nonvi-Efa</i>) et valide.</>,
                      <>La clé apparaît <B>une seule fois</B> et commence par <Code>sk-ant-</Code>. Clique <B>« Copy »</B> tout de suite.</>,
                      <>Reviens dans le fichier <Code>.env.local</Code> et colle-la juste après <Code>ANTHROPIC_API_KEY=</Code></>,
                    ]}
                    warn={<>Va aussi dans <B>« Billing »</B> (menu de gauche) et ajoute quelques euros de crédit — <b>sans crédit, la clé ne fonctionne pas</b>.</>}
                    mock={
                      <SettingsMock
                        required
                        url="console.anthropic.com › API keys"
                        sidebar={["Dashboard", "API keys", "Billing", "Limits", "Team"]}
                        active="API keys"
                        kicker="API keys"
                        keyName="Create Key"
                        keyMasked="sk-ant-api03-••••••••••••••••••"
                      />
                    }
                  />
                ),
              },
              {
                id: "fireflies",
                label: "Fireflies",
                node: (
                  <ToolGuide
                    name="Fireflies"
                    envKey="FIREFLIES_API_KEY"
                    steps={[
                      <>Va sur <B>fireflies.ai</B> et connecte-toi.</>,
                      <>Tout en bas à gauche, clique sur ton <B>nom</B>, puis sur <B>« Settings »</B> (Réglages).</>,
                      <>Dans le menu des réglages, ouvre l&apos;onglet <B>« Developer Settings »</B> (parfois écrit « Dev Tools »).</>,
                      <>Repère l&apos;encadré <B>« API Key »</B>, clique sur l&apos;œil pour l&apos;afficher, puis sur <B>« Copy »</B>.</>,
                      <>Colle-la après <Code>FIREFLIES_API_KEY=</Code></>,
                    ]}
                    warn={<>Astuce générale : les clés sont <b>presque toujours</b> dans une partie <B>« Developer »</B> / « Dev Tools », jamais dans les réglages de tous les jours.</>}
                    mock={
                      <SettingsMock
                        url="app.fireflies.ai › Settings"
                        sidebar={["Recording & Privacy", "AI settings", "Developer Settings", "Billing", "Account"]}
                        active="Developer Settings"
                        kicker="Developer Settings"
                        keyName="API Key"
                        keyMasked="••••••••••••••••••••••••••••"
                      />
                    }
                  />
                ),
              },
              {
                id: "apify",
                label: "Apify",
                node: (
                  <ToolGuide
                    name="Apify"
                    envKey="APIFY_TOKEN"
                    steps={[
                      <>Va sur <B>console.apify.com</B> et connecte-toi.</>,
                      <>En haut à droite, clique sur ton <B>avatar</B>, puis sur <B>« Settings »</B>.</>,
                      <>Dans le menu de gauche, clique sur <B>« Integrations »</B> (ou « API &amp; Integrations »).</>,
                      <>Sous <B>« Personal API tokens »</B>, copie le jeton (il commence par <Code>apify_api_</Code>).</>,
                      <>Colle-le après <Code>APIFY_TOKEN=</Code></>,
                    ]}
                    mock={
                      <SettingsMock
                        url="console.apify.com › Settings"
                        sidebar={["Actors", "Storage", "Schedules", "Integrations", "Settings"]}
                        active="Integrations"
                        kicker="Personal API tokens"
                        keyName="Personal API token"
                        keyMasked="apify_api_••••••••••••••••••••"
                      />
                    }
                  />
                ),
              },
              {
                id: "gemini",
                label: "Gemini",
                node: (
                  <ToolGuide
                    name="Gemini (images)"
                    envKey="GEMINI_API_KEY"
                    steps={[
                      <>Va sur <B>aistudio.google.com</B> et connecte-toi avec ton compte Google.</>,
                      <>En haut à gauche, clique sur le bouton <B>« Get API key »</B> (Obtenir une clé API).</>,
                      <>Clique sur <B>« Create API key »</B>, choisis un projet (ou laisse celui par défaut), valide.</>,
                      <>La clé (elle commence par <Code>AIza</Code>) s&apos;affiche → clique <B>« Copy »</B>.</>,
                      <>Colle-la après <Code>GEMINI_API_KEY=</Code></>,
                    ]}
                    mock={
                      <SettingsMock
                        url="aistudio.google.com › API keys"
                        sidebar={["Chat", "Stream", "API keys", "Documentation"]}
                        active="API keys"
                        kicker="Get API key"
                        keyName="Create API key"
                        keyMasked="AIza••••••••••••••••••••••••"
                      />
                    }
                  />
                ),
              },
              {
                id: "google",
                label: "Google",
                node: (
                  <ToolGuide
                    name="Google (Gmail / YouTube)"
                    envKey="GOOGLE_CLIENT_ID"
                    steps={[
                      <>Va sur <B>console.cloud.google.com</B> et connecte-toi.</>,
                      <>Tout en haut, ouvre le menu des projets → <B>« Nouveau projet »</B>, donne un nom, crée-le.</>,
                      <>Menu <B>☰ → « APIs et services » → « Bibliothèque »</B> : cherche et active <B>Gmail API</B> (et <B>YouTube Data API</B> si besoin).</>,
                      <><B>« APIs et services » → « Écran de consentement OAuth »</B> : type <i>Externe</i>, mets ton nom + ton email, enregistre.</>,
                      <><B>« Identifiants » → « + Créer des identifiants » → « ID client OAuth »</B> → type <i>Application Web</i>.</>,
                      <>Copie l&apos;<B>ID client</B> ET le <B>secret</B> → colle-les après <Code>GOOGLE_CLIENT_ID=</Code> et <Code>GOOGLE_CLIENT_SECRET=</Code></>,
                    ]}
                    warn={<>C&apos;est de loin le plus technique. Si tu es perdu, écris à Claude : <B>« guide-moi écran par écran pour créer mes identifiants Google »</B> — il le fait avec toi.</>}
                    mock={
                      <SettingsMock
                        url="console.cloud.google.com › Credentials"
                        sidebar={["APIs et services", "Identifiants", "Écran OAuth", "Bibliothèque"]}
                        active="Identifiants"
                        kicker="ID client OAuth 2.0"
                        keyName="ID client OAuth 2.0"
                        keyMasked="•••••.apps.googleusercontent.com"
                      />
                    }
                  />
                ),
              },
              {
                id: "arcads",
                label: "Arcads",
                node: <ArcadsGuide />,
              },
            ]}
          />

          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Le principe ne change jamais : tu te connectes à l&apos;outil, tu
            cherches la partie <B>« Developer » / « API »</B>, tu copies la clé, tu la colles dans
            <span className="lv-mt"> .env.local</span> après le <Code>=</Code>. Coincé sur un outil ? Dis
            à Claude : <b>« aide-moi à trouver ma clé [nom de l&apos;outil], guide-moi clic par clic »</b>.
          </div>
        </div>
      </section>

      {/* ============ ÉTAPE 6 — LANCE ET REGARDE ============ */}
      <section className="lv-slide" id="in6">
        <div className="lv-board lav">
          <div className="lv-eyebrow">Étape 06 · C&apos;est parti</div>
          <h2 className="lv-h2">Lance la plateforme et <span className="lv-mark">regarde-la</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip> <span className="self-center text-[15px] font-semibold">ouvrir ta plateforme dans le navigateur — une phrase, un lien à cliquer</span>
          </div>
          <Todo
            items={[
              <>Dans Claude Code, écris : <B>« Lance la plateforme, donne-moi le lien »</B>.</>,
              <>Claude affiche un lien <Code>http://localhost:3000</Code> → <B>clique</B> dessus (ou copie-le dans ton navigateur).</>,
              <>Ta plateforme s&apos;ouvre. Pour la fermer plus tard, il suffit de fermer l&apos;onglet.</>,
            ]}
          />
          <div className="lv-fig">
            <svg viewBox="0 0 1200 480">
              <defs>
                <marker id="in6a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill="#0F0F0F" />
                </marker>
              </defs>
              {/* Claude Code : lance + donne le lien */}
              <ClaudeWin
                x={20}
                y={55}
                s={0.72}
                caption="demande à Claude"
                prompt={<>Lance la plateforme, donne-moi le lien<tspan className="lv-blink">▌</tspan></>}
              >
                <text x="192" y="140" fontSize="16" fill="#5A564E" className="lv-ph" style={{ ["--d" as string]: "0s" }}>→ je démarre le serveur…</text>
                <g className="lv-fo" style={{ ["--d" as string]: "1.2s" }}>
                  <rect x="188" y="150" width="345" height="96" rx="14" fill="#EDEBFF" />
                  <text x="206" y="184" fontSize="16" fontWeight="700" fill="#188A5C">✓ En ligne. Ouvre ce lien :</text>
                  <text x="206" y="216" fontSize="17" fontWeight="800" fill="#5B4DEE" className="lv-mt">http://localhost:3000</text>
                </g>
              </ClaudeWin>
              <line x1="712" y1="250" x2="775" y2="250" stroke="#0F0F0F" strokeWidth="4" className="lv-flow" markerEnd="url(#in6a)" />
              <text x="744" y="228" textAnchor="middle" fontSize="14" fill="#5A5A5A">clic sur le lien</text>
              {/* le navigateur avec la plateforme */}
              <g className="lv-pop">
                <rect x="790" y="70" width="390" height="340" rx="22" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3.5" />
                {/* barre d'adresse */}
                <rect x="790" y="70" width="390" height="52" rx="22" fill="#F3F2F7" />
                <rect x="790" y="104" width="390" height="18" fill="#F3F2F7" />
                <circle cx="814" cy="96" r="5" fill="#FF5F57" /><circle cx="832" cy="96" r="5" fill="#FEBC2E" /><circle cx="850" cy="96" r="5" fill="#28C840" />
                <rect x="874" y="82" width="286" height="28" rx="14" fill="#FFFFFF" stroke="#E4E1F5" strokeWidth="1.5" />
                {/* petit cadenas dessiné (pas d'emoji) */}
                <rect x="890" y="91" width="10" height="8" rx="1.5" fill="none" stroke="#8A8A8A" strokeWidth="1.5" />
                <path d="M892 91 v-2 a3 3 0 0 1 6 0 v2" fill="none" stroke="#8A8A8A" strokeWidth="1.5" />
                <text x="908" y="101" fontSize="13" className="lv-mt" fill="#5A5A5A">localhost:3000</text>
                {/* contenu : tuiles d'employés IA */}
                <rect x="814" y="142" width="180" height="24" rx="8" fill="#5B4DEE" />
                <rect x="814" y="180" width="104" height="78" rx="14" fill="#5B4DEE" />
                <AgentPic slug="orchestrateur" x={824} y={186} size={66} />
                <rect x="930" y="180" width="56" height="78" rx="12" fill="#FFD9C7" />
                <AgentPic slug="createur-contenu" x={934} y={196} size={48} />
                <rect x="998" y="180" width="56" height="78" rx="12" fill="#C6EEDB" />
                <AgentPic slug="designer" x={1002} y={196} size={48} />
                <rect x="1066" y="180" width="56" height="78" rx="12" fill="#DCD3FF" />
                <AgentPic slug="analyste" x={1070} y={196} size={48} />
                <rect x="814" y="278" width="308" height="14" rx="7" fill="#0F0F0F" opacity="0.3" />
                <rect x="814" y="302" width="230" height="14" rx="7" fill="#0F0F0F" opacity="0.18" />
                <text x="985" y="368" textAnchor="middle" fontSize="19" fontWeight="700" fill="#188A5C">ta plateforme est en ligne ✓</text>
              </g>
            </svg>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> <b>« localhost »</b> veut dire « sur ton ordinateur ». Clique sur
            le lien <span className="lv-mt"> http://localhost:3000</span> que Claude te donne → ta plateforme
            s&apos;ouvre dans le navigateur. Pour la rouvrir plus tard, redis simplement à Claude :
            <b> « lance la plateforme »</b>.
          </div>
        </div>
      </section>

      {/* ============ FINALE ============ */}
      <section className="lv-slide" id="in-fin">
        <div className="lv-board dark">
          <div className="lv-eyebrow" style={{ color: "#FF8867" }}>C&apos;est installé</div>
          <h2 className="lv-h2">Ton équipe d&apos;employés IA est prête</h2>
          <div className="lv-fig">
            <svg viewBox="0 0 1200 430">
              <text x="90" y="70" fontSize="24" fill="#B7AEE8" fontWeight="700">Récapitulatif</text>
              <g fontSize="23" fill="#FFFFFF">
                <text x="120" y="132" className="lv-in" style={{ ["--d" as string]: "0s" }}>1 · dossier décompressé</text>
                <text x="120" y="180" className="lv-in" style={{ ["--d" as string]: "0.3s" }}>2 · ouvert dans Claude Code</text>
                <text x="120" y="228" className="lv-in" style={{ ["--d" as string]: "0.6s" }}>3 · installé (« installe le projet »)</text>
                <text x="120" y="276" className="lv-in" style={{ ["--d" as string]: "0.9s" }}>4 · fichier .env.local créé</text>
                <text x="120" y="324" className="lv-in" style={{ ["--d" as string]: "1.2s" }}>5 · clé Anthropic collée</text>
                <text x="120" y="372" className="lv-in" style={{ ["--d" as string]: "1.5s" }}>6 · lancée sur localhost:3000</text>
              </g>
              {/* carte "pour la rouvrir" */}
              <g className="lv-fo" style={{ ["--d" as string]: "1.9s" }}>
                <rect x="760" y="150" width="360" height="150" rx="24" fill="#FFFFFF" />
                <text x="940" y="200" textAnchor="middle" fontSize="16" fontWeight="700" fill="#191627">pour la rouvrir un autre jour</text>
                <text x="940" y="232" textAnchor="middle" fontSize="15" fill="#5A5A5A">ouvre le dossier dans Claude Code</text>
                <text x="940" y="258" textAnchor="middle" fontSize="15" fill="#5A5A5A">puis dis&nbsp;:</text>
                <text x="940" y="286" textAnchor="middle" fontSize="18" fontWeight="800" fill="#5B4DEE" className="lv-mt">« lance la plateforme »</text>
              </g>
            </svg>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> C&apos;est tout — tu n&apos;as jamais écrit de code, tu as juste parlé
            à Claude. Chaque fois que tu veux ouvrir ta plateforme : ouvre le dossier dans Claude Code et dis
            <b> « lance la plateforme »</b>. Il te redonne le lien à cliquer.
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= Composants ================= */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-[#0F0F0F] bg-white px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </kbd>
  );
}

/** Liste d'actions concrètes et courtes, numérotées — pour rendre chaque étape non-vague. */
function Todo({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-2 flex w-full max-w-[900px] flex-col gap-1.5 self-start rounded-xl border border-[#0F0F0F]/15 bg-white/60 px-3.5 py-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-[1.4] text-[#2A2A2A]">
          <span className="mt-px flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#0F0F0F] text-[11px] font-black text-white">
            {i + 1}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

/** Petite étiquette d'intention (OBJECTIF / À RETENIR) — remplace les emoji. */
function Chip({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className="mr-2 inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.08em]"
      style={dark ? { background: "#0F0F0F", color: "#fff" } : { background: "#188A5C", color: "#fff" }}
    >
      {children}
    </span>
  );
}

/** Fenêtre Finder (macOS) sans emoji — base 350 × 220. À placer dans un <svg>. */
function Finder({ x, y, title, items, active }: { x: number; y: number; title: string; items: string[]; active?: string }) {
  const h = 64 + items.length * 40;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="350" height={h} rx="16" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      {/* barre */}
      <rect width="350" height="40" rx="16" fill="#F3F2F7" />
      <rect y="24" width="350" height="16" fill="#F3F2F7" />
      <circle cx="24" cy="20" r="5.5" fill="#FF5F57" />
      <circle cx="44" cy="20" r="5.5" fill="#FEBC2E" />
      <circle cx="64" cy="20" r="5.5" fill="#28C840" />
      <text x="175" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5A5A5A">{title}</text>
      {items.map((it, i) => {
        const ry = 56 + i * 40;
        const on = it === active;
        return (
          <g key={it}>
            {on && <rect x="12" y={ry - 2} width="326" height="34" rx="9" fill="#DCD3FF" />}
            {/* petite icône fichier dessinée */}
            <rect x="24" y={ry + 3} width="18" height="22" rx="3" fill="none" stroke={on ? "#0F0F0F" : "#8A8A8A"} strokeWidth="2" />
            <path d={`M37 ${ry + 3} l0 6 l6 0`} fill="none" stroke={on ? "#0F0F0F" : "#8A8A8A"} strokeWidth="2" />
            <text x="56" y={ry + 20} fontSize="15" fontWeight={on ? 700 : 500} fill={on ? "#0F0F0F" : "#5A5A5A"} className="lv-mt">{it}</text>
          </g>
        );
      })}
    </g>
  );
}

/** Dossier ouvert (liste de fichiers qui apparaissent) — sans emoji. À placer dans un <svg>. */
function FolderSVG({ x, y, title, items }: { x: number; y: number; title: string; items: { name: string; d: string }[] }) {
  const h = 70 + items.length * 44;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="360" height={h} rx="18" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      {/* onglet dossier */}
      <path d="M 20 6 h 40 l 12 14 h 60" fill="none" stroke="#5B4DEE" strokeWidth="0" />
      <text x="24" y="40" fontSize="17" fontWeight="700" fill="#0F0F0F" className="lv-mt">{title}</text>
      <line x1="0" y1="54" x2="360" y2="54" stroke="#EEEDF6" strokeWidth="2" />
      {items.map((it, i) => {
        const ry = 66 + i * 44;
        return (
          <g key={it.name} className="lv-seq" style={{ ["--d" as string]: it.d }}>
            <rect x="20" y={ry + 2} width="16" height="20" rx="3" fill="none" stroke="#8A8A8A" strokeWidth="2" />
            <text x="46" y={ry + 20} fontSize="14.5" fontWeight={500} fill="#5A5A5A">{it.name}</text>
          </g>
        );
      })}
    </g>
  );
}

/** Mot en gras violet (cible d'un clic) dans les listes d'étapes. */
function B({ children }: { children: React.ReactNode }) {
  return <b className="rounded bg-[#EDE9FF] px-1 text-[#4A3DD6]">{children}</b>;
}
/** Bout de code / nom de fichier en monospace. */
function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[#191627] px-1 py-px font-mono text-[0.86em] text-[#B9F0C5]">{children}</code>;
}

/**
 * Guide d'un outil : à GAUCHE les étapes numérotées ultra-explicites (où
 * cliquer, dans quel menu), à DROITE la reconstitution de l'écran de réglages
 * avec la clé entourée. Pensé pour quelqu'un qui n'a jamais vu ce genre de page.
 */
function ToolGuide({
  name, envKey, steps, mock, warn, required,
}: {
  name: string;
  envKey: string;
  steps: React.ReactNode[];
  mock: React.ReactNode;
  warn?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="w-full" style={{ maxWidth: 1120 }}>
      <div className="grid items-start gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* colonne étapes */}
        <div className="rounded-2xl border-2 border-[#0F0F0F] bg-white p-4 text-left shadow-[4px_4px_0_rgba(15,15,15,0.1)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[15px] font-black text-[#0F0F0F]">Pas à pas — {name}</span>
            {required ? (
              <span className="rounded-full bg-[#F5411C] px-2 py-0.5 text-[10px] font-black text-white">obligatoire</span>
            ) : (
              <span className="rounded-full border border-[#DCD3FF] bg-[#F3F0FF] px-2 py-0.5 text-[10px] font-black text-[#5B4DEE]">facultatif</span>
            )}
          </div>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#0F0F0F] text-[12px] font-black text-white">
                  {i + 1}
                </span>
                <span className="text-[13.5px] leading-[1.45] text-[#2A2A2A]">{s}</span>
              </li>
            ))}
          </ol>
          {warn && (
            <div className="mt-3 rounded-xl border-2 border-dashed border-[#F5411C] bg-[#FFF6F2] px-3 py-2 text-[12.5px] leading-snug text-[#3A3A3A]">
              <span className="mr-1 font-black text-[#F5411C]">Attention&nbsp;:</span>
              {warn}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#191627] px-3 py-2">
            <span className="truncate font-mono text-[12px] font-bold text-[#B9F0C5]">
              {envKey}=<span className="text-[#7C7597]">ta-clé-collée</span>
            </span>
          </div>
        </div>
        {/* colonne interface */}
        <div className="lv-in" style={{ ["--d" as string]: "0.15s" }}>
          {mock}
          <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">
            voilà l&apos;écran réel — la clé est dans l&apos;encadré orange
          </p>
        </div>
      </div>
    </div>
  );
}

/** Reconstitution d'une page de réglages (fenêtre navigateur + sidebar + clé entourée). */
function SettingsMock({
  url, sidebar, active, kicker, keyName, keyMasked, required,
}: {
  url: string;
  sidebar: string[];
  active: string;
  kicker: string;
  keyName: string;
  keyMasked: string;
  required?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#0F0F0F] bg-white shadow-[0_18px_44px_-22px_rgba(15,15,15,0.4)]">
      {/* barre de fenêtre navigateur */}
      <div className="flex items-center gap-2 border-b border-[#E6E4EE] bg-[#F3F2F7] px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 truncate font-mono text-[11.5px] font-bold text-[#5A5A5A]">{url}</span>
        {required && (
          <span className="ml-auto shrink-0 rounded-full bg-[#F5411C] px-2 py-0.5 text-[10px] font-black text-white">
            obligatoire
          </span>
        )}
      </div>
      <div className="flex text-left">
        {/* sidebar réglages */}
        <div className="w-[150px] shrink-0 border-r border-[#EEEDF6] bg-[#FBFAFE] p-2.5">
          <div className="mb-2 text-[12px] font-black text-[#0F0F0F]">Réglages</div>
          {sidebar.map((it) => {
            const on = it === active;
            return (
              <div
                key={it}
                className={
                  "mb-0.5 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold leading-tight " +
                  (on ? "bg-[#EDE9FF] text-[#5B4DEE]" : "text-[#5A5A5A]")
                }
              >
                {it}
              </div>
            );
          })}
        </div>
        {/* panneau principal */}
        <div className="flex-1 p-4">
          <div className="mb-2.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
            {kicker}
          </div>
          <div className="relative rounded-xl border-2 border-dashed border-[#F5411C] bg-[#FFF8F5] p-3.5">
            <span className="absolute -top-3 left-4 rounded-full bg-[#F5411C] px-2.5 py-1 text-[10.5px] font-black text-white shadow">
              ta clé est ici
            </span>
            <div className="mb-2 text-[13px] font-black text-[#0F0F0F]">{keyName}</div>
            <div className="flex items-center gap-2 rounded-lg border border-[#E4E1F5] bg-white px-2.5 py-2">
              <span className="flex-1 truncate font-mono text-[11.5px] tracking-[0.1em] text-[#5A5A5A]">
                {keyMasked}
              </span>
              <span className="shrink-0 rounded-md border border-[#E4E1F5] px-1.5 py-1 text-[10px] font-semibold text-[#8A8A8A]">
                Afficher
              </span>
              <span className="shrink-0 rounded-md bg-[#F5411C] px-2 py-1 text-[10px] font-bold text-white">
                Copier
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Guide Arcads — pas de clé : tout se fait par un bouton DANS la plateforme. */
function ArcadsGuide() {
  return (
    <div className="w-full" style={{ maxWidth: 1120 }}>
      <div className="grid items-start gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* étapes */}
        <div className="rounded-2xl border-2 border-[#0F0F0F] bg-white p-4 text-left shadow-[4px_4px_0_rgba(15,15,15,0.1)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[15px] font-black text-[#0F0F0F]">Pas à pas — Arcads (vidéos)</span>
            <span className="rounded-full border border-[#DCD3FF] bg-[#F3F0FF] px-2 py-0.5 text-[10px] font-black text-[#5B4DEE]">
              aucune clé à copier
            </span>
          </div>
          <ol className="space-y-2">
            {[
              <>Lance d&apos;abord ta plateforme (étape 6) et ouvre <B>localhost:3000</B> dans le navigateur.</>,
              <>Dans le menu, clique sur l&apos;<B>agent e-commerce</B>.</>,
              <>Ouvre l&apos;onglet <B>« Studio vidéo »</B>.</>,
              <>Clique sur le bouton violet <B>« Connecter Arcads »</B>.</>,
              <>Une fenêtre s&apos;ouvre → clique <B>« Autoriser »</B>. C&apos;est connecté.</>,
            ].map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#5B4DEE] text-[12px] font-black text-white">
                  {i + 1}
                </span>
                <span className="text-[13.5px] leading-[1.45] text-[#2A2A2A]">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 rounded-xl border-2 border-dashed border-[#5B4DEE] bg-[#F7F5FF] px-3 py-2 text-[12.5px] leading-snug text-[#3A3A3A]">
            <span className="mr-1 font-black text-[#5B4DEE]">Bon à savoir&nbsp;:</span>
            Arcads est le seul outil qui ne demande <b>rien</b> dans <Code>.env.local</Code> — tout passe par ce bouton.
          </div>
        </div>
        {/* interface plateforme */}
        <div className="lv-in" style={{ ["--d" as string]: "0.15s" }}>
          <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#0F0F0F] bg-white shadow-[0_18px_44px_-22px_rgba(15,15,15,0.4)]">
            <div className="flex items-center gap-2 border-b border-[#E6E4EE] bg-[#F3F2F7] px-3.5 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-2 truncate font-mono text-[11.5px] font-bold text-[#5A5A5A]">
                localhost:3000 › e-commerce › Studio vidéo
              </span>
            </div>
            <div className="p-4">
              <div className="mb-2.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
                Générateur de vidéos produit
              </div>
              <div className="relative rounded-xl border-2 border-dashed border-[#5B4DEE] bg-[#F7F5FF] p-4">
                <span className="absolute -top-3 left-4 rounded-full bg-[#5B4DEE] px-2.5 py-1 text-[10.5px] font-black text-white shadow">
                  clique ici
                </span>
                <p className="mb-3 text-[12.5px] leading-snug text-[#3A3A3A]">
                  Connecte ton compte Arcads en un clic — une fenêtre te demande d&apos;autoriser.
                </p>
                <span className="inline-flex items-center rounded-xl bg-[#5B4DEE] px-4 py-2 text-[13px] font-bold text-white shadow">
                  Connecter Arcads
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">
            l&apos;écran est dans ta plateforme, pas sur un site externe
          </p>
        </div>
      </div>
    </div>
  );
}
