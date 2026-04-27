# OpenCode Handoff: Bender v2 Agent Harness (Pixelworld Tools)

Date: 2026-04-25

## Goal
Tighten the existing **Bender v2** Playwright harness and expose a clean, minimal interface so:

1. OpenCode flows can run deterministic Bender test sequences (headless Playwright).
2. Other agents (e.g. Cloudflare/remote agents) can drive Bender via a small set of **CLI-style commands** instead of brittle ad-hoc scripts.

We already have:
- `~/tools/bender/index_v2.html` – browser demo with `window.benderAgent` (v2 bridge).
- `~/tools/bender/playwright_bender_harness.js` – current harness.
- `~/tools/bender/README_bender_agent.md` – API overview + usage notes.

Do **not** rebuild Bender. This handoff is about:
- making the harness more **structured and resilient**, and
- adding a couple of **agent-friendly entrypoints** (CLI/JSON) that OpenCode and external agents can call.

---

## Desired Capabilities

### 1. Deterministic Playwright Harness (v2.1)

Tighten `playwright_bender_harness.js` so it:

- Uses a **structured step log**:
  - Each step produces `{ step, ok, result?, error? }`.
  - Final output is a single JSON object printed to stdout, e.g.:
    ```json
    {
      "ok": true,
      "url": "http://localhost:8080/index_v2.html",
      "steps": [
        {"step": "ping", "ok": true, "result": {"ok": true, "version": "v2"}},
        {"step": "resetScene", "ok": true},
        {"step": "addPrimitive:cube", "ok": true, "result": {"objectId": "obj_..."}},
        {"step": "setMode:Edit", "ok": true},
        {"step": "screenshot", "ok": true, "path": "bender_runs/step_01.png"}
      ]
    }
    ```

- Takes **CLI args** for:
  - `--url` (default `http://localhost:8080/index_v2.html`)
  - `--headless=true|false` (default true)
  - `--steps=<json>` optional list of benderAgent actions, e.g.:
    ```bash
    node playwright_bender_harness.js \
      --steps='[{"action":"resetScene"},{"action":"addPrimitive","args":["cube"]}]'
    ```

- Handles missing API methods gracefully:
  - If `window.benderAgent` is missing, return `ok:false` with a clear error.
  - If a particular method (e.g. `addPrimitive`) is missing, mark that step as `{ok:false, error:"addPrimitive not available"}` but keep the run going.

- Creates/uses `bender_runs/` under `~/tools/bender/` for:
  - Screenshots
  - Optional logs

**Where:**
- Keep the file at: `~/tools/bender/playwright_bender_harness.js`

---

### 2. JSON Command Schema for Agents

Define a small JSON command schema that all agents can share when talking to Bender via `window.benderAgent`:

```json
{
  "version": "v1",
  "steps": [
    {"action": "resetScene"},
    {"action": "addPrimitive", "args": ["cube"]},
    {"action": "setMode", "args": ["Edit"]},
    {"action": "runCommand", "args": ["addSphere"]},
    {"action": "screenshot", "path": "bender_runs/step_01.png"}
  ]
}
```

Mapping rules inside the harness:

- `resetScene` → `window.benderAgent.resetScene()`
- `addPrimitive` → `window.benderAgent.addPrimitive(type)`
- `setMode` → `window.benderAgent.setMode(mode)`
- `runCommand` → `window.benderAgent.runCommand(cmd)`
- `getState` → `window.benderAgent.getState()` (attach to `result`)
- `screenshot` → Playwright screenshot to `path` (default `bender_runs/<timestamp>.png`)

Anything unknown should become a `{ok:false, error:"Unknown action"}` step.

---

### 3. CLI Wrapper Script(s) for Agents & Cloudflare Workers

Add a **thin CLI wrapper** around the Playwright harness so non-Node agents (e.g. Cloudflare Workers, other Orchestrators) can call one of a few stable shell commands instead of embedding harness logic themselves.

Create a small Node CLI script, for example:

- `~/tools/bender/bender_cli.js`

Behavior:

- Subcommands:
  - `bender_cli.js ping` → sanity-check harness & agent API.
  - `bender_cli.js run --steps '<json>'` → runs arbitrary JSON steps via the harness.
  - `bender_cli.js sample` → runs a canned sequence (reset → add cube → set edit mode → screenshot).

- Output: always a single JSON object to stdout, suitable for:
  - OpenCode
  - Cloudflare/remote agents
  - shell pipelines (`jq`, etc.)

Example usage:

```bash
# Simple readiness check
node bender_cli.js ping | jq .

# Run a custom sequence
node bender_cli.js run \
  --steps='[{"action":"resetScene"},{"action":"addPrimitive","args":["cube"]}]'
```

**Note:** This CLI can simply **shell out to** `playwright_bender_harness.js` under the hood and normalize the output.

---

### 4. OpenCode Integration Hints

Once the harness + CLI are stable, typical OpenCode flows should:

1. Treat Bender as an **external tool**:
   - Command: `node /home/sherlockhums/tools/bender/bender_cli.js run --steps '<json>'`
   - Expected output: JSON with `steps[]`, plus any screenshots.

2. Use Bender as a visualization or geometry sandbox for:
   - Quick 3D mockups the agent wants to generate.
   - Sanity-checking spatial reasoning tasks.

3. Keep configs simple:
   - Hard-code the Bender tool path in a small handoff document or skills file.
   - Let OpenCode agents propose `steps[]` but keep execution via the CLI.

---

### 5. Cloudflare / Remote Agent Usage

For remotely hosted agents (Cloudflare Workers, etc.) that can’t run Playwright directly:

- They can call a local **HTTP endpoint** (future work) or a **queued command** that runs:
  ```bash
  node /home/sherlockhums/tools/bender/bender_cli.js run --steps '<json>'
  ```
- Return the JSON result and (optionally) upload screenshots somewhere reachable.

This handoff does **not** require implementing the HTTP layer yet, but the CLI should be designed with that in mind:
- All results JSON-serializable.
- No interactive prompts.

---

## Acceptance Criteria

- `playwright_bender_harness.js`:
  - Accepts `--url`, `--headless`, and `--steps`.
  - Produces a single well-formed JSON object on stdout.
  - Handles missing `window.benderAgent` or missing methods without crashing.
  - Saves screenshots under `bender_runs/` when asked.

- `bender_cli.js`:
  - Provides `ping`, `run`, and `sample` commands.
  - Delegates to the harness and normalizes output.
  - Suitable for use by OpenCode flows and remote agents.

- `README_bender_agent.md` updated to:
  - Document the harness flags.
  - Document the JSON step schema.
  - Show example CLI invocations for OpenCode/Cloudflare‑style agents.
