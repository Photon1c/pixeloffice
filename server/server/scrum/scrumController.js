import * as fs from "fs";
import * as path from "path";
const SCRUM_LOG_DIR = path.resolve(process.cwd(), "data", "scrum_logs");
console.log(`[SCRUM] Log directory: ${SCRUM_LOG_DIR}, cwd: ${process.cwd()}`);
if (!fs.existsSync(SCRUM_LOG_DIR)) {
    fs.mkdirSync(SCRUM_LOG_DIR, { recursive: true });
}
function generateSessionId() {
    return `scrum-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
export function createScrumSession(topic, participants, sourceContext) {
    return {
        id: generateSessionId(),
        timestamp: new Date().toISOString(),
        topic,
        participants,
        currentStage: "check",
        results: [],
        finalStatus: "pending",
        sourceContext,
    };
}
export function getNextStage(current) {
    const stages = ["check", "report", "review", "decide", "execute", "log"];
    const idx = stages.indexOf(current);
    return idx < stages.length - 1 ? stages[idx + 1] : null;
}
export function validateCheckOutput(output) {
    if (!output || typeof output !== "object")
        return false;
    const o = output;
    return (typeof o.repo_status === "string" &&
        Array.isArray(o.findings) &&
        o.findings.every((f) => typeof f === "string"));
}
async function fetchGitHubREADME(owner, repo) {
    const readmeNames = ['README.md', 'README.rst', 'README.txt', 'README'];
    for (const name of readmeNames) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${name}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'PixelOffice-SCRUM'
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.content) {
                    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
                    return decoded;
                }
                else if (data.download_url) {
                    const dlResponse = await fetch(data.download_url);
                    if (dlResponse.ok) {
                        return await dlResponse.text();
                    }
                }
            }
        }
        catch {
            // Continue to next name
        }
    }
    return null;
}
export async function runCheckStage(session, sourceContext) {
    const targetRepo = "Photon1c/pixeloffice";
    let readmeContent;
    let repoStatus = "changes_detected";
    const findings = [
        "Repository: " + targetRepo,
    ];
    if (sourceContext && sourceContext.length > 0) {
        findings.push("Source Context:");
        findings.push(...sourceContext);
    }
    try {
        const readme = await fetchGitHubREADME("Photon1c", "pixeloffice");
        if (readme) {
            readmeContent = readme.substring(0, 2000);
            findings.push("README.md found - " + readme.split('\n').length + " lines");
            repoStatus = "changes_detected";
        }
        else {
            findings.push("No README found");
        }
    }
    catch (err) {
        findings.push("Could not fetch repository info: " + (err instanceof Error ? err.message : "unknown error"));
        repoStatus = "error";
    }
    const output = {
        repo_status: repoStatus,
        findings,
        readme_content: readmeContent,
        repo: targetRepo,
        source_context: sourceContext,
    };
    return {
        stage: "check",
        agent: "clerk",
        output,
        valid: validateCheckOutput(output),
    };
}
export function runReportStage(session) {
    const checkResult = session.results.find((r) => r.stage === "check");
    const findings = checkResult && checkResult.valid
        ? checkResult.output.findings
        : ["Unable to retrieve findings"];
    const output = {
        summary: `Repository status: ${findings.join("; ")}.`,
        from_stage: "check",
    };
    return {
        stage: "report",
        agent: "clerk",
        output,
        valid: typeof output.summary === "string",
    };
}
export function runReviewStage(session) {
    const checkResult = session.results.find((r) => r.stage === "check");
    const hasUnrunTests = checkResult?.valid &&
        checkResult.output.findings.includes("tests not yet run");
    const NO_ACTION_DEFAULT = "No action recommended right now. Monitor and revisit if new evidence appears.";
    let recommendedActions;
    if (hasUnrunTests) {
        recommendedActions = ["run tests", "review modified files"];
    }
    else {
        recommendedActions = [];
    }
    if (recommendedActions.length === 0) {
        recommendedActions = [NO_ACTION_DEFAULT];
    }
    const output = {
        approved: !hasUnrunTests,
        risks: hasUnrunTests ? ["tests not run"] : [],
        recommended_actions: recommendedActions,
    };
    return {
        stage: "review",
        agent: "specialist",
        output,
        valid: typeof output.approved === "boolean",
    };
}
export function runDecideStage(session) {
    const reviewResult = session.results.find((r) => r.stage === "review");
    const approved = reviewResult?.valid ? reviewResult.output.approved : false;
    const decision = approved ? "implement" : "escalate";
    const output = {
        decision,
        rationale: approved
            ? "Review approved, proceeding to implementation."
            : "Risks identified, escalating for further review.",
    };
    return {
        stage: "decide",
        agent: "executive",
        output,
        valid: ["implement", "defer", "escalate", "close"].includes(decision),
    };
}
export function runExecuteStage(session) {
    const decideResult = session.results.find((r) => r.stage === "decide");
    const decision = decideResult?.valid
        ? decideResult.output.decision
        : "skipped";
    const output = {
        action: decision === "implement" ? "prepare_implementation" : decision,
        status: decision === "implement" ? "mock_complete" : "skipped",
    };
    return {
        stage: "execute",
        agent: "clerk",
        output,
        valid: typeof output.status === "string",
    };
}
export function runLogStage(session) {
    const logPath = path.join(SCRUM_LOG_DIR, `${session.id}.md`);
    console.log(`[SCRUM] runLogStage called, writing to: ${logPath}`);
    // Important: exporter parses the *last* ```json block as the session JSON.
    // At this stage, `session.results` does not yet include the log stage result
    // (advanceScrumSession appends it after the handler returns). So we write a
    // "sessionForWrite" that includes the log stage and marks finalStatus=complete.
    const output = { logged: false, path: logPath };
    const stageResult = {
        stage: "log",
        agent: "archivist",
        output,
        valid: true,
    };
    const sessionForWrite = {
        ...session,
        currentStage: "log",
        finalStatus: "complete",
        results: [...session.results, stageResult],
    };
    const logContent = generateSessionMarkdown(sessionForWrite);
    try {
        fs.writeFileSync(logPath, logContent, "utf8");
        output.logged = true;
        console.log(`[SCRUM] Log saved successfully: ${logPath}`);
    }
    catch (err) {
        console.error(`[SCRUM] Failed to write log: ${err}`);
        return {
            stage: "log",
            agent: "archivist",
            output: { logged: false, path: logPath },
            valid: false,
            error: "Failed to write log file",
        };
    }
    // If this is a self-maintenance topic, append GitHub-ready summary
    if (sessionForWrite.topic && sessionForWrite.topic.startsWith("repo:")) {
        appendToGithubNotes(sessionForWrite);
    }
    return stageResult;
}
function appendToGithubNotes(session) {
    const notesPath = path.resolve("docs/PIXEL_OFFICE_SCRUM_NOTES.md");
    const githubSummary = generateGithubSummary(session);
    try {
        const marker = "<!-- New entries are appended below this line. Do not edit existing entries. -->";
        let content = "";
        if (fs.existsSync(notesPath)) {
            content = fs.readFileSync(notesPath, "utf8");
        }
        const entry = `\n${githubSummary}\n`;
        if (content.includes(marker)) {
            content = content.replace(marker, `${marker}\n${entry}`);
        }
        else {
            content += entry;
        }
        fs.writeFileSync(notesPath, content, "utf8");
    }
    catch (error) {
        console.error("Failed to append to GitHub notes:", error);
    }
}
function generateGithubSummary(session) {
    const date = new Date(session.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const decision = session.results.find(r => r.stage === "decide")?.output;
    const review = session.results.find(r => r.stage === "review")?.output;
    const check = session.results.find(r => r.stage === "check")?.output;
    const lines = [
        `## ${date} — ${session.topic}`,
        "",
        `**Session ID:** ${session.id}`,
        `**Status:** ${session.finalStatus}`,
        "",
    ];
    if (check && check.findings) {
        lines.push("### Observations");
        check.findings.forEach(f => lines.push(`- ${f}`));
        lines.push("");
    }
    if (review && review.risks) {
        lines.push("### Risks Identified");
        review.risks.forEach(r => lines.push(`- ${r}`));
        lines.push("");
    }
    if (review && review.recommended_actions) {
        lines.push("### Recommended Actions");
        review.recommended_actions.forEach(a => lines.push(`- ${a}`));
        lines.push("");
    }
    if (decision) {
        lines.push(`**Decision:** ${decision.decision.toUpperCase()}`);
        lines.push(`**Rationale:** ${decision.rationale}`);
        lines.push("");
    }
    lines.push("---");
    return lines.join("\n");
}
function generateSessionMarkdown(session) {
    const lines = [
        `# SCRUM Session: ${session.id}`,
        "",
        `**Timestamp:** ${session.timestamp}`,
        `**Topic:** ${session.topic}`,
        `**Participants:** ${session.participants.join(", ")}`,
        "",
        "## Stages",
        "",
    ];
    for (const result of session.results) {
        lines.push(`### ${result.stage.toUpperCase()}`);
        lines.push(`- **Agent:** ${result.agent}`);
        lines.push(`- **Valid:** ${result.valid ? "Yes" : "No"}`);
        if (result.error) {
            lines.push(`- **Error:** ${result.error}`);
        }
        lines.push(`- **Output:**`);
        lines.push("```json");
        lines.push(JSON.stringify(result.output, null, 2));
        lines.push("```");
        lines.push("");
    }
    lines.push("## Summary");
    const finalDecision = session.results.find((r) => r.stage === "decide")?.output;
    if (finalDecision) {
        lines.push(`- **Decision:** ${finalDecision.decision}`);
        lines.push(`- **Rationale:** ${finalDecision.rationale}`);
    }
    lines.push(`- **Final Status:** ${session.finalStatus}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Session JSON");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(session, null, 2));
    lines.push("```");
    return lines.join("\n");
}
export async function advanceScrumSession(session) {
    const stageHandlers = {
        check: (s) => runCheckStage(s, s.sourceContext),
        report: runReportStage,
        review: runReviewStage,
        decide: runDecideStage,
        execute: runExecuteStage,
        log: runLogStage,
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
    const stageResult = await handler(session);
    session.results.push(stageResult);
    console.log(`[SCRUM] Completed stage: ${session.currentStage}, valid: ${stageResult.valid}, next: ${getNextStage(session.currentStage)}`);
    if (!stageResult.valid) {
        session.finalStatus = "failed";
        return { session, stageResult };
    }
    const nextStage = getNextStage(session.currentStage);
    if (nextStage) {
        session.currentStage = nextStage;
    }
    else {
        session.finalStatus = "complete";
    }
    return { session, stageResult };
}
