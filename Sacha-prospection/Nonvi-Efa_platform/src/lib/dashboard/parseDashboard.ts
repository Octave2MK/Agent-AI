/**
 * Parse un markdown d'agent Gmail/Fireflies en structure "dashboard" (liste
 * maître-détail de contacts/prospects). Format attendu :
 *
 *   ## [prospect] Jean Dupont — Acme Corp
 *   **Entreprise** : Acme Corp
 *   **Rôle** : CTO
 *   **Statut** : lead-chaud
 *   **Dernier contact** : 2026-04-18
 *   **Urgence** : haute
 *
 *   ### Calls
 *   - 2026-04-18 · 45 min · demo produit · Verdict : très intéressé
 *
 *   ### To-do
 *   - [ ] Envoyer devis avant 2026-04-25 | Maxim
 *   - [x] Envoyer case study
 *
 *   ### Relance
 *   **Quand** : 2026-04-23
 *   **Canal** : email
 *   **Message** :
 *   Bonjour Jean, suite à notre démo...
 *
 * Le tag `[contact]` est un alias de `[prospect]` (utilisé par Gmail).
 */

export type Urgency = "high" | "medium" | "low";

export interface DashboardTodo {
  text: string;
  done: boolean;
  assignee?: string;
  deadline?: string;
}

export interface DashboardSection {
  key: string; // slug normalisé : "calls" / "todo" / "relance" / "threads" / "draft"
  label: string; // libellé affiché tel quel (preserve l'accent)
  bullets: string[]; // bullets simples (non-checklist)
  todos: DashboardTodo[]; // items `- [ ]` / `- [x]`
  fields: Record<string, string>; // champs `**Clé** : valeur` dans la section
  body?: string; // texte libre restant (utile pour "Message" / "Draft")
}

export interface DashboardContact {
  id: string;
  name: string;
  company?: string;
  role?: string;
  status?: string;
  lastContact?: string;
  urgency?: Urgency;
  // autres champs bold capturés au niveau du bloc
  extraFields: Record<string, string>;
  sections: DashboardSection[];
}

export interface DashboardParsed {
  contacts: DashboardContact[];
  // texte avant le premier `## [prospect]` — intro / KPIs globaux
  intro?: string;
}

const TAG_RE = /^##\s+\[(prospect|contact)\]\s+(.+)$/i;
const FIELD_RE = /\*\*([^*]+?)\*\*\s*[:：]\s*(.+?)(?:\s*$|\n)/g;
const TODO_RE = /^-\s+\[([ xX])\]\s+(.+)$/;
const BULLET_RE = /^[-*•]\s+(.+)$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseUrgency(raw: string): Urgency | undefined {
  const v = raw.trim().toLowerCase();
  if (/(haute|high|urgent|critique|p0|p1|élevée|elevee)/.test(v)) return "high";
  if (/(moyenne|medium|normale|p2)/.test(v)) return "medium";
  if (/(basse|low|faible|p3|aucune)/.test(v)) return "low";
  return undefined;
}

function extractBoldFields(text: string): { fields: Record<string, string>; rest: string } {
  const fields: Record<string, string> = {};
  const lines = text.split("\n");
  const rest: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*\*\*([^*]+?)\*\*\s*[:：]\s*(.+?)\s*$/);
    if (m) {
      fields[m[1].trim()] = m[2].trim();
    } else {
      rest.push(line);
    }
  }
  return { fields, rest: rest.join("\n").trim() };
}

function parseSection(rawHeading: string, rawBody: string): DashboardSection {
  const label = rawHeading.trim();
  const key = slugify(label);
  const { fields, rest } = extractBoldFields(rawBody);
  const bullets: string[] = [];
  const todos: DashboardTodo[] = [];
  const bodyLines: string[] = [];

  for (const rawLine of rest.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      if (bodyLines.length || bullets.length || todos.length) bodyLines.push("");
      continue;
    }
    const todoMatch = line.match(TODO_RE);
    if (todoMatch) {
      const done = /x/i.test(todoMatch[1]);
      const raw = todoMatch[2].trim();
      // Format étendu : "Texte | assignee" ou "Texte | deadline: 2026-04-25" ou "Texte | Maxim"
      const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
      const text = parts[0] || raw;
      let assignee: string | undefined;
      let deadline: string | undefined;
      for (const p of parts.slice(1)) {
        const dMatch = p.match(/^(?:deadline|échéance|avant)\s*[:：]?\s*(.+)$/i);
        if (dMatch) deadline = dMatch[1].trim();
        else if (!assignee) assignee = p;
      }
      const embeddedDate = text.match(/\b(avant\s+)?\d{4}-\d{2}-\d{2}\b/);
      if (!deadline && embeddedDate) deadline = embeddedDate[0];
      todos.push({ text, done, assignee, deadline });
      continue;
    }
    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
      continue;
    }
    bodyLines.push(line);
  }

  const body = bodyLines.join("\n").trim() || undefined;

  return { key, label, bullets, todos, fields, body };
}

