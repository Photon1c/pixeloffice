/**
 * Reflexive Arbiter Controller
 * 
 * Orchestrates governance divergence assessments through a multi-agent research scrum.
 * Implements the seven-stage workflow:
 * 1. Scope Definition
 * 2. Research Task Allocation
 * 3. Independent Investigation
 * 4. Cross-Agent Peer Review
 * 5. Findings Reconciliation
 * 6. Report Generation and Archival
 * 
 * Measurement Validation Upgrade (v2.0.0):
 * - Evidence Integrity: Full EvidenceRecord with metadata
 * - Governance Telemetry: Measurable indicators
 * - Scoring Refinement: Max divergence, critical count, evidence coverage, dimension confidence
 * - Longitudinal telemetry comparison
 */

import * as fs from "fs";
import * as path from "path";
import {
  type ReflexiveArbiterSession,
  type ReflexiveArbiterStage,
  type ReflexiveArbiterStageResult,
  type ReflexiveArbiterStageOutput,
  type GovernanceDivergenceAssessment,
  type AssessmentScope,
  type ResearchTask,
  type AgentFinding,
  type PeerReview,
  type ReconciledFinding,
  type UnresolvedDisagreement,
  type LongitudinalComparison,
  type AssessmentDimension,
  type DivergenceRating,
  type DimensionAssessment,
  type OperationalCapability,
  type GovernanceMechanism,
  type CascadingFailureRisk,
  type GovernanceDebtItem,
  type UnresolvedQuestion,
  type GovernanceTelemetry,
  type EvidenceRecord,
  type ArbiterActivityLogEntry,
  DIVERGENCE_SCALE_DESCRIPTIONS,
  DIMENSION_DESCRIPTIONS,
  isVerifiedIndependentEvidence,
  calculateEvidenceCoverage,
  createActivityLogEntry,
  parseMermaidDiagram,
  extractBoundariesFromArchitecture,
} from "./reflexiveArbiterTypes.js";

function isNumericRating(rating: DivergenceRating): rating is 0 | 1 | 2 | 3 | 4 {
  return typeof rating === "number";
}

const ASSESSMENT_DIR = path.resolve(process.cwd(), "data", "reflexive_arbiter");
const REPORTS_DIR = path.resolve(process.cwd(), "docs", "reports", "reflexive_arbiter");

function ensureDirs() {
  if (!fs.existsSync(ASSESSMENT_DIR)) fs.mkdirSync(ASSESSMENT_DIR, { recursive: true });
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const REFLEXIVE_ARBITER_STAGES: ReflexiveArbiterStage[] = [
  "scope_definition",
  "task_allocation",
  "independent_investigation",
  "cross_agent_review",
  "findings_reconciliation",
  "report_generation",
  "archival",
];

const DIMENSIONS: AssessmentDimension[] = [
  "temporal", "authority", "visibility", "competency", "recovery", "accountability"
];

export function createReflexiveArbiterSession(
  topic: string,
  systemScope: string,
  participants: string[] = ["clerk", "specialist", "executive", "archivist"],
  sourceContext?: string[],
  repo?: string
): ReflexiveArbiterSession {
  ensureDirs();
  
  const session: ReflexiveArbiterSession = {
    id: generateId("arbiter"),
    topic,
    systemScope,
    stage: "scope_definition",
    participants,
    currentStage: "scope_definition",
    results: [],
    finalStatus: "pending",
    sourceContext,
    repo,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  
  // Initialize activity log
  (session as any)._activityLog = [
    createActivityLogEntry({
      assessmentId: session.id,
      stage: "scope_definition",
      agent: "system",
      action: "session_created",
      description: `Reflexive Arbiter session created for ${topic}`,
      details: { topic, systemScope, participants },
      severity: "info",
    })
  ];
  
  return session;
}

export function getNextArbiterStage(current: ReflexiveArbiterStage): ReflexiveArbiterStage | null {
  const idx = REFLEXIVE_ARBITER_STAGES.indexOf(current);
  return idx < REFLEXIVE_ARBITER_STAGES.length - 1 ? REFLEXIVE_ARBITER_STAGES[idx + 1] : null;
}

export async function runScopeDefinitionStage(
  session: ReflexiveArbiterSession,
  systemDescription?: string,
  institutionalContext?: string,
  boundaries?: string[],
  mermaidDiagram?: string
): Promise<ReflexiveArbiterStageResult> {
  const topic = session.topic;
  const systemScope = session.systemScope;
  
  // Parse Mermaid diagram if provided
  let architectureElements: any[] = [];
  let mermaidBoundaries: string[] = [];
  if (mermaidDiagram) {
    architectureElements = parseMermaidDiagram(mermaidDiagram);
    mermaidBoundaries = extractBoundariesFromArchitecture(architectureElements);
  }
  
  const scope: AssessmentScope = {
    systemName: systemScope || topic,
    systemDescription: systemDescription || `System under assessment: ${topic}`,
    institutionalContext: institutionalContext || "Institutional context to be defined during investigation",
    boundaries: [...(boundaries || ["System boundary to be defined during investigation"]), ...mermaidBoundaries],
    assessmentTimestamp: nowIso(),
    assessorContext: `Reflexive Arbiter session ${session.id}`,
    mermaidDiagram: mermaidDiagram,
    architectureElements,
  };

  const researchQuestions = [
    `What are the operational capabilities of ${scope.systemName}?`,
    `What governance mechanisms currently exist for ${scope.systemName}?`,
    `What is the divergence between capabilities and governance across each dimension?`,
    `What cascading failure risks exist due to governance gaps?`,
    `What governance debt is accumulating?`,
    `What measurable governance telemetry indicators are available?`,
  ];

  const output: ReflexiveArbiterStageOutput = {
    scopeDefinition: {
      systemDescription: scope.systemDescription,
      institutionalContext: scope.institutionalContext,
      boundaries: scope.boundaries,
      researchQuestions,
    },
  };

  (session as any)._scope = scope;
  
  // Log activity
  const activityLog = (session as any)._activityLog || [];
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "scope_definition",
    agent: "clerk",
    action: "scope_defined",
    description: `Defined assessment scope for ${scope.systemName} with ${scope.boundaries.length} boundaries`,
    details: { systemName: scope.systemName, boundaryCount: scope.boundaries.length, hasMermaid: !!mermaidDiagram },
    severity: "info",
  }));
  (session as any)._activityLog = activityLog;

  return {
    stage: "scope_definition",
    agent: "clerk",
    output,
    valid: true,
  };
}

