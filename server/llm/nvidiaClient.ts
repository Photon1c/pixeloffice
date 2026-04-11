/**
 * NVIDIA Model Integration Client
 * 
 * Design Note: This adapter is designed to be standalone and reusable by
 * other services (like pixel-me or pixeltroupe) without Pixel Office dependencies.
 */

export interface NvidiaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NvidiaChatOptions {
  model?: string;        // override default model
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

/**
 * Calls NVIDIA's /v1/chat/completions endpoint
 */
export async function nvidiaChat(
  messages: NvidiaChatMessage[],
  options: NvidiaChatOptions = {}
): Promise<{ content: string; raw: any }> {
  const apiKey = process.env.NVIDIA_API_KEY;
  // Best performer from HR benchmarks: Kimi K2 (5/5 passed, avg 1571ms)
  // Other good options: Phi-3 Mini, Gemma 7B, Solar 10.7B (all 5/5, ~1600-1700ms)
  const defaultModel = process.env.NVIDIA_MODEL_ID || "moonshotai/kimi-k2-instruct-0905";
  const model = options.model || defaultModel;

  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured in environment variables.");
  }

  const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 1.0,
        stream: false
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`NVIDIA API Error (${response.status}): ${errorBody.substring(0, 200)}`);
    }

    const data = await response.json();
    
    // Content extraction comparable to nvidia_v4.py
    let content = "";
    const choice = data.choices?.[0];
    if (choice && choice.message) {
      if (typeof choice.message.content === 'string') {
        content = choice.message.content;
      } else if (Array.isArray(choice.message.content)) {
        // Handle list-of-parts if necessary (multi-modal or structured)
        content = choice.message.content.map((part: any) => part.text || "").join("");
      }
    }

    return {
      content,
      raw: data
    };
  } catch (error: any) {
    console.error("[NVIDIA Client] Request failed:", error.message);
    throw error;
  }
}
