import { nvidiaChat, NvidiaChatMessage, NvidiaChatOptions } from "./nvidiaClient.js";
import { openai } from "./client.js";

/**
 * Routes LLM requests based on availability and configuration.
 * Prioritizes NVIDIA if API key is present.
 */
export async function routeChat(
  messages: any[],
  options: any = {}
): Promise<{ content: string; provider: 'nvidia' | 'openai'; raw: any }> {
  const useNvidia = !!process.env.NVIDIA_API_KEY;

  if (useNvidia) {
    try {
      console.log("[LLM Router] Routing to NVIDIA...");
      const result = await nvidiaChat(messages as NvidiaChatMessage[], options as NvidiaChatOptions);
      return {
        content: result.content,
        provider: 'nvidia',
        raw: result.raw
      };
    } catch (err) {
      console.warn("[LLM Router] NVIDIA failed, falling back to OpenAI:", err);
      // Fallback to OpenAI
    }
  }

  console.log("[LLM Router] Routing to OpenAI...");
  const response = await openai.chat.completions.create({
    model: options.model || "gpt-4o-mini",
    messages,
    ...options
  });

  return {
    content: response.choices[0].message.content || "",
    provider: 'openai',
    raw: response
  };
}
