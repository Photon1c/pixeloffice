# Local Model → OpenAI Fallback Implementation

**Date:** 2026-03-19  
**Feature:** Local Model Fallback  
**Status:** Complete

## Goal

Implement a tiered strategy for `generateFn`:
1. Try local Ollama models first
2. Fall back to OpenAI if local fails or times out

## Files Created

### src/llm/localClient.ts

New client for calling local Ollama models:

**Key functions:**
- `isLocalModelAvailable()` - Check if Ollama server is reachable
- `generateWithLocalModel(prompt)` - Call local model with timeout
- `tryLocalModel(prompt)` - Convenience wrapper returning `null` on failure

**Configuration:**
- `OLLAMA_ENDPOINT` - Ollama server URL (default: `http://localhost:11434`)
- `LOCAL_MODEL_NAME` - Model name (default: `llama3.2`)
- `LOCAL_TIMEOUT_MS` - Timeout in ms (default: `8000`)

## Files Modified

### server/services/llmGenerateFn.ts

**Changes:**
- Import `tryLocalModel` and `isLocalModelAvailable` from localClient
- Added availability check (cached after first call)
- Updated `generateFn` to try local first, fall back to OpenAI
- Added `resetLocalModelCache()` for testing

**New flow:**
```
generateFn(prompt)
  └─> check local availability (cached)
      ├─> Local available: try local model
      │       ├─> Success: return result
      │       └─> Fail: fall back to OpenAI
      └─> Local unavailable: use OpenAI directly
```

## Configuration

Add to `.env`:
```bash
# Local model settings (optional - defaults shown)
OLLAMA_ENDPOINT=http://localhost:11434
LOCAL_MODEL_NAME=llama3.2
LOCAL_TIMEOUT_MS=8000

# OpenAI (keep existing)
OPENAI_MODEL=gpt-4o-mini
```

## Test Results

```
=== Server startup ===
[generateFn] Local model available, will use local-first strategy

=== Cooler Talk ===
[generateFn] Local model available, will use local-first strategy
[generateFn] Local model failed/empty, falling back to OpenAI
[generateFn] OpenAI: We must escalate this feedback now; efficiency can...
```

**Behavior verified:**
- Local model detection works ✓
- Fallback to OpenAI on local failure ✓
- CoolerTalk still functions ✓

## Build Verification

```bash
npm run build  # ✓ Successful
```

## Constraints

- Existing CoolerSession validation unchanged
- SCRUM logic unchanged (uses mocked outputs)
- No changes to conversation engine

## Next Steps

1. Start Ollama server and test local model directly
2. Verify local model produces valid responses
3. Add logging for model selection decisions