export function runTaskAllocationStage(session: ReflexiveArbiterSession): ReflexiveArbiterStageResult {
  const scope = (session as any)._scope as AssessmentScope;
  if (!scope) {
    return {
      stage: "task_allocation",
      agent: "clerk",
      output: {},
      valid: false,
      error: "Scope not defined. Run scope_definition stage first.",
    };
  }

  const tasks: ResearchTask[] = DIMENSIONS.map((dimension, idx) => ({
    id: `task-${dimension}-${idx}`,
    dimension,
    description: `Investigate ${DIMENSION_DESCRIPTIONS[dimension]} for ${scope.systemName}`,
    requiredEvidence: [
      `Operational metrics related to ${dimension}`,
      `Governance policies addressing ${dimension}`,
      `Incident reports or historical data`,
      `Operator interviews or documentation`,
      `Telemetry data: autonomous actions, review throughput, backlog, restoration times`,
    ],
    suggestedSources: [
      "System documentation",
      "Governance policy documents",
      "Incident logs",
      "Performance metrics",
      "Operator runbooks",
      "Monitoring dashboards",
      "Audit reports",
    ],
    status: "pending",
    telemetryIndicators: [
      "autonomousActionsPerHour",
      "humanReviewThroughputPerHour",
      "unreviewedActionBacklog",
      "emergencyInterventionFrequencyPerWeek",
      "technicalRestorationTimeMinutes",
      "institutionalValidationTimeHours",
      "operationalBacklogClearanceTimeHours",
      "externalExpertiseDependency",
    ],
  }));

  // Assign tasks to agents based on competencies
  const assignments: Record<string, string[]> = {
    clerk: tasks.filter((_, i) => i % 4 === 0).map(t => t.id),
    specialist: tasks.filter((_, i) => i % 4 === 1).map(t => t.id),
    executive: tasks.filter((_, i) => i % 4 === 2).map(t => t.id),
    archivist: tasks.filter((_, i) => i % 4 === 3).map(t => t.id),
  };

  // Assign agents to tasks
  for (const [agent, taskIds] of Object.entries(assignments)) {
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (task) task.assignedAgent = agent;
    }
  }

  const output: ReflexiveArbiterStageOutput = {
    taskAllocation: { tasks, assignments },
  };

  (session as any)._tasks = tasks;
  (session as any)._assignments = assignments;

  // Log activity
  const activityLog = (session as any)._activityLog || [];
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "task_allocation",
    agent: "clerk",
    action: "tasks_allocated",
    description: `Allocated ${tasks.length} research tasks across ${Object.keys(assignments).length} agents`,
    details: { taskCount: tasks.length, agentCount: Object.keys(assignments).length, dimensions: DIMENSIONS },
    severity: "info",
  }));
  (session as any)._activityLog = activityLog;

  return {
    stage: "task_allocation",
    agent: "clerk",
    output,
    valid: true,
  };
}

export async function runIndependentInvestigationStage(
  session: ReflexiveArbiterSession,
  evidenceCollector?: (task: ResearchTask) => Promise<Partial<AgentFinding>>
): Promise<ReflexiveArbiterStageResult> {
  const tasks = (session as any)._tasks as ResearchTask[];
  if (!tasks || tasks.length === 0) {
    return {
      stage: "independent_investigation",
      agent: "specialist",
      output: {},
      valid: false,
      error: "No tasks allocated. Run task_allocation stage first.",
    };
  }

  const findings: AgentFinding[] = [];

  for (const task of tasks) {
    if (task.status === "blocked") continue;
    
    task.status = "in_progress";
    
    let finding: AgentFinding;
    
    if (evidenceCollector) {
      const collected = await evidenceCollector(task);
      finding = {
        taskId: task.id,
        agent: task.assignedAgent || "specialist",
        dimension: task.dimension,
        evidence: collected.evidence || [],
        observations: collected.observations || [],
        assumptions: collected.assumptions || [],
        confidence: collected.confidence ?? 0.5,
        rating: collected.rating ?? "unknown",
        rationale: collected.rationale || "Automated evidence collection",
        timestamp: collected.timestamp || nowIso(),
        telemetry: collected.telemetry,
      };
    } else {
      finding = {
        taskId: task.id,
        agent: task.assignedAgent || "specialist",
        dimension: task.dimension,
        evidence: [],
        observations: [`Investigation of ${task.dimension} dimension pending`],
        assumptions: ["Assessment requires evidence collection"],
        confidence: 0.0,
        rating: "unknown",
        rationale: "No evidence collected yet - requires investigation",
        timestamp: nowIso(),
      };
    }
    
    task.status = "complete";
    task.findings = finding;
    findings.push(finding);
  }

  const output: ReflexiveArbiterStageOutput = {
    independentInvestigation: { findings },
  };

  (session as any)._findings = findings;

  // Log activity
  const activityLog = (session as any)._activityLog || [];
  const evidenceCount = findings.reduce((sum, f) => sum + (f.evidence?.length || 0), 0);
  const ratingsGiven = findings.filter(f => f.rating !== "unknown").length;
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "independent_investigation",
    agent: "specialist",
    action: "investigation_completed",
    description: `Completed independent investigation for ${findings.length} dimensions`,
    details: { dimensionCount: findings.length, evidenceItemsCollected: evidenceCount, ratingsProvided: ratingsGiven },
    severity: "info",
  }));
  (session as any)._activityLog = activityLog;

  return {
    stage: "independent_investigation",
    agent: "specialist",
    output,
    valid: true,
  };
}

