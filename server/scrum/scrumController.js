"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScrumSession = createScrumSession;
exports.getNextStage = getNextStage;
exports.validateCheckOutput = validateCheckOutput;
exports.runCheckStage = runCheckStage;
exports.runReportStage = runReportStage;
exports.runReviewStage = runReviewStage;
exports.runDecideStage = runDecideStage;
exports.runExecuteStage = runExecuteStage;
exports.runLogStage = runLogStage;
exports.advanceScrumSession = advanceScrumSession;
var fs = require("fs");
var path = require("path");
var SCRUM_LOG_DIR = path.resolve(process.cwd(), "data", "scrum_logs");
console.log("[SCRUM] Log directory: ".concat(SCRUM_LOG_DIR, ", cwd: ").concat(process.cwd()));
if (!fs.existsSync(SCRUM_LOG_DIR)) {
    fs.mkdirSync(SCRUM_LOG_DIR, { recursive: true });
}
function generateSessionId() {
    return "scrum-".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 8));
}
function createScrumSession(topic, participants) {
    return {
        id: generateSessionId(),
        timestamp: new Date().toISOString(),
        topic: topic,
        participants: participants,
        currentStage: "check",
        results: [],
        finalStatus: "pending",
    };
}
function getNextStage(current) {
    var stages = ["check", "report", "review", "decide", "execute", "log"];
    var idx = stages.indexOf(current);
    return idx < stages.length - 1 ? stages[idx + 1] : null;
}
function validateCheckOutput(output) {
    if (!output || typeof output !== "object")
        return false;
    var o = output;
    return (typeof o.repo_status === "string" &&
        Array.isArray(o.findings) &&
        o.findings.every(function (f) { return typeof f === "string"; }));
}
function fetchGitHubREADME(owner, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var readmeNames, _i, readmeNames_1, name_1, response, data, decoded, dlResponse, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    readmeNames = ['README.md', 'README.rst', 'README.txt', 'README'];
                    _i = 0, readmeNames_1 = readmeNames;
                    _b.label = 1;
                case 1:
                    if (!(_i < readmeNames_1.length)) return [3 /*break*/, 11];
                    name_1 = readmeNames_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 9, , 10]);
                    return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(owner, "/").concat(repo, "/contents/").concat(name_1), {
                            headers: {
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'PixelOffice-SCRUM'
                            }
                        })];
                case 3:
                    response = _b.sent();
                    if (!response.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, response.json()];
                case 4:
                    data = _b.sent();
                    if (!data.content) return [3 /*break*/, 5];
                    decoded = Buffer.from(data.content, 'base64').toString('utf-8');
                    return [2 /*return*/, decoded];
                case 5:
                    if (!data.download_url) return [3 /*break*/, 8];
                    return [4 /*yield*/, fetch(data.download_url)];
                case 6:
                    dlResponse = _b.sent();
                    if (!dlResponse.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, dlResponse.text()];
                case 7: return [2 /*return*/, _b.sent()];
                case 8: return [3 /*break*/, 10];
                case 9:
                    _a = _b.sent();
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/, null];
            }
        });
    });
}
function runCheckStage(session) {
    return __awaiter(this, void 0, void 0, function () {
        var targetRepo, readmeContent, repoStatus, findings, readme, err_1, output;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetRepo = "Photon1c/pixeloffice";
                    repoStatus = "changes_detected";
                    findings = [
                        "Repository: " + targetRepo,
                    ];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchGitHubREADME("Photon1c", "pixeloffice")];
                case 2:
                    readme = _a.sent();
                    if (readme) {
                        readmeContent = readme.substring(0, 2000);
                        findings.push("README.md found - " + readme.split('\n').length + " lines");
                        repoStatus = "changes_detected";
                    }
                    else {
                        findings.push("No README found");
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    findings.push("Could not fetch repository info: " + (err_1 instanceof Error ? err_1.message : "unknown error"));
                    repoStatus = "error";
                    return [3 /*break*/, 4];
                case 4:
                    output = {
                        repo_status: repoStatus,
                        findings: findings,
                        readme_content: readmeContent,
                        repo: targetRepo,
                    };
                    return [2 /*return*/, {
                            stage: "check",
                            agent: "clerk",
                            output: output,
                            valid: validateCheckOutput(output),
                        }];
            }
        });
    });
}
function runReportStage(session) {
    var checkResult = session.results.find(function (r) { return r.stage === "check"; });
    var findings = checkResult && checkResult.valid
        ? checkResult.output.findings
        : ["Unable to retrieve findings"];
    var output = {
        summary: "Repository status: ".concat(findings.join("; "), "."),
        from_stage: "check",
    };
    return {
        stage: "report",
        agent: "clerk",
        output: output,
        valid: typeof output.summary === "string",
    };
}
function runReviewStage(session) {
    var checkResult = session.results.find(function (r) { return r.stage === "check"; });
    var hasUnrunTests = (checkResult === null || checkResult === void 0 ? void 0 : checkResult.valid) &&
        checkResult.output.findings.includes("tests not yet run");
    var output = {
        approved: !hasUnrunTests,
        risks: hasUnrunTests ? ["tests not run"] : [],
        recommended_actions: hasUnrunTests ? ["run tests", "review modified files"] : [],
    };
    return {
        stage: "review",
        agent: "specialist",
        output: output,
        valid: typeof output.approved === "boolean",
    };
}
function runDecideStage(session) {
    var reviewResult = session.results.find(function (r) { return r.stage === "review"; });
    var approved = (reviewResult === null || reviewResult === void 0 ? void 0 : reviewResult.valid) ? reviewResult.output.approved : false;
    var decision = approved ? "implement" : "escalate";
    var output = {
        decision: decision,
        rationale: approved
            ? "Review approved, proceeding to implementation."
            : "Risks identified, escalating for further review.",
    };
    return {
        stage: "decide",
        agent: "executive",
        output: output,
        valid: ["implement", "defer", "escalate", "close"].includes(decision),
    };
}
function runExecuteStage(session) {
    var decideResult = session.results.find(function (r) { return r.stage === "decide"; });
    var decision = (decideResult === null || decideResult === void 0 ? void 0 : decideResult.valid)
        ? decideResult.output.decision
        : "skipped";
    var output = {
        action: decision === "implement" ? "prepare_implementation" : decision,
        status: decision === "implement" ? "mock_complete" : "skipped",
    };
    return {
        stage: "execute",
        agent: "clerk",
        output: output,
        valid: typeof output.status === "string",
    };
}
function runLogStage(session) {
    var logContent = generateSessionMarkdown(session);
    var logPath = path.join(SCRUM_LOG_DIR, "".concat(session.id, ".md"));
    console.log("[SCRUM] runLogStage called, writing to: ".concat(logPath));
    try {
        fs.writeFileSync(logPath, logContent, "utf8");
        console.log("[SCRUM] Log saved successfully: ".concat(logPath));
    }
    catch (err) {
        console.error("[SCRUM] Failed to write log: ".concat(err));
        var output_1 = { logged: false, path: "" };
        return {
            stage: "log",
            agent: "archivist",
            output: output_1,
            valid: false,
            error: "Failed to write log file",
        };
    }
    // If this is a self-maintenance topic, append GitHub-ready summary
    if (session.topic && session.topic.startsWith("repo:")) {
        appendToGithubNotes(session);
    }
    var output = { logged: true, path: logPath };
    return {
        stage: "log",
        agent: "archivist",
        output: output,
        valid: true,
    };
}
function appendToGithubNotes(session) {
    var notesPath = path.resolve("docs/PIXEL_OFFICE_SCRUM_NOTES.md");
    var githubSummary = generateGithubSummary(session);
    try {
        var marker = "<!-- New entries are appended below this line. Do not edit existing entries. -->";
        var content = "";
        if (fs.existsSync(notesPath)) {
            content = fs.readFileSync(notesPath, "utf8");
        }
        var entry = "\n".concat(githubSummary, "\n");
        if (content.includes(marker)) {
            content = content.replace(marker, "".concat(marker, "\n").concat(entry));
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
    var _a, _b, _c;
    var date = new Date(session.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    var decision = (_a = session.results.find(function (r) { return r.stage === "decide"; })) === null || _a === void 0 ? void 0 : _a.output;
    var review = (_b = session.results.find(function (r) { return r.stage === "review"; })) === null || _b === void 0 ? void 0 : _b.output;
    var check = (_c = session.results.find(function (r) { return r.stage === "check"; })) === null || _c === void 0 ? void 0 : _c.output;
    var lines = [
        "## ".concat(date, " \u2014 ").concat(session.topic),
        "",
        "**Session ID:** ".concat(session.id),
        "**Status:** ".concat(session.finalStatus),
        "",
    ];
    if (check && check.findings) {
        lines.push("### Observations");
        check.findings.forEach(function (f) { return lines.push("- ".concat(f)); });
        lines.push("");
    }
    if (review && review.risks) {
        lines.push("### Risks Identified");
        review.risks.forEach(function (r) { return lines.push("- ".concat(r)); });
        lines.push("");
    }
    if (review && review.recommended_actions) {
        lines.push("### Recommended Actions");
        review.recommended_actions.forEach(function (a) { return lines.push("- ".concat(a)); });
        lines.push("");
    }
    if (decision) {
        lines.push("**Decision:** ".concat(decision.decision.toUpperCase()));
        lines.push("**Rationale:** ".concat(decision.rationale));
        lines.push("");
    }
    lines.push("---");
    return lines.join("\n");
}
function generateSessionMarkdown(session) {
    var _a;
    var lines = [
        "# SCRUM Session: ".concat(session.id),
        "",
        "**Timestamp:** ".concat(session.timestamp),
        "**Topic:** ".concat(session.topic),
        "**Participants:** ".concat(session.participants.join(", ")),
        "",
        "## Stages",
        "",
    ];
    for (var _i = 0, _b = session.results; _i < _b.length; _i++) {
        var result = _b[_i];
        lines.push("### ".concat(result.stage.toUpperCase()));
        lines.push("- **Agent:** ".concat(result.agent));
        lines.push("- **Valid:** ".concat(result.valid ? "Yes" : "No"));
        if (result.error) {
            lines.push("- **Error:** ".concat(result.error));
        }
        lines.push("- **Output:**");
        lines.push("```json");
        lines.push(JSON.stringify(result.output, null, 2));
        lines.push("```");
        lines.push("");
    }
    lines.push("## Summary");
    var finalDecision = (_a = session.results.find(function (r) { return r.stage === "decide"; })) === null || _a === void 0 ? void 0 : _a.output;
    if (finalDecision) {
        lines.push("- **Decision:** ".concat(finalDecision.decision));
        lines.push("- **Rationale:** ".concat(finalDecision.rationale));
    }
    lines.push("- **Final Status:** ".concat(session.finalStatus));
    return lines.join("\n");
}
function advanceScrumSession(session) {
    return __awaiter(this, void 0, void 0, function () {
        var stageHandlers, handler, stageResult, nextStage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stageHandlers = {
                        check: runCheckStage,
                        report: runReportStage,
                        review: runReviewStage,
                        decide: runDecideStage,
                        execute: runExecuteStage,
                        log: runLogStage,
                    };
                    handler = stageHandlers[session.currentStage];
                    if (!handler) {
                        session.finalStatus = "failed";
                        return [2 /*return*/, {
                                session: session,
                                stageResult: {
                                    stage: session.currentStage,
                                    agent: "system",
                                    output: {},
                                    valid: false,
                                    error: "Unknown stage",
                                },
                            }];
                    }
                    return [4 /*yield*/, handler(session)];
                case 1:
                    stageResult = _a.sent();
                    session.results.push(stageResult);
                    console.log("[SCRUM] Completed stage: ".concat(session.currentStage, ", valid: ").concat(stageResult.valid, ", next: ").concat(getNextStage(session.currentStage)));
                    if (!stageResult.valid) {
                        session.finalStatus = "failed";
                        return [2 /*return*/, { session: session, stageResult: stageResult }];
                    }
                    nextStage = getNextStage(session.currentStage);
                    if (nextStage) {
                        session.currentStage = nextStage;
                    }
                    else {
                        session.finalStatus = "complete";
                    }
                    return [2 /*return*/, { session: session, stageResult: stageResult }];
            }
        });
    });
}
