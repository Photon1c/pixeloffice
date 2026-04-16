import * as fs from "fs";
import * as path from "path";
import type { CoolerSession, Utterance } from "../conversation/types.js";

export type ScrumCandidateStatus = "pending" | "approved" | "rejected";

export interface ScrumCandidate {
  id: string;
  status: ScrumCandidateStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;

  source: {
    location: string;
    coolerSessionId: string;
    topic: string;
    participants: string[];
    utteranceCount: number;
    coolerMarkdownPath?: string;
  };

  score: number;
  threshold: number;
  reasons: string[];

  kb: {
    query: string;
    resultsCount: number;
    topSnippets: string[];
  };

  proposed: {
    scrumTitle: string;
    scrumType: "planning";
    agenda: string[];
    tasks: Array<{ title: string; description: string }>;
  };
}

export interface CandidateListItem {
  id: string;
  status: ScrumCandidateStatus;
  createdAt: string;
  updatedAt: string;
  score: number;
  threshold: number;
  scrumTitle: string;
  topic: string;
  location: string;
  coolerMarkdownPath?: string;
  reasons: string[];
}

const CANDIDATES_DIR = path.resolve(process.cwd(), "data", "scrum_candidates");
const SCRUM_DOCS_DIR = path.resolve(process.cwd(), "docs", "scrum");