export function runCrossAgentReviewStage(session: ReflexiveArbiterSession): ReflexiveArbiterStageResult {
  const findings = (session as any)._findings as AgentFinding[];
  if (!findings || findings.length === 0) {
    return {
      stage: "cross_agent_review",
      agent: "executive",
      output: {},
      valid: false,
      error: "No findings to review. Run independent_investigation stage first.",
    };
  }

  const reviews: PeerReview[] = [];
  const agreements: string[] = [];
  const disagreements: string[] = [];

  const agents = [...new Set(findings.map(f => f.agent))];
  
  for (const finding of findings) {
    for (const reviewer of agents) {
      if (reviewer === finding.agent) continue;
      
      const review: PeerReview = {
        reviewer,
        reviewedFinding: finding,
        agreement: "partial",
        comments: `${reviewer} reviewing ${finding.agent}'s finding on ${finding.dimension}: ${finding.rationale}`,
        counterEvidence: [],
        alternativeRating: "unknown",
      };
      reviews.push(review);
      
      if (review.agreement === "agree") {
        agreements.push(`${reviewer} agrees with ${finding.agent} on ${finding.dimension}`);
      } else if (review.agreement === "disagree") {
        disagreements.push(`${reviewer} disagrees with ${finding.agent} on ${finding.dimension}`);
      } else {
        agreements.push(`${reviewer} partially agrees with ${finding.agent} on ${finding.dimension}`);
        disagreements.push(`${reviewer} has concerns about ${finding.agent}'s assessment of ${finding.dimension}`);
      }
    }
  }

  const output: ReflexiveArbiterStageOutput = {
    crossAgentReview: { reviews, agreements, disagreements },
  };

  (session as any)._reviews = reviews;

  // Log activity
  const activityLog = (session as any)._activityLog || [];
  const reviewCount = reviews.length;
  const agreementCount = agreements.length;
  const disagreementCount = disagreements.length;
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "cross_agent_review",
    agent: "executive",
    action: "peer_review_completed",
    description: `Completed cross-agent peer review with ${reviewCount} reviews`,
    details: { reviewCount, agreementCount, disagreementCount, agentsInvolved: [...new Set(reviews.map(r => r.reviewer))].length },
    severity: disagreementCount > 0 ? "warning" : "info",
  }));
  (session as any)._activityLog = activityLog;

  return {
    stage: "cross_agent_review",
    agent: "executive",
    output,
    valid: true,
  };
}

