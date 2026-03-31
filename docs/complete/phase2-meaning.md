PHASE 2: Intent Enforcement + Topic Anchoring + Anti-Repetition

GOAL
Fix the gap between structure and meaning.
The controller exists, but agents are still producing:
- unrelated lines
- incorrect intent usage
- repeated filler phrases

We now enforce semantic correctness.

---

CORE UPGRADES

1. STRICT INTENT VALIDATION

Add hard rules:

ASK:
- must be a question
- must contain "?" OR interrogative (who/what/why/how/did/etc)

ANSWER:
- must reference previous line (keywords or semantic match)
- must NOT be a question

AGREE:
- must reference previous line
- must include agreement signal (e.g. "yeah", "true", "good point")

REDIRECT:
- must bridge from previous line to new angle
- must still contain a keyword from topic OR previous line

ESCALATE:
- must increase urgency, importance, or action level
- no generic praise like "great teamwork"

JOKE:
- must reference topic or previous line (no random jokes)

OBSERVE:
- must reference topic directly

---

2. TOPIC ANCHORING (CRITICAL FIX)

Every utterance must include:
- at least ONE keyword from:
  a) topic
  OR
  b) previous line

Implement:
- extract simple keyword list from topic
- extract keywords from previous line
- require overlap

Reject if no overlap.

Example failure:
Topic: "weather"
Line: "We need to discuss the new strategy" → REJECT

---

3. ANTI-REPETITION MEMORY

Problem:
- "Anyone else hungry?"
- "Great teamwork everyone!"
- "Has anyone seen ClawGuard?"

Solution:

Maintain:
- per-session phrase memory
- short global memory (last ~20 lines)

Reject if:
- same line appears again
- OR high similarity (>0.8 fuzzy match)

Add simple cooldown:
- an agent cannot repeat same phrase across sessions

---

4. INTENT ↔ TEXT ALIGNMENT CHECK

After generation:

Validate:
- intent matches structure

Examples:
- ask without "?" → REJECT
- escalate without urgency → REJECT
- agree without reference → REJECT

If mismatch → retry

---

5. PROMPT HARDENING

Update per-turn prompt:

Include:

- topic
- previous line
- required intent
- REQUIRED constraint:
  "You MUST directly reference the previous line or topic"

Add:
"Do NOT change topic randomly"

Add:
"If you fail, your response will be rejected"

---

6. REPAIR STRATEGY (IMPORTANT)

If generation fails 3 times:

DO NOT fallback to generic filler.

Instead:
- force a minimal valid line using template:

Examples:
ASK:
"Did that noise come from the basement earlier?"

AGREE:
"Yeah, that basement noise definitely sounded unusual."

Keep it deterministic.

---

7. LOGGING IMPROVEMENT

Add flags:

```json
{
  "valid": true,
  "retries": 1,
  "rejected_reasons": []
}

```

This helps debug model behavior.

FILES TO MODIFY

server/conversation/coolerController.ts

enhance validateUtterance()

add keyword extraction

add repetition memory

add intent enforcement

(optional helper)

utils/textValidation.ts

SUCCESS CRITERIA

A session is successful if:

conversation stays on topic

lines reference each other

no repeated phrases

intents match actual language

no random jumps like "ping pong" or "hungry"

EXAMPLE TARGET OUTPUT

Topic: basement noise

FrontDesk (ask):
"Did anyone hear that noise from the basement earlier?"

IronClaw (answer):
"Yeah, that basement noise sounded heavier than usual."

Sherlobster (joke):
"If that basement noise is alive, I'm leaving."

OpenClaw (redirect):
"Should we check if maintenance logged that basement noise?"

LeslieClaw (agree):
"Yeah, tracking that basement noise makes sense."

IronClaw (escalate):
"We should inspect that basement noise before it worsens."

NON-GOALS

no personality system yet

no TinyTroupe

no memory system beyond repetition control

OUTPUT

Return:

exact code changes

updated validateUtterance logic

keyword extraction method

test cases

Keep it minimal and patch-based.
