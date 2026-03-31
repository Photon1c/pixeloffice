Implement SCRUM Phase 3A for Pixel Office as a strict workflow skeleton.

GOAL
Build the first SCRUM session system as a state-driven operational pipeline, not a freeform chat feature.

IMPORTANT
- Keep this minimal and patch-oriented.
- Do NOT add creative multi-agent dialogue.
- Do NOT integrate GitHub write actions yet.
- Do NOT redesign CoolerSession.
- Reuse existing architecture patterns where sensible, but SCRUM is a separate workflow from cooler talk.

CORE IDEA
SCRUM should progress through fixed stages with clear outputs:

1. check
2. report
3. review
4. decide
5. execute
6. log

This phase should use deterministic or mocked outputs where needed.
The purpose is to prove the session lifecycle, state progression, UI flow, and logging format.

REQUIREMENTS

1. Add a new SCRUM session flow triggered from the Pixel Office UI.
   Example button:
   - "SCRUM"

2. SCRUM must create a structured session object, for example:
   - session id
   - timestamp
   - topic
   - participants
   - current stage
   - stage outputs
   - final status

3. Implement these fixed stages:

CHECK
- agent: clerk or assigned repo-check role
- output: mocked repo state summary
- example:
  {
    "repo_status": "changes_detected",
    "findings": [
      "2 modified files",
      "1 untracked file",
      "tests not yet run"
    ]
  }

REPORT
- agent: clerk
- output: short summary derived from check stage

REVIEW
- agent: specialist
- output:
  {
    "approved": true,
    "risks": ["tests not run"],
    "recommended_actions": ["run tests", "review modified files"]
  }

DECIDE
- agent: executive or specialist
- output: one of
  - implement
  - defer
  - escalate
  - close

EXECUTE
- agent: clerk or maintenance role
- output: mocked action result only
- no real repo writes yet
- example:
  {
    "action": "run_tests",
    "status": "mock_complete"
  }

LOG
- agent: archivist
- output: serialized session log written to file

4. Enforce strict stage order.
- No skipping ahead
- No looping back
- No repeated report/review chains
- Session should move linearly from stage to stage

5. Add lightweight validation:
- each stage must produce the expected schema
- if invalid, mark session failed and log reason
- do not improvise around missing data

6. Logging
Write each SCRUM session to a dedicated markdown log and optionally JSON.
Include:
- session id
- topic
- participants
- each stage
- responsible agent
- structured output
- final decision
- final status

7. UI behavior
- Clicking SCRUM starts a visible session
- agents gather in meeting area or designated positions
- current stage is shown in UI
- when complete, agents return to desks
- no long chat bubbles required
- this should feel like a workflow board, not cooler banter

SUGGESTED FILES

New:
- server/scrum/scrumController.ts
- server/scrum/types.ts

Possible updates:
- server/index.ts
- src/components/PixelOffice.tsx
- src/utils/layout.ts
- docs/dev_logs/SCRUM_PHASE3A.md

SUGGESTED TYPES

```ts
type ScrumStage = "check" | "report" | "review" | "decide" | "execute" | "log";

interface ScrumStageResult {
  stage: ScrumStage;
  agent: string;
  output: unknown;
  valid: boolean;
  error?: string;
}

interface ScrumSession {
  id: string;
  timestamp: string;
  topic: string;
  participants: string[];
  currentStage: ScrumStage;
  results: ScrumStageResult[];
  finalStatus: "complete" | "failed";
}

```

IMPLEMENTATION GUIDELINES

Keep stage handlers as separate functions:

runCheckStage()

runReportStage()

runReviewStage()

runDecideStage()

runExecuteStage()

runLogStage()

Prefer deterministic mocked values in this phase.

Keep functions small and testable.

Add brief code comments only where useful.

NON-GOALS

no AI-generated dialogue

no TinyTroupe

no GitHub mutation

no repo write-back

no persistent task planner

no full personality logic

no recursive review loops

SUCCESS CRITERIA

This phase is successful if:

a SCRUM session runs from start to finish

stages appear in correct order

outputs are structured and logged

UI can show session progression

no conversational drift occurs

OUTPUT FORMAT FOR YOUR RESPONSE

Please provide:

implementation plan

files to create or modify

exact code changes

any schemas or helper functions

short test plan

Keep it practical, brief, and patch-based.