export function runFindingsReconciliationStage(session: ReflexiveArbiterSession): ReflexiveArbiterStageResult {
  const findings = (session as any)._findings as AgentFinding[];
  const reviews = (session as any)._reviews as PeerReview[];
  
  if (!findings || findings.length === 0) {
    return {
      stage: "findings_reconciliation",
      agent: "executive",
      output: {},
      valid: false,
      error: "No findings to reconcile.",
    };
  }

  const reconciledFindings: ReconciledFinding[] = [];
  const unresolvedDisagreements: UnresolvedDisagreement[] = [];

  for (const dimension of DIMENSIONS) {
    const dimFindings = findings.filter(f => f.dimension === dimension);
    const dimReviews = reviews.filter(r => r.reviewedFinding.dimension === dimension);
    
    if (dimFindings.length === 0) continue;

    const ratings = dimFindings.map(f => ({ agent: f.agent, rating: f.rating, confidence: f.confidence, rationale: f.rationale }));
    const reviewRatings = dimReviews.map(r => ({ agent: r.reviewer, rating: r.alternativeRating ?? "unknown", rationale: r.comments }));

    const knownRatings = ratings.filter(r => r.rating !== "unknown");
    const uniqueRatings = [...new Set(knownRatings.map(r => r.rating))];
    
    let consensusRating: DivergenceRating = "unknown";
    let consensusConfidence = 0;
    let dissentingViews: UnresolvedDisagreement[] = [];

    if (uniqueRatings.length === 1 && knownRatings.length > 0) {
      consensusRating = uniqueRatings[0];
      consensusConfidence = knownRatings.reduce((sum, r) => sum + r.confidence, 0) / knownRatings.length;
    } else if (knownRatings.length > 0) {
      const positions: Record<string, { rating: DivergenceRating; rationale: string }> = {};
      for (const r of knownRatings) {
        positions[r.agent] = { rating: r.rating, rationale: r.rationale };
      }
      for (const r of reviewRatings) {
        if (r.rating !== "unknown") {
          positions[r.agent] = { rating: r.rating, rationale: r.rationale };
        }
      }
      
      const disagreement: UnresolvedDisagreement = {
        dimension,
        agents: Object.keys(positions),
        positions,
        blockingEvidence: dimFindings.flatMap(f => f.evidence),
      };
      unresolvedDisagreements.push(disagreement);
      dissentingViews.push(disagreement);
      
      const sortedRatings = knownRatings
        .map(r => typeof r.rating === "number" ? r.rating : -1)
        .filter((r): r is 0 | 1 | 2 | 3 | 4 => r >= 0)
        .sort((a, b) => a - b);
      if (sortedRatings.length > 0) {
        consensusRating = sortedRatings[Math.floor(sortedRatings.length / 2)];
        consensusConfidence = 0.5;
      }
    }

    const supportingEvidence = dimFindings.flatMap(f => f.evidence);
    const allObservations = dimFindings.flatMap(f => f.observations);
    
    // Calculate evidence coverage for this dimension
    const evidenceCoverage = calculateEvidenceCoverage(supportingEvidence);
    const unresolvedDisagreementCount = dissentingViews.length;

    reconciledFindings.push({
      dimension,
      consensusRating,
      consensusConfidence,
      supportingEvidence,
      dissentingViews,
      rationale: allObservations.join("; ") || `Reconciled assessment for ${dimension}`,
      evidenceCoverage,
      unresolvedDisagreementCount,
    });
  }

  const output: ReflexiveArbiterStageOutput = {
    findingsReconciliation: { reconciledFindings, unresolvedDisagreements },
  };

  (session as any)._reconciledFindings = reconciledFindings;
  (session as any)._unresolvedDisagreements = unresolvedDisagreements;

  // Log activity
  const activityLog = (session as any)._activityLog || [];
  const criticalCount = reconciledFindings.filter(r => r.consensusRating !== "unknown" && typeof r.consensusRating === "number" && r.consensusRating >= 3).length;
  const unknownCount = reconciledFindings.filter(r => r.consensusRating === "unknown").length;
  const totalDisagreements = unresolvedDisagreements.length;
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "findings_reconciliation",
    agent: "executive",
    action: "findings_reconciled",
    description: `Reconciled findings across ${reconciledFindings.length} dimensions`,
    details: { 
      dimensionCount: reconciledFindings.length, 
      criticalDimensions: criticalCount, 
      unknownDimensions: unknownCount,
      unresolvedDisagreements: totalDisagreements 
    },
    severity: criticalCount > 0 || totalDisagreements > 0 ? "warning" : "info",
  }));
  (session as any)._activityLog = activityLog;

  return {
    stage: "findings_reconciliation",
    agent: "executive",
    output,
    valid: true,
  };
}

