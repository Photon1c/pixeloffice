# OpenCode Brief – NVIDIA Model Integration for Pixel Office

## Goal

Integrate **one working NVIDIA-hosted chat model** into Pixel Office as a first step toward using NVIDIA’s free models (e.g., `deepseek-ai/deepseek-v3.1`) as a cloud provider instead of local models.

Phase 1 is intentionally small:
- Add support for **one NVIDIA model** wired through a clear adapter.
- Allow it to be selected via config (env and/or JSON), and optionally surfaced in the UI model dropdown.
- Keep the integration generic enough that Pixel Office (and later `pixel-me` / `pixeltroupe`) can reuse it.

We are **not** trying to redesign the whole model routing system yet—just make one NVIDIA model a first-class option.

---

## Context

Reference CLI playground (outside Pixel Office):
- `~/temporary_shuttle/llm_gui/nvidia_v4.py`
  - Talks to: `https://integrate.api.nvidia.com/v1/chat/completions`
  - Model listing: `https://integrate.api.nvidia.com/v1/models`
  - Reads `NVIDIA_API_KEY` from `.env`.
  - Uses a familiar `messages: [{role, content}, ...]` structure.

Pixel Office:
- App root: `~/apps/pixelworld/pixel_office`
- Frontend: Vite + React
- Backend: Node/TypeScript server under `server/` (already using OpenAI today)
- Future plan: also use this integration path for `pixel-me` and `pixeltroupe`.

We want a clean, **adapter-style** NVIDIA client that follows the same general contract as existing LLM calls, so we can route cooler talk, SCRUM summarization, or other tasks through it without copy-pasting HTTP logic everywhere.

---

## Phase 1 Requirements

### 1. NVIDIA Client Adapter

Create a small, reusable NVIDIA client module under `server/`, for example:

- `server/llm/nvidiaClient.ts`

Responsibilities:
- Read configuration from env and/or JSON config:
  - `NVIDIA_API_KEY` (required)
  - `NVIDIA_MODEL_ID` (optional; can default inside code)
- Expose a simple function such as:

```ts
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

export async function nvidiaChat(
  messages: NvidiaChatMessage[],
  options: NvidiaChatOptions = {}
): Promise<{ content: string; raw: any }>; // raw = full JSON response
```

- Use NVIDIA’s `/v1/chat/completions` endpoint.
- Implement content extraction comparable to `extract_text_from_json` in `nvidia_v4.py` (handle `content` as string or list-of-parts).
- Basic error handling:
  - Throw/give structured errors for HTTP failures, including status and short body snippet.

### 2. Configuration Source

We want **one** clear place to define the default NVIDIA model.

Initial options (we can support both):

1. **Env-only** (simple):
   - `.env` keys (or server equivalent):
     - `NVIDIA_API_KEY=...`
     - `NVIDIA_MODEL_ID=deepseek-ai/deepseek-v3.1` (or any chosen default)

2. **Optional JSON config file** for future flexibility:
   - Example path (to be created if used):
     - `server/config/model_providers.json`
   - Example structure:

```json
{
  "nvidia": {
    "defaultModel": "deepseek-ai/deepseek-v3.1",
    "enabled": true
  }
}
```

**For Phase 1**: prioritize **env-based config**. JSON can be stubbed or left as a later enhancement.

### 3. Wiring into Existing LLM Routing (Minimal)

Pick **one** clear use case in Pixel Office where the NVIDIA model can be swapped in without massive refactors. Two good options:

1. Cooler Talk summarization / promotion helper.
2. A single “utility” summarizer used in server-side scripts.

For this brief, choose **one** and:

- Add a small wrapper function, e.g. `server/llm/nvidiaCoolerSummarizer.ts` **or** a general `server/llm/llmRouter.ts` that:
  - Accepts a prompt / message list.
  - Calls `nvidiaChat(...)` when config says the NVIDIA provider is active.
  - Otherwise falls back to existing OpenAI path (or vice versa).

Keep the selection logic simple for now:
- If `NVIDIA_API_KEY` + `NVIDIA_MODEL_ID` are present → NVIDIA is available.
- Otherwise, skip NVIDIA and use the existing provider.

### 4. UI Surface (Dropdown / Agent Assignment) – Minimal Hook

We do **not** need a full UI redesign. Phase 1 goal is:

- Add a minimal code path so we *could* expose NVIDIA as a model choice later.

Ideas:
- Extend an existing model list in the UI (if one exists) to include a `"NVIDIA: <modelId>"` entry **only when** the backend reports NVIDIA as available.
- Or just add a comment / TODO in the component where model dropdown is populated, referencing `nvidiaClient` and `NVIDIA_MODEL_ID` as the future hook.

If a dropdown already exists for agents or models, add a **single** entry for the chosen NVIDIA model and wire it through whatever model selection state is already in place. It’s okay if this is dev-only or behind a flag for now.

### 5. Reuse for pixel-me / pixeltroupe (Design Note)

Do not implement this now, but:
- Design the `server/llm/nvidiaClient.ts` so it has **no Pixel Office-specific assumptions**.
- Keep imports generic so that `pixel-me` and `pixeltroupe` can copy/reference this adapter later without dragging in unrelated dependencies.

A short design note at the top of `nvidiaClient.ts` explaining this intent is enough.

---

## Acceptance Criteria

1. **NVIDIA Client Works**
   - With valid `NVIDIA_API_KEY` and `NVIDIA_MODEL_ID` in env, calling `nvidiaChat([...])` returns assistant text for a simple test prompt.
   - Error conditions (bad key, bad model) surface a clear, debuggable message.

2. **Config is Centralized**
   - Default NVIDIA model is set in environment variables (and/or a single config JSON), not hard-coded in multiple places.
   - Pixel Office code that uses NVIDIA refers to this central config.

3. **Single Integration Point in Pixel Office**
   - At least one server-side path (e.g., a summarizer or cooler helper) can use the NVIDIA model by flipping configuration.
   - This path is easy to identify (well-named file and function) and doesn’t require editing many files.

4. **UI Ready Hook (Optional but Preferred)**
   - There is either:
     - A real dropdown entry for the NVIDIA model, OR
     - A clearly documented spot in the UI code where such an entry would be wired, pointing to the new adapter.

5. **No Regression to Existing OpenAI Behavior**
   - If `NVIDIA_API_KEY` is missing, Pixel Office still works exactly as before using the existing provider.

---

## Where to Document

- This file: `docs/active/opencode_nvidia_integration_spec.md` (source of truth for the brief).
- If the implementation adds notable behavior (e.g., a new env var), append a short note to any existing environment/config docs in `docs/` so Leslie can remember how to toggle providers.

The aim is a **small, clean, reversible** first step: one NVIDIA model, one adapter, one clear usage path in Pixel Office, with room to expand later into `pixel-me` and `pixeltroupe`. 
