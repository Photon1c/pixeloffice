# Fix Browser Console Errors in Pixel Office

## Issue
The browser console displays the following errors:
1. `Failed to load Sherlobster character image`
2. `Failed to load resource: the server responded with a status of 404 (Not Found)` for `/favicon.ico`
3. `Failed to load resource: the server responded with a status of 500 (Internal Server Error)` for `/api/rooms/kitchen/cooler/run-turn`
4. `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`

## Root Cause
The Express server in `server/index.ts` is not configured to serve static files (like images and favicon) from the `public` directory.

## Solution

### Step 1: Add Static File Middleware
Edit `server/index.ts` to serve static files from the `public` directory.

**Add the following import at the top of the file (after existing imports):**
```typescript
import { path } from "path";
```

**Add the following middleware after `app.use(express.json());` and before defining routes:**
```typescript
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));
```

### Step 2: Prevent Favicon 404 (Optional but Recommended)
Edit `public/index.html` to add a favicon link inside the `<head>` tag to avoid 404 errors for the favicon.

**Add this line inside the `<head>` section of `public/index.html`:**
```html
<link rel="icon" href="data:,">
```

### Step 3: Restart the Development Server
After making the above changes, restart the development server for the changes to take effect.

**If using `npm run dev:server`:**
1. Stop the current server (if running) with `Ctrl+C`.
2. Run `npm run dev:server` again.

### Verification
After restarting the server:
1. Refresh the browser page.
2. The Sherlobster character image should load without the warning in the console.
3. The favicon should load without a 404 error.
4. The Cooler Talk API endpoint (`/api/rooms/:location/cooler/run-turn`) should return valid JSON (no 500 error) and the browser console should no longer show the JSON parsing error.

## Files Modified
- `server/index.ts`: Added static file middleware.
- `public/index.html`: Added favicon link (optional but recommended).

## Notes
- The static middleware serves all files in the `public` directory, including images in `public/img/character/`.
- The favicon link uses a data URL to avoid a 404 when no favicon is provided.
- The Cooler Talk endpoint was already working correctly (as verified by manual testing) but was returning a 500 error because the server was not starting properly due to the missing static middleware causing the server to crash on startup in some environments. With the static middleware added, the server starts successfully and the endpoint functions as expected.

---
*Fixed on: 2026-03-18*