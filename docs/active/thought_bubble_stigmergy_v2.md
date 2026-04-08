# OpenCode Handoff Spec
## Feature: Thought Burst Visualization + Desk Monitoring + Public Speech Events

### Goal
Add a lightweight “thought burst” and “desk monitoring” layer to Pixel Office so agents can:
1. generate short internal thought drafts,
2. optionally promote those drafts into visible public speech bubbles,
3. allow nearby simulated office agents to emit visible response events,
4. show when an agent appears repetitive or stalled,
5. expose all of this in a simple operator-visible UI.

This should support the current design direction:
- short, bounded LLM calls instead of continuous long-form generation
- visible office traces that reflect agent activity
- public speech as a social event in the office
- simple configurable desk/agent monitoring

---

## Design Principle
Agents should work in **short visible thought bursts**, not indefinite background narration.

Preferred cycle:
- short thought burst
- inspect result
- optionally display public speech
- log desk state
- continue only if needed

This is intended as a UI/simulation layer for local model behavior, not hidden autonomous behavior.

---

## Part A — Agent Thought Burst Flow

### Add lightweight agent activity states
Suggested visible states:

- `idle`
- `thinking`
- `thought_ready`
- `speaking`
- `review_needed`
- `stalled`

### Thought burst behavior
Agents should use small bounded generations (short token budgets).
After each burst:
- store internal draft text
- optionally generate a shorter visible public version
- evaluate whether more output is useful

### Suggested thought output shape
```json
{
  "thought": "internal short draft",
  "public_candidate": true,
  "speech_text": "short visible office statement",
  "confidence": 0.78
}

Notes:

not every thought should become public speech
public speech should be shorter and cleaner than internal thought
only public speech is visible to nearby agents
Part B — Desk Activity Traces
Add lightweight desk-level office traces

Each desk/work area can accumulate visible status values such as:

review_heat
speech_activity
task_shadow
attention_marker
stall_marker

These should decay over time.

Suggested meanings
review_heat: this desk may need review or follow-up
speech_activity: recent public speech happened here
task_shadow: unfinished or interrupted work remains here
attention_marker: another office agent is observing or nearby
stall_marker: recent repetitive or low-progress output occurred
Visual treatment

Keep this simple:

mild glow around desk
small icon above desk
thought bubble vs speech bubble distinction
subtle desk pulse or badge

No heavy animation required on first pass.

Part C — Repetition / Stall Monitoring
Add a lightweight output monitor

Do not use heavy analysis first.
Start with simple heuristics.

Track things like:

repeated sentence count
repeated phrase / n-gram count
low novelty over recent output
repeated discourse markers
too many tokens with too little new information
Suggested monitor output

{
  "state": "healthy|stalled",
  "stall_score": 0.0,
  "novelty_score": 0.0,
  "reason": "brief explanation",
  "recommended_action": "continue|pause|summarize|retry"
}

Intended behavior

When repetitive or low-progress output is detected:

mark desk visually
expose status in the UI
optionally pause or summarize the burst
do not allow endless hidden output loops

Part D — Nearby Agent Response Events
Goal

If an agent posts a visible public speech bubble, nearby office agents may emit a visible response event.

Public speech event shape

{
  "speaker": "ZeroClaw",
  "location": "desk-3",
  "speech_text": "This repo status may need review.",
  "topic_tags": ["repo", "status", "review"],
  "social_weight": 0.62
}

Nearby response policy

Nearby agents may decide whether to respond based on:

proximity
role relevance
topic match
current workload
local desk/room heat
recent interaction fatigue
Visible response types

Reuse or adapt current office interaction styles:

acknowledge
answer
ask
redirect
agree
observe
ignore

Constraint:

nearby agents respond only to public speech, not hidden internal thought
Part E — Operator UI
Add a small “Thought Bursts / Desk Monitor” panel

Show:

active agent
current visible state
burst count
token budget
stall score
novelty score
whether public speech was posted
recent response events
recent monitor actions
Operator controls

Allow user to configure:

max burst tokens
repetition / stall threshold
novelty threshold
whether public speech is enabled
whether stall monitoring is passive or auto-pause
response event sensitivity
Helpful display areas
internal thought draft (optional debug view)
public speech stream
nearby response stream
desk activity indicators

Keep first pass lightweight and readable.

Part F — Terminal / Local Model Support
Immediate practical target

Support short local model calls (BitNet and similar) using bounded prompt execution.

Pattern:

build prompt with optional context text
run short burst
capture output
evaluate output
optionally convert to public speech
optionally trigger nearby response event
Context input support

Support:

inline prompt
prompt file
attached text document
chunked summaries for longer docs
Important rule

Do not dump very large documents directly into tiny local models.
Prefer:

chunk
summarize chunks
combine summaries
feed focused context into the short burst

Part G — Suggested Data Structures
Agent burst state

{
  "agent_id": "ZeroClaw",
  "state": "thinking",
  "burst_index": 3,
  "stall_score": 0.18,
  "novelty_score": 0.71,
  "public_candidate": true,
  "last_valid_point": "repo status likely needs review"
}

Desk activity state

{
  "desk_id": "desk-3",
  "review_heat": 0.30,
  "speech_activity": 0.66,
  "task_shadow": 0.51,
  "attention_marker": 0.24,
  "stall_marker": 0.10,
  "updated_at": "timestamp"
}

Public speech event

{
  "speaker": "ZeroClaw",
  "location": "desk-3",
  "speech_text": "This repo status may need review.",
  "topic_tags": ["repo", "status", "review"],
  "social_weight": 0.62
}

Part H — Implementation Order
Phase 1
add bounded thought burst model
add thought bubble vs speech bubble distinction
add simple repetition/stall heuristics
add desk activity values
add small monitor panel
Phase 2
allow nearby agents to emit visible response events
log monitor actions
expose configurable thresholds in UI
Phase 3
integrate desk activity into existing Cooler / SCRUM promotion logic
use desk heat/activity to influence follow-up selection
improve decay / social weighting
Constraints
keep changes additive
do not break existing Cooler / SCRUM behavior
do not introduce endless background generation
all model activity should remain bounded and visible
prefer cheap heuristics before expensive monitoring
Success Criteria

This feature is successful if:

agents use short visible thought bursts,
repetitive/stalled output is visibly detectable,
public speech bubbles can be emitted,
nearby agents can optionally emit response events,
desk activity reflects agent state,
the user can see and tune the system from the UI.
