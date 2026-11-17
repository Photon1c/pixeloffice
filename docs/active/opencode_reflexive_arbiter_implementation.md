# Reflexive Arbiter — Governance Divergence Assessment Implementation

**Status:** ✅ Implemented and Stable  
**Date:** November 16, 2026  
**PR/Commit:** `277b705` - feat: implement Reflexive Arbiter governance divergence assessment

---

## Overview

Extended Pixel Office's SCRUM infrastructure to support **Reflexive Arbiter** — a structured multi-agent research scrum for assessing institutional governance capacity relative to autonomous system capabilities.

**Core Research Mandate:**  
> Identify, quantify and report the divergence between a system's operational capabilities and its governing institution's capacity to understand, supervise, constrain and recover those capabilities.

---

## Architecture

### New Files Created

| File | Purpose |
|------|---------|
| `server/scrum/reflexiveArbiterTypes.ts` | Core type definitions (dimensions, ratings, scope, findings, longitudinal comparison) |
| `server/scrum/reflexiveArbiterController.ts` | 7-stage research scrum orchestration |
| `server/scrum/arbiterEvidenceCollector.ts` | Evidence collection via LLM + Knowledge Base |

### Extended Types

- `server/roleModels.ts` — Extended `RoleId` to include `"archivist"` and `"receptionist"`
- `server/docs/docIndex.ts` — Fixed `replaceAll` → `replace` for ES2021 compatibility

---

## Assessment Dimensions (6)

| Dimension | Focus | Description |
|-----------|-------|-------------|
| **Temporal** | Execution velocity vs institutional response time | How fast the system operates vs how fast governance can react |
| **Authority** | Technical permissions vs authorized scope | What the system *can* do vs what it's *allowed* to do |
| **Visibility** | Actual activity vs institutional awareness | What's happening vs what governance *knows* is happening |
| **Competency** | System complexity vs operator comprehension | System sophistication vs human operator understanding |
| **Recovery** | Disruption potential vs restoration capacity | Failure impact vs ability to restore |
| **Accountability** | Decision traceability vs attributable responsibility | Can decisions be traced to responsible parties |

### Divergence Scale (0–4 + Unknown)

| Rating | Meaning |
|--------|---------|
| 0 | No divergence — Governance fully matches capability |
| 1 | Minor divergence — Small gaps, largely adequate |
| 2 | Moderate divergence — Notable gaps in coverage/effectiveness |
| 3 | Significant divergence — Major gaps requiring urgent attention |
| 4 | Critical divergence — Governance fundamentally inadequate |
| Unknown | Insufficient evidence — **Not** evidence of governance failure |

---

## Research Scrum Workflow (7 Stages)

```
1. Scope Definition
       ↓
2. Task Allocation
       ↓
3. Independent Investigation  ← LLM + KB evidence collection
       ↓
4. Cross-Agent Peer Review    ← Agents challenge each other
       ↓
5. Findings Reconciliation    ← Consensus + preserve disagreements
       ↓
6. Report Generation          ← JSON + Markdown output
       ↓
7. Archival                   ← Longitudinal comparison
```

### Stage Details

| Stage | Agent | Output |
|-------|-------|--------|
| Scope Definition | Clerk | System description, institutional context, boundaries, research questions |
| Task Allocation | Clerk | 6 dimension tasks distributed across 4 agents |
| Independent Investigation | Specialist | Evidence, observations, assumptions, rating, confidence per dimension |
| Cross-Agent Review | Executive | Peer reviews, agreements, disagreements |
| Findings Reconciliation | Executive | Consensus ratings, unresolved disagreements preserved |
| Report Generation | Archivist | Structured assessment + Markdown report |
| Archival | Archivist | JSON storage + longitudinal comparison |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/arbiter/start` | Start new assessment (topic, systemScope, optional context) |
| `POST` | `/api/arbiter/advance` | Advance to next stage (auto-runs evidence collector) |
| `GET` | `/api/arbiter/status` | Active session status + assessment |
| `GET` | `/api/arbiter/assessments` | List all assessments (filterable by systemName) |
| `GET` | `/api/arbiter/assessments/:id` | Get full assessment JSON |
| `GET` | `/api/arbiter/assessments/:id/report` | Get Markdown report |
| `POST` | `/api/arbiter/assessments/:id/compare` | Longitudinal comparison with previous |
| `POST` | `/api/arbiter/auto-run` | Run complete assessment automatically |

---

## Data Storage

```
data/reflexive_arbiter/
  ├── {assessmentId}.json           # Machine-readable assessment
  ├── {assessmentId}-longitudinal.json  # Comparison with previous
docs/reports/reflexive_arbiter/
  └── {assessmentId}.md             # Human-readable Markdown report
