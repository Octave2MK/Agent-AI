import { convertToModelMessages, isToolUIPart, stepCountIs, streamText, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getAgentBySlug } from "@/lib/agents";
import { buildMockResponse } from "@/lib/mockStream";
import { renderInbox, renderMeetings, renderCandidatesFull, renderYouTube, renderDrive } from "@/lib/dataSources";
import { appendUsage } from "@/lib/analytics/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

const ACTION_ORIENTED_INSTRUCTION = `

---

## Règle de production (priorité absolue)

**Produis DIRECTEMENT le livrable demandé dans ta première réponse.**

- Ne pose PAS de question de clarification si l'intention est raisonnablement claire.
- Commence ta réponse par un titre markdown (\`# ...\`) qui reflète le livrable (ex. \`# Post LinkedIn — lancement Davide\`, \`# Brief de campagne — Q2 2026\`).
- Si un détail manque (public exact, canal, ton, deadline), fais une **hypothèse raisonnable** et note-la clairement à la fin dans une section "## Hypothèses" — plutôt que de demander.
- Livre un produit fini, pas un plan d'action : du contenu prêt à copier, un brief complet, un prompt image utilisable, pas une promesse.
- Ne pose une question QUE si la demande est réellement ambigüe (ex. "help me", "fais un truc", "aide").
`;

const DECK_LISIBILITE_RULE = `

---

## Règle lisibilité — obligatoire pour tout livrable en format deck (slides)

Les slides seront lues en PDF par des gens qui n'étaient pas dans la réunion. **Chaque slide doit être autoportante et comprise par un lecteur non-initié.**

1. **Jamais d'acronyme nu.** Premier usage = nom complet + acronyme entre parenthèses. Ex. "Taux de clic (CTR)" pas "CTR". Ensuite tu peux réutiliser l'acronyme seul.
2. **Body/caption OBLIGATOIRE** sur toute slide data-viz (\`[stat]\`, \`[kpi]\`, \`[bars]\`, \`[line]\`) — 1-2 phrases qui expliquent **quoi** on regarde, **pourquoi c'est important**, et le **verdict** (ce qu'il faut retenir).
3. **Titres auto-portants.** Pas "Top 3" → préfère "Les 3 vidéos les plus vues". Pas "Évolution" → préfère "Gain de 2 451 abonnés en 30 jours". Le titre dit déjà l'insight.
4. **Verdict après chaque chart** — une phrase qui commence par "Ce qui ressort :…", "En clair :…", "À noter :…". Le lecteur ne doit pas avoir à interpréter les barres tout seul.
5. **Nombres contextualisés.** 92 678 vues = beaucoup ou peu ? Toujours comparer à une référence (période précédente, moyenne secteur, ordre de grandeur) ou donner un équivalent parlant (× la population de telle ville, équivalent de N semaines de trafic, etc.).
6. **Vocabulaire accessible.** Traduire ou expliciter systématiquement les termes techniques :
   - **TL;DR → BANNI.** Utilise "En bref", "Verdict global", "Résumé", "Synthèse" ou "À retenir".
   - baseline → "période précédente" ou "référence"
   - benchmark → "moyenne du secteur"
   - retention / watch time → "durée de visionnage moyenne"
   - engagement rate → "taux d'interactions (likes + commentaires / vues)"
   - CTR → "taux de clic (CTR)"
   - reach organique → "portée naturelle (non payée)"
   - churn → "perte de clients"
   - KPI → "indicateur clé"
   - funnel → "parcours de conversion"
   - CPM / CPC / ROAS / LTV / CAC → toujours expliciter entre parenthèses à la 1re occurrence
7. **Pas de bullet muet.** Chaque bullet doit porter une info complète, pas un mot-clé seul ("rétention" → "Durée moyenne de visionnage de 5,5 minutes").

Cette règle s'applique en plus de tes règles d'agent. En cas de conflit de format, priorise la lisibilité.
`;

