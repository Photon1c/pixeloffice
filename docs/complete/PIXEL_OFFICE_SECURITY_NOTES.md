# Pixel Office Security Hardening - Phase 1 Notes

**Date:** 2026-03-20  
**Phase:** 1 - Security Boundary Enforcement

## Objective
Eliminate browser-bound secret handling and enforce a strict server-only trust boundary for all credentials, tokens, and API keys.

---

## Changes Made

### 1. Module Relocations (Server Boundary Enforcement)

#### LLM Client Modules
| Original Location | New Location | Purpose |
|-------------------|--------------|---------|
| `src/llm/client.ts` | `server/llm/client.ts` | OpenAI API client with `OPENAI_API_KEY` |
| `src/llm/localClient.ts` | `server/llm/localClient.ts` | Ollama local model client with endpoint config |

#### Database Configuration
| Original Location | New Location | Purpose |
|-------------------|--------------|---------|
| `src/pixel_memory/config.ts` | `server/pixel_memory/config.ts` | DB credentials (CORE_DB_HOST, CORE_DB_PASS, etc.) |

### 2. Import Updates

**Updated files:**
- `server/index.ts` - Changed imports from `../src/llm/` and `../src/pixel_memory/` to server-local paths
- `server/services/llmGenerateFn.ts` - Updated to import from `../llm/` and `../llm/`

### 3. Admin Token Exposure Fix

**File:** `src/components/AdminAssistant.tsx`

**Before:**
```typescript
const ADMIN_TOKEN = (import.meta as any).env?.VITE_ADMIN_ACCESS_TOKEN || "";
function adminHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (ADMIN_TOKEN) headers["x-admin-token"] = ADMIN_TOKEN;
  return headers;
}
```

**After:**
```typescript
function adminHeaders(): HeadersInit {
  return {};
}
```

**Security improvement:** Removed client-side admin token exposure. Authentication is now handled exclusively server-side via `requireAdmin()` middleware.

### 4. Guard Files Added

To prevent future accidental misuse, stub files were placed in original locations that throw errors if imported from client code:

- `src/llm/client.ts` - Throws if imported in browser context
- `src/llm/localClient.ts` - Throws if imported in browser context
- `src/pixel_memory/config.ts` - Added `typeof window !== "undefined"` guard

---

## Risks Eliminated

| Risk | Status |
|------|--------|
| `OPENAI_API_KEY` bundled in client JS | ✅ Eliminated |
| `CORE_DB_PASS` bundled in client JS | ✅ Eliminated |
| `VITE_ADMIN_ACCESS_TOKEN` exposed in browser | ✅ Eliminated |
| `OLLAMA_ENDPOINT` with potential auth info | ✅ Moved to server-only |

---

## Remaining Considerations (Phase 2+)

1. **Session-based admin auth**: The admin panel currently relies on `requireAdmin()` middleware checking `x-admin-token` header. For production, consider HTTP-only session cookies or JWT tokens.

2. **API response audit**: Not all API responses were audited for credential leakage. Recommend a full audit of `server/index.ts` response objects.

3. **Logging audit**: Console logging was reduced but not fully audited. Ensure no raw tokens appear in server logs.

4. **CORS configuration**: The server uses `cors()` without restrictions. Consider tightening for production.

---

## Verification Steps

1. Build the frontend: `npm run build`
2. Inspect `dist/assets/*.js` for:
   - `OPENAI_API_KEY`
   - `CORE_DB_PASS`
   - `VITE_ADMIN_ACCESS_TOKEN`
   - `process.env` references (except safe VITE_ vars)
3. Test admin endpoints without token (should work in dev, block in production)

---

## File Summary

```
MOVED:
  src/llm/client.ts          → server/llm/client.ts
  src/llm/localClient.ts     → server/llm/localClient.ts
  src/pixel_memory/config.ts → server/pixel_memory/config.ts

MODIFIED:
  server/index.ts                      (import paths updated)
  server/services/llmGenerateFn.ts    (import paths updated)
  src/components/AdminAssistant.tsx    (token exposure removed)
  src/llm/client.ts                   (guard added)
  src/llm/localClient.ts              (guard added)
  src/pixel_memory/config.ts          (guard added)
```
