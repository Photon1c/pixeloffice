# Cooler Talk Phase 2 - Conversation Engine Upgrade Summary

**Date:** 2026-03-17
**Status:** Complete

---

## Overview

Phase 2 implements strict semantic correctness for the water cooler conversation system. The controller now enforces intent-text alignment, topic anchoring, and anti-repetition.

---

## Changes Made

### 1. Strict Intent Validation (`coolerController.ts`)

| Intent | Rule |
|--------|------|
| `ask` | Must contain `?` OR interrogative (who/what/why/how/did/etc) |
| `answer` | Must NOT be a question |
| `agree` | Must contain agreement signal (yeah, true, exactly, good point) |
| `escalate` | Must contain urgency (should, need to, important, urgent) |
| `joke` | Must reference topic or previous line |
| `observe` | Must reference topic directly |
| `redirect` | Must bridge from previous line |

### 2. Topic Anchoring

```typescript
// Extract keywords from topic
function extractTopicKeywords(topic: string): string[]
// Extract from previous line  
function extractLineKeywords(text: string): string[]
// Must have overlap
function hasKeywordOverlap(text, topicKeywords, prevKeywords): boolean
```

**Rule:** Every utterance must contain at least ONE keyword from either the topic OR the previous line.

### 3. Anti-Repetition Memory

```typescript
usedPhrases: Set<string>  // Per-session phrase tracking

// Fuzzy match > 70% similarity = reject
function fuzzyMatch(a, b): boolean
```

### 4. Hardened Prompts

Added strict constraints to each turn:
```
STRICT RULES:
- You MUST reference the topic OR what was just said
- Maximum 12 words
- Write as natural speech, not narration  
- NO quotes around your response
- If you ignore these rules, your response will be rejected!
```

### 5. Repair Strategy

After 5 failed validation attempts, uses deterministic templates:

```typescript
const REPAIR_TEMPLATES = {
  ask: (topic) => `Did anyone else notice the ${topic}?`,
  answer: (_, prev) => prev ? `Yes, I think you're right about that.` : `I think so too.`,
  agree: (_, prev) => prev ? `Exactly, that's a good point.` : `I totally agree.`,
  // ... etc
};
```

### 6. Validation Logging

Each utterance now tracks:
```json
{
  "valid": true,
  "retries": 1,
  "rejected_reasons": ["no_topic_or_prev_reference"]
}
```

---

## Files Modified

- `server/conversation/coolerController.ts` - Complete rewrite with strict validation
- `server/conversation/agentPersonalities.ts` - Added personality schema
- `server/index.ts` - Updated to use new validation, repair strategy, gemma model
- `src/components/PixelOffice.tsx` - Staggered dialogue timing (3s delay between bubbles)

---

## Example Output

**Topic:** "basement noise"

```
- FrontDesk (ask): "Did anyone hear that noise from the basement?"
- IronClaw (answer): "Yeah, that basement noise sounded heavier than usual."
- Sherlobster (joke): "If that basement noise is alive, I'm leaving."
- OpenClaw (redirect): "Should we check if maintenance logged that?"
- LeslieClaw (agree): "Yeah, tracking that makes sense."
- IronClaw (escalate): "We should inspect before it worsens."
```

---

## Model & Timing

- **Model:** gemma (switched from llama3.2 for speed)
- **Timeout:** 60s per turn
- **Retries:** 5 attempts before repair
- **Delay:** 1.5s between turns
- **Dialogue display:** 3s stagger, 8s per bubble

---

## Development Guide: Windows + Cursor IDE

### Setup for Parallel Development

This section outlines how to develop the conversation engine in Windows using Cursor IDE, then integrate back to this project.

---

### 1. Project Structure

Create a standalone TypeScript project:

```
conversation-engine/
├── src/
│   ├── coolerController.ts   # Core conversation logic
│   ├── agentPersonalities.ts # Agent schemas
│   ├── types.ts              # TypeScript interfaces
│   └── index.ts              # Main export
├── package.json
├── tsconfig.json
└── tests/
    └── conversation.test.ts
