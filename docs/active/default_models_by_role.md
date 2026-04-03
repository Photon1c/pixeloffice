GLM = Front Desk Clerk
Gemma 4 = Executive + Specialist

Now the real job is to define the workload schema so Pixel Office can route work without every agent inventing its own rules.

Here’s the practical way to lock it down.

Start with 3 layers
1. Work item

This is the task itself.

Use fields like:

{
  "id": "task-001",
  "title": "Review wellness conversation",
  "description": "Check whether cooler session should trigger scrum follow-up",
  "source": "cooler_session",
  "source_ref": "ct-1774844039779",
  "task_type": "review",
  "priority": "medium",
  "urgency": 0.52,
  "complexity": 0.44,
  "stakes": "low",
  "visibility": "internal",
  "requires_speed": true,
  "requires_judgment": true,
  "requires_specialist": false,
  "domain": "workflow",
  "status": "queued"
}

This is the universal object everything else hangs off.

2. Routing metadata

This tells the office who should touch it.

{
  "recommended_role": "frontdesk",
  "fallback_role": "executive",
  "specialist_role": null,
  "routing_reason": [
    "low stakes",
    "needs fast summary",
    "source is conversational"
  ]
}

This is where your GLM/Gemma split becomes real.

3. Execution contract

This defines what the model is expected to return.

{
  "expected_output": "decision_note",
  "output_format": "json",
  "must_include": [
    "summary",
    "decision",
    "confidence",
    "follow_up_needed"
  ],
  "max_response_tokens": 300
}

This prevents drift.

The minimum fields I’d add to Pixel Office

If you want something universal, don’t overbuild it yet. Add only what improves routing.

Core fields
{
  "task_type": "review | summarize | route | decide | execute | log | escalate",
  "domain": "workflow | technical | research | social | ops | security",
  "stakes": "low | medium | high",
  "complexity": 0.0,
  "urgency": 0.0,
  "requires_speed": true,
  "requires_judgment": false,
  "requires_specialist": false,
  "requires_memory": false,
  "requires_tools": false,
  "privacy_level": "internal | sensitive | public",
  "expected_output": "summary | json | plan | decision_note | action_list",
  "status": "queued | assigned | in_progress | blocked | done"
}

That’s enough to drive a lot of behavior.

How to map this to your roles
GLM front desk clerk should get:
low/medium stakes
high-speed tasks
conversational intake
initial summaries
first-pass routing
simple structured extraction
Rule of thumb:

If the task is mostly ingest, classify, summarize, or redirect, send it to GLM.

Gemma 4 executive should get:
decisions
arbitration
prioritization
escalation review
follow-up approval
policy-ish judgment calls
Rule of thumb:

If the task asks what should happen next, send it to Gemma executive.

Gemma 4 specialist should get:
domain-specific analysis
technical judgment
schema validation
deeper internal reasoning
sensitive/private work
Rule of thumb:

If the task needs careful interpretation inside one domain, send it to Gemma specialist.

Simple routing logic

You can express it almost as a table:

Fast + low stakes + intake          -> GLM Front Desk
Fast + structured extraction        -> GLM Front Desk
Decision + prioritization           -> Gemma Executive
Domain-specific analysis            -> Gemma Specialist
Sensitive/private/internal fallback -> Gemma Local
The most useful extra field to add

If you only add one smart field, add:

"workload_mode": "intake | triage | judgment | specialist | execution | audit"

Why this helps:

it is more operational than “task_type”
it maps directly to roles
it gives you a strong dashboard grouping

Example:

intake → GLM
triage → GLM or executive
judgment → executive
specialist → specialist
execution → tool/worker
audit → executive or archivist
A stronger universal schema starter

This is the one I’d actually use first:

{
  "id": "task-001",
  "title": "Review wellness conversation",
  "source": "cooler_session",
  "source_ref": "ct-1774844039779",
  "task_type": "review",
  "workload_mode": "triage",
  "domain": "workflow",
  "priority": "medium",
  "urgency": 0.52,
  "complexity": 0.44,
  "stakes": "low",
  "requires_speed": true,
  "requires_judgment": true,
  "requires_specialist": false,
  "requires_tools": false,
  "requires_memory": true,
  "privacy_level": "internal",
  "recommended_role": "frontdesk",
  "fallback_role": "executive",
  "expected_output": "decision_note",
  "output_format": "json",
  "status": "queued"
}

That’s enough to power routing, logging, and review.

What you probably still need to add in Pixel Office

From the way you work, I suspect these are the missing pieces:

1. decision pressure
How badly does this need a judgment call versus mere summarization?

"decision_pressure": 0.78

2. ambiguity
How unclear is the request?

"ambiguity": 0.61

3. escalation threshold
At what point should front desk stop and hand it up?

"escalation_threshold": 0.70

4. review heat
You already care about this. That can become a routing signal.

"review_heat": 0.83

That one can push conversational items from intake into executive review.

Best visualization to lock this down

Don’t start with a fancy diagram. Start with a routing matrix.

Example
Workload mode	Speed need	Judgment need	Specialist need	Best role
intake	high	low	low	GLM Front Desk
triage	high	medium	low	GLM Front Desk
judgment	medium	high	low	Gemma Executive
specialist	low	high	high	Gemma Specialist
audit	low	high	medium	Gemma Executive

That table will clarify the schema faster than prose.

My blunt recommendation

Do not try to make the universal schema perfect yet.

Just make it good enough to answer:

what kind of work is this
how risky is it
how fast does it need to move
who should own it
what output shape is required

If your schema answers those five, Pixel Office becomes much easier to scale.

If you want, I can turn this into a compact Pixel Office workload schema v1 JSON spec plus a role-routing matrix.

Your last message used about 70–95 tokens.
