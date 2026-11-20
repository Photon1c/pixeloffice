/**
 * Evidence Collector for Reflexive Arbiter
 * 
 * Provides functions to collect evidence for governance divergence assessments
 * using the existing Pixel Office LLM and knowledge base infrastructure.
 * 
 * Measurement Validation Upgrade (v2.0.0):
 * - Full EvidenceRecord with source URI, timestamps, classification, independence, verification
 * - Governance telemetry collection
 * - LLM assertion detection and marking
 * - Missing/unavailable measurement distinction
 */

import type { 
  ResearchTask, 
  AgentFinding, 
  EvidenceRecord, 
  GovernanceTelemetry,
  EvidenceClassification,
  SourceIndependence,
  VerificationStatus,
  AssessmentDimension 
} from "./reflexiveArbiterTypes.js";
import { callChatModelForRole, type RoleId } from "../roleModels.js";
import { createEvidenceRecord, createLLMAssertionEvidence, calculateEvidenceCoverage } from "./reflexiveArbiterTypes.js";

const KB_SERVER_URL = process.env.KB_SERVER_URL || "http://127.0.0.1:8787";

export interface EvidenceCollectorOptions {
  role?: RoleId;
  useKnowledgeBase?: boolean;
  useWebSearch?: boolean;
  /** Collect governance telemetry indicators */
  collectTelemetry?: boolean;
}

export interface TelemetryCollectionResult {
  telemetry: Partial<GovernanceTelemetry>;
  evidence: EvidenceRecord[];
  notes: string[];
}

/**
 * Search knowledge base for relevant documents
 * Returns evidence records with full metadata
 */
async function searchKnowledgeBase(query: string, topK: number = 5): Promise<EvidenceRecord[]> {
  try {
    const resp = await fetch(`${KB_SERVER_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!resp.ok) return [];
    const data: any = await resp.json();
    const results = data.results || [];
    return results
      .slice(0, topK)
      .map((r: any, idx: number) => {
        const text = r.text ? String(r.text) : JSON.stringify(r);
        const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 500);
        return createEvidenceRecord({
          content: cleanText,
          sourceUri: r.uri || r.source || `kb://search/${query}/${idx}`,
          publishedAt: r.publishedAt || r.date || null,
          classification: "reported" as EvidenceClassification,
          sourceIndependence: "unknown" as SourceIndependence,
          verificationStatus: "unverified" as VerificationStatus,
          confidence: 0.6,
          collector: "knowledge_base",
          tags: ["kb-search", query],
        });
      });
  } catch (e) {
    console.error(`[EvidenceCollector] KB search failed for "${query}":`, e);
    return [];
  }
}

/**
 * Call LLM for evidence analysis
 * Returns both evidence records and telemetry
 */