function ensureDirs() {
  if (!fs.existsSync(CANDIDATES_DIR)) fs.mkdirSync(CANDIDATES_DIR, { recursive: true });
  if (!fs.existsSync(SCRUM_DOCS_DIR)) fs.mkdirSync(SCRUM_DOCS_DIR, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeTimestampForFilename(iso: string) {
  return iso.replace(/[:.]/g, "-");
}

function readCandidateFile(filePath: string): ScrumCandidate {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeCandidateFile(filePath: string, candidate: ScrumCandidate) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(candidate, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

function candidatePath(id: string) {
  return path.join(CANDIDATES_DIR, `${id}.json`);
}

function getTextCorpus(session: CoolerSession): string {
  const parts: string[] = [];
  if (session.topic) parts.push(session.topic);
  for (const u of session.utterances || []) {
    parts.push(`${u.speaker}: ${u.text}`);
  }
  return parts.join("\n");
}

function countMatches(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const p of patterns) {
    const m = text.match(p);
    if (m) n += m.length;
  }
  return n;
}

function computeScore(session: CoolerSession, kbBoost: number): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const text = getTextCorpus(session).toLowerCase();

  const escalateCount = (session.utterances || []).filter((u: Utterance) => u.intent === "escalate").length;
  if (escalateCount > 0) reasons.push(`contains ${escalateCount} escalate intent(s)`);

  const actionPatterns = [
    /\bwe should\b/g,
    /\bwe need to\b/g,
    /\blet's\b/g,
    /\bsomeone should\b/g,
    /\bwe ought to\b/g,
    /\bimplementation plan\b/g,
    /\bplan\b/g,
    /\bbuild\b/g,
    /\bimplement\b/g,
    /\bprototype\b/g,
    /\bwrite\b/g,
    /\btest\b/g,
  ];
  const actionHits = countMatches(text, actionPatterns);
  if (actionHits > 0) reasons.push(`action phrasing detected (${actionHits} hits)`);

  const urgencyPatterns = [/\burgent\b/g, /\bblocker\b/g, /\bdeadline\b/g, /\basap\b/g];
  const urgencyHits = countMatches(text, urgencyPatterns);
  if (urgencyHits > 0) reasons.push(`urgency detected (${urgencyHits} hits)`);

  // Base scoring: keep it simple + explainable.
  let score = 0;
  score += escalateCount * 15;
  score += actionHits * 4;
  score += urgencyHits * 6;
  score += kbBoost;

  if (kbBoost > 0) reasons.push(`KB boost (+${kbBoost})`);

  score = Math.max(0, Math.min(100, score));
  return { score, reasons };
}

async function kbSearch(kbServerUrl: string, query: string): Promise<{ resultsCount: number; topSnippets: string[] }> {
  try {
    const resp = await fetch(`${kbServerUrl}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 5 }),
    });
    if (!resp.ok) return { resultsCount: 0, topSnippets: [] };
    const data: any = await resp.json();
    const results = data.results || [];
    const snippets = results
      .slice(0, 3)
      .map((r: any) => (r.text ? String(r.text) : JSON.stringify(r)))
      .map((s: string) => s.replace(/\s+/g, " ").trim().slice(0, 240));
    return { resultsCount: results.length, topSnippets: snippets };
  } catch {
    return { resultsCount: 0, topSnippets: [] };
  }
}

function proposeScrumTitle(topic: string, kbSnippets: string[], reasons: string[]): string {
  const t = topic.replace(/^in recent news:\s*/i, "").trim();
  const hay = `${t}\n${kbSnippets.join("\n")}`.toLowerCase();

  if (hay.includes("fsd") || hay.includes("self driving") || hay.includes("autonomous")) {
    return "SCRUM (Planning): FSD Python Test Engine";
  }
  if (hay.includes("falcon vision") || hay.includes("parking occupancy") || hay.includes("yolo")) {
    return "SCRUM (Planning): Falcon Vision Occupancy Pipeline";
  }
  if (hay.includes("pixel office") || hay.includes("pixeloffice")) {
    return "SCRUM (Planning): Pixel Office Follow-up";
  }

  // Fallback: keep it tied to the source topic.
  return `SCRUM (Planning): ${t.slice(0, 72)}${t.length > 72 ? "…" : ""}`;
}

function proposeAgenda(topic: string): string[] {
  const t = topic.replace(/^in recent news:\s*/i, "").trim();
  return [
    `Intake: what happened / what we noticed (${t.slice(0, 80)}${t.length > 80 ? "…" : ""})`,
    "Define goal and success criteria",
    "Constraints and assumptions",
    "Implementation plan (milestones + owners)",
    "Next actions (tickets / scripts / tests)",
  ];
}

function proposeTasks(topic: string, kbSnippets: string[]): Array<{ title: string; description: string }> {
  const t = topic.replace(/^in recent news:\s*/i, "").trim();
  const hay = `${t}\n${kbSnippets.join("\n")}`.toLowerCase();

  if (hay.includes("fsd") || hay.includes("self driving") || hay.includes("autonomous")) {
    return [
      {
        title: "Draft FSD python test engine architecture",
        description: "Define modules (scenario ingestion, sim harness, assertions, reporting) + interfaces. Include 3 acceptance tests.",
      },
      {
        title: "Spike: minimal scenario runner script",
        description: "Implement a tiny CLI that runs 1 scenario and emits a JSON report. Success = deterministic output + basic metrics.",
      },
      {
        title: "Integrate with Pixel Office tasking",
        description: "Create backlog tickets and a cadence for iteration (weekly SCRUM, daily micro-standup).",
      },
    ];
  }

  return [
    {
      title: "Convert cooler topic into a concrete goal",
      description: `Turn: "${t.slice(0, 120)}${t.length > 120 ? "…" : ""}" into a measurable deliverable.`,
    },
    {
      title: "Outline implementation plan",
      description: "List milestones, risks, and required artifacts (scripts, docs, dashboards).",
    },
    {
      title: "Create first 3 tickets",
      description: "Seed tasks with owners and acceptance criteria so this doesn't evaporate.",
    },
  ];
}

export async function maybeCreateScrumCandidate(params: {
  session: CoolerSession;
  location: string;
  coolerMarkdownPath?: string;
  kbServerUrl?: string;
  threshold?: number;
}): Promise<ScrumCandidate | null> {
  ensureDirs();

  const kbServerUrl = params.kbServerUrl || "http://127.0.0.1:8787";
  const threshold = params.threshold ?? 25;

  const topic = params.session.topic || "(no topic)";
  const kbQuery = topic.replace(/^in recent news:\s*/i, "").trim();
  const kbRes = await kbSearch(kbServerUrl, kbQuery);

  // Small, conservative KB boost. Enough to matter, not enough to drown other signals.
  const kbBoost = Math.min(20, kbRes.resultsCount * 4);
  const { score, reasons } = computeScore(params.session, kbBoost);

  // Guard: don't spam candidates. Require some explicit "action-ness".
  const hasEscalate = (params.session.utterances || []).some((u) => u.intent === "escalate");
  const hasActionish = reasons.some((r) => r.startsWith("action phrasing")) || reasons.some((r) => r.startsWith("urgency"));

  if (score < threshold) return null;
  if (!hasEscalate && !hasActionish && kbRes.resultsCount === 0) return null;

  const id = generateId("scrumcand");
  const createdAt = nowIso();

  const scrumTitle = proposeScrumTitle(topic, kbRes.topSnippets, reasons);
  const candidate: ScrumCandidate = {
    id,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
    source: {
      location: params.location,
      coolerSessionId: params.session.id,
      topic,
      participants: params.session.participants || [],
      utteranceCount: (params.session.utterances || []).length,
      coolerMarkdownPath: params.coolerMarkdownPath,
    },
    score,
    threshold,
    reasons,
    kb: {
      query: kbQuery,
      resultsCount: kbRes.resultsCount,
      topSnippets: kbRes.topSnippets,
    },
    proposed: {
      scrumTitle,
      scrumType: "planning",
      agenda: proposeAgenda(topic),
      tasks: proposeTasks(topic, kbRes.topSnippets),
    },
  };

  writeCandidateFile(candidatePath(id), candidate);
  return candidate;
}

export function listScrumCandidates(status?: ScrumCandidateStatus): CandidateListItem[] {
  ensureDirs();
  const files = fs.readdirSync(CANDIDATES_DIR).filter((f) => f.endsWith(".json"));
  const items: CandidateListItem[] = [];

  for (const f of files) {
    const p = path.join(CANDIDATES_DIR, f);
    try {
      const c = readCandidateFile(p);
      if (status && c.status !== status) continue;
      items.push({
        id: c.id,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        score: c.score,
        threshold: c.threshold,
        scrumTitle: c.proposed.scrumTitle,
        topic: c.source.topic,
        location: c.source.location,
        coolerMarkdownPath: c.source.coolerMarkdownPath,
        reasons: c.reasons,
      });
    } catch {
      // ignore
    }
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

export function getScrumCandidate(id: string): ScrumCandidate | null {
  ensureDirs();
  const p = candidatePath(id);
  if (!fs.existsSync(p)) return null;
  try {
    return readCandidateFile(p);
  } catch {
    return null;
  }
}

export function approveScrumCandidate(id: string): { ok: boolean; candidate?: ScrumCandidate; scrumDocPath?: string; error?: string } {
  ensureDirs();
  const p = candidatePath(id);
  if (!fs.existsSync(p)) return { ok: false, error: "NOT_FOUND" };

  const c = readCandidateFile(p);
  if (c.status === "approved") {
    return { ok: true, candidate: c, scrumDocPath: undefined };
  }

  const ts = nowIso();
  c.status = "approved";
  c.approvedAt = ts;
  c.updatedAt = ts;
  writeCandidateFile(p, c);

  const safeTs = safeTimestampForFilename(ts);
  const filename = `${safeTs}_scrum-planning-${c.id}.md`;
  const docPath = path.join(SCRUM_DOCS_DIR, filename);

  const md = [
    `---`,
    `title: "${c.proposed.scrumTitle.replace(/\"/g, "'")}"`,
    `date: "${ts}"`,
    `scrum_type: "planning"`,
    `status: "approved"`,
    `source_cooler_session: "${c.source.coolerSessionId}"`,
    c.source.coolerMarkdownPath ? `source_cooler_markdown: "${c.source.coolerMarkdownPath}"` : `source_cooler_markdown: ""`,
    `location: "${c.source.location}"`,
    `score: ${c.score}`,
    `threshold: ${c.threshold}`,
    `---`,
    ``,
    `## Source`,
    `- Topic: ${c.source.topic}`,
    `- Participants: ${c.source.participants.join(", ")}`,
    c.source.coolerMarkdownPath ? `- Cooler log: ${c.source.coolerMarkdownPath}` : `- Cooler log: (none)`,
    ``,
    `## Why this was escalated`,
    ...c.reasons.map((r) => `- ${r}`),
    ``,
    `## Proposed agenda`,
    ...c.proposed.agenda.map((a) => `- ${a}`),
    ``,
    `## Proposed tasks`,
    ...c.proposed.tasks.map((t) => `- **${t.title}**: ${t.description}`),
    ``,
    `## KB context`,
    `- Query: ${c.kb.query}`,
    `- Results: ${c.kb.resultsCount}`,
    ...c.kb.topSnippets.map((s) => `- ${s}`),
    ``,
    `---`,
    `*Generated from Pixel Office Cooler → SCRUM Candidate approval*`,
    ``,
  ].join("\n");

  fs.writeFileSync(docPath, md, "utf8");

  return { ok: true, candidate: c, scrumDocPath: docPath };
}

export function rejectScrumCandidate(id: string): { ok: boolean; candidate?: ScrumCandidate; error?: string } {
  ensureDirs();
  const p = candidatePath(id);
  if (!fs.existsSync(p)) return { ok: false, error: "NOT_FOUND" };

  const c = readCandidateFile(p);
  const ts = nowIso();
  c.status = "rejected";
  c.rejectedAt = ts;
  c.updatedAt = ts;
  writeCandidateFile(p, c);
  return { ok: true, candidate: c };
}
