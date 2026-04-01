What you want is not raw “memory,” but bounded memory with decay and relevance gates. Otherwise Cooler Session turns into agents chewing the same rug forever.

The double edge is:

too little memory → conversations feel disposable and fake
too much memory → conversations become recursive sludge, in-jokes, fixation loops, and self-reference spirals
Best approach

Give them selective recall, not full transcript recall.

A good structure is:

1. Short-term memory

Only the last few turns of the current conversation.

Use this for:

coherence
answering direct follow-ups
maintaining topic continuity
2. Episodic memory

A small summary of past conversations, not the raw text.

Store things like:

topic
sentiment
unresolved question
notable conclusion
recurring tension
who said what that mattered

Example:

{
  "topic": "local models for clerk roles",
  "summary": "Agents agreed smaller obedient models outperform chatty thinkers for clerk work.",
  "open_loop": "Need to test another 1B-class model.",
  "importance": 0.74,
  "timestamp": "2026-03-30"
}
3. Decay / freshness

Old memories should weaken unless reinforced.

That keeps the office from acting haunted by every prior water cooler chat.

The trick that prevents circular loops

Before an agent reintroduces an old topic, require a reason.

For example, only allow memory recall if one of these is true:

the current topic is semantically similar
the old topic was unresolved
a new event changes the meaning of the old topic
another agent explicitly asks about it
the memory has high importance

So instead of:

“Remember when we talked about X?”
“Yes, remember when we talked about remembering X?”

You get:

“This reminds me of our earlier discussion about clerk-model reliability because we never resolved the benchmark gap.”

That is recursion with purpose, not recursion as mold.

Add anti-loop safeguards

You probably want at least these:

Repetition detector

If the current exchange is too similar to a recent one, block or reroute it.

Memory cooldown

A recalled memory cannot be reused again for N turns unless new information is added.

Novelty threshold

A recalled topic must contribute something new:

new evidence
new interpretation
new decision
new tension
Loop counter

Track how many times the same topic orbit has repeated in one session.
If it crosses a threshold:

force topic shift
inject a new observation
end the conversation naturally
Best design principle

Treat memory like fuel, not like terrain.

Too much terrain and they get trapped in it.
Fuel helps them push a conversation forward.

So each recalled memory should answer:

Why is this relevant now?
What does it change?
What new move does it enable?

If the answer is “nothing,” don’t surface it.

A strong minimal model

For Cooler Session, I’d start with each agent having:

{
  "working_memory": [],
  "episodic_memories": [],
  "recent_topics": [],
  "recalled_memory_ids": [],
  "loop_risk_score": 0.0
}

And each memory entry having:

{
  "id": "mem_0142",
  "topic": "role-model mapping",
  "summary": "Night-auditor was repeatedly better for custodian tasks.",
  "importance": 0.81,
  "novelty": 0.35,
  "last_used_turn": 18,
  "times_recalled": 1,
  "open_loop": true
}

Then only recall if:

relevance > threshold
cooldown passed
times_recalled below cap
loop_risk_score below threshold

That will get you most of the benefit without the rot.

My blunt recommendation

Do not start by giving them full conversational memory.

Start by giving them:

memory summaries
open loops
cooldowns
repetition blocking

That’s enough to make them feel like they remember, without letting them disappear into self-licking ice cream cone behavior.
