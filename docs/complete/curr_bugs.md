# Fixed Bugs

- [x] `/api/stigmergy/traces` 500 Error: Fixed by ensuring data directory exists and handling empty/null JSON.
- [x] `/handoff/opencode-local-agents.json` 500 Error: Added missing route to server.
- [x] `/api/cooler/topics/current` 500 Error: Improved error handling in `fetchNewsTopics`.
- [x] `/favicon.ico` 404 Error: Created temporary favicon from character sprite.
- [x] SyntaxError: Unexpected end of JSON input in `fetchTraces`: Fixed by adding validation for empty responses and absolute file paths in backend.
- [x] Sherlobster image load error: Verified image exists at `/public/img/character/sherlobster_transparent.png`.

# Remaining Issues

- [ ] Criminology Lab: Currently hidden as per cleanup brief (mermaid generator is broken).
- [ ] Sherlock CS (port 5190): External service not started by default session script.