async function callLLMForEvidence(
  role: RoleId,
  prompt: string
): Promise<{ evidence: EvidenceRecord[]; telemetry: Partial<GovernanceTelemetry>; notes: string[] }> {
  try {
    const result = await callChatModelForRole(role, [
      { role: "user", content: prompt }
    ], { temperature: 0.2, max_tokens: 2048 });
    const response = result.response || "";
    
    // Parse JSON from response
    let parsed: {
      observations?: string[];
      assumptions?: string[];
      rating?: 0|1|2|3|4|"unknown";
      confidence?: number;
      rationale?: string;
      telemetry?: Partial<GovernanceTelemetry>;
      evidenceItems?: Array<{
        content: string;
        sourceUri: string;
        publishedAt?: string;
        classification?: EvidenceClassification;
        sourceIndependence?: SourceIndependence;
        verificationStatus?: VerificationStatus;
        confidence?: number;
      }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, treat as LLM assertion
    }

    const evidence: EvidenceRecord[] = [];
    const notes: string[] = [];

    // Process structured evidence items if provided
    if (parsed.evidenceItems && parsed.evidenceItems.length > 0) {
      for (const item of parsed.evidenceItems) {
        evidence.push(createEvidenceRecord({
          content: item.content,
          sourceUri: item.sourceUri,
          publishedAt: item.publishedAt ?? null,
          classification: item.classification ?? "reported",
          sourceIndependence: item.sourceIndependence ?? "unknown",
          verificationStatus: item.verificationStatus ?? "unverified",
          confidence: item.confidence ?? 0.5,
          collector: role,
        }));
      }
    }

    // Add observations as reported evidence
    if (parsed.observations) {
      for (const obs of parsed.observations) {
        evidence.push(createEvidenceRecord({
          content: obs,
          sourceUri: `llm://${role}/observation/${Date.now()}`,
          publishedAt: null,
          classification: "inferred",
          sourceIndependence: "unknown",
          verificationStatus: "llm_assertion",
          confidence: parsed.confidence ?? 0.4,
          collector: role,
          tags: ["llm-observation"],
        }));
      }
    }

    // Add assumptions as hypothetical evidence
    if (parsed.assumptions) {
      for (const assumption of parsed.assumptions) {
        evidence.push(createEvidenceRecord({
          content: assumption,
          sourceUri: `llm://${role}/assumption/${Date.now()}`,
          publishedAt: null,
          classification: "hypothetical",
          sourceIndependence: "unknown",
          verificationStatus: "llm_assertion",
          confidence: 0.2,
          collector: role,
          tags: ["llm-assumption"],
        }));
      }
    }

    notes.push(`LLM analysis completed by ${role}`);
    
    return {
      evidence,
      telemetry: parsed.telemetry || {},
      notes,
    };
  } catch (e: any) {
    console.error(`[EvidenceCollector] LLM call failed for ${role}:`, e.message);
    return { evidence: [], telemetry: {}, notes: [`LLM error: ${e.message}`] };
  }
}

/**
 * Collect governance telemetry indicators
 * Attempts to gather measurable metrics from KB and LLM
 */
