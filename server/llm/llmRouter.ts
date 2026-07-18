import { nvidiaChat, NvidiaChatMessage, NvidiaChatOptions } from "./nvidiaClient.js";
import { openai } from "./client.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPING_PATH = path.resolve(__dirname, "../model_role_mapping.json");

let mappingCache: Record<string, any> = {};

function loadMapping(): Record<string, any> {
  if (Object.keys(mappingCache).length > 0) return mappingCache;
  try {
    mappingCache = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf-8"));
    return mappingCache;
  } catch {
    return {};
  }
}

export function refreshMappingCache(): void {
  mappingCache = {};
  loadMapping();
}

export function getModelForRole(role: string): { model: string; provider: string } {
  const mapping = loadMapping();
  const entry = mapping[role];
  if (!entry) return { model: "qwen3.5:4b", provider: "ollama" };
  return {
    model: entry.model_name || "qwen3.5:4b",
    provider: entry.provider || "ollama",
  };
}

export function getAllRoleMappings(): Record<string, { model_name: string; provider: string; use_case: string }> {
  const mapping = loadMapping();
  const roles: Record<string, any> = {};
  for (const [key, val] of Object.entries(mapping)) {
    if (key.startsWith("_")) continue;
    roles[key] = val;
  }
  return roles;
}

/**
 * Routes LLM requests based on role mapping and availability.
 * Prioritizes local Ollama models first; falls back to NVIDIA cloud.
 */
export async function routeChat(
  messages: any[],
  options: { model?: string; role?: string; max_tokens?: number; temperature?: number } = {}
): Promise<{ content: string; provider: "nvidia" | "ollama"; model: string; raw: any }> {
  const { model: explicitModel, role } = options;

  // Resolve model via role mapping if no explicit model given
  let targetModel: string;
  let targetProvider: string;

  if (explicitModel) {
    targetModel = explicitModel;
    targetProvider = "ollama";
  } else if (role) {
    const resolved = getModelForRole(role);
    targetModel = resolved.model;
    targetProvider = resolved.provider;
  } else {
    targetModel = "qwen3.5:4b";
    targetProvider = "ollama";
  }

  // Try Ollama (local) first
  if (targetProvider === "ollama") {
    try {
      console.log(`[LLM Router] Routing to Ollama (local): model=${targetModel}, role=${role || "none"}`);
      const response = await openai.chat.completions.create({
        model: targetModel,
        messages,
        ...options
      });
      return {
        content: response.choices[0].message.content || "",
        provider: "ollama",
        model: response.model || targetModel,
        raw: response
      };
    } catch (err) {
      console.warn(`[LLM Router] Ollama model "${targetModel}" failed:`, err instanceof Error ? err.message : err);
      // If a specific role model failed, try the default fallback
      if (targetModel !== "qwen3.5:4b") {
        try {
          console.log(`[LLM Router] Retrying with default model qwen3.5:4b...`);
          const response = await openai.chat.completions.create({
            model: "qwen3.5:4b",
            messages,
            ...options
          });
          return {
            content: response.choices[0].message.content || "",
            provider: "ollama",
            model: response.model || "qwen3.5:4b",
            raw: response
          };
        } catch (retryErr) {
          console.warn("[LLM Router] Default Ollama model also failed:", retryErr instanceof Error ? retryErr.message : retryErr);
        }
      }
    }
  }

  // Fallback to NVIDIA cloud if available
  if (process.env.NVIDIA_API_KEY) {
    try {
      console.log("[LLM Router] Routing to NVIDIA (cloud fallback)...");
      const result = await nvidiaChat(messages as NvidiaChatMessage[], {
        ...options,
        model: targetProvider === "nvidia" ? targetModel : undefined
      });
      return {
        content: result.content,
        provider: "nvidia",
        model: result.model || targetModel,
        raw: result.raw
      };
    } catch (err) {
      console.warn("[LLM Router] NVIDIA also failed:", err instanceof Error ? err.message : err);
      throw err;
    }
  }

  throw new Error("No LLM provider available (Ollama offline, NVIDIA not configured)");
}
