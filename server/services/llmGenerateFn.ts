import type { GenerateFn } from "../conversation/api.js";
import { tryLocalModel, isLocalModelAvailable } from "../llm/localClient.js";
import { routeChat } from "../llm/llmRouter.js";

const MAX_TOKENS = 40;
const TEMPERATURE = 0.7;

let localModelAvailable: boolean | null = null;

/**
 * Check if local model is available (cached)
 */
async function checkLocalAvailability(): Promise<boolean> {
  if (localModelAvailable === null) {
    localModelAvailable = await isLocalModelAvailable();
    if (localModelAvailable) {
      console.log("[generateFn] Local model available, will use local-first strategy");
    } else {
      console.log("[generateFn] Local model unavailable, using cloud providers");
    }
  }
  return localModelAvailable;
}

/**
 * Tiered generation strategy:
 * 1. Local (Ollama)
 * 2. Cloud Router (NVIDIA -> OpenAI)
 */
export const generateFn: GenerateFn = async (prompt: string): Promise<string> => {
  // 1. Local
  const localAvailable = await checkLocalAvailability();
  if (localAvailable) {
    const localResult = await tryLocalModel(prompt);
    if (localResult !== null && localResult.length > 0) {
      return localResult;
    }
  }
  
  // 2. Cloud Router
  try {
    const result = await routeChat([{ role: "user", content: prompt }], {
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE
    });
    return result.content;
  } catch (error) {
    console.error("[generateFn] Cloud Router error:", error);
    return "I'm having trouble thinking right now. Let's try again.";
  }
};

/**
 * Reset the local model availability cache
 * Useful for testing or when Ollama is restarted
 */
export function resetLocalModelCache(): void {
  localModelAvailable = null;
}
