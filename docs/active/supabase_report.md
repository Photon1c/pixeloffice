# Supabase Configuration & Bug Report

## 1. Current Status
The Supabase client is initialized in `src/utils/supabaseClient.ts`. It uses Vite environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

In the live Netlify environment, a `ReferenceError: supabase is not defined` was reported. This typically happens when:
1. The `supabase` client is expected to be a global variable (e.g., accessed via console or a non-module script).
2. The environment variables are missing during the build or at runtime.

## 2. Identified Issues
- **Global Scope:** The `supabase` object is exported as a module constant and is not attached to the `window` object.
- **Server Usage:** The backend server (`server/cooler/coolerToScrum.ts`) also uses a Supabase client (`supabaseAdmin`) and expects `SUPABASE_SERVICE_KEY` or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
- **Netlify Environment:** If these variables are not set in the Netlify UI, the client will fail to initialize correctly, leading to `null` or `undefined` values being passed to `createClient`.

## 3. Proposed Changes

### A. Expose Supabase Globally (Optional, for Debugging)
To resolve the `ReferenceError` when testing in the console of the live app, we can attach the client to the window object in `src/utils/supabaseClient.ts`.

### B. Environment Variable Validation
Add stricter checks to ensure the app fails gracefully or warns clearly when keys are missing.

### C. Example Fix for src/utils/supabaseClient.ts
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabaseClient] Missing environment variables!');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

// Attach to window for live debugging (Fixes ReferenceError in console)
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
```

## 4. Supabase Auth Confirmation
The user requested to confirm Supabase authentication. 
- The current implementation uses `createClient(url, key)`.
- For the live app, ensure that **Site URL** and **Redirect URIs** are correctly configured in the Supabase Dashboard (`Authentication -> Settings -> External OAuth Providers / Site URL`) to match the Netlify URL: `https://stigmergic-pixel-office.netlify.app`.

## 5. Summary of Action Items
1. **Set Netlify Env Vars:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are added to the Netlify project settings.
2. **Update Client Initialization:** Apply the global attachment fix to allow console-based debugging.
3. **Verify Auth Redirects:** Update Supabase dashboard settings with the Netlify production URL.
