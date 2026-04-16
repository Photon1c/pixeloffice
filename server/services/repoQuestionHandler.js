"use strict";
/**
 * Phase D Bind Patch: Repo Question Handler
 *
 * Minimal integration to enable repo questions like "What is on this repo's README?"
 * through the existing chat interface.
 *
 * This module:
 * - Classifies if a message is a repo question
 * - Parses the question type (README, status, files, etc.)
 * - Fetches repo info via GitHub API (or provides helpful fallback)
 * - Optionally creates tasks from interactions
 */
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
exports.isRepoQuestion = isRepoQuestion;
exports.extractRepoInfo = extractRepoInfo;
exports.fetchRepoStatus = fetchRepoStatus;
exports.fetchFileContent = fetchFileContent;
exports.fetchFileList = fetchFileList;
exports.generateReadmeAnswer = generateReadmeAnswer;
exports.generateStatusAnswer = generateStatusAnswer;
exports.generateFilesAnswer = generateFilesAnswer;
exports.handleRepoQuestion = handleRepoQuestion;
exports.formatAnswerForOffice = formatAnswerForOffice;
var REPO_QUESTION_PATTERNS = [
    /\b(readme|read me|what('?s| is) on)\b.*\b(readme|repo|repository)\b/i,
    /\bwhat('?s| is) (in|on|inside)\b.*\b(repo|repository)\b/i,
    /\b(repo|repository)\b.*\b(readme|status|files|structure)\b/i,
    /\bwhat('?s| is) the (repo|repository)\b/i,
    /\bcheck\s+(the\s+)?(repo|repository|github)\b/i,
    /\blist\s+(the\s+)?(files|branches|issues)\b/i,
    /\bshow\s+(me\s+)?(readme|repo|repository)\b/i,
    /\bREADME\b/i,
    /\bgit(hub|lab)?\s+(status|info|info)\b/i,
];
function isRepoQuestion(message) {
    var lower = message.toLowerCase();
    if (/\breadme\b/i.test(lower) || /\b(read me|read me up)\b/i.test(lower)) {
        return { isQuestion: true, type: "readme" };
    }
    if (/\b(status|state|changes|modified|untracked)\b.*\b(repo|repository|github|git)\b/i.test(lower) ||
        /\b(repo|repository|github|git)\b.*\b(status|state|changes|modified)\b/i.test(lower)) {
        return { isQuestion: true, type: "status" };
    }
    if (/\bfiles?\b/i.test(lower) && /\b(repo|repository|github|this project|project)\b/i.test(lower)) {
        return { isQuestion: true, type: "files" };
    }
    if (/\b(structure|tree|directories?|folders?)\b.*\b(repo|repository|this project)\b/i.test(lower) ||
        /\b(repo|repository)\b.*\b(structure|tree|directories?|folders?)\b/i.test(lower)) {
        return { isQuestion: true, type: "structure" };
    }
    if (/\bissues?\b/i.test(lower)) {
        return { isQuestion: true, type: "issues" };
    }
    if (/\bbranches?\b/i.test(lower)) {
        return { isQuestion: true, type: "branches" };
    }
    if (/\bcontributors?\b/i.test(lower)) {
        return { isQuestion: true, type: "contributors" };
    }
    if (/\b(about|info|details)\b.*\b(this project|the project|repo|repository)\b/i.test(lower) ||
        /\b(what's|what is|describe)\b.*\b(this|the)\b.*\b(project|repo|repository)\b/i.test(lower)) {
        return { isQuestion: true, type: "general" };
    }
    for (var _i = 0, REPO_QUESTION_PATTERNS_1 = REPO_QUESTION_PATTERNS; _i < REPO_QUESTION_PATTERNS_1.length; _i++) {
        var pattern = REPO_QUESTION_PATTERNS_1[_i];
        if (pattern.test(lower)) {
            return { isQuestion: true, type: "general" };
        }
    }
    return { isQuestion: false, type: null };
}
function extractRepoInfo(config) {
    var _a, _b;
    return {
        owner: config.owner || ((_a = process.env.SAFE_SCRUM_REPO) === null || _a === void 0 ? void 0 : _a.split("/")[0]) || "unknown",
        repo: config.repo || ((_b = process.env.SAFE_SCRUM_REPO) === null || _b === void 0 ? void 0 : _b.split("/")[1]) || "unknown",
        branch: config.branch || process.env.SAFE_SCRUM_BRANCH || "main",
    };
}
function fetchRepoStatus(config) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = config.token || process.env.GITHUB_TOKEN;
                    if (!token || config.owner === "unknown" || config.repo === "unknown") {
                        return [2 /*return*/, null];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(config.owner, "/").concat(config.repo), {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                Accept: "application/vnd.github.v3+json",
                                "User-Agent": "PixelOffice-RepoQuestionHandler",
                            },
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    return [2 /*return*/, {
                            owner: config.owner,
                            repo: config.repo,
                            branch: data.default_branch,
                            defaultBranch: data.default_branch,
                            openIssues: data.open_issues_count,
                            watchers: data.watchers_count,
                            forks: data.forks_count,
                            description: data.description,
                        }];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchFileContent(config) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = config.token || process.env.GITHUB_TOKEN;
                    if (!token || config.owner === "unknown" || config.repo === "unknown") {
                        return [2 /*return*/, null];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(config.owner, "/").concat(config.repo, "/contents/").concat(config.path, "?ref=").concat(config.branch), {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                Accept: "application/vnd.github.v3+json",
                                "User-Agent": "PixelOffice-RepoQuestionHandler",
                            },
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    if (data.encoding === "base64" && data.content) {
                        return [2 /*return*/, Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8")];
                    }
                    return [2 /*return*/, null];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchFileList(config) {
    return __awaiter(this, void 0, void 0, function () {
        var token, path, response, data, files, dirs, _i, data_1, item, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    token = config.token || process.env.GITHUB_TOKEN;
                    if (!token || config.owner === "unknown" || config.repo === "unknown") {
                        return [2 /*return*/, null];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    path = config.path || "";
                    return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(config.owner, "/").concat(config.repo, "/contents/").concat(path, "?ref=").concat(config.branch), {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                Accept: "application/vnd.github.v3+json",
                                "User-Agent": "PixelOffice-RepoQuestionHandler",
                            },
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    files = [];
                    dirs = [];
                    for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                        item = data_1[_i];
                        if (item.type === "file") {
                            files.push(item.name);
                        }
                        else if (item.type === "dir") {
                            dirs.push(item.name + "/");
                        }
                    }
                    return [2 /*return*/, { files: files, dirs: dirs }];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function generateReadmeAnswer(fileContent, repoInfo) {
    if (!fileContent) {
        return "I couldn't fetch the README for ".concat(repoInfo.owner, "/").concat(repoInfo.repo, ". ") +
            "This might mean:\n" +
            "- The repository doesn't have a README file\n" +
            "- The GitHub token isn't configured\n" +
            "- The repository is private\n\n" +
            "You can check manually at: https://github.com/".concat(repoInfo.owner, "/").concat(repoInfo.repo);
    }
    var truncated = fileContent.length > 2000
        ? fileContent.substring(0, 2000) + "\n\n*[truncated]*"
        : fileContent;
    return "Here's what's in the README for **".concat(repoInfo.owner, "/").concat(repoInfo.repo, "**:\n\n").concat(truncated);
}
function generateStatusAnswer(status, repoInfo) {
    if (!status) {
        return "I couldn't fetch the status for ".concat(repoInfo.owner, "/").concat(repoInfo.repo, ". ") +
            "GitHub integration may not be configured. " +
            "Set GITHUB_TOKEN in your .env file to enable repo status.";
    }
    return [
        "## Repository Status: ".concat(status.owner, "/").concat(status.repo),
        "",
        "**Default Branch:** ".concat(status.defaultBranch),
        "**Description:** ".concat(status.description || "(no description)"),
        "",
        "**Stats:**",
        "- Open Issues: ".concat(status.openIssues),
        "- Watchers: ".concat(status.watchers),
        "- Forks: ".concat(status.forks),
        "",
        "**Link:** https://github.com/".concat(status.owner, "/").concat(status.repo),
    ].join("\n");
}
function generateFilesAnswer(fileList, repoInfo) {
    if (!fileList) {
        return "I couldn't list files for ".concat(repoInfo.owner, "/").concat(repoInfo.repo, ". ") +
            "GitHub integration may not be configured.";
    }
    var files = fileList.files, dirs = fileList.dirs;
    if (files.length === 0 && dirs.length === 0) {
        return "The repository ".concat(repoInfo.owner, "/").concat(repoInfo.repo, " appears to be empty.");
    }
    var lines = ["## Files in ".concat(repoInfo.owner, "/").concat(repoInfo.repo), ""];
    if (dirs.length > 0) {
        lines.push("**Directories:**");
        for (var _i = 0, _a = dirs.slice(0, 10); _i < _a.length; _i++) {
            var dir = _a[_i];
            lines.push("- \uD83D\uDCC1 ".concat(dir));
        }
        if (dirs.length > 10) {
            lines.push("- ... and ".concat(dirs.length - 10, " more directories"));
        }
        lines.push("");
    }
    if (files.length > 0) {
        lines.push("**Files:**");
        for (var _b = 0, _c = files.slice(0, 20); _b < _c.length; _b++) {
            var file = _c[_b];
            lines.push("- \uD83D\uDCC4 ".concat(file));
        }
        if (files.length > 20) {
            lines.push("- ... and ".concat(files.length - 20, " more files"));
        }
    }
    return lines.join("\n");
}
function handleRepoQuestion(message, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, isQuestion, type, repoInfo, token, _b, content, status_1, fileList, status_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = isRepoQuestion(message), isQuestion = _a.isQuestion, type = _a.type;
                    if (!isQuestion || !type) {
                        return [2 /*return*/, {
                                isRepoQuestion: false,
                                questionType: null,
                                answer: "",
                            }];
                    }
                    repoInfo = extractRepoInfo({});
                    token = (options === null || options === void 0 ? void 0 : options.token) || process.env.GITHUB_TOKEN;
                    _b = type;
                    switch (_b) {
                        case "readme": return [3 /*break*/, 1];
                        case "status": return [3 /*break*/, 3];
                        case "files": return [3 /*break*/, 5];
                        case "structure": return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 7];
                case 1: return [4 /*yield*/, fetchFileContent({
                        owner: repoInfo.owner,
                        repo: repoInfo.repo,
                        branch: repoInfo.branch,
                        path: "README.md",
                        token: token,
                    })];
                case 2:
                    content = _c.sent();
                    return [2 /*return*/, {
                            isRepoQuestion: true,
                            questionType: "readme",
                            answer: generateReadmeAnswer(content, repoInfo),
                            metadata: content ? { fileContent: content, fileName: "README.md" } : undefined,
                        }];
                case 3: return [4 /*yield*/, fetchRepoStatus({
                        owner: repoInfo.owner,
                        repo: repoInfo.repo,
                        token: token,
                    })];
                case 4:
                    status_1 = _c.sent();
                    return [2 /*return*/, {
                            isRepoQuestion: true,
                            questionType: "status",
                            answer: generateStatusAnswer(status_1, repoInfo),
                            metadata: status_1 ? { repoStatus: status_1 } : undefined,
                        }];
                case 5: return [4 /*yield*/, fetchFileList({
                        owner: repoInfo.owner,
                        repo: repoInfo.repo,
                        branch: repoInfo.branch,
                        token: token,
                    })];
                case 6:
                    fileList = _c.sent();
                    return [2 /*return*/, {
                            isRepoQuestion: true,
                            questionType: type,
                            answer: generateFilesAnswer(fileList, repoInfo),
                        }];
                case 7: return [4 /*yield*/, fetchRepoStatus({
                        owner: repoInfo.owner,
                        repo: repoInfo.repo,
                        token: token,
                    })];
                case 8:
                    status_2 = _c.sent();
                    return [2 /*return*/, {
                            isRepoQuestion: true,
                            questionType: "general",
                            answer: generateStatusAnswer(status_2, repoInfo),
                            metadata: status_2 ? { repoStatus: status_2 } : undefined,
                        }];
            }
        });
    });
}
function formatAnswerForOffice(result, agentName) {
    if (agentName === void 0) { agentName = "clerk"; }
    if (!result.isRepoQuestion) {
        return "";
    }
    return [
        "*[".concat(agentName, " checks the repository and responds]*"),
        "",
        result.answer,
    ].join("\n");
}