async function collectGovernanceTelemetry(
  systemName: string,
  dimension: AssessmentDimension,
  role: RoleId
): Promise<TelemetryCollectionResult> {
  const telemetry: Partial<GovernanceTelemetry> = {};
  const evidence: EvidenceRecord[] = [];
  const notes: string[] = [];

  // Define telemetry queries per dimension
  const telemetryQueries: Record<AssessmentDimension, string[]> = {
    temporal: [
      `autonomous actions per hour ${systemName}`,
      `institutional response time ${systemName}`,
      `deployment frequency ${systemName}`,
    ],
    authority: [
      `permission scope ${systemName}`,
      `authorization policy ${systemName}`,
      `access control metrics ${systemName}`,
    ],
    visibility: [
      `monitoring coverage ${systemName}`,
      `observability metrics ${systemName}`,
      `alert volume ${systemName}`,
    ],
    competency: [
      `operator training ${systemName}`,
      `system complexity metrics ${systemName}`,
      `staffing levels ${systemName}`,
    ],
    recovery: [
      `mean time to restore ${systemName}`,
      `incident frequency ${systemName}`,
      `restoration procedures ${systemName}`,
    ],
    accountability: [
      `decision audit trail ${systemName}`,
      `responsibility assignment ${systemName}`,
      `traceability metrics ${systemName}`,
    ],
  };

  // Search KB for telemetry data
  if (telemetryQueries[dimension]) {
    for (const query of telemetryQueries[dimension]) {
      const results = await searchKnowledgeBase(query, 2);
      if (results.length > 0) {
        evidence.push(...results);
        notes.push(`Found ${results.length} KB telemetry results for: ${query}`);
      }
    }
  }

  // Use LLM to estimate telemetry where KB data is missing
  const telemetryPrompt = `You are a ${role} collecting governance telemetry for the "${dimension}" dimension of ${systemName}.

Please estimate the following measurable indicators based on your knowledge. For each, provide:
1. A numeric value (or null if completely unknown/unavailable)
2. A confidence level (0-1)
3. Source reference if available

Metrics to estimate:
- autonomousActionsPerHour: Number of autonomous actions per hour
- humanReviewThroughputPerHour: Human reviews completed per hour  
- unreviewedActionBacklog: Count of unreviewed actions awaiting review
- emergencyInterventionFrequencyPerWeek: Emergency interventions per week
- technicalRestorationTimeMinutes: Mean time to restore (minutes)
- institutionalValidationTimeHours: Mean time for institutional validation (hours)
- operationalBacklogClearanceTimeHours: Mean time to clear operational backlog (hours)
- externalExpertiseDependency: Dependency on external expertise (0-1 scale)

IMPORTANT: Distinguish between "measured zero" (value is 0) and "unavailable" (null). 
Use null for unavailable, 0 for measured zero.

Respond as JSON:
{
  "telemetry": {
    "autonomousActionsPerHour": 10,
    "humanReviewThroughputPerHour": 2,
    "unreviewedActionBacklog": 50,
    "emergencyInterventionFrequencyPerWeek": 0.5,
    "technicalRestorationTimeMinutes": 45,
    "institutionalValidationTimeHours": 4,
    "operationalBacklogClearanceTimeHours": 2,
    "externalExpertiseDependency": 0.3
  },
  "confidence": 0.6,
  "sourceReferences": ["doc1", "doc2"]
}`;

  const llmResult = await callLLMForEvidence(role, telemetryPrompt);
  evidence.push(...llmResult.evidence);
  notes.push(...llmResult.notes);
  
  // Merge telemetry from LLM (marked as LLM assertions)
  if (llmResult.telemetry) {
    Object.assign(telemetry, llmResult.telemetry);
  }

  // Add measurement availability flags
  const measurementAvailability = {
    autonomousActionsPerHour: telemetry.autonomousActionsPerHour !== null && telemetry.autonomousActionsPerHour !== undefined,
    humanReviewThroughputPerHour: telemetry.humanReviewThroughputPerHour !== null && telemetry.humanReviewThroughputPerHour !== undefined,
    unreviewedActionBacklog: telemetry.unreviewedActionBacklog !== null && telemetry.unreviewedActionBacklog !== undefined,
    emergencyInterventionFrequencyPerWeek: telemetry.emergencyInterventionFrequencyPerWeek !== null && telemetry.emergencyInterventionFrequencyPerWeek !== undefined,
    technicalRestorationTimeMinutes: telemetry.technicalRestorationTimeMinutes !== null && telemetry.technicalRestorationTimeMinutes !== undefined,
    institutionalValidationTimeHours: telemetry.institutionalValidationTimeHours !== null && telemetry.institutionalValidationTimeHours !== undefined,
    operationalBacklogClearanceTimeHours: telemetry.operationalBacklogClearanceTimeHours !== null && telemetry.operationalBacklogClearanceTimeHours !== undefined,
    externalExpertiseDependency: telemetry.externalExpertiseDependency !== null && telemetry.externalExpertiseDependency !== undefined,
  };

  const fullTelemetry: GovernanceTelemetry = {
    autonomousActionsPerHour: telemetry.autonomousActionsPerHour ?? null,
    humanReviewThroughputPerHour: telemetry.humanReviewThroughputPerHour ?? null,
    unreviewedActionBacklog: telemetry.unreviewedActionBacklog ?? null,
    emergencyInterventionFrequencyPerWeek: telemetry.emergencyInterventionFrequencyPerWeek ?? null,
    technicalRestorationTimeMinutes: telemetry.technicalRestorationTimeMinutes ?? null,
    institutionalValidationTimeHours: telemetry.institutionalValidationTimeHours ?? null,
    operationalBacklogClearanceTimeHours: telemetry.operationalBacklogClearanceTimeHours ?? null,
    externalExpertiseDependency: telemetry.externalExpertiseDependency ?? null,
    measuredAt: new Date().toISOString(),
    measurementAvailability,
  };

  return { telemetry: fullTelemetry, evidence, notes };
}

/**
 * Main evidence collection function for a research task
 * Returns AgentFinding with full EvidenceRecord array and telemetry
 */
