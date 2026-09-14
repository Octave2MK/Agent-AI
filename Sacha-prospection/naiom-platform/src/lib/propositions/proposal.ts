/**
 * Génération STRUCTURÉE d'une proposition commerciale (Victor) à partir d'un call.
 * Victor renvoie un JSON complet → rendu ensuite en PDF pro (schémas + prix).
 * L'email d'envoi est renvoyé SÉPARÉMENT (jamais dans le PDF).
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export interface ProcessStep { step: string; pain: string }
export interface Solution {
  title: string;
  problem: string;
  how: string;
  before: string[]; // process actuel (manuel)
  after: string[]; // process automatisé
  tools: string[];
  gain: string; // ex. "≈ 8 h/semaine récupérées"
  setup: number; // prix de mise en place (€)
  recurring: number; // abonnement mensuel (€), 0 si aucun
}
export interface PricingItem { label: string; amount: number; type: "setup" | "mensuel" }
export interface TimelinePhase { phase: string; label: string }

export interface Proposal {
  prospect: string;
  sector: string;
  contactName: string;
  date: string;
  reference: string; // ex. "PROP-2026-014"
  executiveSummary: string;
  context: string;
  processIntro: string;
  currentProcess: ProcessStep[];
  solutions: Solution[];
  pricing: { items: PricingItem[]; totalSetup: number; totalRecurring: number };
  timeline: TimelinePhase[];
  nextSteps: string[];
  email: { subject: string; body: string };
}

export interface CallContext {
  title: string; date: string; participants: string[]; type: string; sentiment: string;
  summary: string; keyPoints?: string[]; actionItems?: string[]; transcript?: string;
}

const SYSTEM = `Tu es Victor, closer et ingénieur solutions chez NAIOM (agence d'ingénierie d'agents IA + automatisations n8n).
À partir d'un call prospect analysé, tu produis une PROPOSITION COMMERCIALE structurée, concrète et chiffrée.

Tu réponds UNIQUEMENT avec un objet JSON valide (aucun texte autour, pas de bloc markdown), conforme à ce schéma :
{
  "prospect": string,               // nom de l'entreprise du prospect
  "sector": string,                 // secteur (ex. "Immobilier", "E-commerce")
  "contactName": string,            // interlocuteur principal
  "reference": string,              // ex. "PROP-2026-XXX"
  "executiveSummary": string,       // 2-3 phrases: l'enjeu + la promesse
  "context": string,                // 1 paragraphe: situation actuelle et besoins détectés AU CALL
  "processIntro": string,           // 1-2 phrases introduisant l'analyse du process actuel
  "currentProcess": [ { "step": string, "pain": string } ],   // 4-6 étapes du process ACTUEL avec le point de douleur de chacune
  "solutions": [ {
     "title": string,               // nom de l'automatisation proposée
     "problem": string,             // le problème précis résolu
     "how": string,                 // comment ça marche, 1-2 phrases concrètes
     "before": [string],            // 3-4 étapes du flux MANUEL actuel (court, 2-4 mots/étape)
     "after": [string],             // 3-4 étapes du flux AUTOMATISÉ (court)
     "tools": [string],             // outils (n8n, Claude, Airtable, Make, Gmail API...)
     "gain": string,                // gain chiffré réaliste (temps/€/erreurs)
     "setup": number,               // prix de mise en place en €
     "recurring": number            // abonnement mensuel en € (0 si aucun)
  } ],                              // 2-4 solutions
  "timeline": [ { "phase": string, "label": string } ],   // 3-4 phases (ex. "Semaine 1-2" / "Cadrage & accès")
  "nextSteps": [string],            // 2-3 prochaines étapes concrètes
  "email": { "subject": string, "body": string }   // email d'accompagnement PRO, séparé du PDF, en français, signé "L'équipe NAIOM"
}

Règles:
- Français, ton B2B pro, zéro jargon creux. Prix réalistes en euros (setup 1 500–8 000 €, abo 200–800 €/mois).
- Les solutions découlent DIRECTEMENT des douleurs évoquées au call. Concret, pas générique.
- "before"/"after" = étapes TRÈS courtes (pour un schéma visuel).
- Ne mets JAMAIS l'email dans le corps de la proposition ; il va dans le champ "email".`;

/** Échappe les retours-ligne bruts DANS les chaînes JSON (Claude en met parfois). */
function escapeCtrlInStrings(s: string): string {
  let out = "", inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === "\\") { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && (ch === "\n" || ch === "\r" || ch === "\t")) { out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : "\\t"; continue; }
    out += ch;
  }
  return out;
}

function coerce(raw: string, prospect: string): Proposal {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let j: Partial<Proposal>;
  try { j = JSON.parse(cleaned) as Partial<Proposal>; }
  catch {
    try { j = JSON.parse(escapeCtrlInStrings(cleaned)) as Partial<Proposal>; }
    catch {
      throw new Error("La proposition générée était incomplète (réponse trop longue). Réessaie — je relance la génération.");
    }
  }
  const today = new Date();
  return {
    prospect: j.prospect || prospect,
    sector: j.sector || "—",
    contactName: j.contactName || "",
    date: today.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    reference: j.reference || `PROP-${today.getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    executiveSummary: j.executiveSummary || "",
    context: j.context || "",
    processIntro: j.processIntro || "",
    currentProcess: j.currentProcess ?? [],
    solutions: (j.solutions ?? []).map((s) => ({
      title: s.title ?? "", problem: s.problem ?? "", how: s.how ?? "",
      before: s.before ?? [], after: s.after ?? [], tools: s.tools ?? [],
      gain: s.gain ?? "", setup: Number(s.setup) || 0, recurring: Number(s.recurring) || 0,
    })),
    pricing: buildPricing(j.solutions ?? []),
    timeline: j.timeline ?? [],
    nextSteps: j.nextSteps ?? [],
    email: { subject: j.email?.subject || `Proposition commerciale — ${prospect}`, body: j.email?.body || "" },
  };
}

function buildPricing(sols: Partial<Solution>[]): Proposal["pricing"] {
  const items: PricingItem[] = [];
  let totalSetup = 0, totalRecurring = 0;
  for (const s of sols) {
    const setup = Number(s.setup) || 0, rec = Number(s.recurring) || 0;
    if (setup) { items.push({ label: `${s.title} — mise en place`, amount: setup, type: "setup" }); totalSetup += setup; }
    if (rec) { items.push({ label: `${s.title} — maintenance/mois`, amount: rec, type: "mensuel" }); totalRecurring += rec; }
  }
  return { items, totalSetup, totalRecurring };
}

export async function generateProposal(call: CallContext, prospect: string): Promise<Proposal> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY absente dans .env.local.");
  const context = `Call analysé (source Fireflies) :
# ${call.title}
Date: ${call.date} · Type: ${call.type} · Sentiment: ${call.sentiment}
Participants: ${call.participants.join(", ")}

## Résumé
${call.summary}

## Points clés
${(call.keyPoints ?? []).map((k) => `- ${k}`).join("\n")}

## Prochaines étapes évoquées
${(call.actionItems ?? []).map((a) => `- ${a}`).join("\n")}

## Extrait transcript
${(call.transcript ?? "").slice(0, 4000)}

Prospect (entreprise cible) : ${prospect}

Génère MAINTENANT le JSON de la proposition.`;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { text } = await generateText({
    model: anthropic("claude-opus-5"),
    maxOutputTokens: 16000, // Opus 5 pense + écrit un gros JSON → éviter la troncature ("Unterminated string")
    system: SYSTEM,
    prompt: context,
  });
  return coerce(text, prospect);
}
