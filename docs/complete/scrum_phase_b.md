# SCRUM Phase B/C/D - Report Exporter with GitHub Integration

## Overview

Phase B/C/D implementation adds local markdown report export for completed SCRUM sessions with optional GitHub sync.

**Phase D Governance**: Pixel Office is considered stable. GitHub integration for the configured repo should be straightforward. The SafeScrumRepoClient is intentionally lightweight and should not grow additional policy/guardrail logic.

## Files Created

- `server/scrum/scrumExporter.ts` - Main exporter module with all export modes
- `server/scrum/tests/scrumExporter.test.ts` - Test suite (25 tests)
- `server/github/safeScrumRepoClient.ts` - Thin GitHub client wrapper
- `server/github/tests/safeScrumRepoClient.test.ts` - GitHub client tests (9 tests)
- `src/components/ScrumPanel.tsx` - UI panel for SCRUM export with mode selection
- `server/index.ts` - Added export API endpoints

## Export Modes

Five export modes are available:

### Local-Only Modes (No GitHub Required)
1. **preview** - Generate markdown only, no writes
2. **localReport** - Write `docs/reports/YYYY-MM-DD_scrum-*.md`
3. **localNotes** - Append to `docs/PIXEL_OFFICE_SCRUM_NOTES.md`

### GitHub-Integrated Modes
4. **githubReport** - localReport + commit/push to configured repo
5. **githubNotes** - localNotes + commit/push to configured repo

## Configuration

Set these environment variables to enable GitHub modes:

```bash
GITHUB_TOKEN=ghp_...           # GitHub personal access token
SAFE_SCRUM_REPO=owner/repo      # Target repository
SAFE_SCRUM_BRANCH=main          # Target branch (default: main)
SAFE_SCRUM_REPORTS_DIR=docs/reports       # Reports directory
SAFE_SCRUM_NOTES_PATH=docs/PIXEL_OFFICE_SCRUM_NOTES.md
```

## API Reference

### Export Functions

```typescript
import { 
  exportScrumReport, 
  exportLatestCompletedScrum,
  previewScrumReport,
  generateGithubNotes,
  appendToGithubNotes,
  type ExportMode
} from './server/scrum/scrumExporter';

// Export with mode
const result = await exportScrumReport(sessionId, 'localReport');
const result = await exportScrumReport(sessionId, 'githubReport', githubClient);

// Preview without saving
const preview = previewScrumReport(session);

// GitHub notes
const notes = generateGithubNotes(session);
const notesPath = await appendToGithubNotes(session);
```

### SafeScrumRepoClient

```typescript
import { createSafeScrumRepoClient } from './server/github/safeScrumRepoClient';

const client = createSafeScrumRepoClient(process.env);
if (client) {
  await client.pushReport('/path/to/report.md', 'SCRUM Report commit');
  await client.pushNotes('## Notes content', 'Notes commit');
}
```

## Server API Endpoints

### POST /api/scrum/export

Export a SCRUM session with mode selection.

```bash
# Preview (dry-run)
curl -X POST http://localhost:3000/api/scrum/export \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "scrum-123", "mode": "preview"}'

# Local report
curl -X POST http://localhost:3000/api/scrum/export \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "scrum-123", "mode": "localReport"}'

# GitHub report (requires GITHUB_TOKEN)
curl -X POST http://localhost:3000/api/scrum/export \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "scrum-123", "mode": "githubReport"}'
```

### GET /api/scrum/export/preview/:sessionId

Get a preview without saving.

### GET /api/scrum/github/status

Check GitHub configuration status.

### POST /api/scrum/append-notes

Append notes for a session.

## Report Format

Reports include:

- **Metadata**: Session ID, date, topic, participants, status
- **CHECK**: Repository status and findings
- **REPORT**: Summary from check stage
- **REVIEW**: Approval status, risks, recommended actions
- **DECIDE**: Decision and rationale
- **EXECUTE**: Action and status
- **LOG**: Completion status
- **Summary**: Final decision and next actions

## File Naming

Pattern: `YYYY-MM-DD_scrum-<sessionId>.md`

Example: `2026-03-19_scrum-scrum-1773901107330-6mtlm3.md`

## Error Codes

| Code | Description |
|------|-------------|
| `SESSION_NOT_FOUND` | Session ID doesn't exist |
| `INCOMPLETE_SESSION` | Session hasn't reached LOG stage |
| `WRITE_ERROR` | Filesystem write failed |
| `GITHUB_NOT_CONFIGURED` | GitHub env vars not set |
| `SESSION_ID_REQUIRED` | Preview requires sessionId |

## Guardrails

- **Repo/branch scope**: GitHub operations target only the configured `SAFE_SCRUM_REPO` and `SAFE_SCRUM_BRANCH`
- **Path allowlist**: Reports under `SAFE_SCRUM_REPORTS_DIR`, notes at `SAFE_SCRUM_NOTES_PATH`
- **Local modes work without config**: preview, localReport, localNotes work without GitHub setup
- **Completed sessions only**: Incomplete sessions are rejected

## Running Tests

```bash
npm run test:scrum   # SCRUM exporter tests
npm run test:github # GitHub client tests
```

## UI Integration

The ScrumPanel component provides:
- Start/advance SCRUM sessions
- Mode selection radio buttons
- GitHub configuration status badge
- Preview pane for reports
- Export status with commit links
- Config hints when GitHub not set up
