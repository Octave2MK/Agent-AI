/**
 * Génération STRUCTURÉE d'une proposition commerciale (Victor) à partir d'un call.
 * Victor renvoie un JSON complet → rendu ensuite en PDF pro (schémas + prix).
 * L'email d'envoi est renvoyé SÉPARÉMENT (jamais dans le PDF).
 */
import { generateText } from "ai";
import { getAIModel, requireAIKey } from "@/lib/ai/provider";

export interface ProcessStep { step: string; pain: string }
export interface Solution {
  title: string;
  problem: string;
  how: string;
  before: string[];
  after: string[];
  tools: string[];
  gain: string;
  setup: number;
  recurring: number;
}
export interface PricingItem { label: string; amount: number; type: "setup" | "mensuel" }
export interface TimelinePhase { phase: string; label: string }

export interface Proposal {
  prospect: string;
  sector: string;
  contactName: string;
  date: string;
  reference: string;
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
  "prospect": string,
  "sector": string,
  "contactName": string,
  "reference": string,
  "executiveSummary": string,
  "context": string,
  "processIntro": string,
  "currentProcess": [ { "step": string, "pain": string } ],
  "solutions": [ {
     "title": string,
     "problem": string,
     "how": string,
     "before": [string],
     "after": [string],
     "tools": [string],
     "gain": string,
     "setup": number,
     "recurring": number
  } ],
  "timeline": [ { "phase": string, "label": string } ],
  "nextSteps": [string],
  "email": { "subject": string, "body": string }
}

Règles:
- Français, ton B2B pro, zéro jargon creux. Prix réalistes en euros (setup 1 500–8 000 €, abo 200–800 €/mois).
- Les solutions découlent DIRECTEMENT des douleurs évoquées au call. Concret, pas générique.
- "before"/"after" = étapes TRÈS courtes (pour un schéma visuel).
- Ne mets JAMAIS l'email dans le corps de la proposition ; il va dans le champ "email".`;

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
  requireAIKey();
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

  const { text } = await generateText({
    model: getAIModel("claude-opus-5"),
    maxOutputTokens: 16000,
    system: SYSTEM,
    prompt: context,
  });
  return coerce(text, prospect);
}
