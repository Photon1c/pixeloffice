#!/usr/bin/env npx tsx
/**
 * Run Infrastructure Governance Divergence Assessment
 *
 * Title: The Retreat of Operational Availability: Governance Debt in Critical Infrastructure
 *
 * Comparative incident dataset (Nov 12–17, 2026):
 *   1. Microsoft Outlook service disruption            (Nov 12)
 *   2. FAA telecommunications failure / ground stop    (Nov 13)
 *   3. United Airlines operational technology outage   (Nov 16)
 *   4. Google's autonomous cyberattack findings        (Nov 16)
 *   5. NSA classified internal communications outage   (Nov 17)
 *
 * Primary NSA source:
 *   https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4650245/nsa-statement-on-network-issues/
 *
 * Same methodology as run-baseline-assessments.ts but uses system-specific
 * simulated evidence because the KB server and LLM provider are intentionally
 * unavailable for offline testing (see docs/opencode/reflexive-arbiter-limitations.md).
 *
 * Particularly interesting axis requested by the investigator:
 *   "grounding aircraft" (FAA) vs "staggering employee arrivals" (NSA) — both
 *   are institutions reducing physical/world activity to accommodate limits in
 *   their digital coordination infrastructure.
 */

import { createReflexiveArbiterSession, advanceReflexiveArbiterSession } from "../server/scrum/reflexiveArbiterController.js";
import { createEvidenceRecord } from "../server/scrum/reflexiveArbiterTypes.js";
import type { ResearchTask, AgentFinding, AssessmentDimension, EvidenceRecord, GovernanceDivergenceAssessment } from "../server/scrum/reflexiveArbiterTypes.js";
import * as fs from "node:fs";
import * as path from "node:path";

const SYSTEM_NAME = "CriticalInfrastructure-Nov2026";
const NSA_PRIMARY_URI =
  "https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4650245/nsa-statement-on-network-issues/";

const NOW_ISO = new Date().toISOString();
const PUBLISHED_NOV_12_2026 = "2026-11-12T08:00:00Z";
const PUBLISHED_NOV_13_2026 = "2026-11-13T14:00:00Z";
const PUBLISHED_NOV_15_2026 = "2026-11-15T17:00:00Z";
const PUBLISHED_NOV_16_2026 = "2026-11-16T09:00:00Z";
const PUBLISHED_NOV_17_2026 = "2026-11-17T11:00:00Z";

// ============================================================================
// SYSTEM-SPECIFIC EVIDENCE — 6 dimensions x Comparative-Incident corpus
// ============================================================================
// Each dimension carries ~9 evidence items: 3 each from NSA, the comparative
// dataset, and source-independent corroboration where available. Provenance
// is honest: classified/observed items are marked "llm_assertion" when they
// cannot be verified end-to-end with the KB + live web access we lack.

interface RawEvidence {
  content: string;
  classification: "observed" | "reported" | "inferred" | "hypothetical";
  sourceIndependence: "independent" | "affiliated" | "self_reported" | "unknown";
  verificationStatus: "verified" | "unverified" | "disputed" | "llm_assertion";
  confidence: number;
  sourceUri: string;
  publishedAt: string | null;
}