```

### 2. Cursor IDE Setup

**Install Cursor on Windows:**
- Download from https://cursor.sh
- Install and sign in

**Create new project:**
1. Open Cursor → New Project
2. Select "TypeScript" template
3. Name: `conversation-engine`

**Key Cursor features to leverage:**

| Feature | Shortcut | Use Case |
|---------|----------|----------|
| AI Chat | `Ctrl+L` | Ask about code, debug issues |
| Inline Chat | `Ctrl+K` | Edit selected code with AI |
| Generate Tests | `Ctrl+Shift+T` | Auto-generate unit tests |
| Codebase Index | Auto | Semantic search across code |
| Terminal | `Ctrl+` | Run tests, build |

### 3. Development Workflow

**Step 1: Copy core files from pixel_office**

Copy these files to your new project:
- `server/conversation/coolerController.ts` → `src/coolerController.ts`
- `server/conversation/agentPersonalities.ts` → `src/agentPersonalities.ts`

**Step 2: Create minimal test harness**

```typescript
// src/testRunner.ts
import { createCoolerSession, validateUtterance, buildTurnPrompt } from './coolerController.js';

const session = createCoolerSession("weekend plans", ["Alice", "Bob"]);
// Test various scenarios
console.log(validateUtterance(...));
```

**Step 3: Run tests locally**

```bash
npm run test      # Run unit tests
npm run dev       # Watch mode
```

**Step 4: Debug with Cursor**

- Use `Ctrl+L` to ask: "Why is validateUtterance failing for ask intent?"
- Use `Ctrl+K` to refactor functions
- Use `/test` command to generate test cases

### 4. Testing Strategy

**Unit Tests:**
```typescript
// tests/coolerController.test.ts
describe('validateUtterance', () => {
  it('should reject ask without question mark', () => {
    const utterance = { speaker: 'Alice', text: 'I think so', intent: 'ask' };
    const result = validateUtterance(utterance, session, []);
    expect(result.valid).toBe(false);
    expect(result.rejected_reasons).toContain('ask_without_question_mark');
  });
  
  it('should accept agree with agreement signal', () => {
    const utterance = { speaker: 'Bob', text: 'Yeah thats a good point', intent: 'agree' };
    const result = validateUtterance(utterance, session, []);
    expect(result.valid).toBe(true);
  });
});
```

**Integration Tests:**
- Test full conversation flow
- Verify topic anchoring
- Check repair strategy

### 5. Debugging Ollama Integration

To test without pixel_office server:

```typescript
// src/ollamaTest.ts
import { callOllama } from './ollamaClient.js';

const response = await callOllama({
  model: 'gemma',
  prompt: buildTurnPrompt(session, 'Alice', 'ask')
});
console.log(response);
```

### 6. Integration Back to pixel_office

**When ready to merge:**

1. **Compile to JavaScript:**
   ```bash
   npm run build
   ```

2. **Copy files:**
   - `dist/coolerController.js` → `server/conversation/coolerController.js`
   - `dist/agentPersonalities.js` → `server/conversation/agentPersonalities.js`

3. **Update imports if needed** (may need to add `.js` extensions for ES modules)

4. **Test in pixel_office:**
   ```bash
   cd pixel_office
   npm run build:server
   # Restart server
   ```

### 7. Key Differences to Handle

| Aspect | Standalone | pixel_office |
|--------|-----------|--------------|
| Import paths | Relative `./` | Relative with `.js` extension |
| ESM | Native | Needs `.js` extensions |
| Environment | Node.js | Express server |
| Testing | Jest/Vitest | Manual console.log |

### 8. Recommended Debug Workflow

```
1. Make changes in Cursor (Windows)
2. Run: npm run test
3. If passing, build: npm run build
4. Copy dist/* to pixel_office/server/conversation/
5. Test in pixel_office
6. Commit changes
```

### 9. Useful Cursor Commands

| Command | Description |
|---------|-------------|
| `Ctrl+L` | Open AI chat |
| `Ctrl+K` | Edit with AI |
| `Ctrl+Shift+G` | Git controls |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick file open |
| `/test` | Generate tests |

---

## Next Steps

Potential improvements:
- Add personality-specific response validation
- Implement longer conversation memory
- Add sentiment analysis
- Support multiple conversation topics simultaneously

---

## References

- Phase 1: `docs/dev_logs/COOLER_FIX-A_SUMMARY.md`
- Phase 2 Spec: `docs/dev_logs/phase2-meaning.md`
- Previous Implementation: `docs/dev_logs/COOLER_TALK_FEATURE.md`