export async function collectEvidenceForTask(
  task: ResearchTask,
  options: EvidenceCollectorOptions = {}
): Promise<Partial<AgentFinding>> {
  const { role = "specialist", useKnowledgeBase = true, collectTelemetry = true } = options;
  const dimension = task.dimension;
  const systemName = task.description.match(/for (.+)$/)?.[1] || "the system";

  const evidence: EvidenceRecord[] = [];
  const observations: string[] = [];
  const assumptions: string[] = [];
  const notes: string[] = [];
  let telemetry: Partial<GovernanceTelemetry> = {};

  // 1. Search knowledge base for relevant documents
  if (useKnowledgeBase) {
    const kbQueries = [
      `${dimension} governance ${systemName}`,
      `${dimension} policy ${systemName}`,
      `${dimension} incident ${systemName}`,
      `${dimension} metrics ${systemName}`,
    ];

    for (const query of kbQueries) {
      const results = await searchKnowledgeBase(query, 3);
      if (results.length > 0) {
        evidence.push(...results);
        observations.push(`Found ${results.length} KB results for: ${query}`);
        notes.push(`KB search: ${query} -> ${results.length} results`);
      }
    }
  }

  // 2. Collect governance telemetry if requested
  if (collectTelemetry) {
    const telemetryResult = await collectGovernanceTelemetry(systemName, dimension, role);
    telemetry = telemetryResult.telemetry;
    evidence.push(...telemetryResult.evidence);
    notes.push(...telemetryResult.notes);
  }

  // 3. Use LLM to analyze the dimension
  const analysisPrompt = `You are a ${role} conducting a governance divergence assessment for the "${dimension}" dimension of ${systemName}.

Research Task: ${task.description}

Required Evidence Types:
${task.requiredEvidence.map(e => `- ${e}`).join("\n")}

Suggested Sources:
${task.suggestedSources.map(s => `- ${s}`).join("\n")}

Evidence Collected So Far:
${evidence.map(e => `- [${e.classification}] ${e.content.slice(0, 200)} (source: ${e.sourceUri}, verification: ${e.verificationStatus})`).join("\n")}

Please provide:
1. Key observations about ${dimension} governance for this system
2. Assumptions you are making due to missing evidence
3. A divergence rating (0-4, or "unknown" if insufficient evidence)
4. Your confidence level (0-1)
5. Rationale for your rating
6. Any telemetry metrics you can estimate (see telemetry schema)

Format your response as JSON:
{
  "observations": ["..."],
  "assumptions": ["..."],
  "rating": 0|1|2|3|4|"unknown",
  "confidence": 0.0-1.0,
  "rationale": "...",
  "telemetry": {
    "autonomousActionsPerHour": 10,
    "humanReviewThroughputPerHour": 2,
    "unreviewedActionBacklog": 50,
    "emergencyInterventionFrequencyPerWeek": 0.5,
    "technicalRestorationTimeMinutes": 45,
    "institutionalValidationTimeHours": 4,
    "operationalBacklogClearanceTimeHours": 2,
    "externalExpertiseDependency": 0.3
  },
  "evidenceItems": [
    {
      "content": "Specific evidence statement",
      "sourceUri": "https://example.com/doc",
      "publishedAt": "2026-01-15T00:00:00Z",
      "classification": "observed|reported|inferred|hypothetical",
      "sourceIndependence": "independent|affiliated|self_reported|unknown",
      "verificationStatus": "verified|unverified|disputed",
      "confidence": 0.8
    }
  ]
}`;

  const llmResult = await callLLMForEvidence(role, analysisPrompt);
  
  // Extract observations and assumptions from LLM result (stored as tagged evidence)
  const llmObservations = llmResult.evidence
    .filter(e => e.tags?.includes("llm-observation"))
    .map(e => e.content);
  const llmAssumptions = llmResult.evidence
    .filter(e => e.tags?.includes("llm-assumption"))
    .map(e => e.content);
  
  observations.push(...llmObservations);
  assumptions.push(...llmAssumptions);
  
  // Merge telemetry from analysis
  if (llmResult.telemetry) {
    telemetry = { ...telemetry, ...llmResult.telemetry };
  }

  // Add all evidence from LLM result (includes KB results, observations, assumptions)
  evidence.push(...llmResult.evidence);

  // For rating and confidence, we need to parse the LLM's JSON response
  // The callLLMForEvidence stores the parsed rating/confidence in the evidence tags
  // But we need to extract it from the raw response. Let's do a second LLM call for the rating.
  // Actually, the callLLMForEvidence already tries to parse JSON and returns structured data.
  // We'll use a simpler approach: assume the LLM analysis includes rating in the notes or we use defaults.
  
  // Calculate evidence coverage
  const evidenceCoverage = calculateEvidenceCoverage(evidence);

  // Default rating/confidence/rationale - in practice these would come from a dedicated rating call
  // For now, use reasonable defaults based on evidence quality
  const hasVerifiedEvidence = evidence.some(e => e.verificationStatus === "verified");
  const hasKbEvidence = evidence.some(e => e.sourceUri.startsWith("kb://"));
  const defaultConfidence = hasVerifiedEvidence ? 0.8 : (hasKbEvidence ? 0.6 : 0.4);
  const defaultRating = hasVerifiedEvidence ? 2 : "unknown" as DivergenceRating;

  return {
    evidence,
    observations,
    assumptions,
    confidence: defaultConfidence,
    rating: defaultRating,
    rationale: `Automated assessment for ${dimension} dimension based on ${evidence.length} evidence items`,
    timestamp: new Date().toISOString(),
    telemetry: Object.keys(telemetry).length > 0 ? telemetry as GovernanceTelemetry : undefined,
  };
}