const DECK_AGENTS = new Set(["analyste", "gmail", "fireflies", "cv", "presentateur", "orchestrateur"]);

// Agents qui produisent un livrable → flux PLAN → approbation → création.
const CREATE_CAPABLE = new Set(["proposition", "strategiste", "presentateur", "analyste", "createur-contenu", "cv", "fireflies", "gmail"]);
const PLAN_INSTRUCTION = `

---

## ⚠️ Règle livrable : PLAN d'abord, création APRÈS approbation

Quand l'utilisateur te demande de PRODUIRE un livrable (proposition, brief, deck, rapport, post/carrousel, email, analyse…), tu **ne rédiges PAS le livrable complet dans le chat**. Tu réponds UNIQUEMENT par un **PLAN court** :

1. Une phrase de cadrage : ce que tu vas créer, pour qui, à partir de quoi (cite la source réelle : le call, l'email, les données connectées).
2. 3 à 6 puces : la **structure** / les sections / les angles que tu vas produire.
3. Termine EXACTEMENT par cette ligne : « **Valide ce plan avec le bouton ci-dessous et je crée le livrable.** »

Ne mets aucun contenu final (pas de propal rédigée, pas de slides écrites) — juste le plan. Après validation, un bouton « Approuver & créer » déclenchera la vraie création (PDF / fichier). Pour une simple question ou discussion, réponds normalement (pas de plan).`;

const WEB_ACCESS_INSTRUCTION = `

---

## Accès web (recherche + fetch)

Tu disposes de deux outils natifs Anthropic :

- **\`web_search\`** — recherche en temps réel sur le web. À utiliser dès qu'il manque une information sur une entreprise, un prospect, un concurrent, une tendance marché, une actualité, un chiffre sectoriel. Donne une \`query\` précise en langage naturel (français ou anglais).
- **\`web_fetch\`** — récupère le contenu d'une URL précise. À utiliser quand :
  - Tu veux analyser le site d'un prospect (palette, ton, proposition de valeur, services, clients référencés).
  - Le user te donne une URL explicite ("regarde ce lien").
  - Une recherche t'a donné une URL pertinente dont tu veux extraire le contenu intégral.

### Quand utiliser quoi

- **"Va chercher telle entreprise / fais une recherche / trouve-moi"** → \`web_search\` d'abord, puis \`web_fetch\` sur les 1-2 URLs les plus pertinentes (site officiel, LinkedIn entreprise, press release récent).
- **"Regarde ce site / copie leur style"** → \`web_fetch\` direct sur l'URL donnée pour analyser la DA (palette, typo, ton, CTAs, structure).
- **"Fais-moi un deck de prospection pour X"** → \`web_search\` "X entreprise services clients", puis \`web_fetch\` du site officiel, puis produis le deck en citant les infos récupérées.
- **Question factuelle simple** (ex. "capitale du Japon") → réponds de mémoire, pas besoin de web.

### Règles d'usage

1. **Maximum 5 appels web par réponse** — reste parcimonieux, priorise les sources primaires.
2. **Cite tes sources** dans le livrable final : dans la slide \`[thanks]\` pour un deck, ou dans un bloc \`## Sources\` pour un document texte.
3. **Ne cite jamais une donnée web sans l'URL source**. Le lecteur doit pouvoir vérifier.
4. **Règle anti-invention maintenue** : si les résultats web ne contiennent pas l'info demandée, dis-le explicitement ("donnée indisponible publiquement") plutôt que d'inventer.
5. **Contenu visuel (palette, typo d'un site)** : décris textuellement les couleurs dominantes (ex. "bleu nuit #1a2b3c, accent corail") que le Designer pourra reprendre. Tu n'as pas accès aux images.
`;

