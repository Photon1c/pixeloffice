import "dotenv/config";

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
export const LOCAL_MODEL = process.env.LOCAL_MODEL_NAME || "qwen3.5:4b";
const LOCAL_TIMEOUT_MS = parseInt(process.env.LOCAL_TIMEOUT_MS || "8000", 10);

export interface LocalModelResponse {
  success: boolean;
  content: string;
  error?: string;
  latencyMs?: number;
}

export async function isLocalModelAvailable(): Promise<boolean> {
  try {
    const response = await Promise.race([
      fetch(`${OLLAMA_ENDPOINT}/api/tags`),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("timeout")), 2000)
      )
    ]);
    return response.ok;
  } catch {
    return false;
  }
}

export async function generateWithLocalModel(prompt: string): Promise<LocalModelResponse> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT_MS);
    
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCAL_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 100,
        },
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        content: "",
        error: `Ollama API error: ${response.status} ${response.statusText}`,
        latencyMs: Date.now() - startTime,
      };
    }
    
    const data = await response.json() as { response?: string };
    const content = data.response?.trim() || "";
    
    if (!content) {
      return {
        success: false,
        content: "",
        error: "Empty response from local model",
        latencyMs: Date.now() - startTime,
      };
    }
    
    return {
      success: true,
      content,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return {
      success: false,
      content: "",
      error: errorMessage,
      latencyMs,
    };
  }
}

export async function tryLocalModel(prompt: string): Promise<string | null> {
  const result = await generateWithLocalModel(prompt);
  return result.success && result.content.length > 0 ? result.content : null;
}
