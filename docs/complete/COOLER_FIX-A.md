You are implementing Phase 1 of the Pixel Office water cooler system.

GOAL
Fix the current dialogue problem where each agent says isolated observations like scripted actors. We want a simple chained conversation system where each line depends on either the topic or the immediately previous line.

IMPORTANT
Do NOT redesign the whole app.
Do NOT introduce TinyTroupe yet.
Do NOT add major new dependencies unless absolutely necessary.
Keep the implementation small, modular, and easy to test.

CURRENT PROBLEM
The existing cooler talk feature successfully gathers agents and displays speech bubbles, but the dialogue lacks conversational continuity. Each agent is effectively producing a standalone sentence. We need a minimal conversation controller that enforces turn-to-turn coherence.

PHASE 1 OBJECTIVE
Create a deterministic conversation chain layer for cooler talk sessions.

REQUIREMENTS
1. Every dialogue line must reference at least one of:
   - the session topic
   - the immediately previous line

2. Each line must have a lightweight conversational intent chosen from a controlled set, such as:
   - observe
   - ask
   - answer
   - joke
   - redirect
   - agree
   - disagree
   - escalate

3. Enforce these rules:
   - no two consecutive lines may both be plain observations unless the second explicitly responds to the first
   - at least one line in each session must be a question
   - at least one later line must answer or respond to that question
   - final line should either close, redirect, or lightly summarize the exchange

4. Keep output short enough for speech bubbles.
   Target roughly 6 to 14 words per line.

5. Preserve existing cooler talk flow:
   - button triggers session
   - agents gather around cooler
   - dialogue appears in bubbles
   - agents return to desks
   - session gets logged

6. Add structure to the log output so each utterance stores:
   - speaker
   - text
   - intent
   - reply_to index or null

DESIGN APPROACH
Implement a small conversation controller module that:
- selects speaker order
- tracks topic
- tracks prior utterances
- assigns allowed next intents
- builds the next prompt using:
  - current topic
  - speaking agent name
  - prior line
  - prior intent
  - simple session goal: casual but connected office chatter

Prefer a rules-first orchestration layer instead of freeform generation.

SUGGESTED IMPLEMENTATION
Create a new module, for example:
- server/conversation/coolerController.ts

This module should expose something like:
- createCoolerSession(topic, participants)
- generateInitialTurn(...)
- generateNextTurn(...)
- validateTurn(...)
- serializeSessionLog(...)

The controller should:
1. build a session state object
2. pick a speaker order
3. assign intents in a sensible chain
4. generate one utterance at a time
5. validate each utterance before accepting it
6. retry or repair if the utterance fails validation

VALIDATION RULES
Reject or repair a line if:
- it is too long
- it ignores both topic and previous line
- it is generic filler with no conversational link
- it breaks the question-response rule
- it duplicates a recent line
- it sounds like narration instead of speech

PROMPTING STRATEGY
When generating each line, do not ask the model for a whole conversation.
Ask for one line only.

Per-turn prompt should include:
- topic
- agent name
- last speaker
- last line
- required intent for this turn
- short constraint: respond naturally to the previous line or the topic
- word limit

Example idea:
"Topic: weird noise from the basement.
Previous line by FrontDesk: 'Did anyone else hear that bang downstairs?'
Your agent: IronClaw.
Required intent: answer.
Write one short spoken line that directly responds to the previous line. Max 12 words."

NON-GOALS
Do not add full persistent memory yet.
Do not integrate registrar or archivist deeply yet beyond improved logging shape.
Do not add personality schema enforcement yet, except maybe optional placeholders.
Do not implement SCRUM behavior here.

DELIVERABLES
1. Minimal modular code changes
2. Brief code comments explaining the controller
3. Updated API behavior if needed
4. Improved markdown log format
5. A short test plan covering:
   - normal session
   - duplicate/generic line rejection
   - question followed by answer
   - session closing line
   - multiple refresh cycles

SUCCESS CRITERIA
Phase 1 is successful if cooler talk now feels like an actual exchange instead of disconnected one-liners.

EXAMPLE TARGET SHAPE
Topic: that weird noise from the basement

- FrontDesk (ask): "Did anyone else hear that thump downstairs?"
- IronClaw (answer): "Yeah, sounded heavier than the pipes."
- Sherlobster (joke): "If it's a sea monster, I'm clocking out."
- OpenClaw (redirect): "Before panicking, did maintenance check it yesterday?"
- FrontDesk (agree): "Fair point, but it definitely wasn't normal."
- IronClaw (close): "Let's log it before it becomes tonight's problem."

OUTPUT FORMAT FOR YOUR RESPONSE
Please provide:
1. implementation plan
2. files to modify
3. exact code changes
4. any new helper functions
5. short rationale for each change

Keep it practical and patch-oriented.
