# COOLER_FIX-A: Chained Conversation System

**Date:** 2026-03-17
**Feature:** Water Cooler Chained Conversation Controller
**Requirement:** Phase 1 - Fix isolated dialogue problem

## Problem

The original cooler talk feature produced isolated, disconnected statements. Each agent generated dialogue independently without reference to what others said, making conversations feel like scripted monologues rather than exchanges.

## Solution

Created a conversation controller module that orchestrates turn-by-turn dialogue with enforced coherence rules.

## Implementation

### New File: `server/conversation/coolerController.ts`

**Core Functions:**
- `createCoolerSession(topic, participants)` - Initialize session with shuffled speaker order
- `buildTurnPrompt(session, agentName, intent)` - Build context-aware prompts
- `validateUtterance(utterance, session, allUtterances)` - Validate each line
- `getNextIntent(session)` - Select next intent based on chain rules
- `sessionToMarkdown(session)` - Format structured log output

**Data Types:**
```typescript
type ConversationIntent = "observe" | "ask" | "answer" | "joke" | "redirect" | "agree" | "disagree" | "escalate";

interface Utterance {
  speaker: string;
  text: string;
  intent: ConversationIntent;
  replyTo: number | null;
}
```

### Intent Chain Rules

| Last Intent | Allowed Next |
|-------------|--------------|
| (first) | ask, observe |
| ask | answer, agree, disagree, joke |
| answer | joke, redirect, agree, observe |
| joke | observe, ask, agree, redirect |
| agree | observe, redirect, ask |
| disagree | answer, observe, joke |
| observe | answer, ask, joke, agree |
| redirect | agree, observe, answer |
| (closing) | redirect, agree, escalate |

### Validation Rules

- **Word count:** 6-14 words per line
- **Coherence:** Must reference topic OR previous line
- **No duplicates:** Rejects repeated lines
- **No filler:** Rejects generic responses like "interesting", "nice", "okay"
- **Question rule:** At least one question per session
- **Response rule:** Must answer asked questions
- **Retry:** Up to 3 attempts per turn on validation failure

### Prompt Engineering

Each turn prompt includes:
- Current topic
- Previous speaker and their line
- Required intent
- Intent-specific guidance
- Word limit (10-12 words)

## Modified Files

1. **`server/conversation/coolerController.ts`** (new)
2. **`server/index.ts`**
   - Added import for controller
   - Rewrote `/api/coolertalk` endpoint to use chained generation
   - Updated `writeCoolerTalkToFile()` to use new format
   - Updated `coolerTalkLog` type definition

## Log Format

```markdown
## Cooler Talk Session - ct-1234567890

**Topic:** weird noise from the basement
**Participants:** FrontDesk, IronClaw, Sherlobster, OpenClaw

### Dialogue

- **FrontDesk** (ask, reply_to: null): "Did anyone else hear that thump downstairs?"
- **IronClaw** (answer, reply_to: 0): "Yeah, sounded heavier than the pipes."
- **Sherlobster** (joke, reply_to: 1): "If it's a sea monster, I'm out."
- **OpenClaw** (redirect, reply_to: 2): "Did maintenance check it yesterday?"
---
```

## Test Cases

1. **Normal session:** All turns follow chain rules
2. **Duplicate rejection:** System retries if line is duplicate
3. **Question-answer:** At least one ask → answer pair
4. **Closing line:** Last turn is redirect, agree, or escalate
5. **Multiple retries:** Handles validation failures gracefully

## Example Conversation

```
Topic: that weird noise from the basement

- FrontDesk (ask): "Did anyone else hear that thump downstairs?"
- IronClaw (answer): "Yeah, sounded heavier than the pipes."
- Sherlobster (joke): "If it's a sea monster, I'm clocking out."
- OpenClaw (redirect): "Before panicking, did maintenance check it?"
- FrontDesk (agree): "Fair point, but it definitely wasn't normal."
- IronClaw (close): "Let's log it before it becomes tonight's problem."
```

## Non-Goals (Preserved from Phase 1)

- No full persistent memory
- No deep registrar/archivist integration
- No personality schema enforcement
- No SCRUM behavior (separate feature)

## Files Created/Modified

- `server/conversation/coolerController.ts` (NEW)
- `server/index.ts` (MODIFIED)
- `docs/dev_logs/COOLER_FIX-A.md` (THIS FILE)
