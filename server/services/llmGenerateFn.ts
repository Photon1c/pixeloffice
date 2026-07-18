import type { GenerateFn } from "../conversation/api.js";
import { tryLocalModel, isLocalModelAvailable, LOCAL_MODEL } from "../llm/localClient.js";
import { routeChat } from "../llm/llmRouter.js";
import { getRegistry, isModelAvailable } from "./modelRegistry.js";

const MAX_TOKENS = 40;
const TEMPERATURE = 0.7;

let localModelAvailable: boolean | null = null;

let lastUsedModel: string = LOCAL_MODEL;

export function getLastUsedModel(): string {
  return lastUsedModel;
}

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
 * 1. Local (Ollama) — with model registry awareness
 * 2. Cloud Router (NVIDIA -> OpenAI)
 */
export const generateFn: GenerateFn = async (prompt: string): Promise<string> => {
  const localAvailable = await checkLocalAvailability();
  if (localAvailable) {
    const registry = getRegistry();

    // Use best available model from registry, defaulting to LOCAL_MODEL
    const sorted = [...registry.available].sort((a, b) => b.size - a.size);
    const preferredModel = sorted.length > 0
      ? sorted.find(m => !m.name.includes("cloud") && !m.name.includes("embed"))?.name || LOCAL_MODEL
      : LOCAL_MODEL;

    lastUsedModel = preferredModel;
    const localResult = await tryLocalModel(prompt);
    if (localResult !== null && localResult.length > 0) {
      return localResult;
    }
  }

  try {
    lastUsedModel = "cloud";
    const result = await routeChat([{ role: "user", content: prompt }], {
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE
    });
    lastUsedModel = result.model || "cloud";
    return result.content;
  } catch (error) {
    console.error("[generateFn] Cloud Router error:", error);
    return "I'm having trouble thinking right now. Let's try again.";
  }
};

export function resetLocalModelCache(): void {
  localModelAvailable = null;
}
