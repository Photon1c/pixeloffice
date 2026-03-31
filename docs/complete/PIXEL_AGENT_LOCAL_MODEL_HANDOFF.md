# OpenCode Handoff: Wire Local Benchmark Winners into Pixel Agents

## High-level Goal

Use the **locally benchmarked winning models** (e.g., `physics-assistant`, `night-auditor`) from the model_foundry benchmarks to power **real pixel agents** inside the Pixel apps (`~/apps/pixelworld/`, especially `pixeltroupe` and pixel_office / pixel-me later).

We already have:
- A repeatable local-model workflow on the VPS using `llama.cpp` / related tooling.
- Benchmark results in `~/projects/model_foundry/scripts/pixel_office_hr_report.json` that identify strong candidates for the four agent roles (Custodian, Clerk, Specialist, Executive).
- A role-based YAML architecture (`AGENTLIGHTNING_ROLE_ARCHITECTURE.yaml`) and implementation handoff for AgentLightning in `pixeltroupe`.

This document tells you how to **connect those dots** so that Pixel agents are backed by the benchmark winners instead of ad-hoc model choices.

---

## Source of Truth: Benchmark Results

**File:** `~/projects/model_foundry/scripts/pixel_office_hr_report.json`

- Contains evaluation metadata for multiple models (e.g., Blaze-3B, Gemma-1B, Qwen-0.8B, and the `physics-assistant` / `night-auditor` models not shown in the sample snippet).
- Each model has:
  - `model_name`
  - `provider` (e.g., `ollama`)
  - `tests` keyed by question (Q1–Q5) with:
    - `role` (Custodian, Clerk, Clerk+, Specialist, Executive)
    - `passed` (boolean)
    - `raw_output`
    - `latency_ms`
  - `recommended_role` summarizing where this model performed best.

**Assumption (per Leslie):**
- `physics-assistant` and `night-auditor` are top performers across the relevant roles and should be treated as **preferred local models** for mapping into the four-role architecture.

Your job is to:
1. Parse these benchmark results programmatically.
2. Select the appropriate local model **per role**.
3. Expose those selections as concrete endpoints that Pixel agents and AgentLightning can call.

---

## Role Mapping Strategy

Roles (from `AGENTLIGHTNING_ROLE_ARCHITECTURE.yaml`):
- Custodian – monitoring and validation
- Clerk – classification / routing / extraction
- Specialist – transformations / summarization
- Executive – synthesis and decision-making

**Target mapping (to be refined by reading the JSON):**
- Use `night-auditor` as a strong candidate for **Clerk/Specialist**-style structured tasks.
- Use `physics-assistant` as a strong candidate for **Specialist/Executive**-style reasoning where its domain and behavior fit.

Implementation details:
1. Write a small helper module in `~/projects/model_foundry/scripts/` (or a sensible shared lib under `model_foundry`) that:
   - Loads `pixel_office_hr_report.json`.
   - For each role (Custodian, Clerk, Specialist, Executive), finds one or more models with:
     - `tests[*].passed == true` for that role’s questions.
     - Reasonable `latency_ms`.
     - If present, `recommended_role` matching the role.
   - Emits a **compact mapping structure**, e.g.:

   ```json
   {
     "custodian": { "model_name": "night-auditor", "provider": "ollama" },
     "clerk":     { "model_name": "night-auditor", "provider": "ollama" },
     "specialist":{ "model_name": "physics-assistant", "provider": "ollama" },
     "executive": { "model_name": "physics-assistant", "provider": "ollama" }
   }
   ```

2. Save this mapping to a file consumable by Pixelworld apps, e.g.:
   - `~/apps/pixelworld/model_role_mapping.json`

This keeps **role → model** mapping explicit and versionable.

---

## Integration with Pixelworld (`~/apps/pixelworld/`)

### 1. Central config for local model endpoints

Create a small shared config module in `~/apps/pixelworld/` (or an appropriate subdir, e.g., `pixelworld_core/`) that:

- Loads `model_role_mapping.json`.
- For each entry, constructs the actual call configuration required by the runtime (e.g., `ollama` endpoints, `llama.cpp` path, etc.).

Example (pseudocode / TypeScript-like):