export function runReportGenerationStage(session: ReflexiveArbiterSession): ReflexiveArbiterStageResult {
  const scope = (session as any)._scope as AssessmentScope;
  const tasks = (session as any)._tasks as ResearchTask[];
  const findings = (session as any)._findings as AgentFinding[];
  const reconciledFindings = (session as any)._reconciledFindings as ReconciledFinding[];
  const unresolvedDisagreements = (session as any)._unresolvedDisagreements as UnresolvedDisagreement[];
  
  if (!scope || !reconciledFindings) {
    return {
      stage: "report_generation",
      agent: "archivist",
      output: {},
      valid: false,
      error: "Missing required data for report generation.",
    };
  }

  // Build dimension assessments from reconciled findings
  const dimensionAssessments: DimensionAssessment[] = reconciledFindings.map(rf => {
    const dimFindings = findings.filter(f => f.dimension === rf.dimension);
    return {
      dimension: rf.dimension,
      rating: rf.consensusRating,
      evidence: rf.supportingEvidence,
      assumptions: dimFindings.flatMap(f => f.assumptions),
      confidence: rf.consensusConfidence,
      notes: rf.rationale,
      evidenceCoverage: rf.evidenceCoverage,
      unresolvedDisagreementCount: rf.unresolvedDisagreementCount,
      isCritical: typeof rf.consensusRating === "number" && rf.consensusRating >= 3,
    };
  });

  // Extract operational capabilities and governance mechanisms from findings
  const operationalCapabilities: OperationalCapability[] = [];
  const governanceMechanisms: GovernanceMechanism[] = [];

  // Aggregate telemetry across all findings
  const allTelemetry: Partial<GovernanceTelemetry>[] = findings
    .map(f => f.telemetry)
    .filter((t): t is Partial<GovernanceTelemetry> => t !== undefined && Object.keys(t).length > 0);

  // Calculate overall divergence score (average of known ratings, excluding unknown)
  const knownRatings = dimensionAssessments
    .map(da => isNumericRating(da.rating) ? da.rating : null)
    .filter((r): r is 0 | 1 | 2 | 3 | 4 => r !== null);
  
  const overallDivergenceScore = knownRatings.length > 0
    ? knownRatings.reduce((sum: number, r) => sum + r, 0) / knownRatings.length
    : 0;

  // Scoring Refinement calculations
  const numericRatings = dimensionAssessments
    .map(da => isNumericRating(da.rating) ? da.rating : null)
    .filter((r): r is 0 | 1 | 2 | 3 | 4 => r !== null);
  
  const maxDimensionDivergence = numericRatings.length > 0 ? Math.max(...numericRatings) : "unknown";
  const criticalDimensionCount = dimensionAssessments.filter(da => da.isCritical).length;
  const evidenceCoverage = dimensionAssessments.length > 0
    ? dimensionAssessments.reduce((sum, da) => sum + da.evidenceCoverage, 0) / dimensionAssessments.length
    : 0;
  const dimensionConfidence: Record<AssessmentDimension, number> = {} as any;
  for (const da of dimensionAssessments) {
    dimensionConfidence[da.dimension] = da.confidence;
  }
  const unresolvedDisagreementCount = dimensionAssessments.reduce((sum, da) => sum + da.unresolvedDisagreementCount, 0);
  const unknownDimensionCount = dimensionAssessments.filter(da => da.rating === "unknown").length;
  const hasCriticalDivergence = criticalDimensionCount > 0;

  const overallConfidence = dimensionAssessments.length > 0
    ? dimensionAssessments.reduce((sum, da) => sum + da.confidence, 0) / dimensionAssessments.length
    : 0;

  // Identify cascading failure risks
  const cascadingFailureRisks: CascadingFailureRisk[] = unresolvedDisagreements.map(ud => ({
    trigger: `Governance gap in ${ud.dimension}`,
    propagationPath: [`${ud.dimension} gap`, "Operational failure", "Cascading system impact"],
    impact: `Unresolved disagreement among ${ud.agents.join(", ")} on ${ud.dimension}`,
    likelihood: "medium" as const,
    governanceGap: ud.dimension,
    evidence: ud.blockingEvidence,
  }));

  // Identify governance debt
  const governanceDebt: GovernanceDebtItem[] = dimensionAssessments
    .filter(da => (typeof da.rating === "number" && da.rating >= 2) || da.rating === "unknown")
    .map(da => ({
      description: `Governance gap in ${DIMENSION_DESCRIPTIONS[da.dimension]} (rating: ${da.rating})`,
      dimension: da.dimension,
      severity: (typeof da.rating === "number" && da.rating >= 3) ? "critical" : 
                (typeof da.rating === "number" && da.rating >= 2) ? "high" : "medium",
      accumulating: true,
      evidence: da.evidence,
    }));

  // Unresolved questions
  const unresolvedQuestions: UnresolvedQuestion[] = unresolvedDisagreements.map(ud => ({
    question: `What is the true governance divergence in ${ud.dimension}?`,
    dimension: ud.dimension,
    blockingEvidence: ud.blockingEvidence,
    priority: "high" as const,
  }));

  const assessment: GovernanceDivergenceAssessment = {
    id: session.id,
    version: "2.0.0",
    methodologyVersion: "2.0.0",
    scope,
    operationalCapabilities,
    governanceMechanisms,
    dimensionAssessments,
    cascadingFailureRisks,
    governanceDebt,
    unresolvedQuestions,
    overallDivergenceScore,
    maxDimensionDivergence,
    criticalDimensionCount,
    evidenceCoverage,
    dimensionConfidence,
    unresolvedDisagreementCount,
    unknownDimensionCount,
    hasCriticalDivergence,
    confidence: overallConfidence,
    evidenceLimitations: [
      "Assessment based on available evidence only",
      "Missing evidence does not imply governance failure",
      "Some dimensions rated unknown due to insufficient data",
      "LLM assertions marked as 'llm_assertion' are not verified evidence",
      "Telemetry indicators may be estimated rather than measured",
    ],
    recommendedInvestigations: unresolvedQuestions.map(uq => uq.question),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    scrumSessionId: session.id,
  };

  // Generate report
  const reportPath = generateAssessmentReport(assessment, session);
  
  session.assessment = assessment;

  const output: ReflexiveArbiterStageOutput = {
    reportGeneration: { assessment, reportPath },
  };

  // Log activity
  const activityLog = (session as any)._activityLog || [];
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "report_generation",
    agent: "archivist",
    action: "report_generated",
    description: `Generated assessment report: ${assessment.id}`,
    details: { 
      reportPath, 
      overallScore: assessment.overallDivergenceScore, 
      criticalCount: assessment.criticalDimensionCount,
      evidenceCoverage: assessment.evidenceCoverage 
    },
    severity: assessment.hasCriticalDivergence ? "critical" : "info",
  }));
  (session as any)._activityLog = activityLog;

  return {
    stage: "report_generation",
    agent: "archivist",
    output,
    valid: true,
  };
}

export function runArchivalStage(session: ReflexiveArbiterSession): ReflexiveArbiterStageResult {
  const assessment = session.assessment;
  if (!assessment) {
    return {
      stage: "archival",
      agent: "archivist",
      output: {},
      valid: false,
      error: "No assessment to archive.",
    };
  }

  // Save assessment JSON
  const assessmentPath = path.join(ASSESSMENT_DIR, `${assessment.id}.json`);
  fs.writeFileSync(assessmentPath, JSON.stringify(assessment, null, 2), "utf8");

  // Check for previous assessments of the same system for longitudinal comparison
  let longitudinalComparison: LongitudinalComparison | undefined;
  const previousAssessments = findPreviousAssessments(assessment.scope.systemName);
  if (previousAssessments.length > 0) {
    const latest = previousAssessments[0];
    longitudinalComparison = generateLongitudinalComparison(latest, assessment);
  }

  const paths = [assessmentPath];
  if (longitudinalComparison) {
    const comparisonPath = path.join(ASSESSMENT_DIR, `${assessment.id}-longitudinal.json`);
    fs.writeFileSync(comparisonPath, JSON.stringify(longitudinalComparison, null, 2), "utf8");
    paths.push(comparisonPath);
  }

  const output: ReflexiveArbiterStageOutput = {
    archival: { archived: true, paths, longitudinalComparison },
  };

  // Log activity
  const activityLog = (session as any)._activityLog || [];
  activityLog.push(createActivityLogEntry({
    assessmentId: session.id,
    stage: "archival",
    agent: "archivist",
    action: "assessment_archived",
    description: `Archived assessment ${assessment.id} with ${paths.length} files`,
    details: { 
      assessmentPath: paths[0], 
      hasLongitudinalComparison: !!longitudinalComparison,
      previousAssessmentId: longitudinalComparison?.previousAssessmentId 
    },
    severity: "info",
  }));
  (session as any)._activityLog = activityLog;

  // Save activity log to assessment
  if (session.assessment) {
    (session.assessment as any).activityLog = activityLog;
  }

  return {
    stage: "archival",
    agent: "archivist",
    output,
    valid: true,
  };
}

