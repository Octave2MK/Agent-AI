export type AgentSlug =
  | "orchestrateur"
  | "strategiste"
  | "createur-contenu"
  | "designer"
  | "analyste"
  | "presentateur"
  | "gmail"
  | "fireflies"
  | "proposition"
  | "cv"
  | "ecommerce"
  | "prospection"
  | "veille"
  | "comptabilite";

export type AgentStatus = "active" | "coming-soon" | "locked";

export interface AgentMeta {
  slug: AgentSlug;
  name: string; // prénom de l'agent (ex. "Antoine")
  role: string; // fonction (ex. "Stratège", "Designer")
  tagline: string; // description courte
  model: string;
  tools: string[];
  status: AgentStatus;
  accent: "marine" | "nude" | "muted";
  icon: string; // nom d'icône lucide
  systemPrompt: string;
  deliverableFolder?: string; // dossier racine relatif (ex. "briefs")
}

export interface Deliverable {
  slug: string; // nom de fichier sans extension
  filename: string;
  title: string; // premier H1 ou nom fichier
  folder: string;
  absolutePath: string;
  bytes: number;
  modifiedAt: string; // ISO
  frontmatter: Record<string, unknown>;
}

export interface CalendarSlot {
  day: string; // "Lundi 20 avr."
  channel: "LinkedIn" | "Instagram" | "YouTube" | "Email";
  time: string; // "07:45"
  title: string;
  author: string; // Zeyneb, Maxim, Page Nonvi-Efa
  status: "programmé" | "brouillon" | "publié";
  deliverableRef?: string; // filename dans content/
}