```ts
// pixelworld/models/roleModels.ts
import mapping from "../../model_role_mapping.json";

export type RoleId = "custodian" | "clerk" | "specialist" | "executive";

export interface RoleModelConfig {
  role: RoleId;
  provider: "ollama" | "llama_cpp" | "remote";
  modelName: string;        // e.g., "physics-assistant"
  endpoint: string;         // e.g., "http://localhost:11434" or socket path
  params?: {
    temperature?: number;
    max_tokens?: number;
  };
}

export function getRoleModelConfig(role: RoleId): RoleModelConfig {
  const entry = (mapping as any)[role];
  if (!entry) {
    throw new Error(`No model mapping defined for role: ${role}`);
  }

  // Map provider/model_name to a usable runtime config.
  // 
  // For ollama-based models:
  return {
    role,
    provider: "ollama",
    modelName: entry.model_name,
    endpoint: process.env.OLLAMA_ENDPOINT || "http://localhost:11434",
    params: {
      temperature: 0.2,
      max_tokens: 1024,
    },
  };
}
```

**Goal:** Anywhere in Pixelworld that needs “the Clerk model” or “the Specialist model” can ask for it via a role, not a hard-coded model name.

---

### 2. Wiring into Pixel Agents (Pixeltroupe first)

Focus initially on `pixeltroupe` within `~/apps/pixelworld/`.

Tasks:
1. Identify where agents/tools are currently calling models:
   - Search for direct references to model names (e.g., `gpt-5.1`, `qwen`, `ollama`, etc.).
   - Identify the abstraction point where agent logic calls out to a model-running service or client.

2. Introduce a role-aware call path:
   - Instead of `callModel("some-model-name", prompt)`, use:

   ```ts
   import { getRoleModelConfig } from "../models/roleModels";

   const clerkModel = getRoleModelConfig("clerk");
   const result = await callModel(clerkModel, prompt);
   ```

   - Implement `callModel(config: RoleModelConfig, prompt: string, extras?: any)` in one shared place.

3. Map specific pixel agents to roles:
   - For example, in `pixeltroupe`:
     - A **log classifier** agent → role `clerk`.
     - A **summary generator** agent → role `specialist`.
     - A **policy checker** agent → role `custodian`.
     - A **planning/coordination** agent → role `executive`.

4. Ensure that, when running locally on the VPS:
   - `night-auditor` and `physics-assistant` are available via the chosen provider (e.g., `ollama run physics-assistant` works).
   - Environment variables or config files point Pixelworld to the correct endpoint.

---

### 3. Hooking into AgentLightning configs

We already have `AGENTLIGHTNING_ROLE_ARCHITECTURE.yaml` (now reordered to live under the pixeltroupe `/dev` folder per Leslie’s re-org).

Tasks for OpenCode:
1. Update or regenerate `AGENTLIGHTNING_ROLE_ARCHITECTURE.yaml` values so that:
   - The `model` section for each role points **logically** to the correct provider/model pair, e.g.:

   ```yaml
   model:
     kind: ollama
     model_name: physics-assistant
     endpoint: http://localhost:11434
   ```

   - Use the role → model mapping derived from `pixel_office_hr_report.json` as the source of truth.

2. Ensure that AgentLightning’s internal representation of roles reads from the same mapping/config used by Pixelworld core (`roleModels.ts` or equivalent), so we don’t diverge.

3. In the AgentLightning UI, surface which local model backs each role, using the info from the YAML / mapping.

---

## Definition of Done

This handoff is complete when:

1. `pixel_office_hr_report.json` is parsed by a small utility that emits a **role → model** mapping (including `physics-assistant` and `night-auditor`).
2. There exists a shared config file in `~/apps/pixelworld/` (e.g., `model_role_mapping.json` + a small helper module) that code can use to get `RoleModelConfig` for `custodian`, `clerk`, `specialist`, and `executive`.
3. `pixeltroupe` uses these role-based configs for at least one or two concrete agents (e.g., Clerk for classification and Specialist for summarization), verifying that calls go through the locally benchmarked models.
4. AgentLightning’s role architecture YAML is updated to reference the same model choices, and its UI can display, for each role, which local model is currently assigned.

Once this is in place, future work can:
- Swap models per role by editing a single mapping / config file.
- Extend the benchmark process to update mappings automatically.
- Attach more complex workflows across pixeltroupe, pixel_office, and pixel-me using these roles as building blocks.
