# Pixel Office "Inference Engine" Metrics

Goal: give Leslie a live dashboard that shows, per agent, how much they are **thinking** (inner narration) versus **speaking** (outer narration), and how agents are routing work between each other.

This builds on the existing Pixel Office metrics endpoint (`/metrics`, Prometheus exposition via `prom-client`) described in `docs/pixel_office_metrics_spec.md`.

## 1. Metrics Schema

### 1.1 Per-agent narration

Single counter with a `channel` label to keep cardinality low:

```text
pixel_office_agent_tokens_total{agent, channel}
```

- **Type:** Counter
- **Labels:**
  - `agent`: logical agent name (e.g. `frontdesk`, `sherlock`, `zeroclaw`, `hermit`, `prawnro`).
  - `channel`: `"inner"` or `"outer"`.
- **Meaning:**
  - `channel="inner"`: tokens spent on hidden reasoning, tool orchestration, and other non-user-visible cognitive work for that agent.
  - `channel="outer"`: tokens that turned into user-visible text (messages sent back to the human or to external systems).

Optional, if we want counts as well as tokens:

```text
pixel_office_agent_messages_total{agent, channel}
```

- **Type:** Counter
- **Labels:**
  - `agent`
  - `channel` in `{"incoming", "outgoing"}`
- **Meaning:**
  - `incoming`: messages received from the human or upstream orchestrator.
  - `outgoing`: messages sent by this agent.

### 1.2 Per-agent tool usage

```text
pixel_office_agent_tool_calls_total{agent}
```

- **Type:** Counter
- **Labels:**
  - `agent`
- **Meaning:** number of tool calls or sub-agent invocations initiated by this logical agent.
- **Note:** if we later need more detail, we can add a coarse `tool_kind` label (e.g. `"github"`, `"browser"`, `"tts"`), but avoid high-cardinality labels.

### 1.3 Agent-to-agent routing

Reuse and specialize the metric hinted at in `pixel_office_metrics_spec.md`:

```text
pixel_office_routes_total{from_agent, to_agent}
```

- **Type:** Counter
- **Labels:**
  - `from_agent`: agent handing off work.
  - `to_agent`: agent receiving work.
- **Meaning:** number of routing hops observed between agents over time.

This, combined with `pixel_office_agent_tokens_total`, gives a graph of who is thinking a lot vs. who is mostly relaying/terminating work.

## 2. Instrumenting a Single Agent Call (Node/TypeScript Sketch)

Assumes:

- Pixel Office backend already exposes `/metrics` with `prom-client`.
- Each request has a notion of `logicalAgent` (the office worker handling the step).
- The LLM provider returns token usage metadata, or we can approximate tokens from string length as a fallback.

### 2.1 Metric definitions

In a metrics module (e.g. `metrics/agent.ts`):

```ts
import client from 'prom-client';

export const agentTokens = new client.Counter({
  name: 'pixel_office_agent_tokens_total',
  help: 'Tokens by agent and channel (inner vs outer narration).',
  labelNames: ['agent', 'channel'] as const,
});

export const agentMessages = new client.Counter({
  name: 'pixel_office_agent_messages_total',
  help: 'Messages by agent and direction (incoming vs outgoing).',
  labelNames: ['agent', 'channel'] as const, // channel in ['incoming', 'outgoing']
});

export const agentToolCalls = new client.Counter({
  name: 'pixel_office_agent_tool_calls_total',
  help: 'Tool calls initiated by an agent.',
  labelNames: ['agent'] as const,
});

export const agentRoutes = new client.Counter({
  name: 'pixel_office_routes_total',
  help: 'Routing hops between agents.',
  labelNames: ['from_agent', 'to_agent'] as const,
});
```

Ensure these metrics are registered with the same `Registry` you use for the existing `/metrics` endpoint.

### 2.2 During routing (agent-to-agent handoff)

Wherever Pixel Office decides the next agent for a task:

```ts
import { agentRoutes } from './metrics/agent';

function routeTask(fromAgent: string, toAgent: string, task: TaskPayload) {
  agentRoutes.inc({ from_agent: fromAgent, to_agent: toAgent });
  // existing routing logic...
}
```

### 2.3 During an agent LLM call

A simplified sketch for a single logical agent step:

```ts
import { agentTokens, agentMessages, agentToolCalls } from './metrics/agent';

async function runAgentStep(logicalAgent: string, input: string): Promise<string> {
  // Count the incoming message
  agentMessages.inc({ agent: logicalAgent, channel: 'incoming' });

  // Build prompts (system, context, tools etc.)
  const internalContext = buildInternalContext(logicalAgent, input); // not shown to user
  const userFacingPrompt = buildUserFacingPrompt(input); // parts that will inform visible output

  // Approximate token counts for prompts (replace with provider usage when available)
  const internalPromptTokens = approximateTokens(internalContext);
  const visiblePromptTokens = approximateTokens(userFacingPrompt);

  // All prompt tokens are effectively "inner" thinking, since they are consumed by the model.
  // If you want a finer split, you can separate system/tool context vs. raw user content.
  agentTokens.inc({ agent: logicalAgent, channel: 'inner' }, internalPromptTokens + visiblePromptTokens);

  // Call the model
  const completion = await callModel({
    context: internalContext,
    prompt: userFacingPrompt,
  });

  const outputText = completion.text;
  const completionTokens = completion.usage?.completionTokens
    ?? approximateTokens(outputText);

  // Completion tokens are our "outer" narration
  agentTokens.inc({ agent: logicalAgent, channel: 'outer' }, completionTokens);

  // Count outgoing message
  agentMessages.inc({ agent: logicalAgent, channel: 'outgoing' });

  return outputText;
}
```

**Notes:**

- For providers that return detailed `usage` metadata (prompt vs completion tokens), you can map more precisely:
  - Treat **prompt tokens** as inner narration.
  - Treat **completion tokens** as outer narration.
- If you have explicit "thinking" channels (e.g. a hidden reasoning stream vs. a user-visible stream), you can split prompt tokens into `channel="inner"` vs `"outer"` more accurately.

### 2.4 During tool calls / sub-agent invocations

Where an agent invokes a tool or sub-agent:

```ts
import { agentToolCalls } from './metrics/agent';

async function callToolAsAgent(logicalAgent: string, toolName: string, args: any) {
  agentToolCalls.inc({ agent: logicalAgent });
  // Optionally log toolName elsewhere; avoid making it a label unless the set is very small.
  return actualToolCall(toolName, args);
}
```

## 3. Dashboard Sketch (Grafana)

Once Alloy/Prometheus scrape `/metrics` from Pixel Office, a minimal "inference engine" dashboard can be:

1. **Inner vs outer narration per agent (last 15 minutes)**
   - Query: `sum by (agent, channel) (rate(pixel_office_agent_tokens_total[15m]))`
   - Visualization: stacked bar or grouped bar chart.

2. **Tool usage per agent**
   - Query: `sum by (agent) (rate(pixel_office_agent_tool_calls_total[15m]))`
   - Visualization: bar chart.

3. **Agent handoff matrix**
   - Query: `sum by (from_agent, to_agent) (rate(pixel_office_routes_total[15m]))`
   - Visualization: heatmap or matrix panel.

Together, these give a live sense of:

- Which agents are doing the most cognitive work (inner tokens).
- Which agents are producing the most outward narration (outer tokens).
- How work is flowing between agents over time.
