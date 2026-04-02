# Report: Analysis of Live App Errors (stigmergic-pixel-office.netlify.app)

## 1. Summary of Errors
The live application is experiencing multiple 404 (Not Found) errors for API endpoints and static assets. This is primarily because the Netlify deployment is configured as a static site, but the application relies on a Node.js Express server for several features.

## 2. Root Cause Analysis

### API Endpoints (404)
The following endpoints are failing:
- `/api/stigmergy/traces`
- `/api/stigmergy/social-potential`
- `/api/cooler/topics/current`

**Reason:** These endpoints are handled by the Express server (`server/index.ts`). Netlify's `netlify.toml` redirects `/api/*` to `/.netlify/functions/*`, but no Netlify functions are currently implemented. The project expects a running server which isn't present in the Netlify static environment.

### Static Assets (404)
The following assets are failing:
- `/handoff/opencode-local-agents.json`
- `/img/character/sherlobster_transparent.png`
- `/favicon.ico`

**Reason:** 
- **Handoff File:** The server tries to serve this from an absolute path (`/home/sherlockhums/...`) which does not exist in the Netlify environment.
- **Images/Favicon:** These are present in the `public` directory but might not be correctly bundled or referenced relative to the `dist` folder during the Vite build process.

### Supabase Error
- `Uncaught ReferenceError: supabase is not defined`

**Reason:** The code in `VM138:1` (likely a console snippet or an unbundled script) is trying to access a global `supabase` variable. In the codebase, `supabase` is an exported constant from `src/utils/supabaseClient.ts` and is not attached to the global `window` object.

## 3. Proposed Changes

### Fix API Endpoints
Since the app uses a custom Express server with complex logic (stigmergy, cooler talk, etc.), there are two options:
1. **Deploy the Server:** Use a service like Render, Railway, or Heroku to host the Express server and update the frontend to point to that URL.
2. **Netlify Functions:** Rewrite the server logic as individual Netlify functions in the `netlify/functions` directory.

### Fix Static Assets
1. **Handoff File:** Move `opencode-local-agents.json` into the `public/handoff/` directory so it is served as a static asset by Netlify, bypassing the need for a server-side route.
2. **Vite Configuration:** Ensure `vite.config.ts` correctly handles the `public` directory. Currently, it has `publicDir` pointing to `../.handoff`, which might be overriding the default `public` folder.

### Fix Supabase Initialization
1. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in the Netlify Environment Variables.
2. If global access is needed for debugging, explicitly attach it in `src/utils/supabaseClient.ts`:
   ```typescript
   export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
   (window as any).supabase = supabase; // For console debugging
   ```

## 4. Verification Plan
1. Check Netlify deployment logs to see if the `dist` folder contains the expected assets.
2. Verify that environment variables are correctly injected into the build process.
3. Test local build (`npm run build && npm run preview`) to replicate the static environment behavior.