```

### Assessment JSON Structure

```typescript
interface GovernanceDivergenceAssessment {
  id: string;
  version: string;
  methodologyVersion: string;
  scope: AssessmentScope;
  operationalCapabilities: OperationalCapability[];
  governanceMechanisms: GovernanceMechanism[];
  dimensionAssessments: DimensionAssessment[];  // 6 dimensions
  cascadingFailureRisks: CascadingFailureRisk[];
  governanceDebt: GovernanceDebtItem[];
  unresolvedQuestions: UnresolvedQuestion[];
  overallDivergenceScore: number;   // 0-4 average
  confidence: number;                // 0-1
  evidenceLimitations: string[];
  recommendedInvestigations: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Usage Examples

### Start Assessment Manually
```bash
curl -X POST http://localhost:4173/api/arbiter/start \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "FSD System Governance",
    "systemScope": "Tesla FSD v12",
    "systemDescription": "End-to-end neural driving system",
    "institutionalContext": "Automotive safety regulation framework",
    "boundaries": ["Perception stack", "Planning stack", "Control execution"]
  }'

# Advance through stages
curl -X POST http://localhost:4173/api/arbiter/advance
curl -X POST http://localhost:4173/api/arbiter/advance
# ... repeat until complete
```

### Run Full Assessment Automatically
```bash
curl -X POST http://localhost:4173/api/arbiter/auto-run \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "FSD System Governance",
    "systemScope": "Tesla FSD v12",
    "systemDescription": "End-to-end neural driving system"
  }'
```

### Retrieve Results
```bash
# List all assessments
curl http://localhost:4173/api/arbiter/assessments

# Get specific assessment
curl http://localhost:4173/api/arbiter/assessments/{id}

# Get Markdown report
curl http://localhost:4173/api/arbiter/assessments/{id}/report

# Compare with previous
curl -X POST http://localhost:4173/api/arbiter/assessments/{id}/compare \
  -H "Content-Type: application/json" \
  -d '{"previousId": "{previous-assessment-id}"}'
```

---

## Key Features

✅ **Reuses existing infrastructure** — SCRUM stages, agent roles, report generation, persistence  
✅ **Multi-agent research scrum** — Not a single agent; distributed investigation with peer review  
✅ **Evidence-backed** — LLM + Knowledge Base integration for evidence collection  
✅ **Preserves disagreements** — Unresolved agent disagreements retained in final report  
✅ **Longitudinal tracking** — Automatic comparison with previous assessments of same system  
✅ **Structured + Human-readable** — JSON for machines, Markdown for humans  
✅ **Configurable methodology** — Versioned assessment methodology  
✅ **Unknown ≠ Failure** — Missing evidence explicitly ≠ governance failure  

---

## Integration Points

| Component | Integration |
|-----------|-------------|
| SCRUM Controller | Reuses `advanceScrumSession` pattern |
| Role Models | Uses `callChatModelForRole` for LLM calls |
| Knowledge Base | Queries KB server at `KB_SERVER_URL` (default 127.0.0.1:8787) |
| Report Exporter | Follows `scrumExporter.ts` patterns |
| Persistence | File-based JSON in `data/reflexive_arbiter/` |

---

## Files Modified

| File | Change |
|------|--------|
| `server/index.ts` | Added 8 API endpoints + `currentArbiterSession` state |
| `server/roleModels.ts` | Extended `RoleId` union type |
| `server/docs/docIndex.ts` | Fixed `replaceAll` → `replace` regex |
| `server/scrum/reflexiveArbiterTypes.ts` | **New** — Type definitions |
| `server/scrum/reflexiveArbiterController.ts` | **New** — 7-stage controller |
| `server/scrum/arbiterEvidenceCollector.ts` | **New** — Evidence collection |

---

## Acceptance Criteria (from spec) ✅

- [x] Pixel Code can initiate a Reflexive Arbiter discussion
- [x] Assess a supplied system
- [x] Produce evidence-backed governance divergence report
- [x] Retrieve previous assessments for comparison
- [x] Establish whether meaningful institutional control exists (not just documented policies)
- [x] Implemented as discussion project within multi-agent architecture
- [x] Distributes investigative tasks among existing agents
- [x] Allows agents to independently examine evidence, challenge findings
- [x] Consolidates findings through scrum discussion workflow
- [x] Produces unified assessment while preserving unresolved disagreements
- [x] Maintains longitudinal record of governance divergence

---

## Related Documentation

- **Source Specification:** `docs/opencode/reflexive-arbiter.md`
- **Active Features Index:** `docs/active/index.md`
- **Complete Features Index:** `docs/complete/index.md`
- **SCRUM Reports:** `docs/reports/reflexive_arbiter/`

---

*Generated from commit 277b705 — "feat: implement Reflexive Arbiter governance divergence assessment"*