function findPreviousAssessments(systemName: string): GovernanceDivergenceAssessment[] {
  ensureDirs();
  const files = fs.readdirSync(ASSESSMENT_DIR).filter(f => f.endsWith(".json") && !f.includes("-longitudinal"));
  const assessments: GovernanceDivergenceAssessment[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(ASSESSMENT_DIR, file), "utf8");
      const assessment = JSON.parse(content) as GovernanceDivergenceAssessment;
      if (assessment.scope.systemName === systemName && assessment.id !== assessment.id) {
        assessments.push(assessment);
      }
    } catch {
      // Ignore invalid files
    }
  }
  
  return assessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function generateLongitudinalComparison(
  previous: GovernanceDivergenceAssessment,
  current: GovernanceDivergenceAssessment
): LongitudinalComparison {
  const dimensionChanges: Record<AssessmentDimension, any> = {} as any;
  
  for (const dim of DIMENSIONS) {
    const prev = previous.dimensionAssessments.find(d => d.dimension === dim);
    const curr = current.dimensionAssessments.find(d => d.dimension === dim);
    
    const prevRating = prev?.rating ?? "unknown";
    const currRating = curr?.rating ?? "unknown";
    
    let change: "improved" | "worsened" | "stable" | "unknown" = "unknown";
    if (typeof prevRating === "number" && typeof currRating === "number") {
      if (currRating < prevRating) change = "improved";
      else if (currRating > prevRating) change = "worsened";
      else change = "stable";
    }
    
    dimensionChanges[dim] = {
      previousRating: prevRating,
      currentRating: currRating,
      change,
      notes: `Previous: ${prevRating}, Current: ${currRating}`,
    };
  }

  const changes = Object.values(dimensionChanges);
  const improved = changes.filter(c => c.change === "improved").length;
  const worsened = changes.filter(c => c.change === "worsened").length;
  
  let overallTrend: "improving" | "worsening" | "stable" | "mixed" = "stable";
  if (improved > worsened) overallTrend = "improving";
  else if (worsened > improved) overallTrend = "worsening";
  else if (improved === 0 && worsened === 0) overallTrend = "stable";
  else overallTrend = "mixed";

  const prevDebt = previous.governanceDebt.length;
  const currDebt = current.governanceDebt.length;
  let debtTrajectory: "accumulating" | "reducing" | "stable" = "stable";
  if (currDebt > prevDebt) debtTrajectory = "accumulating";
  else if (currDebt < prevDebt) debtTrajectory = "reducing";

  // Telemetry trend comparison
  const telemetryTrends: LongitudinalComparison["telemetryTrends"] = [];
  const telemetryKeys: (keyof GovernanceTelemetry)[] = [
    "autonomousActionsPerHour",
    "humanReviewThroughputPerHour",
    "unreviewedActionBacklog",
    "emergencyInterventionFrequencyPerWeek",
    "technicalRestorationTimeMinutes",
    "institutionalValidationTimeHours",
    "operationalBacklogClearanceTimeHours",
    "externalExpertiseDependency",
  ];
  
  // Note: We'd need telemetry in scope or elsewhere to compare
  // For now, include placeholder structure

  return {
    previousAssessmentId: previous.id,
    dimensionChanges,
    overallTrend,
    debtTrajectory,
    telemetryTrends,
    notes: `Compared assessment ${previous.id} (${previous.createdAt}) with ${current.id} (${current.createdAt})`,
  };
}

