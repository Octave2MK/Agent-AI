import type { UIMessage } from "ai";
import { simulateReadableStream } from "ai";

/**
 * Mock response : utilisé si DEMO_MOCK=1 ou si ANTHROPIC_API_KEY absente.
 * Produit un livrable **complet et crédible** selon l'agent + l'intention user.
 */

// ------------------------- LIVRABLES PRÉ-ÉCRITS -------------------------

const DEFAULT_REPLIES: Record<string, string> = {
  orchestrateur: `> 🎯 **Le Stratège** s'occupe de ça.

# Brief de campagne — Lancement Davide (Agent IA SDR)

**Fenêtre** : 4 semaines · **Budget média** : 0 € (organique) · **Canaux** : LinkedIn + YouTube

## Contexte & objectif

NAIOM lance **Davide**, son agent IA de prospection, sur son propre marketing (dogfooding). Objectif SMART : **10 RDV qualifiés Calendly + 5 demandes d'intégration similaires** en 4 semaines, 100 % organique.

## Persona cible : Thomas, CEO de PME B2B en scale-up

70 % du temps commercial perdu en admin. A testé ChatGPT en solo sans systématiser. Lit LinkedIn 7h30-9h. Suit les dirigeants AI-First.

## Positionnement StoryBrand

**"Votre meilleur commercial vient de poser 3 semaines de vacances. Davide, lui, travaille cette nuit."**

## 3 angles de contenu

1. **"Le SDR qui ne prend jamais de congés"** (PAS, LinkedIn long, voix Zeyneb)
2. **"ChatGPT est un outil. Davide est un collègue."** (Hook-Story-Offer, carrousel, voix Maxim)
3. **"Je vous montre Davide en prod"** (AIDA, vidéo YouTube + 3 shorts)

## Cadence hebdo

- Zeyneb : 2-3 posts LinkedIn + 1 short YouTube
- Maxim : 2 posts LinkedIn
- Page NAIOM : 2 posts (long + carrousel)

## KPIs cibles (4 semaines)

- 80 000+ impressions LinkedIn cumulées
- 500+ nouveaux followers (Zeyneb + Maxim + page)
- 50+ DM/commentaires "Davide"
- 10 RDV Calendly bookés · 5 contrats signés ou pipeline chaud

## Hypothèses

- Audience francophone principalement (base actuelle)
- Pas de budget ads → reach organique uniquement
- Témoignage Warburg.ai "booking 3x 30j" utilisé comme unique preuve sociale

---

> **Prochaine étape** : enregistrez ce brief comme livrable (bouton en bas à gauche), puis demandez-moi les contenus — je les produirai angle par angle.`,

  strategiste: `# Brief de campagne — Lancement Davide (Agent IA SDR)

**Client** : NAIOM Agency · **Fenêtre** : 4 semaines · **Budget média** : 0 € (organique)

## 1. Contexte & objectif

NAIOM lance **Davide**, son agent IA de prospection commerciale autonome, sur son propre marketing (dogfooding). Objectif SMART : **10 RDV qualifiés bookés sur Calendly + 5 demandes d'intégration "Davide-like" en 4 semaines**, 100 % organique.

## 2. Analyse marché & concurrence

- 34 % des PME françaises utilisent déjà l'IA (France Num 2025)
- Concurrence positionnée sur l'outil (copilot) — NAIOM se positionne sur l'autonomie (agent qui tourne 24/7)
- Sweet spot identifié : dirigeants de PME B2B 10-200 salariés, saturés par la prospection manuelle

## 3. ICP & persona

**Thomas**, CEO d'une PME B2B en scale-up (35-55 ans). Pipeline plafonné, équipe commerciale qui passe 70 % de son temps en admin. A testé ChatGPT en solo sans systématiser. Lit LinkedIn entre 7h30 et 9h, suit les dirigeants AI-First.

## 4. Positionnement StoryBrand

**Votre meilleur commercial vient de poser 3 semaines de vacances. Davide, lui, travaille cette nuit.**

- Client = héros (Thomas)
- Problème = pipeline plafonné, équipe saturée
- Guide = NAIOM
- Plan = Audit → Build → Train
- Résultat = pipeline autonome + équipe qui ferme au lieu de prospecter

## 5. 3 angles de contenu

1. **"Le SDR qui ne prend jamais de congés"** (PAS) — post LinkedIn long, voix Zeyneb
2. **"ChatGPT est un outil. Davide est un collègue."** (Hook-Story-Offer) — carrousel, voix Maxim
3. **"Je vous montre Davide en prod"** (AIDA) — vidéo YouTube + 3 shorts dérivés

## 6. Cadence hebdomadaire

| Profil | Lun | Mar | Mer | Jeu | Ven |
|---|---|---|---|---|---|
| Zeyneb | 1 post | — | 1 short YT | 1 thread | — |
| Maxim | — | 1 carrousel | — | 1 post | — |
| Page NAIOM | 1 post | — | 1 Reel | — | 1 carrousel |

## 7. KPIs cibles (4 semaines)

- Impressions LinkedIn : 80 000+
- Nouveaux followers cumul (Zeyneb + Maxim + page) : 500+
- DM / commentaires "Davide" : 50+
- RDV Calendly bookés : 10
- Contrats signés ou pipeline chaud : 5

## Hypothèses

- Audience cible assumée = francophone principalement (base actuelle)
- Pas de budget ads → reach organique uniquement
- Témoignage "booking 3x 30 jours" (client Warburg.ai) utilisé comme preuve sociale unique`,

  "createur-contenu": `# Post LinkedIn — "Le SDR qui ne prend jamais de congés"

**Framework** : PAS (Problem-Agitate-Solution) · **Voix** : Zeyneb (CTO) · **Format** : LinkedIn long

## Hook — variante A (recommandée)

> **Votre meilleur commercial vient de poser 3 semaines de vacances.**

*(9 mots — scroll-stop émotionnel, crée instantanément la scène mentale)*

## Hook — variante B

> **Hier soir, 23h : 47 leads qui attendent une relance.**

*(10 mots — joue sur la culpabilité nocturne du dirigeant)*

## Copy complet (~1 780 signes)

Votre meilleur commercial vient de poser 3 semaines de vacances.

Le mien travaille cette nuit.

Il s'appelle Davide.

Et non, ce n'est pas un humain — c'est un agent IA qu'on a construit chez NAIOM.

**Le problème que j'entends chaque semaine chez les dirigeants de PME :**

Vos commerciaux passent 70 % de leur temps sur de la prospection froide, de la qualification, des relances. Pas sur du closing.

Résultat :

→ Les leads chauds refroidissent dans l'inbox.
→ Les follow-up du mardi sont faits le vendredi (ou jamais).
→ Chaque départ d'un SDR = 3 mois d'angoisse pipeline.

Et pendant ce temps, vous, vous dormez mal.

**Ce qu'on a construit pour éviter ça :**

Davide n'est pas un ChatGPT déguisé. C'est un agent orchestré sur n8n, branché sur vos données, avec des garde-fous Human-in-the-Loop sur les envois sensibles.

Concrètement, il :

→ prospecte en continu sur vos segments cibles
→ qualifie les leads sur vos critères (RAG sur votre data, pas d'hallucination)
→ relance au bon moment, 24/7
→ vous laisse le dernier clic sur ce qui compte

Un client nous a confié récemment : *"Davide has completely changed our outbound strategy — our booking rate tripled in less than 30 days."*

C'est **leur** résultat, documenté. Pas une promesse NAIOM. Mais ça donne une idée de ce qu'un agent bien construit peut débloquer.

## CTA

> Je prépare une démo courte de Davide (pas encore publique). Commentez **"Davide"** ou envoyez-moi un DM pour la recevoir en avant-première.

## Hashtags

\`#IAgenerative\` \`#PME\` \`#SalesAutomation\` \`#AIAgents\` \`#n8n\`

## Hypothèses

- Post publié depuis le profil personnel de Zeyneb (CTO NAIOM)
- Audience cible : dirigeants PME B2B francophones (vouvoiement maintenu)
- Créneau optimal suggéré : lundi matin 7h45-8h30`,

  designer: `# Prompts visuels — Campagne Davide (3 formats)

**Outils** : Nano Banana (principal pour la série), Midjourney (hero unique), Ideogram (texte long)
**Palette** : bleu marine \`#1E2957\` + rose nude \`#F5D5CB\`
**Interdictions** : pas de robot humanoïde, pas de cerveau IA stock, pas de photo-stock visible

## 1. Hero campagne (16:9, cover LinkedIn page NAIOM + thumbnail YouTube)

### Variante A — Nano Banana (recommandée)

\`\`\`
Wide cinematic shot of an empty modern startup workspace at 11:47 PM, seen from the door. Cold blue lighting from an uncluttered desk with two ultrawide monitors showing a clean dashboard with calendar slots filling up in real time. A cold cup of coffee on the left. Big windows in the background showing the Paris skyline at night. The only warm color is a soft blush nude light coming from a small lamp on the left side. Overall palette: dominant deep navy #1E2957, accents blush nude #F5D5CB. Empty chair in foreground. No people. No robots. Photographic, editorial style, slight film grain. Aspect ratio 16:9.
\`\`\`

### Variante B — Midjourney (alternative)

\`\`\`
editorial photograph of an empty coworking desk at night, glowing monitor showing a calendar filling up with meeting slots, cold blue light, warm blush pink accent lamp, Paris skyline at night through a window, cinematic, Fujifilm GFX look, no people --ar 16:9 --style raw --v 6.1 --no robots, humanoid, artificial brain, circuit boards
\`\`\`

## 2. Format 1:1 (feed LinkedIn / Instagram)

### Nano Banana

\`\`\`
Same style sheet as Variante A. New framing: square composition, tight on the monitor with the filling calendar, split by a vertical line. Left side: dark navy background with large white typography reading "Davide". Right side: photograph of the monitor. Same palette, same photographic treatment. Aspect ratio 1:1.
\`\`\`

## 3. Format 9:16 (Story / Reel cover)

### Ideogram (pour garantir le texte lisible)

\`\`\`
Vertical portrait editorial poster. Top half: photograph of empty startup desk at night (navy lighting, single blush lamp). Bottom half: large serif typography "23:47" in nude pink #F5D5CB on navy #1E2957, with small caption "Davide travaille" in clean sans-serif white below. Magic prompt off. Aspect ratio 9:16.
\`\`\`

## Negative prompts (à réutiliser partout)

\`robot, humanoid, artificial brain, glowing neural network, circuit board, stock photo people, low quality, blurry, cartoon, low saturation people\`

## Notes

- Si le rose nude part vers saumon sur Midjourney, forcer "desaturated blush pink #F5D5CB" dans le prompt.
- Ideogram prioritaire pour le format 9:16 (texte "23:47" doit être net).
- À tester en priorité : **Variante A Nano Banana 16:9** — si elle passe, on décline toute la série avec la même style sheet.`,

  analyste: `# Rapport de performance — Semaine du 13 au 19 avril 2026

**Client** : NAIOM · **Canaux** : LinkedIn (Zeyneb + Maxim + page) · **Période** : S16 2026

## En bref (5 lignes)

- **Impressions totales** : 24 300 (+42 % vs S15) — propulsé par le post "SDR qui ne prend jamais de congés"
- **Nouveaux followers cumul** : 87 (+19 % vs S15)
- **Taux d'engagement moyen** : 6,8 % (baseline historique : 4,2 %) — tendance clairement positive
- **DM entrants "Davide"** : 14 (objectif hebdo : 10) — ✅ objectif dépassé
- **Alerte** : chute de reach sur le profil de Maxim (-18 %), probablement liée à une semaine sans post

## KPIs vs objectifs

| Métrique | Valeur S16 | Baseline | Δ | Atteint |
|---|---|---|---|---|
| Impressions LinkedIn | 24 300 | 17 100 | +42 % | ✅ |
| Taux d'engagement | 6,8 % | 4,2 % | +62 % | ✅ |
| Nouveaux followers | 87 | 73 | +19 % | ✅ |
| DM entrants | 14 | 10 (objectif) | +40 % | ✅ |

## Top 3 contenus

1. **"Le SDR qui ne prend jamais de congés"** (Zeyneb, 15/04) — 12 400 impressions, 8,3 % engagement
2. **Carrousel "ChatGPT vs Davide"** (Maxim, 16/04) — 5 200 impressions, 7,1 % engagement
3. **Court YouTube "Démo Davide en 60s"** (Zeyneb, 17/04) — 2 800 vues, 42 % rétention

## Flop (à analyser)

- **Post de Maxim du 13/04** ("3 idées fausses sur l'IA") — 340 impressions seulement, 2,1 % engagement. Hypothèse : hook faible + pas de preuve sociale intégrée.

## Insights par plateforme

### LinkedIn
- **Créneau qui performe** : 7h45-8h30 lundi & mercredi (confirme l'ICP Thomas)
- **Format gagnant** : post long avec preuve sociale chiffrée et narratif personnel
- **Hashtag à creuser** : \`#n8n\` ramène une communauté technique qualifiée

### YouTube
- **CTR miniature** : 8,2 % sur le court "Démo Davide" (très bon, >5 % = excellent)
- **À ajuster** : audio du short un peu faible vs ambiance

## Recommandations (priorité haute → basse)

1. **Re-publier Angle A** sur LinkedIn page NAIOM (avec crédit Zeyneb) — la reach personnelle est saturée, la page amplifie
2. **Écrire le "B side"** du post Angle A : témoignage client développé (Warburg.ai)
3. **Maxim** : doubler la cadence la semaine prochaine pour compenser la chute
4. **Tester** un Reel Instagram dérivé du short YouTube (cover Ideogram)
5. **Produire** un carrousel détaillé du workflow n8n (demande forte dans les DM)

## Données manquantes

- Pas encore d'exports Calendly pour corréler DM → RDV bookés (Maxim doit remonter le CSV)
- Pas de tracking UTM sur les liens en bio → impossible d'attribuer les leads formulaire

## Hypothèses

- Les chiffres ci-dessus sont calculés sur des exports mockés pour cette démo ; dans l'usage réel, l'agent se connecte à LinkedIn / YouTube / Calendly via n8n et tire les chiffres en direct.`,

  presentateur: `# Deck pitch prospect — "Mettez Davide au travail"

**Audience** : CEO de PME B2B francophone, 10-200 salariés · **Durée cible** : 20 min + Q&A
**Structure** : SCQA (Situation-Complication-Question-Answer) · **10 slides**

## Slide 1 — Hero

**Copy** : "Votre meilleur commercial vient de poser 3 semaines de vacances."
**Layout** : plein cadre photo (Ideogram 16:9) + logo NAIOM en haut à droite
**Visuel** : hero campagne Davide (voir prompts-images, variante IDE-1)
**Durée orale** : 30 s
**Notes orateur** : hook d'ouverture. Pause 2 secondes après la phrase. Enchaîner : "Le mien travaille cette nuit. Je vais vous montrer pourquoi."

## Slide 2 — Situation

**Copy** : "70 % du temps commercial part en tâches manuelles."
**Layout** : chiffre XXL centré + 3 bullets à droite
**Bullets** : prospection · qualification · follow-up
**Durée orale** : 60 s
**Notes orateur** : citer la source (Sales Hacker 2025). Demander : "Qui dans la salle retrouve ça dans son équipe ?"

## Slide 3 — Complication

**Copy** : "Vos commerciaux closent. Ils ne prospectent pas."
**Layout** : 2 colonnes — "ce qui devrait marcher" vs "la réalité"
**Durée orale** : 90 s
**Notes orateur** : raconter l'anecdote du client qui a perdu 3 mois après le départ d'un SDR.

## Slide 4 — Question implicite

**Copy** : "Et si la prospection tournait pendant que vous dormez ?"
**Layout** : texte plein cadre, typo XXL, fond navy
**Durée orale** : 30 s
**Notes orateur** : pause théâtrale. Enchaîner sur Davide slide 5.

## Slide 5 — Réponse : Davide

**Copy** : "Davide : un agent IA qui prospecte, qualifie et relance 24/7."
**Layout** : 3 colonnes d'icônes (Prospection / Qualification / Relance) + logo NAIOM
**Durée orale** : 120 s
**Notes orateur** : être très concret, donner les noms des outils qu'il orchestre (LinkedIn, Apollo, Clay, HubSpot).

## Slide 6 — Preuve

**Copy** : "Booking triplé en moins de 30 jours."
**Layout** : citation client encadrée + logo Warburg.ai + petite mention légale en bas
**Durée orale** : 60 s
**Notes orateur** : préciser "c'est leur résultat, pas une promesse". Crucial brand-safety.

## Slide 7 — Objections

**Copy** : "Oui mais… l'IA hallucine, je ne suis pas technique, mon CRM est ancien."
**Layout** : 3 objections / 3 réponses courtes
**Durée orale** : 120 s
**Notes orateur** : traiter les 3 objections fréquentes en 40 s chacune.

## Slide 8 — Méthodologie

**Copy** : "Audit → Build → Train. Vous êtes impliqué du jour 1 au jour 90."
**Layout** : timeline 3 étapes horizontale
**Durée orale** : 90 s
**Notes orateur** : insister sur le "Done-With-You", pas "Done-For-You".

## Slide 9 — Ce qui nous distingue

**Copy** : "Pas une agence marketing. Pas un outil no-code. Une équipe d'ingénieurs IA."
**Layout** : tableau 3 colonnes (agences trad / no-code / NAIOM)
**Durée orale** : 60 s
**Notes orateur** : ne JAMAIS dénigrer les concurrents. Montrer la différence, pas casser.

## Slide 10 — CTA

**Copy** : "Prochaine étape : audit 90 minutes."
**Layout** : QR code Calendly + 3 "ce que vous repartez avec"
**Durée orale** : 60 s
**Notes orateur** : rappeler les 3 livrables de l'audit. Encourager à scanner pendant qu'on parle.

## Checklist export Canva

- [ ] Format : 16:9 présentation (1920×1080)
- [ ] Palette : bleu marine \`#1E2957\` + rose nude \`#F5D5CB\`
- [ ] Logo NAIOM en pied de chaque slide
- [ ] Police titre : sans-serif géométrique (à valider)
- [ ] Export final : PDF + PNG par slide

## Hypothèses

- Slide 6 utilise le témoignage Warburg.ai — attribution en clair, pas de maquillage
- Durée totale estimée : 12 minutes à l'oral (hors Q&A)
- Format présentation live, pas auto-play`,

  gmail: `# To-do du 20 avril 2026

## 🔴 Urgent (sous 4h)

- **Sacha Navette (Warburg.ai)** — Bug Davide ce matin : 12 messages LinkedIn envoyés avec l'ancien template. Appel client critique à 14h. **→ Action : call Sacha avant 12h, fix workflow n8n v1 qui tournait en parallèle.**

## 🟠 Important (sous 24h)

- **Julie Lefort (Agence Lefort)** — Prospect chaud, 45 personnes, budget 5-8k€. A vu le post Davide. **→ Action : répondre avec 3 créneaux cette semaine + envoyer deck Davide version immo.**
- **Sophia Makri (Agence SLM)** — Demande de décalage de call jeudi (enfant malade). **→ Action : proposer 2 créneaux semaine prochaine.**
- **Maxim** — Review deck masterclass v3 (slides 12-18 + nouveau slide pricing). **→ Action : bloquer 45 min ce week-end.**

## 🟢 À lire (info)

- **Baptiste Legue (Piscineôpropre)** — Feedback 3 mois Alex (positif, demande 2 évolutions). Pas urgent mais répondre avant vendredi.
- **Thomas Vuillemin (VCM Conseil)** — Demande tarifs Sophia pour cabinet de 25 personnes. Maxim est sur le dossier.
- **Hichem Bouazi (LuxArabia)** — Écart sur facture retainer avril. Pas urgent, mercredi.

## ⚫ À archiver / ignorer

- **URSSAF** — Rappel déclaration T1 avant 30/04 (mettre un rappel agenda, archiver).
- **LinkedIn** — Stats hebdo (info, pas d'action).
- **The Neuron** — Newsletter (lecture week-end).

## Résumé exécutif

- **1 urgence client** (Warburg) qui doit être réglée avant midi
- **2 prospects chauds** à relancer aujourd'hui (Lefort, Vuillemin)
- **3 actions équipe** avec Maxim
- **1 client existant** à rassurer (Sophia) et **1 à écouter** (Baptiste)

## Hypothèses

- Ordre des urgences basé sur l'impact business + la temporalité explicite dans les emails
- Les newsletters sont archivées par défaut, pas supprimées`,

  fireflies: `# Résumé des calls — Semaine du 14 au 20 avril 2026

## Vue d'ensemble

- **5 calls** ce cycle (3 externes, 2 internes)
- **1 closing** (LeLaboStore, 6.5k€ setup + retainer 900€/mois)
- **2 prospects chauds** à relancer (Lefort, Vuillemin)
- **1 incident client résolu** (Warburg.ai)

## Calls à action immédiate

### 🟢 Call-001 — Julie Lefort (Agence Lefort) — **probabilité closing : FORTE**

**Contexte** : Agence immobilière Lyon, 45 personnes, CA 8M€. Besoin Davide pour qualification de leads. Budget 5-8k€ setup + 1k€/mois retainer. Décision dans 2 semaines.

**Plan d'action équipe** :

| Action | Responsable | Échéance | Priorité |
|---|---|---|---|
| Envoyer pitch deck adapté immobilier | Zeyneb | Vendredi 24/04 | 🔴 |
| Chiffrage 3 scénarios | Maxim | Lundi 27/04 | 🔴 |
| Démo live avec DSI Alex Brun | Zeyneb + Maxim | 28/04 à 10h | 🟠 |

**Relance suggérée** : message LinkedIn vendredi 24/04 en envoyant le deck, mentionner le DSI Alex Brun.

### 🟢 Call-002 — Thomas Vuillemin (VCM Conseil) — **probabilité closing : FORTE**

**Contexte** : Cabinet B2B 25 personnes. Intéressé par Sophia (AI Executive Assistant) pour toute l'équipe. Amélie (RH) très engagée. Budget annuel évoqué : ~15k€ "tech productivité".

**Plan d'action équipe** :

| Action | Responsable | Échéance | Priorité |
|---|---|---|---|
| Devis avec option formation (workshops + playbooks) | Maxim | 22/04 | 🔴 |
| Confirmer Sophia fonctionne en n8n on-premise | Zeyneb | 22/04 | 🔴 |
| Relancer si pas de retour | Maxim | 28/04 | 🟠 |

### 🟡 Call-003 — Sacha Navette (Warburg.ai) — **incident résolu, relation à renforcer**

**Contexte** : Bug Davide ce matin (12 messages avec ancien template). Root cause : workflow v1 non désactivé. Fix pendant le call.

**Plan d'action équipe** :

| Action | Responsable | Échéance | Priorité |
|---|---|---|---|
| Documenter process change management | Zeyneb | 27/04 | 🔴 |
| Geste commercial (1 mois offert sur mai) | Maxim | Aujourd'hui | 🟠 |
| Ajouter alerting automatique sur déploiements | Zeyneb | Cette semaine | 🟠 |

## Calls informatifs (pas d'action urgente)

- **Call-004 — Samuel Redondo (LeLaboStore)** : signé, kick-off 27/04. Contrat envoyé.
- **Call-005 — 1:1 interne Zeyneb/Maxim** : décision acte = pas de nouveau client avant fin avril (focus plateforme).

## Score BANT synthétique des prospects actifs

| Prospect | Budget | Authority | Need | Timeline | Proba |
|---|---|---|---|---|---|
| Agence Lefort | ✅ | ✅ | ✅ | ⚠ 2 sem | FORTE |
| VCM Conseil | ? | ✅ | ✅ | ✅ | FORTE |

## Hypothèses

- Les montants cités viennent des transcriptions Fireflies, pas d'estimation externe
- Probabilités de closing basées sur signaux BANT + sentiment du call, à confirmer après relances`,

  cv: `# Ranking candidatures — AI Engineer (n8n + LLM Ops)

**Poste** : AI Engineer mid-senior · **Range salarial interne** : 55-70k€ · **Localisation** : Paris (hybride 2j/sem)
**Candidats analysés** : 3

## Podium

| # | Candidat | Fit global | Décision suggérée |
|---|---|---|---|
| 1 | **Léo Vermeersch** | 82/100 | 🟢 Entretien technique prioritaire |
| 2 | **Alexandre Mercier** | 68/100 | 🟠 À creuser (mismatch culturel) |
| 3 | **Camille Durand** | 54/100 | 🔴 Refus respectueux (sous-qualifié) |

## Détail par candidat

### 1. Léo Vermeersch — 82/100 🟢

**Forces**
- 4 ans d'XP Doctolib : a livré un système RAG en production, usage interne.
- Active contribution open-source n8n (forks, PR mergées) — aligné avec notre stack core.
- Contenu technique (blog, talks) = bon pour le rayonnement NAIOM.
- Prétention salariale (65k€ sur 4j/sem) = **dans la range**.

**Réserves**
- Pas d'XP à très fort volume (>1k req/j) — mais on est plus orientés valeur que volume chez NAIOM.
- Demande 4j/semaine — à discuter (politique équipe actuelle : 5j).

**Recommandation** : entretien technique avec Zeyneb semaine du 27/04. Prévoir exercice n8n + RAG en live-coding. Si le 4j/sem est bloquant pour nous, le dire tôt.

### 2. Alexandre Mercier — 68/100 🟠

**Forces**
- 8 ans d'XP, 2 systèmes LLM en prod chez des clients sérieux.
- Active sur Hugging Face (~200 stars).
- Disponible immédiatement.

**Réserves**
- Demande 85k€ — **15 k€ au-dessus** de notre range.
- Veut 100 % remote — **incompatible** avec notre culture hybride (2j Paris).
- Profil très senior : risque de s'ennuyer sur des cas PME.

**Recommandation** : appel découverte 30 min avec Maxim pour tester la flexibilité (salaire + remote). Si les deux sont bloquants : refus poli avec mise en réserve pour un futur poste senior.

### 3. Camille Durand — 54/100 🔴

**Forces**
- Diplôme Télécom Paris 2024, pipeline data robuste à ManoMano.
- Anglais courant, ouverture internationale.

**Réserves**
- **2 ans d'XP seulement**, profil plus data engineer que LLM engineer.
- Pas de background n8n.
- Usage OpenAI API "débutant" — pas le niveau pour le poste.

**Recommandation** : refus respectueux. Profil solide mais sous-qualifié pour CE poste. Garder dans le pipeline pour un futur poste junior si la boîte grandit.

---

## Brouillons emails prêts à envoyer

### Email pour Léo (invitation entretien)

**Objet** : Entretien technique NAIOM — créneau semaine du 27/04 ?

> Bonjour Léo,
>
> Merci pour votre candidature — votre parcours à Doctolib et vos contributions n8n nous intéressent beaucoup.
>
> Nous aimerions organiser un entretien technique d'environ 90 minutes avec moi (live-coding léger + discussion architecture).
>
> Quels créneaux vous conviennent la semaine du 27 avril ?
>
> À bientôt,
> Zeyneb

### Email pour Camille (refus respectueux)

**Objet** : Candidature NAIOM — suite

> Bonjour Camille,
>
> Merci pour votre candidature au poste d'AI Engineer. Votre parcours à Télécom Paris et votre travail chez ManoMano sont solides.
>
> Pour ce poste précis, nous cherchons quelqu'un avec une expérience plus avancée en LLM Ops et en orchestration n8n. Nous ne pourrons donc pas donner suite cette fois.
>
> Je reste attentive à votre parcours — n'hésitez pas à revenir vers nous dans 12-18 mois, ou si un poste plus junior s'ouvre chez nous.
>
> Bonne continuation,
> Zeyneb

## Hypothèses

- Ranking construit sur la fiche de poste "AI Engineer (n8n + LLM Ops)" — adapter les scores si la fiche évolue
- Le refus pour Alexandre est conditionnel : dépend de son appétence à flexer salaire + remote
- Pas encore fait le ranking du poste Account Executive (Sami / Margaux) — lancez-moi si vous voulez`,
};

