import fs from "node:fs/promises";
import path from "node:path";

type Frontmatter = Record<string, string>;

type CoolerEntry = {
  file: string;
  title: string;
  date: string;
  sessionId: string;
  participantsRaw: string;
  participantsCount: number;
  escalations: number;
};

type ScrumEntry = {
  file: string;
  title: string;
  date: string;
  sourceSession: string;
  stage: string;
  summary: string;
};

type ReportEntry = {
  file: string;
  title: string;
  date: string;
};

type ScrumReportEntry = {
  file: string;
  title: string;
  date: string;
  sourceSession: string;
  stage: string;
  summary: string;
};

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseFrontmatter(md: string): { fm: Frontmatter; body: string } {
  const trimmed = md.startsWith("\n") ? md.slice(1) : md;
  if (!trimmed.startsWith("---\n")) return { fm: {}, body: md };

  const end = trimmed.indexOf("\n---", 4);
  if (end === -1) return { fm: {}, body: md };

  const fmBlock = trimmed.slice(4, end).trimEnd();
  const body = trimmed.slice(end + 4);

  const fm: Frontmatter = {};
  for (const line of fmBlock.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    fm[m[1]] = stripQuotes(m[2] ?? "");
  }
  return { fm, body };
}

function countEscalations(body: string): number {
  const matches = body.match(/\(escalate\b/g);
  return matches ? matches.length : 0;
}

function safeDateKey(dateStr: string): number {
  const t = Date.parse(dateStr);
  return Number.isFinite(t) ? t : 0;
}

function participantsCount(participants: string): number {
  return participants
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean).length;
}

function mdEscapePipe(s: string): string {
  return s.replaceAll("|", "\\|");
}

function guessDateFromFilename(file: string): string {
  const m = file.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function extractFirstHeading(body: string): string {
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (t.startsWith("# ")) return t.slice(2).trim();
  }
  return "";
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md") && e.name.toLowerCase() !== "index.md")
    .map((e) => e.name)
    .sort();
}

async function buildCoolerIndex(projectRoot: string): Promise<CoolerEntry[]> {
  const coolerDir = path.join(projectRoot, "docs", "cooler");
  const files = await listMarkdownFiles(coolerDir);

  const items: CoolerEntry[] = [];
  for (const file of files) {
    const md = await fs.readFile(path.join(coolerDir, file), "utf8");
    const { fm, body } = parseFrontmatter(md);

    const title = fm.title || `Cooler Talk - ${file}`;
    const date = fm.date || "";
    const sessionId = fm.session_id || "";
    const participantsRaw = fm.participants || "";

    items.push({
      file,
      title,
      date,
      sessionId,
      participantsRaw,
      participantsCount: participantsCount(participantsRaw),
      escalations: countEscalations(body),
    });
  }

  items.sort((a, b) => safeDateKey(b.date) - safeDateKey(a.date));
  return items;
}

async function buildScrumIndex(projectRoot: string): Promise<ScrumEntry[]> {
  const scrumDir = path.join(projectRoot, "docs", "scrum");
  try {
    await fs.access(scrumDir);
  } catch {
    return [];
  }

  const files = await listMarkdownFiles(scrumDir);
  const items: ScrumEntry[] = [];

  for (const file of files) {
    const md = await fs.readFile(path.join(scrumDir, file), "utf8");
    const { fm, body } = parseFrontmatter(md);

    const title = fm.title || `SCRUM - ${file}`;
    const date = fm.date || "";
    const sourceSession = fm.source_session || "";
    const stage = (body.match(/\*\*Stage:\*\*\s*(.*)/)?.[1] || "").trim();
    const summary = (body.match(/\*\*Summary:\*\*\s*(.*)/)?.[1] || "").trim();

    items.push({ file, title, date, sourceSession, stage, summary });
  }

  items.sort((a, b) => safeDateKey(b.date) - safeDateKey(a.date));
  return items;
}

async function buildReportsIndex(projectRoot: string): Promise<ReportEntry[]> {
  const reportsDir = path.join(projectRoot, "docs", "reports");
  try {
    await fs.access(reportsDir);
  } catch {
    return [];
  }

  const files = await listMarkdownFiles(reportsDir);
  const items: ReportEntry[] = [];

  for (const file of files) {
    const md = await fs.readFile(path.join(reportsDir, file), "utf8");
    const { fm, body } = parseFrontmatter(md);
    const heading = extractFirstHeading(body);
    const title = fm.title || heading || file;
    const date = fm.date || guessDateFromFilename(file);
    items.push({ file, title, date });
  }

  items.sort((a, b) => safeDateKey(b.date) - safeDateKey(a.date));
  return items;
}

async function buildScrumReportsIndex(projectRoot: string): Promise<ScrumReportEntry[]> {
  const reportsDir = path.join(projectRoot, "SCRUM_REPORTS");
  try {
    await fs.access(reportsDir);
  } catch {
    return [];
  }

  const files = await listMarkdownFiles(reportsDir);
  const items: ScrumReportEntry[] = [];

  for (const file of files) {
    const md = await fs.readFile(path.join(reportsDir, file), "utf8");
    const { fm, body } = parseFrontmatter(md);

    const title = fm.title || extractFirstHeading(body) || file;
    const date = fm.date || guessDateFromFilename(file);
    const sourceSession = fm.source_session || "";
    const stage = (body.match(/\*\*Stage:\*\*\s*(.*)/)?.[1] || "").trim();
    const summary = (body.match(/\*\*Summary:\*\*\s*(.*)/)?.[1] || "").trim();

    items.push({ file, title, date, sourceSession, stage, summary });
  }

  items.sort((a, b) => safeDateKey(b.date) - safeDateKey(a.date));
  return items;
}

