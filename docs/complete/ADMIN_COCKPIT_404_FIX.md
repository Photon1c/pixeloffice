# Dev Log: Admin Cockpit 404 Errors

**Date:** 2026-02-22

**Issue:** Admin cockpit showing 404 errors for database info endpoints

**Symptoms:**
- Accessing admin cockpit showed 404 errors for `/api/admin/summary`, `/api/admin/activity`, etc.
- Frontend was trying to fetch database overview and activity data but receiving 404 responses

**Root Cause:**
- The server was running an outdated compiled version (`server/dist/index.js`) that didn't include the admin API routes
- The compiled file only had basic routes like `/api/employee-status` and genealogy endpoints
- The source file `server/index.ts` had all the admin routes defined, but they weren't being served

**Resolution:**
- Restarted server using `npx tsx server/index.ts` (runs TypeScript directly without compilation)
- This correctly serves all endpoints including:
  - `/api/admin/summary` - Database table overview
  - `/api/admin/activity` - Recent activity log
  - `/api/admin/actions/evaluate-stock-forecasts` - Stock forecast evaluation
  - `/api/db/tables` - List database tables
  - `/api/db/query` - Query table data

**Note:** The TypeScript build (`npm run build:server`) appears to have path resolution issues when compiling imports from `../src/pixel_memory/config.js`. The dev server (`npm run dev:server` or `npx tsx server/index.ts`) works correctly.