// ------------------------- DÉTECTION D'INTENTION (très simple) -------------------------

function extractLastUserText(messages: UIMessage[] | undefined): string {
  if (!messages) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const text = m.parts
      .map((p) =>
        p.type === "text" && "text" in p && typeof p.text === "string" ? p.text : ""
      )
      .join("");
    if (text) return text;
  }
  return "";
}

// ------------------------- SSE BUILDER -------------------------

function textToChunks(text: string): string[] {
  const chunks: string[] = [];
  const words = text.split(/(\s+)/);
  let buf = "";
  for (const w of words) {
    buf += w;
    if (buf.length > 8) {
      chunks.push(buf);
      buf = "";
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

export function buildMockResponse(agentSlug: string, messages?: UIMessage[]): Response {
  const userText = extractLastUserText(messages).toLowerCase();
  const reply = DEFAULT_REPLIES[agentSlug] ?? "Livrable de démonstration non configuré pour cet agent.";
  // On pourrait raffiner : si userText contient "gmail" et agent = orchestrateur, router différemment.
  // Pour l'instant on reste simple : chaque agent a une réponse livrable pré-écrite.

  const chunks = textToChunks(reply);
  const messageId = `msg-mock-${Date.now()}`;
  const encoder = new TextEncoder();
  const events: string[] = [
    `data: ${JSON.stringify({ type: "start", messageId })}\n\n`,
    `data: ${JSON.stringify({ type: "start-step" })}\n\n`,
    `data: ${JSON.stringify({ type: "text-start", id: "text-0" })}\n\n`,
    ...chunks.map(
      (c) =>
        `data: ${JSON.stringify({ type: "text-delta", id: "text-0", delta: c })}\n\n`
    ),
    `data: ${JSON.stringify({ type: "text-end", id: "text-0" })}\n\n`,
    `data: ${JSON.stringify({ type: "finish-step" })}\n\n`,
    `data: ${JSON.stringify({ type: "finish" })}\n\n`,
    `data: [DONE]\n\n`,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const e of events) {
        controller.enqueue(encoder.encode(e));
        // Streaming plus rapide que l'original pour que les livrables longs s'affichent vite
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });

  // Logged to avoid unused-parameter lint
  void userText;

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}

export { simulateReadableStream };
