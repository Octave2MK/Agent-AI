import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type AIProvider = "anthropic" | "gemini";

export function getAIProvider(): AIProvider {
  return process.env.AI_PROVIDER === "gemini" ? "gemini" : "anthropic";
}

export function requireAIKey(): void {
  const provider = getAIProvider();
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY absente dans .env.local.");
  }
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY absente dans .env.local.");
  }
}

/**
 * Retourne le modèle configuré par AI_PROVIDER.
 * Le nom Claude demandé par le code métier est conservé comme préférence
 * de modèle côté Anthropic ; Gemini utilise gemini-3.8-flash.
 */
export function getAIModel(anthropicModel: "claude-opus-5" | "claude-sonnet-5") {
  requireAIKey();
  const provider = getAIProvider();

  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    return google("gemini-3.8-flash");
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic(anthropicModel);
}
