import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
const MAPPING_PATH = path.resolve(__dirname, "../model_role_mapping.json");
const SYNC_INTERVAL_MS = parseInt(process.env.MODEL_SYNC_INTERVAL_MS || "60000", 10);

export interface OllamaModel {
  name: string;
  size: number;
  modified: string;
  digest?: string;
}

export interface ModelRegistryState {
  lastSync: string | null;
  available: OllamaModel[];
  error?: string;
}

let registry: ModelRegistryState = {
  lastSync: null,
  available: [],
};

export function getRegistry(): ModelRegistryState {
  return { ...registry, available: [...registry.available] };
}

export function isModelAvailable(modelName: string): boolean {
  return registry.available.some(m => m.name === modelName || m.name.startsWith(modelName + ":"));
}

export function getBestModel(preferred: string, fallback: string): string {
  if (isModelAvailable(preferred)) return preferred;
  if (isModelAvailable(fallback)) return fallback;
  const sorted = [...registry.available].sort((a, b) => b.size - a.size);
  return sorted.length > 0 ? sorted[0].name : fallback;
}

export function getModelByTag(tag: string): OllamaModel | undefined {
  return registry.available.find(m => m.name === tag);
}

export function getModelsBySize(minSizeGB: number): OllamaModel[] {
  return registry.available.filter(m => m.size >= minSizeGB * 1e9);
}

async function fetchOllamaModels(): Promise<OllamaModel[]> {
  const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
  const data = await response.json();
  return (data.models || []).map((m: any) => ({
    name: m.name,
    size: m.size || 0,
    modified: m.modified_at || "",
    digest: m.digest,
  }));
}

function updateMappingFile(models: OllamaModel[]) {
  try {
    if (!fs.existsSync(MAPPING_PATH)) return;
    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf-8"));

    const availableMap: Record<string, { name: string; size: number }> = {};
    for (const m of models) {
      availableMap[m.name] = { name: m.name, size: m.size };
    }

    mapping._available = {
      lastSync: new Date().toISOString(),
      models: availableMap,
    };

    const validateRole = (role: string, cfg: { model_name?: string; provider?: string }) => {
      if (cfg.provider !== "ollama") return;
      const mn = cfg.model_name;
      if (!mn) return;
      const exact = models.find(m => m.name === mn);
      if (exact) return;
      const partial = models.find(m => m.name.startsWith(mn.split(":")[0]));
      if (partial) {
        console.log(`[ModelRegistry] Role "${role}" uses "${mn}" but found "${partial.name}" — updating`);
        cfg.model_name = partial.name;
        return;
      }
      const fallback = models.find(m => !m.name.includes("cloud") && !m.name.includes("embed"));
      if (fallback) {
        console.warn(`[ModelRegistry] Role "${role}" model "${mn}" not found — falling back to "${fallback.name}"`);
        cfg.model_name = fallback.name;
      }
    };

    for (const [role, cfg] of Object.entries(mapping)) {
      if (role.startsWith("_")) continue;
      validateRole(role, cfg as any);
    }

    fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + "\n", "utf-8");
    console.log(`[ModelRegistry] Updated mapping file with ${models.length} models`);
  } catch (err) {
    console.error("[ModelRegistry] Failed to update mapping file:", err);
  }
}

export async function syncModels(): Promise<ModelRegistryState> {
  try {
    const models = await fetchOllamaModels();
    registry = {
      lastSync: new Date().toISOString(),
      available: models,
    };
    updateMappingFile(models);
    console.log(`[ModelRegistry] Synced ${models.length} models from Ollama`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    registry = { ...registry, error: msg };
    console.error(`[ModelRegistry] Sync failed: ${msg}`);
  }
  return registry;
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs: number = SYNC_INTERVAL_MS): void {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(syncModels, intervalMs);
  console.log(`[ModelRegistry] Auto-sync every ${intervalMs}ms`);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

syncModels();
