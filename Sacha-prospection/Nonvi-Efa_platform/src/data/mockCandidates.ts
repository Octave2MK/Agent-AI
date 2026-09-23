export interface MockJobPosting {
  id: string;
  title: string;
  seniority: "junior" | "mid" | "senior";
  skills: string[];
  location: string;
  salaryRange: string;
}

export interface MockCandidate {
  id: string;
  fullName: string;
  email: string; // pour envoi de réponse automatique
  appliedFor: string; // id du poste
  receivedAt: string; // ISO
  yearsXp: number;
  currentCompany: string;
  currentRole: string;
  skills: string[];
  highlights: string[];
  redFlags: string[];
  salaryExpectation: string;
  availability: string;
  cvSummary: string;
}

export const MOCK_JOBS: MockJobPosting[] = [
  {
    id: "job-ai-eng",
    title: "AI Engineer (n8n + LLM Ops)",
    seniority: "mid",
    skills: ["n8n", "Python", "LLM APIs (OpenAI/Anthropic)", "prompt engineering", "RAG", "TypeScript"],
    location: "Paris (hybride, 2j/semaine)",
    salaryRange: "55-70k€",
  },
  {
    id: "job-account",
    title: "Account Executive B2B",
    seniority: "senior",
    skills: ["outbound B2B", "tech/SaaS sales", "closing mid-market", "HubSpot ou Pipedrive"],
    location: "Paris (full remote OK)",
    salaryRange: "65-85k€ (fixe + variable)",
  },
];

