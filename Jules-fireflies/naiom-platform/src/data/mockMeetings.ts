export interface MockMeeting {
  id: string;
  title: string;
  date: string; // ISO
  durationMin: number;
  participants: string[];
  type: "discovery" | "demo" | "closing" | "client-ops" | "interne";
  summary: string; // résumé pré-existant (issu de Fireflies)
  keyPoints: string[];
  actionItems: string[];
  sentiment: "positive" | "neutral" | "negative";
  transcript: string; // extrait
}

export const MOCK_MEETINGS: MockMeeting[] = [
  {
    id: "call-001",
    title: "Discovery — Camille Estève (Novaro Immobilier)",
    date: "2026-09-04T14:00:00+02:00",
    durationMin: 41,
    participants: ["Camille Roy", "Sam Petit", "Camille Estève"],
    type: "discovery",
    sentiment: "positive",
    summary:
      "Camille dirige Novaro Immobilier, agence de 38 personnes (résidentiel + neuf), 3 agences en Île-de-France. Sature sur la qualification des leads entrants (portail web, SeLoger, Leboncoin) et la relance des mandats dormants. Budget évoqué : 5-8k€ de setup + ~1k€/mois. Très intéressée par un agent de qualification 24/7.",
    keyPoints: [
      "38 collaborateurs, 3 agences, ~200 leads entrants/semaine",
      "Seulement ~35% des leads sont rappelés dans les 24h",
      "Relance des mandats dormants faite 'quand on a le temps' = jamais",
      "Pas d'outil de scoring, tout est trié à la main dans Outlook",
      "Décision visée sous 3 semaines, sponsor : la directrice commerciale",
    ],
    actionItems: [
      "Camille : envoyer un pitch adapté immobilier avant le 09/09",
      "Sam : chiffrer 3 scénarios (qualification / + relance mandats / sur-mesure)",
      "Planifier une démo live la semaine du 15/09",
    ],
    transcript:
      "Camille : 'On reçoit environ 200 demandes par semaine et on en rappelle à peine un tiers dans les temps. Le reste part à la concurrence.' / Camille : 'Un agent peut qualifier chaque lead en continu selon vos critères et pré-remplir la fiche, vos négociateurs ne traitent que le chaud.' / Camille : 'Et pour les mandats qu'on a laissés dormir ?' / Sam : 'On automatise une séquence de relance intelligente, avec validation avant chaque envoi sensible.'",
  },
  {
    id: "call-002",
    title: "Discovery — Rayan Mokhtari (Studio Pixel & Cie, agence marketing)",
    date: "2026-09-05T10:30:00+02:00",
    durationMin: 47,
    participants: ["Camille Roy", "Rayan Mokhtari"],
    type: "discovery",
    sentiment: "positive",
    summary:
      "Rayan est cofondateur de Studio Pixel & Cie, agence marketing/social de 16 personnes (12 clients en régie). Ils perdent un temps fou sur le reporting client mensuel et la production de contenu. Cherchent à automatiser le reporting multi-plateformes et une partie de la veille créative. Enveloppe évoquée : ~10k€ setup.",
    keyPoints: [
      "16 personnes, 12 comptes clients en gestion",
      "Reporting mensuel = 2 jours/mois par account, fait à la main sur Slides",
      "Veille tendances éparpillée, pas de process",
      "Veulent garder la 'patte créative' humaine — automatiser le pénible seulement",
      "Sensibles au fait de ne pas être dépendants d'un prestataire",
    ],
    actionItems: [
      "Sam : proposer un devis reporting automatisé (connecteurs Meta/LinkedIn/TikTok → deck)",
      "Camille : préparer un exemple de rapport client généré automatiquement",
      "Relancer Rayan avant le 12/09",
    ],
    transcript:
      "Rayan : 'Chaque fin de mois c'est l'enfer, mes account managers passent deux jours à copier-coller des chiffres dans des slides.' / Camille : 'On branche vos plateformes, l'agent consolide et génère le rapport de marque, ils n'ont plus qu'à ajouter l'analyse.' / Rayan : 'Ça, si ça marche, ça me rend deux jours par personne par mois.'",
  },
  {
    id: "call-003",
    title: "Demo — Léa Fontaine (Maison Vireo, e-commerce cosmétique)",
    date: "2026-09-03T16:00:00+02:00",
    durationMin: 52,
    participants: ["Camille Roy", "Sam Petit", "Léa Fontaine"],
    type: "demo",
    sentiment: "positive",
    summary:
      "Démo pour Maison Vireo, marque DTC de cosmétique (Shopify, ~3 000 commandes/mois). Douleurs : SAV saturé (retours, suivi commande), relance panier abandonné basique, manque de contenu UGC. Léa (fondatrice) très emballée par un agent SAV + un pipeline de contenu. Budget non figé mais 'prête à investir si le ROI est clair'.",
    keyPoints: [
      "~3 000 commandes/mois, 2 personnes au SAV débordées",
      "60% des tickets = 'où est ma commande' et retours",
      "Relance panier = 1 email générique, taux de récupération faible",
      "Veut du contenu UGC régulier sans tourner elle-même",
      "Stack : Shopify, Gorgias, Klaviyo",
    ],
    actionItems: [
      "Sam : devis agent SAV (Shopify + Gorgias) + séquence de récupération panier",
      "Camille : montrer un exemple de vidéo UGC générée pour un produit",
      "Envoyer étude de cas e-commerce avant le 10/09",
    ],
    transcript:
      "Léa : 'Mes deux personnes au SAV répondent 100 fois par jour à 'où est mon colis'. C'est du gâchis.' / Camille : 'Un agent branché sur Shopify et Gorgias répond instantanément à ces demandes et n'escalade que les cas complexes.' / Léa : 'Et pour le contenu, je peux pas tourner une vidéo par jour.' / Sam : 'On te met en place un pipeline de créatives produit à la chaîne.'",
  },
  {
    id: "call-004",
    title: "Demo — Hugo Delaunay (Cabinet Delaunay & Associés, expertise comptable)",
    date: "2026-09-02T09:30:00+02:00",
    durationMin: 49,
    participants: ["Camille Roy", "Hugo Delaunay", "Farida Benali (office manager)"],
    type: "demo",
    sentiment: "neutral",
    summary:
      "Cabinet d'expertise comptable, 22 collaborateurs, ~400 clients TPE/PME. Douleurs : collecte des pièces clients (relances manuelles infinies), tri/classement des documents reçus, réponses répétitives par email. Très prudents sur la confidentialité (données comptables). Argument n8n auto-hébergé important. Pas de budget annoncé.",
    keyPoints: [
      "22 collaborateurs, ~400 clients, pic de charge en période fiscale",
      "Relance des pièces manquantes = chronophage et mal vécu",
      "Documents reçus par email/WhatsApp, classés à la main",
      "Confidentialité = point bloquant, veulent de l'auto-hébergé",
      "Farida (office manager) sera l'utilisatrice clé",
    ],
    actionItems: [
      "Camille : confirmer déploiement n8n self-hosted + note confidentialité",
      "Sam : devis 'collecte + tri automatique des pièces' + relances intelligentes",
      "Relancer après leur clôture, semaine du 15/09",
    ],
    transcript:
      "Hugo : 'Nos collaborateurs passent leurs journées à relancer les clients pour des pièces. C'est usant et ça décale toutes les échéances.' / Camille : 'On automatise la relance personnalisée et le classement des documents dès réception, en auto-hébergé pour la confidentialité.' / Hugo : 'La confidentialité, c'est non négociable pour nous.'",
  },
  {
    id: "call-005",
    title: "Discovery — Sarah Belkacem (Académie Momentum, organisme de formation)",
    date: "2026-09-01T11:00:00+02:00",
    durationMin: 38,
    participants: ["Sam Petit", "Sarah Belkacem"],
    type: "discovery",
    sentiment: "positive",
    summary:
      "Académie Momentum, organisme de formation en ligne (~1 200 apprenants actifs). Douleurs : support apprenant répétitif, onboarding manuel, relance des inscrits inactifs (churn). Sarah cherche un agent support + une séquence de réengagement. Budget ~4-6k€ setup.",
    keyPoints: [
      "~1 200 apprenants actifs, 4 formations, 1 personne au support",
      "80% des questions support sont récurrentes (accès, planning, certif)",
      "40% des inscrits décrochent avant la fin — aucune relance auto",
      "Onboarding fait à la main à chaque nouvelle cohorte",
      "Stack : Systeme.io + Slack communauté",
    ],
    actionItems: [
      "Sam : devis agent support formation + séquence de réengagement",
      "Camille : maquette d'un parcours d'onboarding automatisé",
      "Envoyer proposition avant le 08/09",
    ],
    transcript:
      "Sarah : 'J'ai 40% de mes apprenants qui décrochent et je n'ai personne pour les relancer un par un.' / Sam : 'On met en place une séquence de réengagement déclenchée sur l'inactivité, personnalisée selon leur avancement.' / Sarah : 'Et le support ? Ma seule personne est noyée sous les mêmes questions.' / Sam : 'Un agent répond aux récurrentes 24/7 et n'escalade que le reste.'",
  },
  {
    id: "call-006",
    title: "Demo — Damien Roussel (Kairos Software, SaaS B2B)",
    date: "2026-08-29T15:00:00+02:00",
    durationMin: 44,
    participants: ["Camille Roy", "Damien Roussel"],
    type: "demo",
    sentiment: "positive",
    summary:
      "Kairos Software, SaaS B2B (gestion de planning pour PME), ~600 clients payants. Douleurs : support N1 saturé, onboarding self-service faible (churn early-life), pas de détection des signaux de churn. Damien (CEO) veut un agent support branché sur leur base de connaissances + un scoring de churn. Enveloppe ~8-12k€.",
    keyPoints: [
      "~600 clients payants, équipe support de 2 personnes",
      "Onboarding self-service : 30% n'activent jamais la fonctionnalité clé",
      "Support N1 = 70% de questions déjà documentées",
      "Aucune détection proactive du churn",
      "Stack : Intercom, HubSpot, base Notion",
    ],
    actionItems: [
      "Camille : devis agent support (Intercom + base Notion) + scoring churn",
      "Sam : préparer un exemple de playbook de réactivation client",
      "Relancer Damien avant le 05/09",
    ],
    transcript:
      "Damien : 'Mon support répond en boucle aux mêmes questions, et je découvre les churns quand le client est déjà parti.' / Camille : 'On branche un agent sur votre base pour absorber le N1, et on met un scoring qui alerte vos CSM avant que le client décroche.' / Damien : 'Si je réduis le churn de 2 points, ça paie l'outil dix fois.'",
  },
  {
    id: "call-007",
    title: "1:1 interne — Camille / Sam (weekly)",
    date: "2026-09-05T09:00:00+02:00",
    durationMin: 30,
    participants: ["Camille Roy", "Sam Petit"],
    type: "interne",
    sentiment: "neutral",
    summary:
      "Weekly 1:1. Point pipeline, priorisation des propositions à envoyer, préparation contenus. Décision : envoyer les propales Novaro et Maison Vireo en priorité cette semaine.",
    keyPoints: [
      "Pipeline : 6 prospects actifs, 3 chauds (Novaro, Maison Vireo, Kairos)",
      "Prioriser l'envoi des propositions Novaro + Maison Vireo",
      "Cabinet Delaunay : attendre la fin de leur clôture pour relancer",
      "Préparer 2 études de cas (immobilier + e-commerce)",
    ],
    actionItems: [
      "Sam : finaliser les chiffrages Novaro et Maison Vireo",
      "Camille : préparer les études de cas immobilier + e-commerce",
      "Ensemble : revue des propositions vendredi",
    ],
    transcript: "",
  },
];

export function renderMeetingsForPrompt(): string {
  return MOCK_MEETINGS.map(
    (m) =>
      `### Call ${m.id} — ${m.title}
- Date : ${m.date} (${m.durationMin} min)
- Type : ${m.type} · Sentiment : ${m.sentiment}
- Participants : ${m.participants.join(", ")}

**Résumé :** ${m.summary}

**Points clés :**
${m.keyPoints.map((k) => `  - ${k}`).join("\n")}

**Action items existants :**
${m.actionItems.map((a) => `  - ${a}`).join("\n")}

**Extrait transcription :** ${m.transcript || "(pas d'extrait disponible)"}`
  ).join("\n\n");
}
