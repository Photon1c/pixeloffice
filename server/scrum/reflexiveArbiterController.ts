/**
 * Reflexive Arbiter Controller
 * 
 * Orchestrates governance divergence assessments through a multi-agent research scrum.
 * Implements the six-stage workflow:
 * 1. Scope Definition
 * 2. Research Task Allocation
 * 3. Independent Investigation
 * 4. Cross-Agent Peer Review
 * 5. Findings Reconciliation
 * 6. Report Generation and Archival
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
  DIVERGENCE_SCALE_DESCRIPTIONS,
  DIMENSION_DESCRIPTIONS,
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

export function createReflexiveArbiterSession(
  topic: string,
  systemScope: string,
  participants: string[] = ["clerk", "specialist", "executive", "archivist"],
  sourceContext?: string[],
  repo?: string
): ReflexiveArbiterSession {
  ensureDirs();
  
  return {
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
}

export function getNextArbiterStage(current: ReflexiveArbiterStage): ReflexiveArbiterStage | null {
  const idx = REFLEXIVE_ARBITER_STAGES.indexOf(current);
  return idx < REFLEXIVE_ARBITER_STAGES.length - 1 ? REFLEXIVE_ARBITER_STAGES[idx + 1] : null;
}

export async function runScopeDefinitionStage(
  session: ReflexiveArbiterSession,
  systemDescription?: string,
  institutionalContext?: string,
  boundaries?: string[]
): Promise<ReflexiveArbiterStageResult> {
  const topic = session.topic;
  const systemScope = session.systemScope;
  
  const scope: AssessmentScope = {
    systemName: systemScope || topic,
    systemDescription: systemDescription || `System under assessment: ${topic}`,
    institutionalContext: institutionalContext || "Institutional context to be defined during investigation",
    boundaries: boundaries || ["System boundary to be defined during investigation"],
    assessmentTimestamp: nowIso(),
    assessorContext: `Reflexive Arbiter session ${session.id}`,
  };

  const researchQuestions = [
    `What are the operational capabilities of ${scope.systemName}?`,
    `What governance mechanisms currently exist for ${scope.systemName}?`,
    `What is the divergence between capabilities and governance across each dimension?`,
    `What cascading failure risks exist due to governance gaps?`,
    `What governance debt is accumulating?`,
  ];

  const output: ReflexiveArbiterStageOutput = {
    scopeDefinition: {
      systemDescription: scope.systemDescription,
      institutionalContext: scope.institutionalContext,
      boundaries: scope.boundaries,
      researchQuestions,
    },
  };

  // Store scope in session for later stages
  (session as any)._scope = scope;

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

  const dimensions: AssessmentDimension[] = [
    "temporal", "authority", "visibility", "competency", "recovery", "accountability"
  ];

  const tasks: ResearchTask[] = dimensions.map((dimension, idx) => ({
    id: `task-${dimension}-${idx}`,
    dimension,
    description: `Investigate ${DIMENSION_DESCRIPTIONS[dimension]} for ${scope.systemName}`,
    requiredEvidence: [
      `Operational metrics related to ${dimension}`,
      `Governance policies addressing ${dimension}`,
      `Incident reports or historical data`,
      `Operator interviews or documentation`,
    ],
    suggestedSources: [
      "System documentation",
      "Governance policy documents",
      "Incident logs",
      "Performance metrics",
      "Operator runbooks",
    ],
    status: "pending",
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
        timestamp: nowIso(),
      };
    } else {
      // Default: create a placeholder finding that requires human/LLM input
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

  // Each agent reviews findings from other agents
  const agents = [...new Set(findings.map(f => f.agent))];
  
  for (const finding of findings) {
    for (const reviewer of agents) {
      if (reviewer === finding.agent) continue; // Don't self-review
      
      // Simulate peer review - in practice this would involve LLM calls
      const review: PeerReview = {
        reviewer,
        reviewedFinding: finding,
        agreement: "partial", // Default to partial to encourage discussion
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

  const dimensions: AssessmentDimension[] = [
    "temporal", "authority", "visibility", "competency", "recovery", "accountability"
  ];

  const reconciledFindings: ReconciledFinding[] = [];
  const unresolvedDisagreements: UnresolvedDisagreement[] = [];

  for (const dimension of dimensions) {
    const dimFindings = findings.filter(f => f.dimension === dimension);
    const dimReviews = reviews.filter(r => r.reviewedFinding.dimension === dimension);
    
    if (dimFindings.length === 0) continue;

    // Collect all ratings
    const ratings = dimFindings.map(f => ({ agent: f.agent, rating: f.rating, confidence: f.confidence, rationale: f.rationale }));
    const reviewRatings = dimReviews.map(r => ({ agent: r.reviewer, rating: r.alternativeRating ?? "unknown", rationale: r.comments }));

    // Check for consensus
    const knownRatings = ratings.filter(r => r.rating !== "unknown");
    const uniqueRatings = [...new Set(knownRatings.map(r => r.rating))];
    
    let consensusRating: DivergenceRating = "unknown";
    let consensusConfidence = 0;
    let dissentingViews: UnresolvedDisagreement[] = [];

    if (uniqueRatings.length === 1 && knownRatings.length > 0) {
      // Full consensus
      consensusRating = uniqueRatings[0];
      consensusConfidence = knownRatings.reduce((sum, r) => sum + r.confidence, 0) / knownRatings.length;
    } else if (knownRatings.length > 0) {
      // Disagreement - use weighted average or flag as unresolved
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
      
      // Use median rating as provisional consensus
      const sortedRatings = knownRatings
        .map(r => typeof r.rating === "number" ? r.rating : -1)
        .filter((r): r is 0 | 1 | 2 | 3 | 4 => r >= 0)
        .sort((a, b) => a - b);
      if (sortedRatings.length > 0) {
        consensusRating = sortedRatings[Math.floor(sortedRatings.length / 2)];
        consensusConfidence = 0.5; // Reduced confidence due to disagreement
      }
    }

    const supportingEvidence = dimFindings.flatMap(f => f.evidence);
    const allObservations = dimFindings.flatMap(f => f.observations);

    reconciledFindings.push({
      dimension,
      consensusRating,
      consensusConfidence,
      supportingEvidence,
      dissentingViews,
      rationale: allObservations.join("; ") || `Reconciled assessment for ${dimension}`,
    });
  }

  const output: ReflexiveArbiterStageOutput = {
    findingsReconciliation: { reconciledFindings, unresolvedDisagreements },
  };

  (session as any)._reconciledFindings = reconciledFindings;
  (session as any)._unresolvedDisagreements = unresolvedDisagreements;

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
  const dimensionAssessments: DimensionAssessment[] = reconciledFindings.map(rf => ({
    dimension: rf.dimension,
    rating: rf.consensusRating,
    evidence: rf.supportingEvidence,
    assumptions: findings
      .filter(f => f.dimension === rf.dimension)
      .flatMap(f => f.assumptions),
    confidence: rf.consensusConfidence,
    notes: rf.rationale,
  }));

  // Extract operational capabilities from findings
  const operationalCapabilities: OperationalCapability[] = [];
  const governanceMechanisms: GovernanceMechanism[] = [];

  // Calculate overall divergence score (average of known ratings, excluding unknown)
  const knownRatings = dimensionAssessments
    .map(da => isNumericRating(da.rating) ? da.rating : null)
    .filter((r): r is 0 | 1 | 2 | 3 | 4 => r !== null);
  
  const overallDivergenceScore = knownRatings.length > 0
    ? knownRatings.reduce((sum: number, r) => sum + r, 0) / knownRatings.length
    : 0;

  const overallConfidence = dimensionAssessments
    .reduce((sum, da) => sum + da.confidence, 0) / dimensionAssessments.length;

  // Identify cascading failure risks
  const cascadingFailureRisks: CascadingFailureRisk[] = unresolvedDisagreements.map(ud => ({
    trigger: `Governance gap in ${ud.dimension}`,
    propagationPath: [`${ud.dimension} gap`, "Operational failure", "Cascading system impact"],
    impact: `Unresolved disagreement among ${ud.agents.join(", ")} on ${ud.dimension}`,
    likelihood: "medium" as const,
    governanceGap: ud.dimension,
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
    version: "1.0.0",
    methodologyVersion: "1.0.0",
    scope,
    operationalCapabilities,
    governanceMechanisms,
    dimensionAssessments,
    cascadingFailureRisks,
    governanceDebt,
    unresolvedQuestions,
    overallDivergenceScore,
    confidence: overallConfidence,
    evidenceLimitations: [
      "Assessment based on available evidence only",
      "Missing evidence does not imply governance failure",
      "Some dimensions rated unknown due to insufficient data",
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
    const latest = previousAssessments[0]; // Most recent previous
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
  
  // Sort by timestamp descending
  return assessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function generateLongitudinalComparison(
  previous: GovernanceDivergenceAssessment,
  current: GovernanceDivergenceAssessment
): LongitudinalComparison {
  const dimensions: AssessmentDimension[] = [
    "temporal", "authority", "visibility", "competency", "recovery", "accountability"
  ];

  const dimensionChanges: Record<AssessmentDimension, any> = {} as any;
  
  for (const dim of dimensions) {
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

  return {
    previousAssessmentId: previous.id,
    dimensionChanges,
    overallTrend,
    debtTrajectory,
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
  lines.push(`- **Overall Confidence:** ${(assessment.confidence * 100).toFixed(0)}%`);
  lines.push("");
  
  lines.push("## Scope");
  lines.push("");
  lines.push(`- **System:** ${assessment.scope.systemName}`);
  lines.push(`- **Description:** ${assessment.scope.systemDescription}`);
  lines.push(`- **Institutional Context:** ${assessment.scope.institutionalContext}`);
  lines.push(`- **Boundaries:** ${assessment.scope.boundaries.join(", ")}`);
  lines.push("");
  
  lines.push("## Dimension Assessments");
  lines.push("");
  
  for (const da of assessment.dimensionAssessments) {
    const ratingStr = da.rating === "unknown" ? "Unknown" : `${da.rating} / 4`;
    const desc = DIVERGENCE_SCALE_DESCRIPTIONS[da.rating];
    lines.push(`### ${da.dimension.charAt(0).toUpperCase() + da.dimension.slice(1)}`);
    lines.push("");
    lines.push(`**Rating:** ${ratingStr}`);
    lines.push(`**Confidence:** ${(da.confidence * 100).toFixed(0)}%`);
    lines.push(`**Scale Meaning:** ${desc}`);
    lines.push("");
    
    if (da.evidence.length > 0) {
      lines.push("**Evidence:**");
      da.evidence.forEach(e => lines.push(`- ${e}`));
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
      lines.push("");
    });
  }
  
  if (assessment.governanceDebt.length > 0) {
    lines.push("## Governance Debt");
    lines.push("");
    assessment.governanceDebt.forEach(debt => {
      lines.push(`- **[${debt.severity.toUpperCase()}]** ${debt.description} (${debt.dimension})`);
      if (debt.accumulating) lines.push(`  - *Accumulating*`);
      if (debt.evidence.length > 0) lines.push(`  - Evidence: ${debt.evidence.join("; ")}`);
    });
    lines.push("");
  }
  
  if (assessment.unresolvedQuestions.length > 0) {
    lines.push("## Unresolved Research Questions");
    lines.push("");
    assessment.unresolvedQuestions.forEach(q => {
      lines.push(`- **[${q.priority.toUpperCase()}]** ${q.question} (${q.dimension})`);
      if (q.blockingEvidence.length > 0) lines.push(`  - Blocking evidence: ${q.blockingEvidence.join("; ")}`);
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
  
  lines.push("---");
  lines.push("");
  lines.push("*Generated by Pixel Office Reflexive Arbiter*");
  
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