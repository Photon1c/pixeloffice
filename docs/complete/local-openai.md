# Local Model → OpenAI Fallback Plan

## Goal

Make Pixel Office’s conversation engine (CoolerSession + SCRUM) use **local models first**, and only fall back to OpenAI when local calls fail (timeout/error) or can’t satisfy validation after a few tries.

We do **not** want to remove OpenAI; we want a tiered strategy:

1. Try local model(s) first.
2. If local fails or is unavailable after N attempts, fall back to OpenAI.
3. Keep the existing CoolerSession validation/repair logic unchanged.

## Current State (2026-03-18)

- Pixel Office uses OpenAI directly for CoolerSession via:

  - `src/llm/client.ts`:

    ```ts
    import "dotenv/config";
    import OpenAI from "openai";

    export const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    ```

  - `server/services/llmGenerateFn.ts`:

    ```ts
    import type { GenerateFn } from "../conversation/api.js";
    import { openai } from "../../src/llm/client.js";

    export const generateFn: GenerateFn = async (prompt) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 40,
        temperature: 0.7,
      });
      return response.choices[0].message.content ?? "";
    };
    ```

- Local/shared model support lives in the **pixelworld root** under `models/` (e.g. `model_client.py`, `roleModels.ts`), but Pixel Office’s conversation engine does not currently call into that layer.

## Desired Behavior

When CoolerSession (or SCRUM, if it ever needs generation) calls `generateFn(prompt)`:

1. Attempt generation via **local model client**:
   - Use the shared `models/` layer (Python or TS) or a new TS wrapper, e.g. `src/llm/localClient.ts`.
   - Apply a per-call timeout.
   - If the call succeeds, return its output.

2. If local model:
   - Throws an error,
   - Times out,
   - Or fails to produce anything usable,
   then try OpenAI as a **fallback**.

3. Preserve existing CoolerSession validation + repair:
   - `generateFn` should just return best-effort text.
   - The engine already:
     - Validates,
     - Retries,
     - Falls back to deterministic repair templates.

## Implementation Sketch

### 1. Introduce a local model wrapper (TS side)

Create something like:

- `src/llm/localClient.ts`

Responsibilities:

- Provide a TS function:

  ```ts
  export async function generateWithLocalModel(prompt: string): Promise<string> {
    // TODO: implement via shared models/ layer
    // For now, this can be a stub or call into HTTP/CLI endpoint that wraps the local model.
    throw new Error("local model not yet wired");
  }
Later, wire this to:
A local HTTP endpoint, or
A CLI command, or
A direct TS client that talks to the models/ machinery.
2. Wrap generateFn with local→OpenAI fallback
Update server/services/llmGenerateFn.ts to something like:

tsCopyCopied!
import type { GenerateFn } from "../conversation/api.js";
import { openai } from "../../src/llm/client.js";
import { generateWithLocalModel } from "../../src/llm/localClient.js";

async function tryLocal(prompt: string): Promise<string | null> {
  try {
    const result = await Promise.race([
      generateWithLocalModel(prompt),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 4000), // 4s timeout, adjust as needed
      ),
    ]);
    if (result && result.trim().length > 0) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

async function tryOpenAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 40,
    temperature: 0.7,
  });
  return response.choices[0].message.content ?? "";
}

export const generateFn: GenerateFn = async (prompt) => {
  const local = await tryLocal(prompt);
  if (local !== null) {
    return local;
  }
  return await tryOpenAI(prompt);
};

Notes:

generateWithLocalModel can start as a stub that always throws; once implemented, tryLocal will use it.
Timeout + null return is the “give up on local” signal.
3. Keep models interchangeable later
When local model wiring is ready:

generateWithLocalModel can call:
A local HTTP server that fronts your model.
A Python script via child_process (less ideal, but possible).
A TS adapter for the shared models/roleModels.ts or similar.
The key is to keep this boundary narrow so swapping the local backend does not touch:

CoolerSession engine,
SCRUM logic,
Or Pixel Office UI.
Tests & Safety
Add tests (or a small harness) to verify:
When generateWithLocalModel succeeds quickly, OpenAI is not called.
When it times out or throws, OpenAI is used instead.
Do not change any CoolerSession tests or configs in this phase; only test the behavior of generateFn.