export function parseDashboardMarkdown(markdown: string): DashboardParsed {
  const lines = markdown.split("\n");
  const contacts: DashboardContact[] = [];
  let intro: string | undefined;
  let introLines: string[] = [];

  // Trouver toutes les positions des tags contact/prospect
  const tagPositions: { line: number; name: string }[] = [];
  lines.forEach((l, i) => {
    const m = l.match(TAG_RE);
    if (m) tagPositions.push({ line: i, name: m[2].trim() });
  });

  if (tagPositions.length === 0) {
    return { contacts: [], intro: markdown.trim() || undefined };
  }

  // Intro = tout ce qui est avant le 1er tag
  introLines = lines.slice(0, tagPositions[0].line);
  intro = introLines.join("\n").trim() || undefined;

  // Pour chaque tag, extraire le bloc jusqu'au prochain `## [` OU `# `
  for (let i = 0; i < tagPositions.length; i++) {
    const start = tagPositions[i].line + 1;
    const end = i + 1 < tagPositions.length ? tagPositions[i + 1].line : lines.length;
    const blockLines = lines.slice(start, end);
    const name = tagPositions[i].name;

    // Split du bloc en sous-sections `### ...`
    const sectionStarts: number[] = [];
    blockLines.forEach((l, idx) => {
      if (/^###\s+/.test(l)) sectionStarts.push(idx);
    });

    const headerRaw = sectionStarts.length
      ? blockLines.slice(0, sectionStarts[0]).join("\n")
      : blockLines.join("\n");
    const { fields, rest: remainingHeader } = extractBoldFields(headerRaw);

    const sections: DashboardSection[] = [];
    for (let j = 0; j < sectionStarts.length; j++) {
      const sStart = sectionStarts[j];
      const sEnd = j + 1 < sectionStarts.length ? sectionStarts[j + 1] : blockLines.length;
      const heading = blockLines[sStart].replace(/^###\s+/, "").trim();
      const body = blockLines.slice(sStart + 1, sEnd).join("\n");
      sections.push(parseSection(heading, body));
    }

    const company = fields["Entreprise"] || fields["Company"] || fields["Société"] || fields["Societe"];
    const role = fields["Rôle"] || fields["Role"] || fields["Poste"] || fields["Fonction"];
    const status = fields["Statut"] || fields["Status"] || fields["État"] || fields["Etat"];
    const lastContact =
      fields["Dernier contact"] || fields["Dernière interaction"] || fields["Last contact"];
    const urgencyRaw = fields["Urgence"] || fields["Urgency"] || fields["Priorité"] || fields["Priority"];
    const urgency = urgencyRaw ? parseUrgency(urgencyRaw) : undefined;

    // Retirer les champs déjà typés de extraFields
    const extraFields: Record<string, string> = { ...fields };
    for (const k of ["Entreprise", "Company", "Société", "Societe", "Rôle", "Role", "Poste", "Fonction",
      "Statut", "Status", "État", "Etat", "Dernier contact", "Dernière interaction", "Last contact",
      "Urgence", "Urgency", "Priorité", "Priority"]) {
      delete extraFields[k];
    }

    const id = slugify(name) || `contact-${i}`;
    contacts.push({
      id,
      name,
      company,
      role,
      status,
      lastContact,
      urgency,
      extraFields,
      sections,
    });

    // Trace pour aider à diagnostiquer si l'agent met du texte libre hors section
    if (remainingHeader.length > 0 && sections.length === 0) {
      contacts[contacts.length - 1].sections.push({
        key: "notes",
        label: "Notes",
        bullets: [],
        todos: [],
        fields: {},
        body: remainingHeader,
      });
    }
  }

  return { contacts, intro };
}

// Helpers utilisés par les panels pour afficher des compteurs
export function countOpenTodos(contact: DashboardContact): number {
  return contact.sections.reduce(
    (acc, s) => acc + s.todos.filter((t) => !t.done).length,
    0
  );
}

export function urgencyBadgeColor(urgency?: Urgency): string {
  if (urgency === "high") return "bg-red-100 text-red-800 border-red-200";
  if (urgency === "medium") return "bg-amber-100 text-amber-800 border-amber-200";
  if (urgency === "low") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