async function hydrateSystemPrompt(agentSlug: string, systemPrompt: string, provider: "anthropic" | "gemini"): Promise<string> {
  let hydrated = systemPrompt;

  if (agentSlug === "gmail" || agentSlug === "orchestrateur") {
    hydrated = hydrated.replace("{{INBOX_SNAPSHOT}}", await renderInbox());
  }
  if (agentSlug === "fireflies" || agentSlug === "orchestrateur") {
    hydrated = hydrated.replace("{{MEETINGS_SNAPSHOT}}", await renderMeetings());
  }
  // Victor (proposition) : on lui donne les vrais calls Fireflies pour qu'il rédige
  // directement la proposition à partir du call demandé (pas de "je vérifie d'abord").
  if (agentSlug === "proposition") {
    const meetings = await renderMeetings();
    hydrated += `\n\n---\n\n# Tes calls (Fireflies connecté)\n\nVoici les calls récents. Quand on te demande « mon dernier call », prends le PREMIER de la liste (le plus récent) et rédige la proposition DIRECTEMENT à partir de son contenu — ne réponds jamais « je vérifie d'abord si un call est disponible », les calls sont ci-dessous. Si la liste est vide, dis-le et propose d'en coller un.\n\n${meetings}`;
  }
  if (agentSlug === "cv" || agentSlug === "orchestrateur") {
    hydrated = hydrated.replace("{{CANDIDATES_SNAPSHOT}}", await renderCandidatesFull());
  }

  // YouTube : injecté côté Analyste + Orchestrateur quand les données sont dispos
  if (agentSlug === "analyste" || agentSlug === "orchestrateur") {
    const yt = await renderYouTube();
    if (yt) {
      hydrated += `\n\n---\n\n# Données YouTube live (compte connecté)\n\n${yt}`;
    }
  }

  // Drive : injecté dans tous les agents SAUF Gmail/CV/Analyste — fichiers de référence.
  // L'Analyste travaille sur YouTube + ses propres livrables (dossier analytics/),
  // le Drive brut n'apporte rien et gonfle le contexte (rate limit 30K tokens/min).
  if (agentSlug !== "gmail" && agentSlug !== "cv" && agentSlug !== "analyste") {
    const drive = await renderDrive();
    if (drive) {
      hydrated += `\n\n---\n\n# Google Drive (fichiers de référence récents)\n\n${drive}\n\n> Tu peux citer ces fichiers par leur nom si c'est pertinent pour la question.`;
    }
  }

  let result = hydrated + ACTION_ORIENTED_INSTRUCTION;
  if (DECK_AGENTS.has(agentSlug)) {
    result += DECK_LISIBILITE_RULE;
  }
  if (provider === "anthropic") {
    result += WEB_ACCESS_INSTRUCTION;
  }
  if (CREATE_CAPABLE.has(agentSlug)) {
    result += PLAN_INSTRUCTION;
  }
  return result;
}

/**
 * Retire les tool parts (web_search / web_fetch) dont l'exécution n'a pas abouti :
 * state "input-streaming" ou "input-available" = tool_use envoyé sans tool_result.
 * Si on les renvoie tels quels à l'API Anthropic, elle rejette l'historique avec
 * "tool_use found without corresponding tool_result". Cas typique : stream
 * interrompu par l'utilisateur pendant un web_search.
 */
