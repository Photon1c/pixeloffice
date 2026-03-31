We need to improve Pixel Office CoolerSession conversation realism and coherence.

Current failure mode:
- Sessions can run with only one participant (e.g. FrontDesk only)
- Same speaker responds to itself repeatedly across multiple intents
- Validation/repair loops are producing generic, repetitive “assistant sludge”
- Conversations stay semantically on-topic but do not progress meaningfully
- We want future memory support, but first need stronger turn flow and anti-loop structure

Goal:
Make CoolerSession feel like a believable office micro-conversation, not a self-chatting validator loop.

Please implement the following in a surgical, minimal way without rewriting the entire system.

==================================================
PRIORITY 1 — PARTICIPANT / SPEAKER FLOW
==================================================

1. Add a preflight participant guard:
- If participant_count < 2, do NOT run normal CoolerSession
- Either:
  a) abort the session cleanly, OR
  b) route to a clearly different "SoloReflection" mode
- Normal CoolerSession should require at least 2 active participants

2. Add anti-self-loop speaker logic:
- Strongly penalize or disallow the same speaker replying to itself on consecutive turns
- Exception only if:
  - no other eligible participants exist, OR
  - explicit monologue/clarification mode is active
- Even in exception mode, cap self-followups to 1 max

3. Add participant diversity preference:
- Prefer speakers who have not spoken recently
- Penalize selecting the same speaker too frequently within the last 3 turns

==================================================
PRIORITY 2 — CONVERSATION PROGRESSION
==================================================

4. Add lightweight conversation progression tracking:
Track whether the conversation has meaningfully advanced across these possible moves:
- open / introduce
- react
- expand
- personalize
- challenge / complicate
- synthesize
- exit

5. Add a “topic advancement” score per turn:
Reward turns that add:
- a concrete example
- disagreement / tension
- consequence / implication
- humor / joke
- workplace-specific angle
- memory callback (future-safe)
- recommendation / decision

Penalize turns that are mostly:
- paraphrase
- generic agreement
- emotional filler
- restatement of prior point

Do not over-engineer this. A lightweight heuristic scorer is enough.

==================================================
PRIORITY 3 — VALIDATION / REPAIR CLEANUP
==================================================

6. Reduce repair loop sludge:
- Lower max retries from 5 to 2 (or similar)
- If a turn still fails after retry cap:
  - try a different intent, OR
  - try a different speaker, OR
  - skip the turn cleanly
- Avoid “valid but mushy” repaired filler

7. Add stronger repetition detection:
- Penalize turns that are semantically too similar to the last 2–3 turns
- Especially penalize repeated “I agree / absolutely / totally” patterns

==================================================
PRIORITY 4 — AGENT VOICE DIFFERENTIATION
==================================================

8. Add lightweight role voice constraints for each speaker.
At minimum define:
- preferred tone
- average sentence length
- preferred intents
- forbidden tone / things to avoid

Example:
FrontDesk:
- tone: friendly, casual, lightly social
- prefers: ask, observe, redirect
- avoids: formal policy speeches, overlong moralizing

Goal:
Different agents should not all sound like the same assistant.

==================================================
PRIORITY 5 — MEMORY-READY (BUT SAFE)
==================================================

9. Add a future-safe memory hook interface WITHOUT full memory behavior yet:
Support an optional “memory_candidates” input per turn like:
[
  {
    "memory_id": "m_104",
    "topic": "remote work scheduling",
    "reason_relevant": "similar to flexibility discussion",
    "reuse_type": "callback"
  }
]

But for now:
- memory should only act as optional context
- memory should NOT directly drive turn generation
- memory should NOT be allowed to force recursive callbacks

==================================================
SUCCESS CRITERIA
==================================================

A successful session should:
- involve 2+ actual participants
- avoid same-speaker self-chatter loops
- feel more like believable office conversation
- show visible progression, not just repeated agreement
- produce cleaner logs with fewer “retries: 5” style repair artifacts
- remain compatible with future bounded memory / episodic recall

Please make changes surgically and preserve the existing CoolerSession architecture where possible.