async function writeCoolerIndex(projectRoot: string, cooler: CoolerEntry[]) {
  const outPath = path.join(projectRoot, "docs", "cooler", "index.md");
  const now = new Date().toISOString();

  const lines: string[] = [];
  lines.push("# Cooler Index");
  lines.push("");
  lines.push(`_Auto-generated: ${now}_`);
  lines.push("");
  lines.push("| date | title | session | participants | escalations |");
  lines.push("|---|---|---|---:|---:|");

  for (const item of cooler) {
    const date = item.date ? item.date.slice(0, 10) : "";
    const title = mdEscapePipe(item.title);
    const link = `./${item.file}`;
    lines.push(
      `| ${date} | [${title}](${link}) | ${item.sessionId || ""} | ${item.participantsCount} | ${item.escalations} |`
    );
  }

  lines.push("");
  lines.push(`Total: **${cooler.length}** cooler sessions`);
  lines.push("");

  await fs.writeFile(outPath, lines.join("\n"), "utf8");
}

async function writeScrumIndex(projectRoot: string, scrum: ScrumEntry[]) {
  const outPath = path.join(projectRoot, "docs", "scrum", "index.md");
  const now = new Date().toISOString();

  const lines: string[] = [];
  lines.push("# Scrum Index");
  lines.push("");
  lines.push(`_Auto-generated: ${now}_`);
  lines.push("");
  lines.push("| date | title | source_session | stage | summary |");
  lines.push("|---|---|---|---|---|");

  for (const item of scrum) {
    const date = item.date ? item.date.slice(0, 10) : "";
    const title = mdEscapePipe(item.title);
    const link = `./${item.file}`;
    lines.push(
      `| ${date} | [${title}](${link}) | ${mdEscapePipe(item.sourceSession || "")} | ${mdEscapePipe(item.stage || "")} | ${mdEscapePipe(item.summary || "")} |`
    );
  }

  lines.push("");
  lines.push(`Total: **${scrum.length}** scrum exports`);
  lines.push("");

  await fs.writeFile(outPath, lines.join("\n"), "utf8");
}

async function writeReportsIndex(projectRoot: string, reports: ReportEntry[]) {
  const outPath = path.join(projectRoot, "docs", "reports", "index.md");
  const now = new Date().toISOString();

  const lines: string[] = [];
  lines.push("# Reports Index");
  lines.push("");
  lines.push(`_Auto-generated: ${now}_`);
  lines.push("");
  lines.push("| date | title | file |");
  lines.push("|---|---|---|");

  for (const item of reports) {
    const date = item.date ? item.date.slice(0, 10) : "";
    const title = mdEscapePipe(item.title);
    const link = `./${item.file}`;
    lines.push(`| ${date} | [${title}](${link}) | ${mdEscapePipe(item.file)} |`);
  }

  lines.push("");
  lines.push(`Total: **${reports.length}** report exports`);
  lines.push("");

  await fs.writeFile(outPath, lines.join("\n"), "utf8");
}

async function writeScrumReportsIndex(projectRoot: string, reports: ScrumReportEntry[]) {
  const outPath = path.join(projectRoot, "SCRUM_REPORTS", "index.md");
  const now = new Date().toISOString();

  const lines: string[] = [];
  lines.push("# Scrum Index");
  lines.push("");
  lines.push(`_Auto-generated: ${now}_`);
  lines.push("");
  lines.push("| date | title | source_session | stage | summary |");
  lines.push("|---|---|---|---|---|");

  for (const item of reports) {
    const date = item.date ? item.date.slice(0, 10) : "";
    const title = mdEscapePipe(item.title);
    const link = `./${item.file}`;
    lines.push(
      `| ${date} | [${title}](${link}) | ${mdEscapePipe(item.sourceSession || "")} | ${mdEscapePipe(item.stage || "")} | ${mdEscapePipe(item.summary || "")} |`
    );
  }

  lines.push("");
  lines.push(`Total: **${reports.length}** scrum exports`);
  lines.push("");

  await fs.writeFile(outPath, lines.join("\n"), "utf8");
}

export async function rebuildDocIndexes(projectRoot: string): Promise<{
  coolerCount: number;
  scrumCount: number;
  reportsCount: number;
  scrumReportsCount: number;
}> {
  const [cooler, scrum, reports, scrumReports] = await Promise.all([
    buildCoolerIndex(projectRoot),
    buildScrumIndex(projectRoot),
    buildReportsIndex(projectRoot),
    buildScrumReportsIndex(projectRoot),
  ]);

  await Promise.all([
    writeCoolerIndex(projectRoot, cooler),
    writeScrumIndex(projectRoot, scrum),
    writeReportsIndex(projectRoot, reports),
    writeScrumReportsIndex(projectRoot, scrumReports),
  ]);

  return {
    coolerCount: cooler.length,
    scrumCount: scrum.length,
    reportsCount: reports.length,
    scrumReportsCount: scrumReports.length,
  };
}
