import { AppNav } from "@/components/landing/AppNav";
import { FigTabs } from "@/components/landing/FigTabs";

export const metadata = {
  title: "Héberger sur un VPS · naiom",
  description:
    "Tutoriel débutant : mettre son site en ligne sur un serveur — chaque commande traduite en français.",
};

/**
 * /vps — Tutoriel « mettre le site en ligne », pour débutants complets.
 * Principes tirés des retours : zéro emoji, aucune commande sans sa traduction
 * en français, un bandeau permanent « tu tapes sur quelle machine », et le
 * vocabulaire expliqué AVANT de commencer. Métaphore filée : le serveur est un
 * immeuble, les ports sont ses portes numérotées.
 */
export default function VpsPage() {
  return (
    <div className="bronx-page lv-snap min-h-screen w-full">
      <AppNav active="vps" />

      {/* ============ COVER ============ */}
      <section className="lv-slide" id="v-top">
        <div className="lv-board lav items-center justify-center text-center" style={{ gap: "2.2vh" }}>
          <div className="lv-eyebrow">Tutoriel · pour débutants complets</div>
          <h1 className="bronx-hero-title" style={{ fontSize: "clamp(28px, 4vw, 56px)", maxWidth: "18ch", lineHeight: 1.1 }}>
            Mettre ton site <span className="lv-mark">en ligne</span>
          </h1>
          <p className="bronx-body" style={{ maxWidth: 660 }}>
            Ton site ne marche que sur <b>ton ordinateur</b>. On va le déplacer sur un ordinateur
            allumé <b>jour et nuit</b>, pour que n&apos;importe qui puisse le visiter avec une vraie adresse.
          </p>
          <div className="rounded-xl border-2 border-[#0F0F0F] bg-white px-4 py-2.5 text-[14px] font-semibold">
            Tu vas copier-coller des commandes. <b>Chacune est traduite en français</b> juste en dessous —
            tu comprendras toujours ce que tu fais.
          </div>
          <nav className="lv-toc">
            <a href="#v1"><span className="n">01</span>Le vocabulaire</a>
            <a href="#v2"><span className="n">02</span>Louer le serveur</a>
            <a href="#v3"><span className="n">03</span>Entrer dans le serveur</a>
            <a href="#v4"><span className="n">04</span>Lire une commande</a>
            <a href="#v5"><span className="n">05</span>Installer les outils</a>
            <a href="#v6"><span className="n">06</span>Envoyer le site</a>
            <a href="#v7"><span className="n">07</span>Le préparer</a>
            <a href="#v8"><span className="n">08</span>Le garder allumé</a>
            <a href="#v9"><span className="n">09</span>Le concierge</a>
            <a href="#v10"><span className="n">10</span>Le nom de domaine</a>
            <a href="#v11"><span className="n">11</span>Le cadenas</a>
            <a href="#v12"><span className="n">12</span>Le mot de passe</a>
          </nav>
        </div>
      </section>

      {/* ============ 1 — VOCABULAIRE ============ */}
      <section className="lv-slide" id="v1">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Étape 01 · Le vocabulaire</div>
          <h2 className="lv-h2">Les <span className="lv-mark m2">6 mots</span> que tu vas croiser</h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>POURQUOI</Chip>
            <span className="self-center text-[15px] font-semibold">
              si tu connais ces 6 mots, tout le reste du tuto devient simple
            </span>
          </div>
          <div className="lv-fig">
            <div className="grid w-full max-w-[1060px] gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <Word d="0s" mot="Serveur (ou VPS)" def="Un ordinateur que tu loues, allumé 24h/24."
                img="Comme louer un local : il reste ouvert même quand tu dors." />
              <Word d="0.1s" mot="SSH" def="Le tunnel qui te relie au serveur à distance."
                img="Une télécommande : tu tapes chez toi, ça s'exécute là-bas." />
              <Word d="0.2s" mot="Terminal" def="La fenêtre noire où on écrit des ordres."
                img="Au lieu de cliquer sur des boutons, tu écris ce que tu veux." />
              <Word d="0.3s" mot="Port" def="Une porte numérotée sur le serveur."
                img="Le serveur est un immeuble ; ton site habite à la porte 3000." />
              <Word d="0.4s" mot="DNS" def="L'annuaire qui traduit un nom en adresse."
                img="Tu tapes un nom, il retrouve le numéro — comme un répertoire." />
              <Word d="0.5s" mot="HTTPS" def="Le petit cadenas dans la barre d'adresse."
                img="La carte d'identité du site : il prouve qu'il est bien lui." />
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Garde en tête l&apos;image de l&apos;<b>immeuble</b> : le serveur est
            l&apos;immeuble, ton site occupe la <b>porte 3000</b>, les visiteurs sonnent toujours à la
            <b> porte 80</b>. Tout le tuto consiste à les amener de la porte 80 à la porte 3000.
          </div>
        </div>
      </section>

      {/* ============ 2 — LOUER LE SERVEUR ============ */}
      <section className="lv-slide" id="v2">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 02 · Le serveur</div>
          <h2 className="lv-h2">Louer un serveur et <span className="lv-mark">noter 2 choses</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              obtenir une adresse IP et un mot de passe — c&apos;est tout ce dont on a besoin
            </span>
          </div>
          <Todo
            items={[
              <>Va chez un hébergeur (<B>Hostinger</B>, <B>OVH</B>, <B>DigitalOcean</B>…) et prends un <B>VPS</B>. Compte 5 à 10 € par mois.</>,
              <>Quand il demande le système, choisis <B>Ubuntu</B> (la version la plus récente).</>,
              <>Note les <B>2 informations</B> qu&apos;il te donne : l&apos;adresse IP et le mot de passe.</>,
            ]}
          />
          <div className="lv-fig">
            <div className="grid w-full max-w-[900px] gap-3 md:grid-cols-2">
              <InfoCard
                d="0.1s"
                label="1. L'adresse IP"
                value="46.202.173.91"
                text="Le numéro de ton serveur sur Internet. C'est son adresse postale, avant qu'il ait un nom."
              />
              <InfoCard
                d="0.3s"
                label="2. Le mot de passe"
                value="••••••••••••"
                text="Celui du serveur (pas celui de ton compte chez l'hébergeur). Garde-le, tu vas t'en servir juste après."
              />
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Un VPS neuf est <b>vide</b> : il n&apos;y a rien dessus, même pas les
            outils pour faire tourner ton site. C&apos;est normal — on va tout installer nous-mêmes aux
            étapes suivantes.
          </div>
        </div>
      </section>

      {/* ============ 3 — SE CONNECTER ============ */}
      <section className="lv-slide" id="v3">
        <div className="lv-board ciel">
          <div className="lv-eyebrow">Étape 03 · La connexion</div>
          <h2 className="lv-h2">Entrer <span className="lv-mark m2">dans le serveur</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              ouvrir une fenêtre qui te permet de commander le serveur à distance
            </span>
            <span className="ml-2 self-center text-[13px] text-[#8A8A8A]">deux façons — clique sur les onglets</span>
          </div>

          <FigTabs
            tabs={[
              {
                id: "nav",
                label: "La façon facile (navigateur)",
                node: <PanelMock />,
              },
              {
                id: "ssh",
                label: "L'autre façon (depuis ton ordi)",
                node: (
                  <div className="w-full max-w-[900px]">
                    <CmdList
                      where="ordi"
                      items={[
                        {
                          cmd: "ssh root@46.202.173.91",
                          why: <>Ouvre la connexion vers le serveur. Remplace les chiffres par <b>ton</b> adresse IP. <b>root</b> est le nom du compte qui a tous les droits.</>,
                        },
                      ]}
                    />
                    <div className="mt-3 rounded-xl border-2 border-dashed border-[#F5411C] bg-[#FFF6F2] px-4 py-2.5 text-[13.5px] leading-snug">
                      <b className="text-[#F5411C]">Important :</b> il te demande le mot de passe, mais
                      <b> rien ne s&apos;affiche quand tu tapes</b> — pas d&apos;étoiles, pas de points. C&apos;est
                      normal, c&apos;est une sécurité. Tape-le et appuie sur Entrée.
                    </div>
                  </div>
                ),
              },
            ]}
          />

          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Une fois connecté, <b>tout ce que tu écris s&apos;exécute sur le
            serveur</b>, plus sur ton ordinateur. C&apos;est le point qui perd le plus de débutants : dans la
            suite du tuto, un bandeau te dira toujours <b>sur quelle machine tu tapes</b>.
          </div>
        </div>
      </section>

      {/* ============ 4 — ANATOMIE D'UNE COMMANDE ============ */}
      <section className="lv-slide" id="v4">
        <div className="lv-board peach">
          <div className="lv-eyebrow">Étape 04 · Se rassurer</div>
          <h2 className="lv-h2">Une commande, ça se <span className="lv-mark m3">lit</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>POURQUOI</Chip>
            <span className="self-center text-[15px] font-semibold">
              ce n&apos;est pas du charabia : chaque mot a un rôle précis
            </span>
          </div>
          <div className="lv-fig">
            <div className="w-full max-w-[900px]">
              <div className="rounded-2xl border-[2.5px] border-[#0F0F0F] bg-[#12101E] p-5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[19px] font-bold">
                  <span className="text-[#F5411C]">$</span>
                  <span className="rounded-md bg-[#5B4DEE] px-2.5 py-1 text-white">apt</span>
                  <span className="rounded-md bg-[#188A5C] px-2.5 py-1 text-white">install</span>
                  <span className="rounded-md bg-[#E8A33D] px-2.5 py-1 text-[#12101E]">-y</span>
                  <span className="rounded-md bg-[#C05A3E] px-2.5 py-1 text-white">nginx</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Anat c="#5B4DEE" k="apt" v="Le magasin d'applications du serveur. C'est lui qui installe les logiciels." />
                <Anat c="#188A5C" k="install" v="L'action qu'on veut faire : installer. (Il existe aussi update, remove…)" />
                <Anat c="#E8A33D" k="-y" v="« Réponds oui à toutes les questions. » Ça évite d'avoir à confirmer à la main." />
                <Anat c="#C05A3E" k="nginx" v="Le nom du logiciel qu'on veut. Ici, le concierge dont on parlera à l'étape 09." />
              </div>
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Le <b>$</b> au début n&apos;est pas à taper : c&apos;est juste le
            symbole qui dit « ici commence une commande ». Tu peux <b>copier-coller</b> sans crainte, puis
            appuyer sur <b>Entrée</b>. Si tu te trompes, rien n&apos;est cassé définitivement — on peut
            toujours réinstaller.
          </div>
        </div>
      </section>

      {/* ============ 5 — INSTALLER LES OUTILS ============ */}
      <section className="lv-slide" id="v5">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 05 · L&apos;outillage</div>
          <h2 className="lv-h2">Installer les <span className="lv-mark">3 outils</span> nécessaires</h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              le serveur est vide : on lui donne le moteur, le veilleur et le concierge
            </span>
          </div>
          <div className="lv-fig">
            <CmdList
              where="serveur"
              items={[
                {
                  cmd: "apt update && apt upgrade -y",
                  why: <>Met le serveur à jour, comme les mises à jour de ton téléphone. À faire en premier, toujours.</>,
                },
                {
                  cmd: "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
                  why: <>Prépare l&apos;installation de <b>Node</b>. Cette ligne va juste chercher la bonne source sur Internet.</>,
                },
                {
                  cmd: "apt install -y nodejs",
                  why: <>Installe <b>Node</b> : c&apos;est le <b>moteur</b> qui fait tourner ton site.</>,
                },
                {
                  cmd: "npm install -g pm2",
                  why: <>Installe <b>pm2</b> : le <b>veilleur de nuit</b> qui garde ton site allumé (étape 08).</>,
                },
                {
                  cmd: "apt install -y nginx",
                  why: <>Installe <b>nginx</b> : le <b>concierge</b> qui accueille les visiteurs (étape 09).</>,
                },
              ]}
            />
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Lance-les <b>une par une</b>, dans l&apos;ordre, en attendant que
            chacune se termine. Beaucoup de texte va défiler : c&apos;est normal, c&apos;est le serveur qui
            raconte ce qu&apos;il fait. Tant que tu ne vois pas le mot <b>error</b> en rouge, tout va bien.
          </div>
        </div>
      </section>

      {/* ============ 6 — ENVOYER LE SITE ============ */}
      <section className="lv-slide" id="v6">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Étape 06 · Le transfert</div>
          <h2 className="lv-h2">Envoyer ton site <span className="lv-mark m2">sur le serveur</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              copier le dossier de ton projet vers le serveur
            </span>
          </div>
          <div className="lv-fig">
            <div className="w-full max-w-[900px]">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <Box label="Ton ordinateur" sub="le dossier du projet" tone="lav" />
                <Arrow />
                <Box label="Le serveur" sub="/var/www/naiom" tone="mint" />
              </div>
              <CmdList
                where="ordi"
                items={[
                  {
                    cmd: "rsync -avz --exclude node_modules --exclude .next ./ root@46.202.173.91:/var/www/naiom/",
                    why: <>Copie ton dossier vers le serveur. <b>rsync</b> est un outil de copie ; <b>--exclude</b> veut dire « n&apos;envoie pas ces deux dossiers », car ils sont énormes et seront recréés sur place.</>,
                  },
                ]}
              />
              <div className="mt-3 rounded-xl border-2 border-dashed border-[#0F0F0F] bg-white px-4 py-2.5 text-[13.5px] leading-snug">
                <b>Attention :</b> cette commande se tape <b>sur ton ordinateur</b>, pas sur le serveur.
                Si tu es connecté en SSH, écris d&apos;abord <span className="lv-mt">exit</span> pour en sortir.
              </div>
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> C&apos;est la seule étape qui part de <b>ton</b> ordinateur. Une
            alternative très courante en équipe : mettre le projet sur <b>GitHub</b>, puis le récupérer
            depuis le serveur avec <span className="lv-mt">git clone</span>.
          </div>
        </div>
      </section>

      {/* ============ 7 — PRÉPARER ============ */}
      <section className="lv-slide" id="v7">
        <div className="lv-board ciel">
          <div className="lv-eyebrow">Étape 07 · La préparation</div>
          <h2 className="lv-h2">Préparer le site pour <span className="lv-mark m2">les visiteurs</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              installer les pièces manquantes, puis fabriquer la version rapide du site
            </span>
          </div>
          <div className="lv-fig">
            <CmdList
              where="serveur"
              items={[
                {
                  cmd: "cd /var/www/naiom/naiom-platform",
                  why: <><b>cd</b> veut dire « entre dans ce dossier ». Tu te places là où se trouve ton site.</>,
                },
                {
                  cmd: "npm ci",
                  why: <>Télécharge toutes les librairies dont le site a besoin (le dossier qu&apos;on n&apos;avait pas envoyé). Ça peut prendre quelques minutes.</>,
                },
                {
                  cmd: "nano .env.local",
                  why: <>Ouvre un éditeur de texte pour y coller tes <b>clés API</b>. Pour enregistrer : <b>Ctrl+O</b> puis Entrée. Pour sortir : <b>Ctrl+X</b>.</>,
                },
                {
                  cmd: "npm run build",
                  why: <>Fabrique la version optimisée du site. C&apos;est ce qui le rend rapide. Attends le message <b>Compiled successfully</b>.</>,
                },
              ]}
            />
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Sans le fichier <span className="lv-mt">.env.local</span>, le site
            démarre quand même mais les fonctions qui utilisent l&apos;IA ne répondront pas. C&apos;est le
            fichier qui contient tes clés — il reste sur le serveur et n&apos;est jamais public.
          </div>
        </div>
      </section>

      {/* ============ 8 — PM2 ============ */}
      <section className="lv-slide" id="v8">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 08 · Le veilleur de nuit</div>
          <h2 className="lv-h2">Garder le site <span className="lv-mark">allumé</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>LE PROBLÈME</Chip>
            <span className="self-center text-[15px] font-semibold">
              si tu lances le site à la main, il s&apos;éteint dès que tu fermes la fenêtre
            </span>
          </div>
          <div className="lv-fig">
            <CmdList
              where="serveur"
              items={[
                {
                  cmd: "pm2 start npm --name naiom -- run start",
                  why: <>Démarre ton site et le confie à <b>pm2</b>. <b>--name naiom</b> lui donne un nom, pour pouvoir le retrouver après.</>,
                },
                {
                  cmd: "pm2 save && pm2 startup",
                  why: <>Mémorise la configuration : si le serveur redémarre en pleine nuit, ton site se rallume <b>tout seul</b>.</>,
                },
                {
                  cmd: "pm2 list",
                  why: <>Affiche l&apos;état. Tu dois voir ton site avec la mention <b>online</b> (en vert).</>,
                },
              ]}
            />
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> À ce stade, ton site <b>tourne</b> — mais personne ne peut encore
            le voir : il est derrière la <b>porte 3000</b>, une porte intérieure. Les deux prochaines étapes
            servent à amener les visiteurs jusqu&apos;à elle. Commande utile en cas de souci :
            <span className="lv-mt"> pm2 logs naiom</span>.
          </div>
        </div>
      </section>

      {/* ============ 9 — NGINX / LES PORTES ============ */}
      <section className="lv-slide" id="v9">
        <div className="lv-board peach">
          <div className="lv-eyebrow">Étape 09 · Le concierge</div>
          <h2 className="lv-h2">Amener les visiteurs à <span className="lv-mark m3">la bonne porte</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>LE PROBLÈME</Chip>
            <span className="self-center text-[15px] font-semibold">
              les visiteurs sonnent à la porte 80, mais ton site est derrière la porte 3000
            </span>
          </div>
          <div className="lv-fig">
            <div className="w-full max-w-[980px]">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <Box label="Le visiteur" sub="sonne à la porte 80" tone="lav" />
                <Arrow />
                <Box label="nginx" sub="le concierge" tone="peach" />
                <Arrow />
                <Box label="Ton site" sub="habite porte 3000" tone="mint" />
              </div>
              <CmdList
                where="serveur"
                items={[
                  {
                    cmd: "nano /etc/nginx/sites-available/naiom",
                    why: <>Crée la fiche d&apos;instructions du concierge. Colle dedans le texte ci-dessous, puis Ctrl+O, Entrée, Ctrl+X.</>,
                  },
                ]}
              />
              <div className="mt-2.5 overflow-hidden rounded-xl border-2 border-[#0F0F0F]">
                <div className="bg-[#12101E] p-3.5 font-mono text-[12px] leading-[1.6] text-[#8FD0FF]">
                  <div>server {"{"}</div>
                  <div className="pl-4">listen 80;<span className="ml-3 text-[#7C7597]">← écoute la porte d&apos;entrée</span></div>
                  <div className="pl-4">server_name app.mon-domaine.com;<span className="ml-3 text-[#7C7597]">← ton futur nom</span></div>
                  <div className="pl-4">location / {"{"}</div>
                  <div className="pl-8">proxy_pass http://127.0.0.1:3000;<span className="ml-3 text-[#7C7597]">← emmène à la porte 3000</span></div>
                  <div className="pl-4">{"}"}</div>
                  <div>{"}"}</div>
                </div>
              </div>
              <div className="mt-2.5">
                <CmdList
                  compact
                  where="serveur"
                  items={[
                    {
                      cmd: "ln -s /etc/nginx/sites-available/naiom /etc/nginx/sites-enabled/",
                      why: <>Active la fiche. (Elle existait, elle est maintenant <b>utilisée</b>.)</>,
                    },
                    {
                      cmd: "nginx -t && systemctl reload nginx",
                      why: <>Vérifie qu&apos;il n&apos;y a pas de faute, puis applique. Fais-le <b>toujours</b> dans cet ordre.</>,
                    },
                  ]}
                />
              </div>
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Ce rôle de concierge porte un nom technique : <b>reverse proxy</b>.
            Retiens simplement l&apos;image : il attend à l&apos;entrée et accompagne chaque visiteur jusqu&apos;à
            la bonne porte.
          </div>
        </div>
      </section>

      {/* ============ 10 — DNS ============ */}
      <section className="lv-slide" id="v10">
        <div className="lv-board">
          <div className="lv-eyebrow">Étape 10 · Le nom</div>
          <h2 className="lv-h2">Remplacer les chiffres par <span className="lv-mark">un vrai nom</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              que les gens tapent un nom, pas une suite de chiffres
            </span>
          </div>
          <Todo
            items={[
              <>Va là où tu as acheté ton domaine, dans la section <B>Zone DNS</B>.</>,
              <>Clique sur <B>Ajouter un enregistrement</B> et recopie exactement le tableau ci-dessous.</>,
              <>Patiente : entre <B>quelques minutes et 1 heure</B> pour que tout Internet soit au courant.</>,
            ]}
          />
          <div className="lv-fig">
            <DnsMock />
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Le <b>DNS</b> est l&apos;annuaire d&apos;Internet : il retient que
            <span className="lv-mt"> app.mon-domaine.com</span> correspond à
            <span className="lv-mt"> 46.202.173.91</span>. <b>Ne passe pas à l&apos;étape suivante tant que ton
            nom n&apos;affiche pas encore le site</b> — l&apos;étape du cadenas échouerait.
          </div>
        </div>
      </section>

      {/* ============ 11 — HTTPS ============ */}
      <section className="lv-slide" id="v11">
        <div className="lv-board mint">
          <div className="lv-eyebrow">Étape 11 · Le cadenas</div>
          <h2 className="lv-h2">Ajouter le <span className="lv-mark m2">cadenas</span> (gratuit)</h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              enlever le « Non sécurisé » que le navigateur affiche aujourd&apos;hui
            </span>
          </div>
          <div className="lv-fig">
            <div className="w-full max-w-[900px]">
              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <UrlBar secure={false} url="http://app.mon-domaine.com" note="Avant : le navigateur méfie" />
                <UrlBar secure url="https://app.mon-domaine.com" note="Après : cadenas, site de confiance" />
              </div>
              <CmdList
                where="serveur"
                items={[
                  {
                    cmd: "apt install -y certbot python3-certbot-nginx",
                    why: <>Installe <b>certbot</b>, l&apos;outil qui fabrique le cadenas gratuitement.</>,
                  },
                  {
                    cmd: "certbot --nginx -d app.mon-domaine.com",
                    why: <>Fabrique et installe le cadenas. Il pose 2 questions : ton <b>email</b>, puis s&apos;il faut rediriger vers HTTPS — réponds <b>2</b> (oui).</>,
                  },
                ]}
              />
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Le certificat est valable 90 jours et se <b>renouvelle tout seul</b>.
            Une seule condition : le nom doit <b>déjà</b> pointer vers le serveur (étape 10). Et sache
            qu&apos;on ne <b>peut pas</b> obtenir de cadenas pour une simple adresse IP — il faut un nom.
          </div>
        </div>
      </section>

      {/* ============ 12 — MOT DE PASSE ============ */}
      <section className="lv-slide" id="v12">
        <div className="lv-board ciel">
          <div className="lv-eyebrow">Étape 12 · Le videur</div>
          <h2 className="lv-h2">Réserver l&apos;accès par <span className="lv-mark m2">mot de passe</span></h2>
          <div className="flex flex-wrap items-center gap-y-2">
            <Chip>OBJECTIF</Chip>
            <span className="self-center text-[15px] font-semibold">
              en ligne, mais visible seulement par ceux à qui tu donnes le code
            </span>
          </div>
          <div className="lv-fig">
            <div className="grid w-full max-w-[1060px] items-start gap-4 lg:grid-cols-[1.1fr_1fr]">
              <CmdList
                where="serveur"
                items={[
                  {
                    cmd: "apt install -y apache2-utils",
                    why: <>Installe le petit outil qui fabrique les mots de passe.</>,
                  },
                  {
                    cmd: "htpasswd -c /etc/nginx/.htpasswd naiom",
                    why: <>Crée l&apos;identifiant <b>naiom</b>. Il te demande alors de choisir un mot de passe (deux fois).</>,
                  },
                  {
                    cmd: "nano /etc/nginx/sites-available/naiom",
                    why: <>Rouvre la fiche du concierge pour y ajouter les 2 lignes ci-dessous, dans le bloc <b>location /</b>.</>,
                  },
                ]}
              />
              <AuthPopup />
            </div>
          </div>
          <div className="mt-2 w-full max-w-[560px] self-start overflow-hidden rounded-xl border-2 border-[#0F0F0F]">
            <div className="bg-[#12101E] p-3 font-mono text-[12px] leading-[1.6] text-[#8FD0FF]">
              <div>auth_basic &quot;Accès réservé&quot;;</div>
              <div>auth_basic_user_file /etc/nginx/.htpasswd;</div>
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> Puis relance <span className="lv-mt">nginx -t &amp;&amp; systemctl reload nginx</span>.
            <b> Piège classique :</b> mets le mot de passe <b>après</b> avoir fait le cadenas (étape 11) —
            dans l&apos;autre sens, la fabrication du cadenas est bloquée par le mot de passe et échoue.
          </div>
        </div>
      </section>

      {/* ============ FINALE ============ */}
      <section className="lv-slide" id="v-fin">
        <div className="lv-board dark">
          <div className="lv-eyebrow" style={{ color: "#FF8867" }}>C&apos;est en ligne</div>
          <h2 className="lv-h2">Récapitulatif et dépannage</h2>
          <div className="lv-fig">
            <div className="grid w-full max-w-[1060px] items-start gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#241F3B] p-5">
                <div className="mb-3 text-[13px] font-black uppercase tracking-[0.14em] text-[#B7AEE8]">
                  Ce que tu as fait
                </div>
                <ol className="space-y-1.5">
                  {[
                    "Loué un ordinateur allumé 24h/24",
                    "Ouvert une fenêtre pour le commander",
                    "Installé le moteur, le veilleur, le concierge",
                    "Envoyé ton site dessus",
                    "Fabriqué la version rapide du site",
                    "Confié le site au veilleur de nuit",
                    "Placé un concierge à l'entrée",
                    "Donné un vrai nom au site",
                    "Ajouté le cadenas de confiance",
                    "Réservé l'accès par mot de passe",
                  ].map((s, i) => (
                    <li key={s} className="lv-in flex gap-2.5 text-[13.5px] text-white" style={{ ["--d" as string]: `${i * 0.1}s` }}>
                      <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#F5411C] text-[10.5px] font-black">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="mb-2 text-[12.5px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
                    Si quelque chose ne marche pas
                  </div>
                  <ul className="space-y-2 text-[13px] text-[#3A3A3A]">
                    <li><span className="lv-mt font-bold">pm2 logs naiom</span><br />Le site ne s&apos;affiche pas : regarde ici, l&apos;erreur y est écrite.</li>
                    <li><span className="lv-mt font-bold">pm2 restart naiom</span><br />Redémarre le site s&apos;il s&apos;est bloqué.</li>
                    <li><span className="lv-mt font-bold">nginx -t</span><br />Te dit si tu as fait une faute dans la fiche du concierge.</li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="mb-2 text-[12.5px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
                    Modifier le site plus tard
                  </div>
                  <p className="mb-2 text-[12.5px] text-[#5A5A5A]">Renvoie-le, refabrique-le, redémarre :</p>
                  <div className="space-y-1 rounded-xl bg-[#191627] p-3 font-mono text-[11.5px] text-[#B9F0C5]">
                    <div>rsync -avz ./ root@TON_IP:/var/www/naiom/</div>
                    <div>cd /var/www/naiom/naiom-platform</div>
                    <div>npm ci &amp;&amp; npm run build</div>
                    <div>pm2 restart naiom</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lv-why">
            <Chip dark>À RETENIR</Chip> La logique est toujours la même, quel que soit l&apos;hébergeur :
            <b> un ordinateur allumé</b>, <b>un site qui tourne</b>, <b>un concierge qui oriente</b>,
            <b> un annuaire qui donne le nom</b>, <b>un cadenas</b>. Tu sais maintenant mettre
            n&apos;importe quel site en ligne.
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= Composants ================= */

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

function B({ children }: { children: React.ReactNode }) {
  return <b className="rounded bg-[#EDE9FF] px-1 text-[#4A3DD6]">{children}</b>;
}

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

/**
 * Le composant central du tuto : une commande + sa traduction en français.
 * `where` affiche en permanence sur QUELLE machine on tape — c'est le point
 * qui perd le plus les débutants.
 */
function CmdList({
  where,
  items,
  compact,
}: {
  where: "serveur" | "ordi";
  items: { cmd: string; why: React.ReactNode }[];
  compact?: boolean;
}) {
  const onServer = where === "serveur";
  return (
    <div className="w-full max-w-[900px]">
      {!compact && (
        <div
          className="mb-2.5 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-black text-white"
          style={{ background: onServer ? "#188A5C" : "#5B4DEE" }}
        >
          <span className="font-mono tracking-[0.08em]">TU TAPES SUR</span>
          <span className="rounded bg-white/20 px-2 py-0.5">
            {onServer ? "LE SERVEUR" : "TON ORDINATEUR"}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="lv-in overflow-hidden rounded-xl border-2 border-[#0F0F0F]"
            style={{ ["--d" as string]: `${i * 0.18}s` }}
          >
            <div className="flex gap-2 bg-[#12101E] px-3.5 py-2.5 font-mono text-[12.5px] leading-snug text-white">
              <span className="shrink-0 font-bold text-[#F5411C]">$</span>
              <span className="break-all font-bold">{it.cmd}</span>
            </div>
            <div className="flex gap-2 bg-white px-3.5 py-2 text-[13px] leading-[1.45] text-[#2A2A2A]">
              <span className="shrink-0 font-black text-[#5B4DEE]">&rarr;</span>
              <span>{it.why}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Carte de vocabulaire : le mot, sa définition, et son image du quotidien. */
function Word({ mot, def, img, d }: { mot: string; def: string; img: string; d: string }) {
  return (
    <div className="lv-in rounded-2xl border-2 border-[#0F0F0F] bg-white p-3.5" style={{ ["--d" as string]: d }}>
      <div className="text-[14.5px] font-black text-[#0F0F0F]">{mot}</div>
      <p className="mt-1 text-[12.5px] leading-snug text-[#3A3A3A]">{def}</p>
      <div className="mt-2 rounded-lg bg-[#F3F0FF] px-2.5 py-1.5 text-[12px] italic leading-snug text-[#4A3DD6]">
        {img}
      </div>
    </div>
  );
}

/** Ligne d'anatomie d'une commande (couleur = morceau surligné). */
function Anat({ c, k, v }: { c: string; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border-2 border-[#EEEDF6] bg-white px-3 py-2">
      <span className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[12.5px] font-bold text-white" style={{ background: c }}>
        {k}
      </span>
      <span className="text-[13px] leading-snug text-[#2A2A2A]">{v}</span>
    </div>
  );
}

function InfoCard({ label, value, text, d }: { label: string; value: string; text: string; d: string }) {
  return (
    <div className="lv-in rounded-2xl border-2 border-[#0F0F0F] bg-white p-4" style={{ ["--d" as string]: d }}>
      <div className="text-[12px] font-black uppercase tracking-[0.12em] text-[#8A8A8A]">{label}</div>
      <div className="mt-1.5 rounded-lg bg-[#191627] px-3 py-2 font-mono text-[14px] font-bold text-[#B9F0C5]">
        {value}
      </div>
      <p className="mt-2 text-[12.5px] leading-snug text-[#3A3A3A]">{text}</p>
    </div>
  );
}

function Box({ label, sub, tone }: { label: string; sub: string; tone: "lav" | "mint" | "peach" }) {
  const bg = tone === "lav" ? "#DCD3FF" : tone === "mint" ? "#C6EEDB" : "#FFD9C7";
  return (
    <div className="rounded-xl border-2 border-[#0F0F0F] px-4 py-2.5 text-center" style={{ background: bg }}>
      <div className="text-[13.5px] font-black text-[#0F0F0F]">{label}</div>
      <div className="font-mono text-[11px] text-[#5A5A5A]">{sub}</div>
    </div>
  );
}

function Arrow() {
  return <span className="px-1 text-[22px] font-black leading-none text-[#0F0F0F]">&rarr;</span>;
}

function UrlBar({ url, secure, note }: { url: string; secure?: boolean; note: string }) {
  return (
    <div className="rounded-xl border-2 border-[#0F0F0F] bg-white p-3">
      <div className="flex items-center gap-2 rounded-lg border border-[#E4E1F5] bg-[#F6F5FB] px-3 py-2">
        {secure ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#188A5C" strokeWidth="2.5">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        ) : (
          <span className="text-[13px] font-black text-[#C05A3E]">!</span>
        )}
        <span className="truncate font-mono text-[12px]" style={{ color: secure ? "#188A5C" : "#C05A3E" }}>
          {url}
        </span>
      </div>
      <div className="mt-2 text-center text-[12px] font-semibold" style={{ color: secure ? "#188A5C" : "#C05A3E" }}>
        {note}
      </div>
    </div>
  );
}

function AuthPopup() {
  return (
    <div className="lv-in" style={{ ["--d" as string]: "0.3s" }}>
      <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#0F0F0F] bg-white shadow-[0_18px_44px_-22px_rgba(15,15,15,0.4)]">
        <div className="flex items-center gap-2 border-b border-[#E6E4EE] bg-[#F3F2F7] px-3.5 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate font-mono text-[11.5px] font-bold text-[#5A5A5A]">app.mon-domaine.com</span>
        </div>
        <div className="bg-[#EDEBF6] p-5">
          <div className="rounded-xl border border-[#D7D3E8] bg-white p-4 shadow-sm">
            <div className="text-[13.5px] font-black text-[#0F0F0F]">Connexion requise</div>
            <p className="mt-1 text-[12px] text-[#8A8A8A]">Ce site demande un identifiant.</p>
            <div className="mt-3 space-y-2">
              <div className="rounded-md border border-[#E4E1F5] bg-[#FAFAFE] px-2.5 py-1.5 font-mono text-[12px] text-[#3A3A3A]">
                naiom
              </div>
              <div className="rounded-md border border-[#E4E1F5] bg-[#FAFAFE] px-2.5 py-1.5 font-mono text-[12px] tracking-[0.2em] text-[#8A8A8A]">
                ••••••••••
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <span className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-[#8A8A8A]">Annuler</span>
              <span className="rounded-md bg-[#5B4DEE] px-3 py-1.5 text-[12px] font-bold text-white">Se connecter</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">ce que voient les visiteurs sans le code</p>
    </div>
  );
}

function PanelMock() {
  return (
    <div className="w-full max-w-[880px]">
      <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#0F0F0F] bg-white shadow-[0_18px_44px_-22px_rgba(15,15,15,0.4)]">
        <div className="flex items-center gap-2 border-b border-[#E6E4EE] bg-[#F3F2F7] px-3.5 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate font-mono text-[11.5px] font-bold text-[#5A5A5A]">
            le site de ton hébergeur › VPS
          </span>
        </div>
        <div className="flex text-left">
          <div className="w-[150px] shrink-0 border-r border-[#EEEDF6] bg-[#FBFAFE] p-2.5">
            <div className="mb-2 text-[12px] font-black text-[#0F0F0F]">Menu</div>
            {["Vue d'ensemble", "Terminal navigateur", "Paramètres", "Sauvegardes"].map((it) => {
              const on = it === "Terminal navigateur";
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
          <div className="flex-1 p-4">
            <div className="mb-2.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
              Ton serveur
            </div>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#E4E1F5] bg-[#FAFAFE] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#28C840]" />
              <span className="font-mono text-[12px] font-bold text-[#0F0F0F]">46.202.173.91</span>
              <span className="ml-auto text-[11px] font-semibold text-[#188A5C]">en marche</span>
            </div>
            <div className="relative rounded-xl border-2 border-dashed border-[#5B4DEE] bg-[#F7F5FF] p-4">
              <span className="absolute -top-3 left-4 rounded-full bg-[#5B4DEE] px-2.5 py-1 text-[10.5px] font-black text-white shadow">
                clique ici
              </span>
              <p className="mb-3 text-[12.5px] leading-snug text-[#3A3A3A]">
                Ouvre une fenêtre noire directement dans ton navigateur. <b>Rien à installer</b>, et tu es
                connecté automatiquement — pas de mot de passe à taper.
              </p>
              <span className="inline-flex items-center rounded-xl bg-[#5B4DEE] px-4 py-2 text-[13px] font-bold text-white shadow">
                Terminal navigateur
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">
        c&apos;est la façon la plus simple quand on débute
      </p>
    </div>
  );
}

function DnsMock() {
  const rows = [
    { l: "Type", v: "A", hint: "A veut dire « adresse ». On garde A." },
    { l: "Nom", v: "app", hint: "donnera app.mon-domaine.com" },
    { l: "Pointe vers", v: "46.202.173.91", hint: "l'adresse IP de ton serveur" },
    { l: "TTL", v: "3600", hint: "laisse la valeur par défaut" },
  ];
  return (
    <div className="w-full max-w-[880px]">
      <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#0F0F0F] bg-white shadow-[0_18px_44px_-22px_rgba(15,15,15,0.4)]">
        <div className="flex items-center gap-2 border-b border-[#E6E4EE] bg-[#F3F2F7] px-3.5 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate font-mono text-[11.5px] font-bold text-[#5A5A5A]">
            là où tu as acheté ton domaine › Zone DNS
          </span>
        </div>
        <div className="p-5 text-left">
          <div className="mb-3 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#8A8A8A]">
            Ajouter un enregistrement
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.l} className="lv-in flex flex-wrap items-center gap-3" style={{ ["--d" as string]: `${0.15 + i * 0.15}s` }}>
                <span className="w-[92px] shrink-0 text-[12.5px] font-bold text-[#5A5A5A]">{r.l}</span>
                <span className="min-w-[150px] rounded-md border-2 border-[#5B4DEE] bg-[#FAFAFE] px-3 py-1.5 font-mono text-[13px] font-bold text-[#0F0F0F]">
                  {r.v}
                </span>
                <span className="text-[11.5px] italic text-[#8A8A8A]">{r.hint}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-xl bg-[#5B4DEE] px-4 py-2 text-[13px] font-bold text-white shadow">
              Enregistrer
            </span>
            <span className="text-[12px] text-[#8A8A8A]">puis patiente quelques minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
