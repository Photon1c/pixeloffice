/**
 * Evidence Collector for Reflexive Arbiter
 * 
 * Provides functions to collect evidence for governance divergence assessments
 * using the existing Pixel Office LLM and knowledge base infrastructure.
 */

import type { ResearchTask, AgentFinding } from "./reflexiveArbiterTypes.js";
import { callChatModelForRole, type RoleId } from "../roleModels.js";

const KB_SERVER_URL = process.env.KB_SERVER_URL || "http://127.0.0.1:8787";

export interface EvidenceCollectorOptions {
  role?: RoleId;
  useKnowledgeBase?: boolean;
  useWebSearch?: boolean;
}

async function searchKnowledgeBase(query: string, topK: number = 5): Promise<string[]> {
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
      .map((r: any) => (r.text ? String(r.text) : JSON.stringify(r)))
      .map((s: string) => s.replace(/\s+/g, " ").trim().slice(0, 500));
  } catch {
    return [];
  }
}

async function callLLMForEvidence(
  role: RoleId,
  prompt: string
): Promise<string> {
  try {
    const result = await callChatModelForRole(role, [
      { role: "user", content: prompt }
    ], { temperature: 0.2, max_tokens: 2048 });
    return result.response || "";
  } catch (e: any) {
    console.error(`[EvidenceCollector] LLM call failed for ${role}:`, e.message);
    return "";
  }
}

export async function collectEvidenceForTask(
  task: ResearchTask,
  options: EvidenceCollectorOptions = {}
): Promise<Partial<AgentFinding>> {
  const { role = "specialist", useKnowledgeBase = true } = options;
  const dimension = task.dimension;
  const systemName = task.description.match(/for (.+)$/)?.[1] || "the system";

  const evidence: string[] = [];
  const observations: string[] = [];
  const assumptions: string[] = [];

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
      }
    }
  }

  // 2. Use LLM to analyze the dimension
  const analysisPrompt = `You are a ${role} conducting a governance divergence assessment for the "${dimension}" dimension of ${systemName}.

Research Task: ${task.description}

Required Evidence Types:
${task.requiredEvidence.map(e => `- ${e}`).join("\n")}

Suggested Sources:
${task.suggestedSources.map(s => `- ${s}`).join("\n")}

Based on your knowledge and the evidence collected so far:
${evidence.map(e => `- ${e}`).join("\n")}

Please provide:
1. Key observations about ${DIMENSION_DESCRIPTIONS[dimension as keyof typeof DIMENSION_DESCRIPTIONS]} for this system
2. Assumptions you are making due to missing evidence
3. A divergence rating (0-4, or "unknown" if insufficient evidence)
4. Your confidence level (0-1)
5. Rationale for your rating

Format your response as JSON:
{
  "observations": ["..."],
  "assumptions": ["..."],
  "rating": 0|1|2|3|4|"unknown",
  "confidence": 0.0-1.0,
  "rationale": "..."
}`;

  const llmResponse = await callLLMForEvidence(role, analysisPrompt);
  
  let parsed: {
    observations?: string[];
    assumptions?: string[];
    rating?: 0|1|2|3|4|"unknown";
    confidence?: number;
    rationale?: string;
  } = {};

  try {
    // Try to extract JSON from response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If parsing fails, use the raw response as observation
    observations.push(`LLM analysis: ${llmResponse.slice(0, 500)}`);
  }

  if (parsed.observations) observations.push(...parsed.observations);
  if (parsed.assumptions) assumptions.push(...parsed.assumptions);

  return {
    evidence,
    observations,
    assumptions,
    confidence: parsed.confidence ?? 0.5,
    rating: parsed.rating ?? "unknown",
    rationale: parsed.rationale || `Automated assessment for ${dimension} dimension`,
  };
}

// Dimension descriptions for prompts
const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  temporal: "Execution velocity versus institutional response time",
  authority: "Technical permissions versus authorized scope",
  visibility: "Actual system activity versus institutional awareness",
  competency: "System complexity versus operator comprehension",
  recovery: "Disruption potential versus restoration capacity",
  accountability: "Decision traceability versus attributable responsibility",
};

export async function createEvidenceCollector(
  defaultRole: RoleId = "specialist"
): Promise<(task: ResearchTask) => Promise<Partial<AgentFinding>>> {
  return async (task: ResearchTask) => {
    // Use the task's assigned agent or default
    const role = (task.assignedAgent as any) || defaultRole;
    return collectEvidenceForTask(task, { role, useKnowledgeBase: true });
  };
}