We are ready to add the first stigmergic field to Pixel Office: Review Heat.

Goal:
Implement a WORKING PROTOTYPE tonight where cooler session conversations can generate a Review Heat signal, and that signal can trigger scrum follow-up behavior. Keep this tight, additive, and practical. Do not overbuild. Do not rewrite unrelated systems. Integrate into the current Pixel Office flow with the smallest clean patch set possible.

Context:
- Pixel Office already has:
  - 2D office simulation
  - agents moving around
  - cooler sessions / water cooler conversations
  - scrum session generation from conversations
  - GitHub-connected scrum flow
  - backend + frontend
  - MySQL-backed tasks/memory
- We are NOT building the full stigmergy engine tonight.
- We are ONLY building the first field: Review Heat.
- Review Heat should behave like a lightweight environmental trace that represents code review bottlenecks, review urgency, or review attention residue.

Definition:
Review Heat = a decaying signal tied to code-review-related conversational outcomes.
Examples:
- agents discussing PR backlog
- blocked review
- stale review
- “needs review”
- bottleneck around a repo / issue / PR / work item
- scrum triggered specifically because review pressure crossed a threshold

Scope for tonight:
1. Detect review-related topics from cooler sessions
2. Write a Review Heat trace/event into backend state
3. Surface Review Heat in the frontend visibly
4. Allow Review Heat to influence scrum generation
5. Keep all logic modular so other trace types can be added later

Required design:
Please implement this as a narrow vertical slice with the following pieces.

1) Backend Review Heat module
Create a small dedicated module/service for Review Heat.
Responsibilities:
- accept a cooler session result / summary / topic cluster
- determine whether review heat should be deposited
- store heat with:
  - source session id
  - optional repo / issue / PR reference if available
  - intensity
  - created_at
  - decay metadata or expiry
  - location anchor if relevant (water cooler, desk cluster, repo node, etc.)
- expose simple read API for current active Review Heat entries
- expose decay behavior in the simplest safe form:
  - either computed on read from timestamp
  - or background decay if that already fits existing architecture
Prefer computed-on-read for simplicity unless there is already a suitable scheduler.

2) Heat generation rules
Implement simple heuristic generation first, not a giant NLP framework.
Trigger Review Heat when cooler session content indicates things like:
- review backlog
- blocked PR
- waiting on approval
- stale review
- bottleneck
- merge delay
- unresolved code review
- repeated technical concern that maps to review attention
Use existing conversation/session summaries if available instead of reprocessing raw dialogue unnecessarily.
Start with transparent keyword/rule logic and keep it easy to inspect.

Example output shape:
{
  "trace_type": "review_heat",
  "source_session_id": "...",
  "intensity": 0.72,
  "topic": "stale PR review backlog",
  "target_ref": {
    "repo": "...",
    "issue": "...",
    "pr": "..."
  },
  "anchor": "water_cooler",
  "created_at": "...",
  "expires_at": "..."
}

3) Intensity logic
Use simple explicit scoring.
Example:
- base score from review-related keywords
- boost if multiple agents converge on same topic
- boost if same topic appears across multiple cooler sessions
- optional boost if connected to open GitHub work
Clamp to [0,1].

Do not overcomplicate this.
We need understandable behavior, not fake sophistication.

4) Scrum bridge
Integrate Review Heat into cooler sessions -> scrum generation.
Desired behavior:
- if a cooler session creates enough Review Heat, mark it as scrum-worthy
- if multiple review heat traces cluster around similar topic/repo/ref, increase chance of scrum creation
- pass review_heat context into the scrum payload so downstream systems know why the scrum was created
- include a human-readable reason, e.g.:
  "Scrum triggered due to elevated Review Heat around stale review backlog in repo X"

5) Frontend visualization
Add a minimal but clear visual treatment for Review Heat.
Keep it simple and legible.
Examples:
- warm pulsing aura around the water cooler after a qualifying conversation
- warm glow or badge in session cards / scrum cards
- small Review Heat panel showing active heat traces with intensity and decay time
Do not build an elaborate particle system tonight.
A compact, obvious visualization is enough.

6) Persistence
If there is an existing DB/event logging path, use it.
If schema changes are needed, keep them minimal.
Acceptable options:
- a new review_heat table
- or reuse an existing event/trace table if there is a natural fit
Need enough persistence so that:
- heat survives refresh/reload for prototype purposes
- decay can still be computed
- traces can be inspected later

7) Observability
Add lightweight logs/debug output for:
- when a cooler session deposits Review Heat
- why it was scored that way
- when Review Heat contributes to scrum creation
Make this easy to inspect tonight.

8) Constraints
- No broad refactor
- No premature generic “all pheromone engine” abstraction
- No giant ML dependency
- No breaking existing cooler session or scrum flow
- Keep code surgical and readable
- Prefer short modules and focused functions
- If a generic naming choice is needed, choose something that can later support other trace types, but do not build the whole future system now

Deliverables:
1. Working prototype code integrated into Pixel Office
2. Short note listing:
   - files added/changed
   - data model used
   - trigger rules
   - how to test it
3. One example scenario:
   - cooler session mentions review backlog
   - Review Heat deposited
   - UI shows heat
   - scrum gets triggered or flagged

Implementation suggestion:
Think in this sequence:
cooler session result
-> review heat detector
-> persisted heat trace
-> active heat query
-> scrum trigger hook
-> frontend glow/panel/badge

Success criteria for tonight:
- I can run Pixel Office
- create or observe a cooler session involving review backlog / blocked review
- see Review Heat appear in system state and/or UI
- see that it meaningfully influences scrum generation
- inspect logs showing the chain from conversation to heat to scrum

Please make the smallest solid implementation that achieves this end-to-end.
