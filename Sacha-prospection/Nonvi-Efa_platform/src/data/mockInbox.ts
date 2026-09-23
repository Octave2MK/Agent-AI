export interface MockEmail {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  receivedAt: string; // ISO
  preview: string;
  body: string;
  category: "client" | "prospect" | "equipe" | "admin" | "newsletter";
  urgency: "high" | "medium" | "low";
  requiresReply: boolean;
  starred?: boolean;
}

// Mock inbox Nonvi-Efa — cohérent avec le business Davide/Lina/Alex etc.
export const MOCK_INBOX: MockEmail[] = [
  {
    id: "m1",
    from: "Sacha Navette",
    fromEmail: "sacha@warburg.ai",
    subject: "URGENT — bug sur Davide ce matin",
    receivedAt: "2026-04-20T07:18:00+02:00",
    preview: "Davide a envoyé 12 messages LinkedIn avec le mauvais template ce matin. Nos prospects vont halluciner...",
    body: "Salut Melyssa, grosse alerte. Davide a envoyé 12 messages LinkedIn ce matin avec le template de mars (celui qu'on avait décidé de remplacer). 3 prospects ont déjà répondu en mode 'c'est quoi ce délire ?'. J'ai mis le workflow n8n en pause. Peux-tu regarder d'urgence ? On a un call client critique à 14h. Merci. Sacha",
    category: "client",
    urgency: "high",
    requiresReply: true,
    starred: true,
  },
  {
    id: "m2",
    from: "Julie Lefort",
    fromEmail: "jlefort@agencelefort.fr",
    subject: "Intéressée par vos agents IA — demande de RDV",
    receivedAt: "2026-04-20T09:42:00+02:00",
    preview: "Bonjour Melyssa, j'ai vu votre post LinkedIn sur Davide, ça m'intéresse énormément pour notre agence...",
    body: "Bonjour Melyssa, j'ai vu votre post LinkedIn ce matin sur Davide et ça m'intéresse énormément. Je dirige une agence immo de 45 personnes sur Lyon. On perd un temps fou sur la prospection froide. Budget envisagé : 5-8k€ setup + retainer. Pourriez-vous me proposer un créneau cette semaine ? Cordialement, Julie Lefort — Agence Lefort.",
    category: "prospect",
    urgency: "high",
    requiresReply: true,
  },
  {
    id: "m3",
    from: "Maxim Delavoet",
    fromEmail: "maxim@Nonvi-Efaagency.com",
    subject: "Deck masterclass — review avant lundi ?",
    receivedAt: "2026-04-20T08:05:00+02:00",
    preview: "Hello Zey, j'ai pushé la v3 du deck masterclass. Peux-tu passer dessus ce week-end ? Focus sur...",
    body: "Hello Zey, j'ai pushé la v3 du deck masterclass dans le Drive. Peux-tu passer dessus ce week-end ? Focus sur les slides 12-18 (démos Davide). J'ai aussi ajouté un slide pricing que je veux qu'on discute ensemble lundi 10h. Maxim",
    category: "equipe",
    urgency: "medium",
    requiresReply: true,
  },
  {
    id: "m4",
    from: "Baptiste Legue",
    fromEmail: "baptiste@piscineopropre.fr",
    subject: "Feedback Alex — 3 mois d'usage",
    receivedAt: "2026-04-19T18:22:00+02:00",
    preview: "Hello Melyssa, ça fait 3 mois qu'Alex tourne sur notre support. Quelques retours + demandes d'évolution...",
    body: "Hello Melyssa, ça fait 3 mois qu'Alex tourne sur notre support client. Globalement très satisfait : -42% de tickets humains, temps de réponse divisé par 4. Deux demandes d'évolution : (1) Alex pourrait-il qualifier les demandes SAV vs commerciales pour mieux router ? (2) On aimerait des rapports hebdo automatiques. On peut faire un call cette semaine ? Bien à toi, Baptiste",
    category: "client",
    urgency: "medium",
    requiresReply: true,
  },
  {
    id: "m5",
    from: "Thomas Vuillemin",
    fromEmail: "thomas@vcm-conseil.com",
    subject: "Suite à la masterclass — j'aurais une question",
    receivedAt: "2026-04-19T20:35:00+02:00",
    preview: "Bonjour, j'ai suivi votre masterclass de décembre, je suis dirigeant d'un cabinet de conseil B2B...",
    body: "Bonjour Melyssa, j'ai suivi votre masterclass de décembre 2025 et j'ai enfin pris le temps de réfléchir à un projet concret. Je dirige un cabinet de conseil B2B de 25 personnes. Ma priorité : mettre en place Sophia (assistant exécutif) pour toute l'équipe. Quels sont vos tarifs et délais actuels ? Cordialement, Thomas",
    category: "prospect",
    urgency: "medium",
    requiresReply: true,
  },
  {
    id: "m6",
    from: "URSSAF",
    fromEmail: "noreply@urssaf.fr",
    subject: "Rappel — déclaration trimestrielle à faire avant le 30/04",
    receivedAt: "2026-04-19T11:15:00+02:00",
    preview: "Bonjour, nous vous rappelons que votre déclaration trimestrielle doit être effectuée avant le 30 avril 2026...",
    body: "Bonjour, rappel automatique : déclaration trimestrielle T1 2026 à effectuer avant le 30 avril. Connectez-vous à votre espace...",
    category: "admin",
    urgency: "medium",
    requiresReply: false,
  },
  {
    id: "m7",
    from: "LinkedIn",
    fromEmail: "noreply@linkedin.com",
    subject: "Vous avez 47 nouvelles vues sur votre profil cette semaine",
    receivedAt: "2026-04-19T08:00:00+02:00",
    preview: "Votre post sur Davide a dépassé les 12 000 vues — voici comment en tirer parti...",
    body: "Hi Melyssa, your post about Davide reached 12 400 impressions this week (+340% vs average). 47 profile views, 8 connection requests pending...",
    category: "newsletter",
    urgency: "low",
    requiresReply: false,
  },
  {
    id: "m8",
    from: "Hichem Bouazi",
    fromEmail: "hichem@luxarabia.com",
    subject: "Question facture — écart sur retainer d'avril",
    receivedAt: "2026-04-18T16:45:00+02:00",
    preview: "Salut Melyssa, j'ai une question sur la facture de retainer — le montant me semble plus haut qu'attendu...",
    body: "Salut Melyssa, j'ai une question sur la facture de retainer d'avril — le montant me semble plus haut que ce qu'on avait convenu. Peux-tu vérifier ? Pas urgent, je peux attendre jusqu'à mercredi. Hichem",
    category: "client",
    urgency: "low",
    requiresReply: true,
  },
  {
    id: "m9",
    from: "The Neuron",
    fromEmail: "hello@theneuron.ai",
    subject: "🧠 Weekly AI digest — April 20",
    receivedAt: "2026-04-20T06:00:00+02:00",
    preview: "Top stories: Google launches Gemini 3.0, Anthropic's new memory system, OpenAI Sora 2...",
    body: "Top stories this week...",
    category: "newsletter",
    urgency: "low",
    requiresReply: false,
  },
  {
    id: "m10",
    from: "Sophia Makri",
    fromEmail: "sophia@agenceslm.com",
    subject: "On peut bouger notre call de jeudi ?",
    receivedAt: "2026-04-20T10:12:00+02:00",
    preview: "Hello Melyssa, désolée pour le délai — je dois décaler notre call jeudi, mon fils est malade...",
    body: "Hello Melyssa, désolée pour le délai — je dois décaler notre call de jeudi 10h, mon fils est malade. Peux-tu me proposer un autre créneau la semaine prochaine ? Sophia",
    category: "client",
    urgency: "medium",
    requiresReply: true,
  },
];

export function renderInboxForPrompt(): string {
  return MOCK_INBOX.map(
    (e) =>
      `### Email ${e.id} — ${e.urgency.toUpperCase()} ${e.requiresReply ? "[à répondre]" : ""}
- De : ${e.from} <${e.fromEmail}>
- Reçu : ${e.receivedAt}
- Sujet : ${e.subject}
- Catégorie : ${e.category}
- Corps : ${e.body}`
  ).join("\n\n");
}