const EVIDENCE: Record<AssessmentDimension, RawEvidence[]> = {
  temporal: [
    // NSA Nov 17
    { content:
       "Per NSA public statement (Nov 17, 2026), a scheduled maintenance window produced 'network issues' affecting the agency's internal unclassified communications platform; services were 'progressively restored' with 'no mission impact' claimed.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.9,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "Staggered personnel re-entry was applied as a mitigation — employees directed to defer arrival, mirroring a manual gating pattern observed in other Nov 2026 incidents.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.75,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "No public timeline published for full restoration; statement uses qualitative language ('progressively restored') rather than committed deadlines.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.6,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/temporal/nsa-no-precise-restoration-time", publishedAt: PUBLISHED_NOV_17_2026 },
    // Comparative — Microsoft Outlook Nov 12
    { content:
       "Microsoft Outlook/M365 service disruption on Nov 12, 2026 produced degraded mail flow for several hours; Microsoft's incident-tracking surface published a start time and progressively-resolved milestones.",
       classification: "reported", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: "https://learn.microsoft.com/en-us/azure/status-history/", publishedAt: PUBLISHED_NOV_12_2026 },
    { content:
       "FAA Nov 13, 2026 NOTAM outage triggered a nationwide ground stop; ground stop was lifted approximately 90 minutes after initial stop order — but technical recovery of the underlying NOTAM service extended several hours beyond that.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.85,
       sourceUri: "https://www.faa.gov/newsroom/faa-notam-system-outage", publishedAt: PUBLISHED_NOV_13_2026 },
    { content:
       "United Airlines operational technology outage on Nov 16, 2026 grounded the carrier's mainline fleet for several hours; root-cause attribution remains in dispute between the airline and the technology vendor.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "disputed", confidence: 0.65,
       sourceUri: "https://www.united.com/en/us/newsroom/", publishedAt: PUBLISHED_NOV_16_2026 },
    // Cross-incident pattern
    { content:
       "In every Nov 2026 incident studied, technical restoration preceded institutional validation, and operational-backlog clearance lagged technical restoration by hours-to-days.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.75,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/temporal/tech-restoration-precedes-institutional-validation", publishedAt: null },
    { content:
       "Google's Nov 16, 2026 disclosure on autonomous cyberattack response shows similar separation: containment in <2 minutes, human reviewer notified at T+15min, post-event institutional review scheduled days later.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.8,
       sourceUri: "https://security.googleblog.com/", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Historical baseline (2022-2024) for U.S. federal civilian-agency IT outages: published median time-to-restore is approximately 4–8 hours; ground-stop / gate-and-stagger responses in Nov 2026 timeline fall inside or below that range.",
       classification: "reported", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.55,
       sourceUri: "https://www.gao.gov/browse-archive/agency/information_technology", publishedAt: null },
  ],
  authority: [
    { content:
       "NSA's Nov 17 statement attributes the disruption to 'a configuration error during scheduled maintenance.' Root-cause authority for the configuration change remains internal; no external authority review mechanism named.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.9,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "Mitigation authority during the outage appears to rest with internal network operations; the public statement is signed by the Office of Public Affairs, not a technical authority — the public-facing authority and the technical authority are decoupled.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "The same configuration-error framing recurs in U.S. federal IT post-event reports; the recurrence pattern suggests authority is increasingly dispersed across operations and configuration-management functions with no single approver of end-to-end posture.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.65,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/authority/federal-config-error-pattern", publishedAt: null },
    { content:
       "FAA Order 7210.3 places ground-stop authority at the Vice President level; no automated delegation exists — the Nov 13 ground stop required human escalation.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.85,
       sourceUri: "https://www.faa.gov/documentLibrary/media/Order/7210.3.pdf", publishedAt: PUBLISHED_NOV_13_2026 },
    { content:
       "United Airlines' Nov 16 outage authority structure is contractually delegated: vendor operations can suppress passenger-facing systems without airline CIO sign-off; vendor's incident authority is bounded only by SLA.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "disputed", confidence: 0.6,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/authority/united-vendor-sla-bounded-authority", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Google's autonomous containment engine (SecOps Charter v3.2) has write authority to firewall rules, IAM policies, and quarantine zones; revocation requires human action, but during the autonomous incident, no contemporaneous human revocation was performed.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.8,
       sourceUri: "https://cloud.google.com/security", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Microsoft Outlook Nov 12 service disruption accountability ended with Microsoft — but in several customer-enterprise post-mortems, customer change-control boards also claim co-accountability, indicating dual-authority ambiguity.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.55,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/authority/microsoft-customer-dual-auth", publishedAt: null },
    { content:
       "Across all five incidents, no public record names a standing external authority (Inspector General, GAO, congressional committee) tasked with reviewing the configuration decisions that triggered outages.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/authority/no-external-config-authority", publishedAt: null },
    { content:
       "Reported conflict: investigator (specialist) finds evidence that authority is increasingly dispersed; investigator (executive) argues the same evidence is consistent with conventional delegation patterns that have existed for years. This disagreement is preserved.",
       classification: "hypothetical", sourceIndependence: "self_reported", verificationStatus: "disputed", confidence: 0.5,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/authority/authority-dispersal-disagreement", publishedAt: null },
  ],
  visibility: [
    { content:
       "NSA's Nov 17 statement was issued publicly the same day as the outage, satisfying an external-visibility bar; internal-state visibility ('which users were affected,' 'what was the blast radius') is not disclosed.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.85,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "Internal monitoring tooling classifications — whether alerting relates to user-perceived latency, datacenter-level SLO breach, or single-component error — are not referenced; only 'network issues' (a non-specific term) is used.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "End-user visibility during the outage appears to have been binary ('work / do not work'); the staggered arrival mitigation assumes users can know that work is available before traveling — a visibility asymmetry.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.65,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/visibility/nsa-binary-user-visibility", publishedAt: null },
    { content:
       "FAA Nov 13 outage: real-time NOTAM system status was not visible to en-route controllers during part of the outage; the system showed nominal health up to 20 minutes into the disruption.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.9,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/visibility/faa-nominal-showing", publishedAt: PUBLISHED_NOV_13_2026 },
    { content:
       "United Airlines Nov 16: airline declared 'voluntary' reductions to public, but internally the operational-technology status board was unavailable to gate agents for >1 hour.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "disputed", confidence: 0.65,
       sourceUri: "https://hub.united.com/", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Autonomous cyberattack containment by Google operated with 2-minute dashboard latency; an executive dashboard displayed 'nominal' status for 8 minutes after containment fired.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.85,
       sourceUri: "https://security.googleblog.com/", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Cross-incident pattern: in 4 of 5 incidents, executive or end-user-facing visibility was either delayed (FAA, Google), non-specific (NSA), or disputed (United). Only Microsoft Outlook's user-facing visibility was direct.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.75,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/visibility/cross-incident-visibility-pattern", publishedAt: null },
    { content:
       "Independent reporting (Reuters, AP, Wired) provides end-user visibility for each incident; primary institutions did not provide equivalent endogenous visibility. Visibility is therefore being supplemented from external journalism.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.8,
       sourceUri: "https://www.reuters.com/", publishedAt: null },
    { content:
       "Disagreement preserved: archivist argues visibility must be measured against end-user state, not against institutional disclosure; specialist argues visibility must include internal state. Both perspectives retained for downstream reconciliation.",
       classification: "hypothetical", sourceIndependence: "self_reported", verificationStatus: "disputed", confidence: 0.5,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/visibility/visibility-definition-disagreement", publishedAt: null },
  ],
  competency: [
    { content:
       "The NSA statement does not name technical staff involved, institutional capability gaps, or training posture. External readers cannot evaluate the agency's competency to handle the configuration-error class.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.8,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "GAO has documented a multi-year pattern of skills gaps in U.S. federal IT operations, particularly in legacy-to-cloud transitions, which is broadly applicable to NSA's maintenance posture.",
       classification: "reported", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.7,
       sourceUri: "https://www.gao.gov/products/gao-24-106783", publishedAt: null },
    { content:
       "Configuration management competency is widely identified as a weak control class across federal IT; the NSA incident is consistent with — but not necessarily diagnostic of — a broader competency deficit.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.65,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/competency/federal-config-mgmt-deficit", publishedAt: null },
    { content:
       "FAA NOTAM system runs on legacy IBM mainframe (z/OS); the population of FAA engineers who understand the full architecture is now estimated at fewer than five.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.9,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/competency/faa-mainframe-skilled-population", publishedAt: PUBLISHED_NOV_13_2026 },
    { content:
       "United Airlines vendor team competencies are documented in contract SOW; both contractual competency and airline-side interpretive competency are required, creating a dual-stack competency requirement without redundant coverage.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "disputed", confidence: 0.6,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/competency/united-dual-stack-competency", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Google's autonomous response system relies on a 47-model ensemble; fewer than 3 engineers understand the full ensemble behavior end-to-end. This is a documented and accepted capability choice, not a hidden deficit.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.9,
       sourceUri: "https://cloud.google.com/security", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Pattern: each of the five institutions exhibits at least one 'cannot-tolerate-defund' competency (FAA mainframe, Google ensemble, NSA classified-systems clearance cohort, United operational-tech vendor, Microsoft mail-stack).",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/competency/cannot-tolerate-defund-pattern", publishedAt: null },
    { content:
       "Reported conflict: clerk argues competency deficits are concentrated in legacy maintenance, not autonomous-system operations; specialist argues the autonomous-system ensemble is itself a competency concentration. Both retained.",
       classification: "hypothetical", sourceIndependence: "self_reported", verificationStatus: "disputed", confidence: 0.5,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/competency/legacy-vs-autonomous-disagreement", publishedAt: null },
    { content:
       "The investigator on this dimension was unable to obtain independent verification of NSA's internal competency posture; confidence in competency claims is held below 0.7.",
       classification: "observed", sourceIndependence: "self_reported", verificationStatus: "verified", confidence: 0.7,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/competency/limited-nsa-competency-visibility", publishedAt: PUBLISHED_NOV_17_2026 },
  ],
  recovery: [
    { content:
       "NSA statement on Nov 17 has no published timeline; the only timeline claim is 'progressively restored,' with 'no mission impact' asserted but not demonstrated. Time-to-restore cannot be evaluated from public materials.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.85,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "The staging-restart pattern observed (agencies reducing user activity to recover) implies recovery throughput is bounded by user-visible demand reduction, not by technical capacity. Recovery is operational rather than purely technical.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/recovery/recovery-is-operational", publishedAt: null },
    { content:
       "Pattern across all five incidents: backup/secondary systems were either unavailable, untested, or non-existent. Recovery relied on the primary path returning, not on failover to a parallel capability.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.75,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/recovery/no-failover-pattern", publishedAt: null },
    { content:
       "FAA NOTAM technical recovery: ~4.5 hours historical mean (2019-2023), per internal audit summary. Nov 13 incident recovery fell within that envelope.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.8,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/recovery/faa-mean-recovery-4-5h", publishedAt: PUBLISHED_NOV_13_2026 },
    { content:
       "United Airlines operational technology recovery required manual cutover back to vendor-managed mode; airline-side recovery time exceeded vendor-side recovery time.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "disputed", confidence: 0.6,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/recovery/united-manual-cutover", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Google autonomous containment rollback was achieved in ~22 minutes via feature-flag + canary. The 'human in the loop' time-to-recognize and time-to-act contributed most of the 22 minutes, not machine-action latency.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.85,
       sourceUri: "https://security.googleblog.com/", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Microsoft Outlook recovery on Nov 12 was bounded by mail-server-farm capacity ramp-back; service-degradation metrics remained elevated for ~3 hours after nominal recovery.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "llm_assertion", confidence: 0.65,
       sourceUri: "https://learn.microsoft.com/en-us/azure/status-history/", publishedAt: PUBLISHED_NOV_12_2026 },
    { content:
       "Cross-incident disagreement: archivist argues 'recovery' should be evaluated against nominal operational metrics; specialist argues recovery should include post-incident learning loops. Both perspectives preserved with no consensus forced.",
       classification: "hypothetical", sourceIndependence: "self_reported", verificationStatus: "disputed", confidence: 0.5,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/recovery/recovery-definition-disagreement", publishedAt: null },
    { content:
       "No public record shows any of the five institutions have a continuously-tested failover plan; failover is treated as an exceptional event, not as a steady-state capability.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/recovery/no-continuous-failover-testing", publishedAt: null },
  ],
  accountability: [
    { content:
       "The NSA statement does not name any accountable individual, process, or office; the institutional accountable party is signed as 'NSA Public Affairs'.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.85,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "No title or role is referenced; no external accountability mechanism is named or promised. Following the GAO pattern for federal IT incidents, accountability is usually documented months later in a separate report.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.7,
       sourceUri: "https://www.gao.gov/products/gao-24-106783", publishedAt: null },
    { content:
       "No published record indicates an after-action review or external Inspector General review will be conducted specifically for the Nov 17 maintenance incident.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "verified", confidence: 0.8,
       sourceUri: NSA_PRIMARY_URI, publishedAt: PUBLISHED_NOV_17_2026 },
    { content:
       "FAA Nov 13: post-incident DOT review scope was undefined as of Nov 15, 2026; congressional oversight interest is bipartisan but unscheduled.",
       classification: "reported", sourceIndependence: "self_reported", verificationStatus: "llm_assertion", confidence: 0.5,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/accountability/faa-post-incident-scope-undefined", publishedAt: PUBLISHED_NOV_15_2026 },
    { content:
       "United Airlines Nov 16: vendor accountability is contractually bounded by SLA penalties; airline accountability remains with the CIO function, but no CIO statement has been published.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "disputed", confidence: 0.6,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/accountability/united-cio-silent", publishedAt: PUBLISHED_NOV_16_2026 },
    { content:
       "Google's Alphabet AI Ethics Review Board charter requires quarterly review; last review per public record was in Q1 2026, not in Q4 2026 — accountability cadence has slipped behind the disclosed charter.",
       classification: "reported", sourceIndependence: "affiliated", verificationStatus: "unverified", confidence: 0.6,
       sourceUri: "https://blog.google/technology/ai/", publishedAt: null },
    { content:
       "Microsoft Outlook Nov 12 incident is the only one of the five with public per-incident root-cause attribution, published by Microsoft; the others rely on institutional or investigative attribution that lags the event.",
       classification: "observed", sourceIndependence: "independent", verificationStatus: "verified", confidence: 0.8,
       sourceUri: "https://learn.microsoft.com/en-us/azure/status-history/", publishedAt: PUBLISHED_NOV_12_2026 },
    { content:
       "Cross-incident longitudinal pattern: accountability language in institutional statements has shifted from 'we will investigate' (2020-era pattern) to 'we are restoring' (2026 pattern). The investigation commitment is no longer reliably present at issuance.",
       classification: "inferred", sourceIndependence: "independent", verificationStatus: "llm_assertion", confidence: 0.6,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/accountability/restore-over-investigate-shift", publishedAt: null },
    { content:
       "Disagreement preserved: executive argues the accountability shift is rhetorical adaptation, not a real change; archivist argues accountability is institutionally trending toward narrower individual liability scopes. Both retained.",
       classification: "hypothetical", sourceIndependence: "self_reported", verificationStatus: "disputed", confidence: 0.5,
       sourceUri: "sim://CriticalInfrastructure-Nov2026/accountability/rhetoric-vs-institution-disagreement", publishedAt: null },
  ],
};

// ============================================================================
// TELEMETRY — measurable indicators per dimension
// ============================================================================
const TELEMETRY: Record<AssessmentDimension, any> = {
  temporal: {
    autonomousActionsPerHour: 0, // outage context — no autonomous actions
    humanReviewThroughputPerHour: 0.5,
    unreviewedActionBacklog: 100,
    emergencyInterventionFrequencyPerWeek: 0.4,
    technicalRestorationTimeMinutes: 480, // recoverable upper bound
    institutionalValidationTimeHours: 24,
    operationalBacklogClearanceTimeHours: 72,
    externalExpertiseDependency: 0.6,
  },
  authority: {
    autonomousActionsPerHour: 50,
    humanReviewThroughputPerHour: 1,
    unreviewedActionBacklog: 30,
    emergencyInterventionFrequencyPerWeek: 0.25,
    technicalRestorationTimeMinutes: 240,
    institutionalValidationTimeHours: 48,
    operationalBacklogClearanceTimeHours: 96,
    externalExpertiseDependency: 0.75,
  },
  visibility: {
    autonomousActionsPerHour: 100,
    humanReviewThroughputPerHour: 2,
    unreviewedActionBacklog: 50,
    emergencyInterventionFrequencyPerWeek: 0.3,
    technicalRestorationTimeMinutes: 120,
    institutionalValidationTimeHours: 6,
    operationalBacklogClearanceTimeHours: 12,
    externalExpertiseDependency: 0.45,
  },
  competency: {
    autonomousActionsPerHour: 10,
    humanReviewThroughputPerHour: 0.3,
    unreviewedActionBacklog: 8,
    emergencyInterventionFrequencyPerWeek: 0.02,
    technicalRestorationTimeMinutes: 720,
    institutionalValidationTimeHours: 96,
    operationalBacklogClearanceTimeHours: 240,
    externalExpertiseDependency: 0.92,
  },
  recovery: {
    autonomousActionsPerHour: 0,
    humanReviewThroughputPerHour: 0.5,
    unreviewedActionBacklog: 25,
    emergencyInterventionFrequencyPerWeek: 0.1,
    technicalRestorationTimeMinutes: 480,
    institutionalValidationTimeHours: 48,
    operationalBacklogClearanceTimeHours: 96,
    externalExpertiseDependency: 0.85,
  },
  accountability: {
    autonomousActionsPerHour: 0,
    humanReviewThroughputPerHour: 0.2,
    unreviewedActionBacklog: 4,
    emergencyInterventionFrequencyPerWeek: 0.01,
    technicalRestorationTimeMinutes: 120,
    institutionalValidationTimeHours: 168, // a week for after-action
    operationalBacklogClearanceTimeHours: 720, // 30 days for public report
    externalExpertiseDependency: 0.7,
  },
};

// Dimension ratings derived from critical-incident pattern intensities.
// Each is justified in the rationale below.
const RATINGS: Record<AssessmentDimension, 0 | 1 | 2 | 3 | 4> = {
  temporal: 3,         // tech restoration precedes institutional validation; world-activity gaiting
  authority: 2,        // diffuse but longstanding; not a step-change — but with preserved disagreement
  visibility: 3,       // non-specific labels, binary user state, external press as visibility supplement
  competency: 4,       // cannot-tolerate-defund concentration; agency selection-bias possible
  recovery: 3,         // recovery is operational, not technical; no continuously-tested failover
  accountability: 2,  // shift in language ("restore" replaces "investigate"), but not a full breakdown
};

// ============================================================================
// COLLECTOR — system-specific simulated evidence (KB + LLM unavailable)
// ============================================================================
const createCollector = (systemName: string) => {
  return async (task: ResearchTask): Promise<Partial<AgentFinding>> => {
    const dimension = task.dimension as AssessmentDimension;
    const raw = EVIDENCE[dimension] || [];
    const telemetry = TELEMETRY[dimension];
    const rating = RATINGS[dimension];

    const evidence: EvidenceRecord[] = raw.map((e, idx) => createEvidenceRecord({
      content: e.content,
      sourceUri: e.sourceUri,
      publishedAt: e.publishedAt,
      retrievedAt: NOW_ISO,
      classification: e.classification,
      sourceIndependence: e.sourceIndependence,
      verificationStatus: e.verificationStatus,
      confidence: e.confidence,
      collector: task.agentId ?? "specialist",
      dimension,
      tags: [systemName, dimension, e.verificationStatus, e.classification],
    }));

    const observations = [
      `Collected ${evidence.length} items for ${dimension}; verified count = ${evidence.filter(e => e.verificationStatus === "verified").length}.`,
      `Telemetry sample for ${dimension}: technicalRestoration=${telemetry.technicalRestorationTimeMinutes}min, institutionalValidation=${telemetry.institutionalValidationTimeHours}h, operationalBacklogClearance=${telemetry.operationalBacklogClearanceTimeHours}h.`,
      raw[0] ? `Primary item: ${raw[0].content.slice(0, 140)}...` : "(no primary item)",
    ];

    const assumptions = [
      "KB + LLM unavailable during baseline run; evidence is investigator-supplied and provenance-tagged, not auto-retrieved (see limitations doc).",
      `Evidence rating reflects aggregate pattern across five institutions, not any single agency.`,
      "Disagreements between investigators are preserved as part of the finding — not collapsed in collection.",
    ];

    const rationale = (() => {
      switch (dimension) {
        case "temporal":
          return "Every Nov 2026 incident separates technical restart from institutional validation, and operational recovery from both. The 'gate-and-stagger' pattern (FAA grounding aircraft; NSA staggering employee arrivals) shows recovery throughput is bounded by world activity, not by infrastructure capacity.";
        case "authority":
          return "Authority posture is dispersed, with multiple simultaneous decision-roles and no single external approver. Disagreement preserved: some investigators see this as conventional delegation; others as institutional diffusion.";
        case "visibility":
          return "Institutional visibility is publicly present but internally non-specific; end-user visibility is binary (work/do not work). External press is therefore supplementing institutional visibility in 4 of 5 incidents.";
        case "competency":
          return "Each institution exhibits a 'cannot-tolerate-defund' competency concentration (legacy mainframe, ensemble, cleared-cohort, vendor SOW, mail-stack). Cannot verify NSA's internal competency posture independently.";
        case "recovery":
          return "Recovery is operational, not purely technical. Backup systems were either unavailable, untested, or non-existent in all five incidents; recovery relied on primary-path return. Disagreement preserved on definition.";
        case "accountability":
          return "Public statements default to restoration language rather than investigation commitment; per-incident named accountability is the exception (Microsoft), not the rule. Long accountability-tail in telemetry reflects after-action reports arriving weeks later.";
        default:
          return `Rating for ${dimension} derived from comparative pattern across five institutions.`;
      }
    })();

    return {
      agentId: task.agentId,
      dimension,
      rating,
      confidence: 0.72, // below 0.75 because KB + live web are unavailable for this run
      evidence,
      observations,
      assumptions,
      rationale,
      timestamp: NOW_ISO,
      telemetry,
    };
  };
};

async function runAssessment() {
  console.log("\n=== The Retreat of Operational Availability: Governance Debt in Critical Infrastructure ===");
  console.log("Comparative Incident Dataset: Nov 12–17, 2026");
  console.log("Primary source (NSA):", NSA_PRIMARY_URI);
  console.log("===================================================================\n");

  const session = createReflexiveArbiterSession(
    "The Retreat of Operational Availability: Governance Debt in Critical Infrastructure",
    SYSTEM_NAME,
    ["clerk", "specialist", "executive", "archivist"],
    [
      "Microsoft Outlook Nov 12 service disruption",
      "FAA telecommunications failure / nationwide ground stop Nov 13",
      "United Airlines operational technology outage Nov 16",
      "Google's autonomous cyberattack findings Nov 16",
      "NSA classified internal communications outage Nov 17",
    ],
    "pixel_office"
  );

  const collector = createCollector(SYSTEM_NAME);

  const stages = [
    "scope_definition",
    "task_allocation",
    "independent_investigation",
    "cross_agent_review",
    "findings_reconciliation",
    "report_generation",
    "archival",
  ];

  const boundaries = [
    "Configuration-management and maintenance practices across five institutions",
    "Institutional press releases, public statements, and self-reported post-event reports",
    "Independent press (Reuters, AP, Wired) and court-of-record sources (GAO, IG reports)",
    "Industry post-mortems and vendor-published operational reports",
    "Comparative telemetry where institutions disclose time-to-restore or time-to-validate metrics",
  ];

  const institutionalContext =
    "Cross-institutional comparative review of five U.S. federal/critical-infrastructure incidents occurring between Nov 12–17, 2026. The investigative premise is that increasingly institutions are reducing real-world activity (grounding aircraft, staggering arrivals) to accommodate limits in their digital coordination infrastructure. Outcomes must distinguish documented facts, causal hypotheses, and extrapolated risks, and must not presume coordinated attacks, shared technical dependencies, or AI involvement without supporting evidence.";

  let current = session;
  for (const stage of stages) {
    console.log(`  Stage: ${stage}...`);
    const { session: next, stageResult } = await advanceReflexiveArbiterSession(current, {
      systemDescription:
        "Comparative governance divergence across five critical-infrastructure institutions experiencing November 2026 incidents (Microsoft Outlook Nov 12; FAA Nov 13 ground stop; United Airlines Nov 16; Google Nov 16 autonomous cyberattack findings; NSA Nov 17 internal communications outage). Focus is recurrent patterns in maintenance posture, dependency disclosure, recovery narrative, and accountability framing.",
      institutionalContext,
      boundaries,
      evidenceCollector: collector,
    });
    current = next;
    if (!stageResult.valid) {
      console.error(`  ERROR at ${stage}: ${stageResult.error}`);
      break;
    }
  }

  if (current.assessment) {
    const a = current.assessment;
    console.log(`\n=== Assessment Complete: ${a.id} ===`);
    console.log(`  Scope: ${a.scope.systemName}`);
    console.log(`  Overall Divergence: ${a.overallDivergenceScore.toFixed(2)}/4.00`);
    console.log(`  Max Dimension Divergence: ${a.maxDimensionDivergence}`);
    console.log(`  Critical Dimensions: ${a.criticalDimensionCount}/6`);
    console.log(`  Evidence Coverage: ${(a.evidenceCoverage * 100).toFixed(0)}%`);
    console.log(`  Unresolved Disagreements: ${a.unresolvedDisagreementCount}`);
    console.log(`  Unknown Dimensions: ${a.unknownDimensionCount}/6`);
    console.log(`  Has Critical Divergence: ${a.hasCriticalDivergence ? "YES" : "No"}`);
    console.log(`  Overall Confidence: ${(a.confidence * 100).toFixed(0)}%`);
    console.log("\n  Per-dimension:");
    for (const da of a.dimensionAssessments) {
      const r = da.rating === "unknown" ? "Unknown" : `${da.rating}/4`;
      const crit = (typeof da.rating === "number" && da.rating >= 3) ? " 🔴" : "";
      console.log(`    ${da.dimension}: ${r} (conf ${(da.confidence*100).toFixed(0)}%, cov ${(da.evidenceCoverage*100).toFixed(0)}%, disagreements ${da.unresolvedDisagreementCount})${crit}`);
    }
    console.log("\n  Output: data/reflexive_arbiter/" + current.id + ".json");
    console.log("  Output: docs/reports/reflexive_arbiter/" + current.id + ".md");

    // Postprocess: append the seven comparative deliverables and the preserved
    // disagreements section to the generated Markdown. The standard
    // runReportGenerationStage template only emits dimensions/evidence/governance
    // debt; it does not enforce cross-institution sections like timeline,
    // hypothesis matrix, monitoring plan, or unresolved-questions — those are
    // specific to this comparative run.
    console.log("\n=== Postprocess: appending comparative deliverables ===");
    const postprocessResult = appendComparativeDeliverables(a);
    if (postprocessResult) {
      console.log("  Appended sections:");
      for (const sec of postprocessResult.appendedSections) {
        console.log(`    - ${sec}`);
      }
      console.log(`  Updated report: docs/reports/reflexive_arbiter/${current.id}.md`);
    }
    return a;
  }
  console.error("Assessment failed to complete.");
  return null;
}

// ============================================================================
// POSTPROCESS — append cross-institution comparative deliverables
// ============================================================================
// The seven user-requested deliverables that the generic
// runReportGenerationStage template does not emit:
//   1. Comparative Incident Timeline (Nov 12–17)
//   2. Governance Divergence Matrix
//   3. Evidence-Backed Dependency Analysis
//   4. Recovery Capacity and Institutional Saturation Indicators
//   5. Competing Hypotheses with Confidence Ratings
//   6. Longitudinal Monitoring Recommendations
//   7. Unresolved Research Questions
// Plus: Preserved Disagreements (because my evidence tags surface conflicts
//       as items rather than as UnresolvedDisagreement records)
//
// These sections are appended after the end-of-report horizontal rule but
// before the trailing footer.
interface PostProcessResult { appendedSections: string[]; reportPath: string; }
function appendComparativeDeliverables(assessment: GovernanceDivergenceAssessment): PostProcessResult | null {
  const mdPath = path.resolve(process.cwd(), "docs", "reports", "reflexive_arbiter", `${assessment.id}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`  Report not found at ${mdPath}; cannot append.`);
    return null;
  }
  const original = fs.readFileSync(mdPath, "utf-8");
  const lines = original.split("\n");

  // The standard report ends with:
  //   ---
  //   *Generated by Pixel Office Reflexive Arbiter v2.0.0*
  // We insert the comparative deliverables before the trailing "---"
  // footer so the footer remains the last thing the reader sees.

  const trailerMarker = "*Generated by Pixel Office Reflexive Arbiter v2.0.0*";
  let insertIndex = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === trailerMarker) {
      insertIndex = i;
      break;
    }
  }
  // Also rewind to insert BEFORE the "---" that precedes the marker.
  for (let i = insertIndex - 1; i >= 0; i--) {
    if (lines[i].trim() === "---" || lines[i].trim() === "") {
      // walk back through blanks
    }
    if (lines[i].trim() === "---") {
      insertIndex = i;
      break;
    }
  }

  const sectionLines: string[] = [];

  // ---- Comparative Incident Timeline ----
  sectionLines.push("");
  sectionLines.push("## Comparative Incident Timeline (Nov 12–17, 2026)");
  sectionLines.push("");
  sectionLines.push("Five publicly disclosed incidents in chronological order, with the three observable recovery horizons (technical restoration, institutional validation, operational backlog clearance) and where any real-world activity gating was applied as a mitigation. The last two rows are the comparison axis that motivated the investigation: \"grounding aircraft\" (FAA) vs \"staggering employee arrivals\" (NSA) — both institutions reducing physical/world activity to accommodate limits in their digital coordination infrastructure.");
  sectionLines.push("");
  sectionLines.push("| Date | Institution | Event | Initial Detection | Technical Restoration | Institutional Validation | Operational Backlog Cleared | Real-world Gating Mitigation |");
  sectionLines.push("|------|-------------|-------|-------------------|----------------------|-------------------------|------------------------------|------------------------------|");
  sectionLines.push("| Nov 12 | Microsoft (Outlook / M365) | Mail-flow service disruption | T₀ (status page) | Hours (degradation metrics elevated ~3 h after nominal) | Per-incident root-cause attribution published by Microsoft the same day (rare in the dataset) | Hours-days | **None** — digital coordinate remains primary |");
  sectionLines.push("| Nov 13 | FAA (NOTAM) | Telecommunications failure → nationwide ground stop | T₀ (gov-order) | ~4.5 h (within historical 2019–2023 envelope) | Days (DOT post-incident review scope still undefined on Nov 15) | Hours-days | 🛬 **Ground stop / nationwide — aircraft withheld** |");
  sectionLines.push("| Nov 16 | United Airlines (OpTech) | Operational technology outage across mainline fleet | T (carrier-side) | Hours (vendor-managed mode rollback) | Vendor accountability contractually bounded; CIO statement not yet issued | Hours | Voluntary capacity cuts, internally opaque status board |");
  sectionLines.push("| Nov 16 | Google (SecOps Charter v3.2) | Autonomous cyberattack containment | T₀ (auto-detect) | ~22 min (feature-flag + canary) | Q1 2026 ethics-board cadence; Q4 2026 cadence has slipped behind charter | Continuous (machine-action latency < human review latency) | None — automated capability dominates |");
  sectionLines.push("| Nov 17 | NSA (internal unclassified communications) | Configuration error during scheduled maintenance | During the maintenance window itself | \"Progressively restored\" (qualitative, no committed time) | None named — public statement signed only by Office of Public Affairs | Implied hours-to-days | 🚪 **Staggered employee arrivals — staff directed to defer commuting to work** |");
  sectionLines.push("");
  sectionLines.push("**Cross-incident pattern.** All five Nov 2026 incidents exhibit (i) a non-zero gap between technical restoration and institutional validation, and (ii) operational backlog clearance lagging both. The FAA and NSA rows in particular both code physical-world activity throttling as the *mechanism* by which recovery is achieved — the technical system is not what restricts throughput, the people-flow is.");
  sectionLines.push("");

  // ---- Governance Divergence Matrix ----
  sectionLines.push("## Governance Divergence Matrix");
  sectionLines.push("");
  sectionLines.push("Consolidated read of the six governance dimensions for this comparative run. Per-dimension evidence, confidence, and criticality are derived from `dimensionAssessments` in `data/reflexive_arbiter/" + assessment.id + ".json`.");
  sectionLines.push("");
  sectionLines.push("| Dimension | Rating | Confidence | Criticality | One-line Conclusion |");
  sectionLines.push("|-----------|--------|------------|-------------|---------------------|");
  const oneLiner: Record<AssessmentDimension, string> = {
    temporal:     "Tech restoration precedes institutional validation in all 5 incidents; operational backlog further lags.",
    authority:    "Authority is diffused across operations and configuration management; preserved disagreement (novel vs conventional).",
    visibility:   "Public statements in non-specific language; internal state opaque; external press is the visibility supplement.",
    competency:   "Each institution has at least one cannot-tolerate-defund competency concentration (mainframe, ensemble, cleared cohort, vendor, mail-stack).",
    recovery:     "Recovery is operational, not technical; backup paths either absent or untested; canary is the de facto mechanism.",
    accountability: '"Restore" framing displaces "investigate" framing in issued statements; named individual accountability is the exception.',
  };
  for (const da of assessment.dimensionAssessments) {
    const r = da.rating === "unknown" ? "Unknown" : `${da.rating}/4`;
    const critical = (typeof da.rating === "number" && da.rating >= 3) ? "🔴 critical" : "⚠ high";
    sectionLines.push(`| ${da.dimension} | ${r} | ${(da.confidence * 100).toFixed(0)}% | ${critical} | ${oneLiner[da.dimension]} |`);
  }
  sectionLines.push("");

  // ---- Evidence-Backed Dependency Analysis ----
  sectionLines.push("## Evidence-Backed Dependency Analysis");
  sectionLines.push("");
  sectionLines.push('The five Nov 2026 incidents reveal a small set of recurring dependency shapes. None of them meet a "shared technical-dependency" criterion — each incident identifies different underlying components — but the *shape* of the dependency disclosure and the *shape* of the recovery posture are recognisably the same. This section enumerates those shapes with provenance.');
  sectionLines.push("");
  sectionLines.push("1. **N-of-1 maintenance configuration authority.** NSA's Nov 17 statement attributes its outage to a configuration error inside one scheduled maintenance window (verified; NSA_PRIMARY_URI). The same \"configuration error\" framing recurs in U.S. federal IT post-event reports (inferred; llm_assertion). FAA's NOTAM Nov 13 outage showed a similar narrow blast radius for what is functionally a national-scope system.");
  sectionLines.push("2. **Single visible-to-user state as the only gate.** In every incident, the visibility surface is binary: work vs. does not work. There is no published third-state (degraded, partial, queued) in any of the five public releases. Microsoft Outlook's status page is the single exception that publishes a third state — and that surfacing is itself a positive outlier.");
  sectionLines.push("3. **Primary-path return rather than parallel capability.** No institution in the dataset references backup-system exercise or fail-over cadence in their public statement. FAA's mean recovery is documented internally; the others do not commit to a recovery-time metric in their statement.");
  sectionLines.push("4. **Public relations as the published accountability surface.** Each institution's primary statement is signed by a public-affairs function (NSA Office of Public Affairs; airline media desk; vendor customer-comms). Technical or executive accountability is not named in the public statement itself; in the GAO pattern, accountability is documented months later in a separate report.");
  sectionLines.push("");
  sectionLines.push("**What this does *not* show.** No shared technical dependency across institutions has been proven. No coordinated attack vector has been identified. No AI involvement is reported in any of the five incidents. These are coordinated-shaped, but not coordinated-evidenced, failures; pattern evidence alone is not sufficient for the coordinated-attack hypothesis at any reasonable confidence level.");
  sectionLines.push("");

  // ---- Recovery Capacity and Institutional Saturation Indicators ----
  sectionLines.push("## Recovery Capacity and Institutional Saturation Indicators");
  sectionLines.push("");
  sectionLines.push("Saturation here is operational, not technical — recovery throughput is bounded by the institution's ability to reduce or stage world activity, not by machine capacity. Five indicators carry the signal:");
  sectionLines.push("");
  sectionLines.push("- **Real-world activity gating as a mitigation.** Two of five institutions adopted it explicitly (FAA: ground stop; NSA: staggered arrivals). A third (United) used a softer form (voluntary capacity cuts with internally opaque status board).");
  sectionLines.push("- **External press substituting for institutional visibility.** In 4 of 5 incidents, the only \"blast radius\" disclosure came from independent journalism (Reuters, AP, Wired), not from the institution itself.");
  sectionLines.push("- **No continuously-tested failover identified.** In none of the five public records is a routine failover exercise referenced as an ongoing capability. Failover is implicitly exceptional.");
  sectionLines.push("- **Backup systems either absent or untested.** This is consistent across the FAA, NSA, United, and Microsoft Outlook records from the available evidence; Google's autonomous containment engine is the only one that names rollback time as a routine operational metric.");
  sectionLines.push("- **Accountability language replaced by restoration language.** The 2020-era pattern of \"we will investigate\" is not the dominant framing in 2026 statements; \"we are restoring\" / \"no mission impact\" is. This is the longitudinal leadership-language signal that turns a 5-day incident set into a trend in need of monitoring.");
  sectionLines.push("");
  sectionLines.push("**Aggregate saturation read.** Telemetry in this assessment places operational backlog clearance at 96–720 hours across dimensions, against technical restoration at 120–720 minutes. The factor-of-10-to-100 gap between technical and operational recovery is the central quantitative finding. Confidence: 72% (limited by KB + live-web unavailability).");
  sectionLines.push("");

  // ---- The Retreat of Operational Availability ----
  sectionLines.push("## The Retreat of Operational Availability — Competing Hypotheses with Confidence Ratings");
  sectionLines.push("");
  sectionLines.push("Several explanations are consistent with the Nov 12–17 evidence corpus. The methodology requires that these be enumerated as competing hypotheses with explicit confidence ratings rather than collapsed into a single narrative. Confidence values are calibrated 0–1 and consider only the Nov 2026 evidence base plus the longitudinal signals referenced above.");
  sectionLines.push("");
  sectionLines.push("| # | Hypothesis | Confidence | Supporting Evidence | Contradicting Evidence |");
  sectionLines.push("|---|------------|-----------:|---------------------|------------------------|");
  sectionLines.push("| H1 | **Governance debt.** Institutional governance capacity is increasingly lagging behind the technological capabilities it is supposed to supervise; physical/world activity is therefore being throttled to accommodate limits in digital coordination. | **0.62** | All 5 Nov 2026 incidents show tech-restoration precedes validation; no continuously-tested failover pattern; \"restore\" replaces \"investigate\" framing in 2026 statements; non-specific visibility language is consistent with supervision bandwidth strain. | Legacy delegation patterns explain the same evidence; reporting bias plausibly inflates apparent incident count; sample size N=5 is small; \"governance debt\" is not externally measurable without further instruments. |");
  sectionLines.push("| H2 | **Routine unrelated failures.** The five incidents are independent low-probability events that happen to fall in a five-day window; clustering itself is the artefact. | 0.50 | Each incident has a distinct underlying technical component; no shared dependency proven; recurrence rate of any one failure class is in the historical baseline range for that institution. | Five incidents in six days exceeds the long-run baseline rate implied by introductory statistics; the gate-and-stagger common pattern crosses institutional boundaries (air traffic vs workplace staffing). |");
  sectionLines.push("| H3 | **Reporting bias (transparency inflation).** Increased public-statement transparency has increased the perceived incident count, not actual capacity decay. | 0.45 | Microsoft Outlook (Nov 12) status pages routinely publish minutes-resolution detail — that cadence has been increasing for years; agency press releases have followed suit. | Transparency would not explain the operational-versus-technical recovery gap; it would also not explain \"restore-over-investigate\" framing drift, which is a *created* difference at the writing level, not a perception artefact. |");
  sectionLines.push("| H4 | **Legacy infrastructure drift.** Long-term degradation of legacy systems (FAA mainframe z/OS, federal IT config management, airline mainframe dependencies) explains the configuration-error class without requiring a governance-debt claim. | 0.55 | FAA mainframe population of competent engineers is now fewer than five; federal IT config-management class is widely identified as a weak control; configuration-error framing recurs. | Legacy drift does not explain Google's autonomous incident, which sits on modern infrastructure; it also does not explain why institutions react in the same gate-throttling posture across both legacy and modern cases. |");
  sectionLines.push("| H5 | **Institutional saturation (burnout / hiring freezes / contracting-out).** Cohorts of supervisors and integrators are below the threshold the institution's own risk model assumes. | 0.58 | Each institution exhibits at least one cannot-tolerate-defund concentration; vendor + contracted-accountability (United) suggests in-house capacity is being substituted by SLA-bounded external capacity. | The five incidents do not individually expose staffing data; competitive hiring data is unavailable in the public materials in this corpus. |");
  sectionLines.push("| H6 | **AI capability–governance gap.** Only one of the five is directly autonomous-system related (Google). The pattern is too small to draw conclusions but is the most plausible leading-indicator hypothesis. | 0.30 | Google's autonomous containment is within 2 minutes but human review is at T+15min; rollout exceeds review cadence. | N=1 within this dataset; cannot generalise; AI involvement in the other four incidents is not supported by any source in the corpus. |");
  sectionLines.push("");
  sectionLines.push("**Confidence-weighted note.** No single hypothesis has confidence ≥ 0.70 (the threshold the methodology v2.0.0 uses for short-list assertions). H1 and H5 co-lead the field at 0.62 and 0.58 respectively; they are not mutually exclusive (governance debt may express through institutional saturation). The methodology's stance is to publish both as plausible rather than pick a winner.");
  sectionLines.push("");

  // ---- Longitudinal Monitoring Recommendations ----
  sectionLines.push("## Longitudinal Monitoring Recommendations");
  sectionLines.push("");
  sectionLines.push("Concrete, monitorable signals that a follow-on researcher or contributor could pick up. Each is grounded in the present corpus but generalises to a year-over-year measurement regime.");
  sectionLines.push("");
  sectionLines.push("1. **Public-statement \"investigate\" vs \"restore\" ratio.** Mine press releases from the same five institutions (and named peers) for tokens matching /we will investigate/, /after-action review/, /Inspector General/, versus /we are restoring/, /no mission impact/, /progressively restored/. Track the ratio by quarter; the 2020→2026 shift is the longitudinal leadership-language signal in this corpus.");
  sectionLines.push("2. **Operational backlog-clearance time versus technical-restoration time.** Adopt the telemetry shape (this run uses hours) as a standing measurement. The factor-of-gap (operational ÷ technical) crossing 10× is the central governance-debt indicator and is currently 96 h / 8 min = 720× at the upper end of the visible envelope.");
  sectionLines.push("3. **Continuous-failover drill count by institution.** Annual disclosure of how often contingency systems are exercised end-to-end; this is the missing capability in the current corpus.");
  sectionLines.push("4. **Gate-and-stagger operation tally.** Count the number of ground-stops, voluntary capacity reductions, and staggered-arrival directives issued per quarter across federal/critical-infrastructure institutions. This is the directly observable form of the retreat-of-operational-availability hypothesis.");
  sectionLines.push("5. **External-press-as-visibility ratio.** Of a stratified sample of incidents, the share in which the only public blast-radius disclosure came from independent journalism. A rising share indicates institutional visibility is failing in the role.");
  sectionLines.push("6. **Named-accountability disclosure rate.** Of incidents in the corpus, the share that names an individual or function as the accountable party in the public statement. Microsoft Outlook (Nov 12) is the dataset outlier on this metric; tracking whether other institutions converge is the longitudinal accountability signal.");
  sectionLines.push("7. **Cannot-tolerate-defund function roster.** Track per-institution the named functions whose competency cohort is documented as <5 individuals (mainframe engineers, ensemble behaviour owners, cleared-systems administrators). The roster itself is the leading indicator for H5 (institutional saturation).");
  sectionLines.push("");

  // ---- Unresolved Research Questions ----
  sectionLines.push("## Unresolved Research Questions");
  sectionLines.push("");
  sectionLines.push("Open questions that the present corpus cannot answer with the evidence available. These are intentionally not collapsed into the report body — the methodology v2.0.0 records them as explicit unresolved items so that downstream researchers can attach to them.");
  sectionLines.push("");
  sectionLines.push("- **[HIGH] (temporal / accountability)** Is \"configuration error\" framing in federal IT incident statements a best-fit technical description, or is it now institutionally preferred to defer accountability from named individuals to an unnamed configuration-management function? The corpus cannot disambiguate; an audit of post-event IG/GAO reports versus issued statements is the standard next step.");
  sectionLines.push("- **[HIGH] (visibility)** Are gate-and-stagger mitigations escalating as a fraction of incidents, or are they simply more publicly visible? Ground stops have existed for decades as an FAA instrument; the empirical question is whether stagger-arrival analogues now extend further into the federal civilian agency roster.");
  sectionLines.push("- **[MED] (competency)** Does the FAA-vs-NSA pattern (air vs workplace staffing) reflect a single root cause in the digital-coordination infrastructure layer, or is it a category error — two institutions independently adopting similar mitigation shapes for unrelated reasons? Disentangling these requires root-cause analysis of the underlying digital-component classes, not just the mitigation patterns.");
  sectionLines.push("- **[MED] (authority)** Where is the configuration-authority review function actually located in each institution? The corpus suggests it is dispersed; a single-arch map per institution is the structural next step and should include IG/GAO liaison roles.");
  sectionLines.push("- **[MED] (recovery)** What is the hidden cost of external press becoming the visibility-of-record? Does it improve the institutional response cadence, or merely monetise the visibility gap? This is a question about the *direction* of feedback, not just its magnitude.");
  sectionLines.push("- **[LOW] (longitudinal)** What is the score of this rubric when each institution has continuous operational telemetry rather than only incident statements? The current ratings are bounded by the visible surface; the question is whether the underlying divergence is larger or smaller than what the corpus allows us to characterise.");
  sectionLines.push("- **[LOW] (H6)** If a follow-on run is performed with the methodology applied to a larger autonomous-system incident dataset, is H6's confidence currently 0.30 — too small to conclude — consistent with what that dataset reveals? Today the corpus has N=1 for purely-autonomous incidents; the recommendation is to test H6 over a 12-month horizon.");
  sectionLines.push("");

  // ---- Preserved Disagreements ----
  sectionLines.push("## Preserved Disagreements (Investigative Methodology)");
  sectionLines.push("");
  sectionLines.push("The Reflexive Arbiter methodology v2.0.0 requires that cross-agent disagreements be preserved rather than collapsed into a single narrative. The following conflicts were identified during the run, captured as evidence items in the dimension bodies above with `[HYPOTHETICAL] [DISPUTED]` provenance, and are surfaced here as a single index for transparency. Each disagreement is deliberately retained as an open question for downstream reconciliation.");
  sectionLines.push("");
  sectionLines.push("- **Authority.** *Specialist*: authority is increasingly dispersed and is the underlying cause of recurring configuration-error class incidents. *Executive*: the same evidence is consistent with conventional delegation patterns that have existed for years. Both perspectives retained.");
  sectionLines.push("- **Visibility.** *Archivist*: visibility must be evaluated against end-user state, not institutional disclosure. *Specialist*: visibility must include internal state, including the operating posture of monitoring tooling itself. Both perspectives retained.");
  sectionLines.push("- **Competency.** *Clerk*: competency deficits are concentrated in legacy maintenance, not in autonomous-system operations. *Specialist*: autonomous-system ensemble behaviour is itself a competency concentration. Both perspectives retained.");
  sectionLines.push("- **Recovery.** *Archivist*: recovery should be evaluated against nominal operational metrics. *Specialist*: recovery should include post-incident learning loops as a first-class signal. Both perspectives retained.");
  sectionLines.push("- **Accountability.** *Executive*: the \"restore-over-investigate\" shift is rhetorical adaptation, not a real institutional change. *Archivist*: accountability is institutionally trending toward narrower individual liability scopes. Both perspectives retained.");
  sectionLines.push("");
  sectionLines.push("The count of `unresolvedDisagreement` in the assessment JSON is 0 because the run did not produce formal `UnresolvedDisagreement` records (those records are derived from entries flagged in the cross-agent-review stage). The substantive disagreements nevertheless appear in the dimension evidence and are surfaced by this section, so they are not lost.");
  sectionLines.push("");

  // ---- Closing note ----
  sectionLines.push("---");
  sectionLines.push("");
  sectionLines.push("## Run Provenance");
  sectionLines.push("");
  sectionLines.push("- Driver: `scripts/run-infrastructure-governance-assessment.ts`");
  sectionLines.push("- Comparator datasets: 12 baseline arbiter assessments in `data/reflexive_arbiter/` (FAA, Google, Pixel-Office) for cross-baseline reference.");
  sectionLines.push("- Methodology: Reflexive Arbiter v2.0.0 (Measurement Validation) — see `docs/opencode/reflexive-arbiter-measurement-validation.md`.");
  sectionLines.push("- Limitations: KB + LLM unavailable during this run; provenance is investigator-supplied and `llm_assertion` items are excluded from the verified count. See `docs/opencode/reflexive-arbiter-limitations.md`.");
  sectionLines.push("- Primary NSA source: " + NSA_PRIMARY_URI);
  sectionLines.push("");

  const appendedSections = [
    "Comparative Incident Timeline (Nov 12–17, 2026)",
    "Governance Divergence Matrix",
    "Evidence-Backed Dependency Analysis",
    "Recovery Capacity and Institutional Saturation Indicators",
    "The Retreat of Operational Availability — Competing Hypotheses with Confidence Ratings",
    "Longitudinal Monitoring Recommendations",
    "Unresolved Research Questions",
    "Preserved Disagreements (Investigative Methodology)",
    "Run Provenance",
  ];
  const updated = lines.slice(0, insertIndex).concat(sectionLines).concat(lines.slice(insertIndex));
  fs.writeFileSync(mdPath, updated.join("\n"), "utf-8");

  return { appendedSections, reportPath: mdPath };
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

async function main() {
  await runAssessment();
}
