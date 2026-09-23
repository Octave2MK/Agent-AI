/**
 * Clés/credentials nécessaires par agent, avec aide "où la trouver".
 * Sert à l'assistant de configuration in-app (pop-up 1er lancement).
 */
export interface KeySpec {
  name: string;
  label: string;
  required: boolean;
  help: string;
  url: string;
  placeholder: string;
  note?: string;
}

const ANTHROPIC: KeySpec = {
  name: "ANTHROPIC_API_KEY",
  label: "Clé Claude (Anthropic)",
  required: true,
  help: "Crée un compte, ouvre « API Keys » puis « Create Key ». La clé commence par sk-ant- et ne s'affiche qu'UNE fois — copie-la tout de suite.",
  url: "https://console.anthropic.com/settings/keys",
  placeholder: "sk-ant-...",
  note: "Indispensable — c'est le cerveau de ton agent.",
};

const APIFY: KeySpec = {
  name: "APIFY_TOKEN",
  label: "Token Apify (scraping)",
  required: true,
  help: "Crée un compte gratuit, va dans Settings → API & Integrations, et copie ton « Personal API token ».",
  url: "https://console.apify.com/settings/integrations",
  placeholder: "apify_api_...",
};

const FIREFLIES: KeySpec = {
  name: "FIREFLIES_API_KEY",
  label: "Clé Fireflies (calls)",
  required: false,
  help: "Ouvre Fireflies → Settings → Developer, et copie ta clé API. Optionnel : sans clé, l'agent tourne en mode démo avec des calls d'exemple.",
  url: "https://app.fireflies.ai/settings",
  placeholder: "votre-clé-fireflies",
  note: "Optionnel — mode démo activé par défaut.",
};

const AIRTABLE: KeySpec = {
  name: "AIRTABLE_TOKEN",
  label: "Token Airtable (factures/clients)",
  required: true,
  help: "Ouvre la page des tokens Airtable, crée un token avec les accès à ta base (scopes data.records:read/write), et copie-le.",
  url: "https://airtable.com/create/tokens",
  placeholder: "pat...",
};

const BY_AGENT: Record<string, KeySpec[]> = {
  prospection: [APIFY],
  veille: [APIFY],
  comptabilite: [AIRTABLE],
  fireflies: [FIREFLIES],
  proposition: [FIREFLIES],
  // gmail : OAuth Google (avancé) — géré dans l'app via bouton "Connecter Google"
  // ecommerce : connexion Arcads directement dans l'app
  // designer : Higgsfield en CLI (higgsfield auth login) — aucune clé .env
};

export function keysFor(slug: string | null): KeySpec[] {
  return [ANTHROPIC, ...(slug ? BY_AGENT[slug] ?? [] : [])];
}