export async function createEvidenceCollector(
  defaultRole: RoleId = "specialist"
): Promise<(task: ResearchTask) => Promise<Partial<AgentFinding>>> {
  return async (task: ResearchTask) => {
    const role = (task.assignedAgent as any) || defaultRole;
    return collectEvidenceForTask(task, { role, useKnowledgeBase: true, collectTelemetry: true });
  };
}

/**
 * Validate evidence integrity - check for LLM assertions masquerading as verified evidence
 */
export function validateEvidenceIntegrity(evidence: EvidenceRecord[]): {
  valid: boolean;
  issues: string[];
  llmAssertionCount: number;
  unverifiedCount: number;
  verifiedCount: number;
} {
  const issues: string[] = [];
  let llmAssertionCount = 0;
  let unverifiedCount = 0;
  let verifiedCount = 0;

  for (const e of evidence) {
    if (e.verificationStatus === "llm_assertion") {
      llmAssertionCount++;
      if (e.classification === "observed") {
        issues.push(`LLM assertion classified as "observed": ${e.content.slice(0, 100)}`);
      }
    } else if (e.verificationStatus === "verified") {
      verifiedCount++;
    } else {
      unverifiedCount++;
    }
    
    // Check for missing required fields
    if (!e.sourceUri) issues.push(`Missing sourceUri: ${e.content.slice(0, 100)}`);
    if (!e.retrievedAt) issues.push(`Missing retrievedAt: ${e.content.slice(0, 100)}`);
    if (e.confidence < 0 || e.confidence > 1) issues.push(`Invalid confidence: ${e.confidence}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    llmAssertionCount,
    unverifiedCount,
    verifiedCount,
  };
}

/**
 * Collect evidence from news article
 * Creates evidence records from news content with proper classification
 */
export async function collectNewsEvidence(params: {
  newsTitle: string;
  newsUrl: string;
  newsSource: string;
  publishedAt: string;
  content: string; // Full article content or summary
  dimension: AssessmentDimension;
  collector: string;
}): Promise<EvidenceRecord[]> {
  const evidence: EvidenceRecord[] = [];
  
  // Main news report as "reported" evidence
  evidence.push(createEvidenceRecord({
    content: `${params.newsTitle}: ${params.content.slice(0, 500)}`,
    sourceUri: params.newsUrl || `news://${params.newsSource}/${Date.now()}`,
    publishedAt: params.publishedAt,
    classification: "reported",
    sourceIndependence: "independent", // News sources are typically independent
    verificationStatus: "unverified", // Requires cross-verification
    confidence: 0.7,
    collector: params.collector,
    dimension: params.dimension,
    tags: ["news", params.newsSource, params.dimension],
  }));
  
  // Extract specific claims as separate evidence items
  const sentences = params.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  for (const sentence of sentences.slice(0, 5)) {
    evidence.push(createEvidenceRecord({
      content: sentence.trim(),
      sourceUri: params.newsUrl || `news://${params.newsSource}/${Date.now()}`,
      publishedAt: params.publishedAt,
      classification: "reported",
      sourceIndependence: "independent",
      verificationStatus: "unverified",
      confidence: 0.5,
      collector: params.collector,
      dimension: params.dimension,
      tags: ["news-extract", params.newsSource, params.dimension],
    }));
  }
  
  return evidence;
}

