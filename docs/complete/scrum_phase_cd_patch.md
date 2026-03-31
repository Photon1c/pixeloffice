# SCRUM Phase C/D - GitHub Integration Patch Summary

**Date:** 2026-03-19
**Phase:** Phase C (Safe GitHub Integration) + Phase D (Governance Relaxation)

---

## Overview

Implemented safe GitHub integration for SCRUM report exports following Phase C design with Phase D governance relaxation. The implementation is intentionally lightweight - thin wrappers, not overbuilt safety frameworks.

## Phase D Governance

Pixel Office is considered **stable**. GitHub integration for the configured repo should be straightforward:
- Keep useful bits (clear config, explicit modes)
- Remove overbuilt structures and unnecessary bindings
- Constrain *where* we operate, not by inventing heavy abstractions

---

## New Files

| File | Purpose |
|------|---------|
| `server/github/safeScrumRepoClient.ts` | Thin GitHub client wrapper |
| `server/github/tests/safeScrumRepoClient.test.ts` | 9 config validation tests |
| `server/scrum/scrumExporter.ts` | Updated with 5 export modes |
| `src/components/ScrumPanel.tsx` | UI with mode selection + GitHub status |
| `docs/active/scrum_phase_b.md` | Full documentation |

---

## Export Modes (5 Total)

### Local-Only (No GitHub Required)
| Mode | Behavior |
|------|----------|
| `preview` | Generate markdown only, no writes |
| `localReport` | Write `docs/reports/YYYY-MM-DD_scrum-*.md` |
| `localNotes` | Append to `docs/PIXEL_OFFICE_SCRUM_NOTES.md` |

### GitHub-Integrated (Requires Config)
| Mode | Behavior |
|------|----------|
| `githubReport` | localReport + commit/push to safe repo |
| `githubNotes` | localNotes + commit/push to safe repo |

---

## Configuration

```bash
GITHUB_TOKEN=ghp_...           # GitHub personal access token
SAFE_SCRUM_REPO=owner/repo     # Target repository
SAFE_SCRUM_BRANCH=main         # Target branch (default: main)
SAFE_SCRUM_REPORTS_DIR=docs/reports
SAFE_SCRUM_NOTES_PATH=docs/PIXEL_OFFICE_SCRUM_NOTES.md
```

---

## SafeScrumRepoClient

Thin wrapper with Phase D governance note:

```typescript
import { createSafeScrumRepoClient } from './server/github/safeScrumRepoClient';

const client = createSafeScrumRepoClient(process.env);
if (client) {
  await client.pushReport('/path/to/report.md', 'SCRUM Report');
  await client.pushNotes('## Notes', 'Notes commit');
}
```

Features:
- Validates config on construction (throws INVALID_CONFIG if missing)
- Uses GitHub REST API with Bearer token
- Targets only configured repo/branch
- Returns `{ success, url?, error? }`

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scrum/export` | POST | Export with mode selection |
| `/api/scrum/export/preview/:sessionId` | GET | Preview without saving |
| `/api/scrum/github/status` | GET | Check GitHub config status |
| `/api/scrum/append-notes` | POST | Append notes for session |

---

## UI Features (ScrumPanel)

- 5 export mode radio buttons
- GitHub status badge (green "GH" or gray "Local")
- Preview pane for reports
- Commit link on successful push
- Config hints when GitHub not set up
- Disabled GitHub options when not configured

---

## Tests

```bash
npm run test:scrum   # 25 SCRUM exporter tests
npm run test:github  # 9 GitHub client tests
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `SESSION_NOT_FOUND` | Session ID doesn't exist |
| `INCOMPLETE_SESSION` | Session hasn't reached LOG stage |
| `WRITE_ERROR` | Filesystem write failed |
| `GITHUB_NOT_CONFIGURED` | GitHub env vars not set |
| `INVALID_CONFIG` | Missing required config fields |

---

## Key Principles

1. **Local modes work without config** - preview, localReport, localNotes
2. **GitHub modes opt-in** - just set env vars
3. **Thin wrappers** - SafeScrumRepoClient does repo/branch scoping only
4. **Completed sessions only** - incomplete sessions rejected
5. **Clear error messages** - partial failures reported with details