export const MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: "c-001",
    fullName: "Léo Vermeersch",
    email: "leo.vermeersch.test@Nonvi-Efaagency.com",
    appliedFor: "job-ai-eng",
    receivedAt: "2026-04-18T09:12:00+02:00",
    yearsXp: 4,
    currentCompany: "Doctolib",
    currentRole: "Senior Software Engineer",
    skills: ["Python", "TypeScript", "LangChain", "RAG", "OpenAI", "AWS", "n8n (notions)"],
    highlights: [
      "A bâti un système RAG interne chez Doctolib (support agents)",
      "Contribue à un projet open-source n8n-nodes (forks + PR mergées)",
      "Contenu technique : blog perso + 2 talks Paris Dev",
    ],
    redFlags: [
      "Pas d'expérience en vraie prod LLM à fort volume (>1k req/j)",
      "Demande un passage à 4 jours / semaine",
    ],
    salaryExpectation: "65k€ fixe (4j/sem)",
    availability: "3 mois de préavis",
    cvSummary:
      "Ingénieur logiciel 4 ans d'XP, solide background Python/TS, familier des LLM. A construit un RAG interne. Très bon matching skills techniques, mais demande 4j/semaine.",
  },
  {
    id: "c-002",
    fullName: "Camille Durand",
    email: "camille.durand.test@Nonvi-Efaagency.com",
    appliedFor: "job-ai-eng",
    receivedAt: "2026-04-17T15:30:00+02:00",
    yearsXp: 2,
    currentCompany: "ManoMano",
    currentRole: "Data Engineer",
    skills: ["Python", "SQL avancé", "Airflow", "dbt", "GCP", "OpenAI API (débutante)"],
    highlights: [
      "Diplôme d'ingénieur (Télécom Paris, 2024)",
      "A construit le pipeline data de l'équipe marketing à ManoMano",
      "Anglais courant + stage de 6 mois à Berlin",
    ],
    redFlags: [
      "Peu d'expérience LLM / prompt engineering concret",
      "Pas de background n8n",
    ],
    salaryExpectation: "55k€",
    availability: "1 mois de préavis",
    cvSummary:
      "Profil data engineer junior solide, potentiel fort mais manque d'XP LLM. Serait plus à l'aise sur du data engineering classique que sur des agents IA en prod.",
  },
  {
    id: "c-003",
    fullName: "Alexandre Mercier",
    email: "alexandre.mercier.test@Nonvi-Efaagency.com",
    appliedFor: "job-ai-eng",
    receivedAt: "2026-04-16T11:45:00+02:00",
    yearsXp: 8,
    currentCompany: "Freelance",
    currentRole: "ML Engineer indépendant",
    skills: ["Python", "PyTorch", "TensorFlow", "LLM fine-tuning", "Hugging Face", "Docker/K8s", "n8n (2 ans)"],
    highlights: [
      "8 ans d'XP dont 3 en freelance (clients : Orange, BNP, startups IA)",
      "A déployé 2 systèmes LLM en prod (un pour un cabinet juridique, un pour une marketplace)",
      "Active sur Hugging Face (modèles publiés, ~200 stars)",
    ],
    redFlags: [
      "Demande 85k€ — au-dessus de notre range",
      "Veut 100% remote, notre culture est hybride",
    ],
    salaryExpectation: "85k€",
    availability: "Disponible immédiatement",
    cvSummary:
      "Profil très senior, overqualifié techniquement. Demande salariale 15k€ au-dessus et 100% remote. Excellent si on accepte les deux, sinon mismatch culturel.",
  },
  {
    id: "c-004",
    fullName: "Sami Benali",
    email: "sami.benali.test@Nonvi-Efaagency.com",
    appliedFor: "job-account",
    receivedAt: "2026-04-19T14:00:00+02:00",
    yearsXp: 6,
    currentCompany: "Lemlist",
    currentRole: "Senior Account Executive",
    skills: ["outbound B2B", "SaaS mid-market", "HubSpot", "closing 30-80k€", "scripts cold"],
    highlights: [
      "Top performer chez Lemlist (top 3 AE sur 12, 2 années consécutives)",
      "Quota atteint à 118% en 2025",
      "Réseau dense dans l'écosystème SaaS/IA FR",
      "Connaît Melyssa via LinkedIn (follower actif)",
    ],
    redFlags: [
      "Pas de réel track record sur des deals >80k€",
    ],
    salaryExpectation: "72k€ fixe + variable",
    availability: "2 mois de préavis",
    cvSummary:
      "Excellent matching pour Account Executive. Top performer actuel chez Lemlist, culture sales SaaS cohérente, déjà dans notre écosystème. Pricing OK.",
  },
  {
    id: "c-005",
    fullName: "Margaux Touffreau",
    email: "margaux.touffreau.test@Nonvi-Efaagency.com",
    appliedFor: "job-account",
    receivedAt: "2026-04-15T17:22:00+02:00",
    yearsXp: 9,
    currentCompany: "Salesforce",
    currentRole: "Enterprise Account Executive",
    skills: ["sales enterprise", "closing 200k€+", "SFDC (évidemment)", "équipes 50+"],
    highlights: [
      "9 ans à Salesforce, closing enterprise",
      "Club des 100% 3 années sur 5",
    ],
    redFlags: [
      "Profile enterprise (deals 200k€+) — mismatch avec notre sweet spot PME (5-30k€)",
      "Pourrait s'ennuyer sur des cycles courts",
      "Attente salariale probable autour de 100k€+",
    ],
    salaryExpectation: "95k€ fixe minimum",
    availability: "3 mois de préavis",
    cvSummary:
      "Profil enterprise, mismatch avec notre sweet spot mid-market / PME. Même si le CV est brillant, cycle de vente et volumes très différents de ce qu'on vend.",
  },
];

export function renderCandidatesForPrompt(): string {
  const jobs = MOCK_JOBS.map(
    (j) =>
      `### Poste ${j.id} — ${j.title} (${j.seniority})
- Skills requis : ${j.skills.join(", ")}
- Localisation : ${j.location}
- Range salarial : ${j.salaryRange}`
  ).join("\n\n");

  const candidates = MOCK_CANDIDATES.map((c) => {
    const job = MOCK_JOBS.find((j) => j.id === c.appliedFor);
    return `### Candidat ${c.id} — ${c.fullName}
- Postule pour : ${job?.title ?? c.appliedFor}
- Reçu : ${c.receivedAt}
- XP : ${c.yearsXp} ans · Actuel : ${c.currentRole} @ ${c.currentCompany}
- Skills : ${c.skills.join(", ")}
- Points forts : ${c.highlights.map((h) => `\n  - ${h}`).join("")}
- Points de vigilance : ${c.redFlags.map((r) => `\n  - ${r}`).join("")}
- Prétention salariale : ${c.salaryExpectation}
- Dispo : ${c.availability}
- Résumé : ${c.cvSummary}`;
  }).join("\n\n");

  return `## Postes ouverts\n\n${jobs}\n\n## Candidats reçus\n\n${candidates}`;
}