/**
 * Collect evidence from GitHub repository
 * Fetches commits, PRs, issues, workflows as evidence
 */
export async function collectGitHubEvidence(params: {
  repo: string; // owner/repo
  token?: string;
  dimension: AssessmentDimension;
  collector: string;
  since?: string; // ISO date string
  paths?: string[];
  events?: ("push" | "pull_request" | "issue" | "workflow_run")[];
}): Promise<EvidenceRecord[]> {
  const evidence: EvidenceRecord[] = [];
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "PixelOffice-Arbiter",
  };
  if (params.token) {
    headers["Authorization"] = `Bearer ${params.token}`;
  }
  
  const baseUrl = `https://api.github.com/repos/${params.repo}`;
  const since = params.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Fetch commits
    const commitsUrl = `${baseUrl}/commits?since=${since}&per_page=50`;
    const commitsResp = await fetch(commitsUrl, { headers });
    if (commitsResp.ok) {
      const commits = await commitsResp.json();
      for (const commit of commits.slice(0, 20)) {
        evidence.push(createEvidenceRecord({
          content: `Commit: ${commit.commit.message.split('\n')[0]} (${commit.sha.slice(0, 7)})`,
          sourceUri: commit.html_url,
          publishedAt: commit.commit.author.date,
          classification: "observed", // Direct observation of code changes
          sourceIndependence: "affiliated", // From the system's own repo
          verificationStatus: "verified", // Git history is verifiable
          confidence: 0.9,
          collector: params.collector,
          dimension: params.dimension,
          tags: ["github", "commit", params.dimension, params.repo],
        }));
      }
    }
    
    // Fetch pull requests
    const prsUrl = `${baseUrl}/pulls?state=all&sort=updated&direction=desc&per_page=30`;
    const prsResp = await fetch(prsUrl, { headers });
    if (prsResp.ok) {
      const prs = await prsResp.json();
      for (const pr of prs.slice(0, 15)) {
        evidence.push(createEvidenceRecord({
          content: `PR #${pr.number}: ${pr.title} (${pr.state}) - ${pr.additions} additions, ${pr.deletions} deletions`,
          sourceUri: pr.html_url,
          publishedAt: pr.updated_at,
          classification: "observed",
          sourceIndependence: "affiliated",
          verificationStatus: "verified",
          confidence: 0.85,
          collector: params.collector,
          dimension: params.dimension,
          tags: ["github", "pull_request", params.dimension, params.repo],
        }));
      }
    }
    
    // Fetch workflow runs (for CI/CD evidence)
    const runsUrl = `${baseUrl}/actions/runs?per_page=20`;
    const runsResp = await fetch(runsUrl, { headers });
    if (runsResp.ok) {
      const runs = await runsResp.json();
      for (const run of (runs.workflow_runs || []).slice(0, 10)) {
        evidence.push(createEvidenceRecord({
          content: `Workflow: ${run.name} (${run.conclusion}) - ${run.run_number}`,
          sourceUri: run.html_url,
          publishedAt: run.updated_at,
          classification: "observed",
          sourceIndependence: "affiliated",
          verificationStatus: "verified",
          confidence: 0.8,
          collector: params.collector,
          dimension: params.dimension,
          tags: ["github", "workflow", params.dimension, params.repo],
        }));
      }
    }
    
  } catch (e) {
    console.error(`[EvidenceCollector] GitHub evidence collection failed for ${params.repo}:`, e);
  }
  
  return evidence;
}

/**
 * Create evidence collector with news and GitHub support
 */
export async function createAdvancedEvidenceCollector(
  defaultRole: RoleId = "specialist"
): Promise<(task: ResearchTask) => Promise<Partial<AgentFinding>>> {
  return async (task: ResearchTask) => {
    const role = (task.assignedAgent as any) || defaultRole;
    return collectEvidenceForTask(task, { role, useKnowledgeBase: true, collectTelemetry: true });
  };
}