function sanitizeOrphanToolParts(messages: UIMessage[]): UIMessage[] {
  return (Array.isArray(messages) ? messages : [])
    .map((m) => ({
      ...m,
      // garde-fou : un message restauré (localStorage) peut ne pas avoir de `parts`
      parts: (Array.isArray(m?.parts) ? m.parts : []).filter((p) => {
        if (!isToolUIPart(p)) return true;
        return p.state === "output-available" || p.state === "output-error";
      }),
    }))
    .filter((m) => m.parts.length > 0);
}

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as UIMessage[] | undefined;
  const agentSlug = body.agentSlug as string | undefined;

  if (!messages || !agentSlug) {
    return new Response("Missing `messages` or `agentSlug`", { status: 400 });
  }

  const sanitizedMessages = sanitizeOrphanToolParts(messages);

  const agent = await getAgentBySlug(agentSlug);
  if (!agent) {
    return new Response(`Unknown agent "${agentSlug}"`, { status: 404 });
  }

  const provider: "anthropic" | "gemini" =
    process.env.AI_PROVIDER === "gemini" ? "gemini" : "anthropic";

  const providerApiKey =
    provider === "gemini"
      ? process.env.GEMINI_API_KEY
      : process.env.ANTHROPIC_API_KEY;

  const useMock =
    process.env.DEMO_MOCK === "1" || !providerApiKey;

  if (useMock) {
    return buildMockResponse(agentSlug, sanitizedMessages);
  }

  const baseSystem =
    agent.systemPrompt || `Tu es ${agent.name}. Sois bref, en français, et utile.`;
  const systemPrompt = await hydrateSystemPrompt(
    agentSlug,
    baseSystem,
    provider
  );

  const anthropic =
    provider === "anthropic"
      ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
      : null;

  const google =
    provider === "gemini"
      ? createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! })
      : null;

  const startTime = Date.now();

  const modelId =
    provider === "gemini"
      ? "gemini-3.6-flash"
      : /opus/i.test(agent.model)
        ? "claude-opus-5"
        : "claude-sonnet-5";

  // Prompt caching Anthropic (TTL ~5min) — pose un cache_control ephemeral sur
  // le system pour que les tours successifs réutilisent la cache au lieu de
  // re-facturer 6-8K tokens d'input à chaque appel. Évite le rate limit ITPM 30K.
  const systemMessage =
    provider === "anthropic"
      ? {
          role: "system" as const,
          content: systemPrompt,
          providerOptions: {
            anthropic: {
              cacheControl: {
                type: "ephemeral" as const,
              },
            },
          },
        }
      : null;
  const modelMessages = await convertToModelMessages(sanitizedMessages);

  // Web search/fetch : budget réduit de 5→2 pour éviter que les résultats injectés
  // (5-10K tokens chacun) ne fassent exploser l'input entre deux tours.
  const webBudget = agentSlug === "analyste" ? 2 : 3;

  const result = streamText({
    model: 
      provider === "gemini"
        ? google!("gemini-3.8-flash")
        : anthropic!(modelId),

    ...(provider === "gemini"
      ? {
          instructions: systemPrompt,
          messages: modelMessages,
        }
      : {
          messages: [systemMessage!, ...modelMessages],
        }),

    maxOutputTokens: 24000,
    maxRetries: 2,

    ...(provider === "anthropic"
      ? {
          tools: {
            web_search: anthropic!.tools.webSearch_20260209({
              maxUses: webBudget,
            }),
            web_fetch: anthropic!.tools.webFetch_20260209({
              maxUses: webBudget,
            }),
          },
        }
      : {}),

    stopWhen: stepCountIs(8),

    onFinish: async ({ usage, steps }) => {
      try {
        const latencyMs = Date.now() - startTime;

        const toolCalls = (steps || []).reduce(
          (acc, step) => acc + (step.toolCalls?.length ?? 0),
          0
        );

        const inputTokens = usage?.inputTokens ?? 0;
        const outputTokens = usage?.outputTokens ?? 0;
        const cachedTokens =
          provider === "anthropic"
            ? usage?.inputTokenDetails?.cacheReadTokens ?? 0
            : 0;

        await appendUsage({
          timestamp: new Date().toISOString(),
          agentSlug,
          model: modelId,
          inputTokens: inputTokens - cachedTokens,
          outputTokens,
          cacheReadTokens: cachedTokens,
          cacheCreationTokens: 0,
          latencyMs,
          success: true,
          toolCalls,
        });
      } catch (e) {
        console.error("[api/chat] usage tracking failed:", e);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => {
      console.error("[api/chat]", err);
      appendUsage({
        timestamp: new Date().toISOString(),
        agentSlug,
        model: modelId,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        latencyMs: Date.now() - startTime,
        success: false,
        toolCalls: 0,
      }).catch(() => {});
      return err instanceof Error ? err.message : "Erreur inconnue";
    },
  });
}