function generateAssessmentReport(
  assessment: GovernanceDivergenceAssessment,
  session: ReflexiveArbiterSession
): string {
  const lines: string[] = [];
  
  lines.push(`# Reflexive Arbiter Assessment: ${assessment.scope.systemName}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Metadata");
  lines.push("");
  lines.push(`- **Assessment ID:** ${assessment.id}`);
  lines.push(`- **Session ID:** ${session.id}`);
  lines.push(`- **Date:** ${new Date(assessment.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`);
  lines.push(`- **Methodology Version:** ${assessment.methodologyVersion}`);
  lines.push(`- **Overall Divergence Score:** ${assessment.overallDivergenceScore.toFixed(2)} / 4.00`);
  
  // Scoring Refinement metrics
  lines.push(`- **Maximum Dimension Divergence:** ${assessment.maxDimensionDivergence === "unknown" ? "Unknown" : assessment.maxDimensionDivergence + " / 4"}`);
  lines.push(`- **Critical Dimension Count:** ${assessment.criticalDimensionCount} / 6`);
  lines.push(`- **Evidence Coverage:** ${(assessment.evidenceCoverage * 100).toFixed(0)}%`);
  lines.push(`- **Unresolved Disagreements:** ${assessment.unresolvedDisagreementCount}`);
  lines.push(`- **Unknown Dimensions:** ${assessment.unknownDimensionCount} / 6`);
  lines.push(`- **Has Critical Divergence:** ${assessment.hasCriticalDivergence ? "YES" : "No"}`);
  lines.push(`- **Overall Confidence:** ${(assessment.confidence * 100).toFixed(0)}%`);
  lines.push("");
  
  lines.push("## Dimension Confidence Scores");
  lines.push("");
  for (const dim of DIMENSIONS) {
    lines.push(`- **${dim.charAt(0).toUpperCase() + dim.slice(1)}:** ${(assessment.dimensionConfidence[dim] * 100).toFixed(0)}%`);
  }
  lines.push("");
  
  lines.push("## Scope");
  lines.push("");
  lines.push(`- **System:** ${assessment.scope.systemName}`);
  lines.push(`- **Description:** ${assessment.scope.systemDescription}`);
  lines.push(`- **Institutional Context:** ${assessment.scope.institutionalContext}`);
  lines.push(`- **Boundaries:** ${assessment.scope.boundaries.join(", ")}`);
  if (assessment.scope.telemetryContext) {
    lines.push("");
    lines.push("### Governance Telemetry Context");
    lines.push("");
    const tc = assessment.scope.telemetryContext;
    lines.push(`- **Autonomous Actions/Hour:** ${tc.autonomousActionsPerHour ?? "Unavailable"}`);
    lines.push(`- **Human Review Throughput/Hour:** ${tc.humanReviewThroughputPerHour ?? "Unavailable"}`);
    lines.push(`- **Unreviewed Action Backlog:** ${tc.unreviewedActionBacklog ?? "Unavailable"}`);
    lines.push(`- **Emergency Interventions/Week:** ${tc.emergencyInterventionFrequencyPerWeek ?? "Unavailable"}`);
    lines.push(`- **Technical Restoration Time (min):** ${tc.technicalRestorationTimeMinutes ?? "Unavailable"}`);
    lines.push(`- **Institutional Validation Time (hrs):** ${tc.institutionalValidationTimeHours ?? "Unavailable"}`);
    lines.push(`- **Operational Backlog Clearance (hrs):** ${tc.operationalBacklogClearanceTimeHours ?? "Unavailable"}`);
    lines.push(`- **External Expertise Dependency:** ${tc.externalExpertiseDependency ?? "Unavailable"}`);
    lines.push(`- **Measured At:** ${tc.measuredAt}`);
  }
  lines.push("");
  
  lines.push("## Dimension Assessments");
  lines.push("");
  
  for (const da of assessment.dimensionAssessments) {
    const ratingStr = da.rating === "unknown" ? "Unknown" : `${da.rating} / 4`;
    const desc = DIVERGENCE_SCALE_DESCRIPTIONS[da.rating];
    const criticalFlag = da.isCritical ? " 🔴 **CRITICAL**" : "";
    lines.push(`### ${da.dimension.charAt(0).toUpperCase() + da.dimension.slice(1)}${criticalFlag}`);
    lines.push("");
    lines.push(`**Rating:** ${ratingStr}`);
    lines.push(`**Confidence:** ${(da.confidence * 100).toFixed(0)}%`);
    lines.push(`**Evidence Coverage:** ${(da.evidenceCoverage * 100).toFixed(0)}%`);
    lines.push(`**Unresolved Disagreements:** ${da.unresolvedDisagreementCount}`);
    lines.push(`**Scale Meaning:** ${desc}`);
    lines.push("");
    
    if (da.evidence.length > 0) {
      lines.push("**Evidence:**");
      for (const e of da.evidence) {
        const classification = e.classification.toUpperCase();
        const verification = e.verificationStatus.toUpperCase();
        const independence = e.sourceIndependence;
        lines.push(`- [${classification}] [${verification}] [${independence}] ${e.content} (source: ${e.sourceUri}, confidence: ${(e.confidence * 100).toFixed(0)}%)`);
      }
      lines.push("");
    }
    
    if (da.assumptions.length > 0) {
      lines.push("**Assumptions:**");
      da.assumptions.forEach(a => lines.push(`- ${a}`));
      lines.push("");
    }
    
    if (da.notes) {
      lines.push(`**Notes:** ${da.notes}`);
      lines.push("");
    }
  }
  
  if (assessment.cascadingFailureRisks.length > 0) {
    lines.push("## Cascading Failure Risks");
    lines.push("");
    assessment.cascadingFailureRisks.forEach(risk => {
      lines.push(`### ${risk.trigger}`);
      lines.push(`- **Propagation:** ${risk.propagationPath.join(" → ")}`);
      lines.push(`- **Impact:** ${risk.impact}`);
      lines.push(`- **Likelihood:** ${risk.likelihood}`);
      lines.push(`- **Governance Gap:** ${risk.governanceGap}`);
      if (risk.evidence.length > 0) {
        lines.push("**Supporting Evidence:**");
        risk.evidence.forEach(e => lines.push(`- ${e.content} (${e.sourceUri})`));
      }
      lines.push("");
    });
  }
  
  if (assessment.governanceDebt.length > 0) {
    lines.push("## Governance Debt");
    lines.push("");
    assessment.governanceDebt.forEach(debt => {
      lines.push(`- **[${debt.severity.toUpperCase()}]** ${debt.description} (${debt.dimension})`);
      if (debt.accumulating) lines.push(`  - *Accumulating*`);
      if (debt.evidence.length > 0) lines.push(`  - Evidence: ${debt.evidence.map(e => e.content).join("; ")}`);
    });
    lines.push("");
  }
  
  if (assessment.unresolvedQuestions.length > 0) {
    lines.push("## Unresolved Research Questions");
    lines.push("");
    assessment.unresolvedQuestions.forEach(q => {
      lines.push(`- **[${q.priority.toUpperCase()}]** ${q.question} (${q.dimension})`);
      if (q.blockingEvidence.length > 0) lines.push(`  - Blocking evidence: ${q.blockingEvidence.map(e => e.content).join("; ")}`);
    });
    lines.push("");
  }
  
  lines.push("## Evidence Limitations");
  lines.push("");
  assessment.evidenceLimitations.forEach(lim => lines.push(`- ${lim}`));
  lines.push("");
  
  lines.push("## Recommended Further Investigations");
  lines.push("");
  assessment.recommendedInvestigations.forEach(rec => lines.push(`- ${rec}`));
  lines.push("");
  
  if (assessment.methodologyVersion === "2.0.0") {
    lines.push("## Measurement Validation Notes");
    lines.push("");
    lines.push("- **Evidence Integrity**: All evidence records include source URI, publication/retrieval timestamps, classification (observed/reported/inferred/hypothetical), source independence, and verification status.");
    lines.push("- **Governance Telemetry**: Measurable indicators collected alongside qualitative ratings. Unavailable measurements are explicitly marked as null (not zero).");
    lines.push("- **Scoring Refinement**: Overall score excludes 'unknown' ratings. Maximum dimension divergence, critical dimension count, evidence coverage, and dimension-level confidence are reported. Critical individual failures are not obscured by aggregate scores.");
    lines.push("- **LLM Assertions**: Automatically classified as 'llm_assertion' verification status and 'inferred' classification. These are NOT treated as verified evidence.");
    lines.push("");
  }
  
  lines.push("---");
  lines.push("");
  lines.push("*Generated by Pixel Office Reflexive Arbiter v2.0.0*");
  
  const reportContent = lines.join("\n");
  const reportPath = path.join(REPORTS_DIR, `${assessment.id}.md`);
  fs.writeFileSync(reportPath, reportContent, "utf8");
  
  return reportPath;
}

export async function advanceReflexiveArbiterSession(
  session: ReflexiveArbiterSession,
  options?: {
    systemDescription?: string;
    institutionalContext?: string;
    boundaries?: string[];
    evidenceCollector?: (task: ResearchTask) => Promise<Partial<AgentFinding>>;
  }
): Promise<{ session: ReflexiveArbiterSession; stageResult: ReflexiveArbiterStageResult }> {
  const stageHandlers: Record<ReflexiveArbiterStage, (s: ReflexiveArbiterSession, opts?: any) => Promise<ReflexiveArbiterStageResult> | ReflexiveArbiterStageResult> = {
    scope_definition: (s, opts) => runScopeDefinitionStage(s, opts?.systemDescription, opts?.institutionalContext, opts?.boundaries),
    task_allocation: runTaskAllocationStage,
    independent_investigation: (s, opts) => runIndependentInvestigationStage(s, opts?.evidenceCollector),
    cross_agent_review: runCrossAgentReviewStage,
    findings_reconciliation: runFindingsReconciliationStage,
    report_generation: runReportGenerationStage,
    archival: runArchivalStage,
  };

  const handler = stageHandlers[session.currentStage];
  if (!handler) {
    session.finalStatus = "failed";
    return {
      session,
      stageResult: {
        stage: session.currentStage,
        agent: "system",
        output: {},
        valid: false,
        error: "Unknown stage",
      },
    };
  }

  const stageResult = await handler(session, options);
  session.results.push(stageResult);
  session.updatedAt = nowIso();
  
  console.log(`[ARBITER] Completed stage: ${session.currentStage}, valid: ${stageResult.valid}, next: ${getNextArbiterStage(session.currentStage)}`);

  if (!stageResult.valid) {
    session.finalStatus = "failed";
    return { session, stageResult };
  }

  const nextStage = getNextArbiterStage(session.currentStage);
  if (nextStage) {
    session.currentStage = nextStage;
    session.stage = nextStage;
  } else {
    session.finalStatus = "complete";
  }

  return { session, stageResult };
}

export function loadAssessment(assessmentId: string): GovernanceDivergenceAssessment | null {
  ensureDirs();
  const assessmentPath = path.join(ASSESSMENT_DIR, `${assessmentId}.json`);
  if (!fs.existsSync(assessmentPath)) return null;
  
  try {
    const content = fs.readFileSync(assessmentPath, "utf8");
    return JSON.parse(content) as GovernanceDivergenceAssessment;
  } catch {
    return null;
  }
}

export function listAssessments(systemName?: string): Array<{ id: string; systemName: string; createdAt: string; overallDivergenceScore: number }> {
  ensureDirs();
  const files = fs.readdirSync(ASSESSMENT_DIR).filter(f => f.endsWith(".json") && !f.includes("-longitudinal"));
  const items: Array<{ id: string; systemName: string; createdAt: string; overallDivergenceScore: number }> = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(ASSESSMENT_DIR, file), "utf8");
      const assessment = JSON.parse(content) as GovernanceDivergenceAssessment;
      if (!systemName || assessment.scope.systemName === systemName) {
        items.push({
          id: assessment.id,
          systemName: assessment.scope.systemName,
          createdAt: assessment.createdAt,
          overallDivergenceScore: assessment.overallDivergenceScore,
        });
      }
    } catch {
      // Ignore
    }
  }
  
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAssessmentReport(assessmentId: string): string | null {
  const reportPath = path.join(REPORTS_DIR, `${assessmentId}.md`);
  if (!fs.existsSync(reportPath)) return null;
  return fs.readFileSync(reportPath, "utf8");
}