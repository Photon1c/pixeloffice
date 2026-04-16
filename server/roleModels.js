"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.tools = exports.roleToAgentMap = exports.autonomyConfig = exports.AUTONOMY_ZONES = void 0;
exports.getRoleModelConfig = getRoleModelConfig;
exports.getQuickTransitionModel = getQuickTransitionModel;
exports.getExecutiveModel = getExecutiveModel;
exports.callChatModelForRole = callChatModelForRole;
var model_role_mapping_json_1 = require("./model_role_mapping.json");
// Autonomy Zones: Green (auto), Yellow (propose/approve), Red (human only)
exports.AUTONOMY_ZONES = {
    // Tool permissions by zone
    GREEN: ["search_knowledge_base", "read_file", "get_weather"],
    YELLOW: ["schedule_scrum", "add_calendar_deadline", "create_improvement_ticket", "create_scrum", "promote_cooler"],
    RED: ["write_code", "delete_data", "migrate_db", "update_secrets"]
};
exports.autonomyConfig = {
    // Tools available to each role
    receptionist: { tools: ["GREEN"], maxTokens: 512 },
    clerk: { tools: ["GREEN", "YELLOW"], maxTokens: 1024 },
    specialist: { tools: ["GREEN", "YELLOW"], maxTokens: 2048 },
    executive: { tools: ["GREEN", "YELLOW", "RED"], maxTokens: 4096 },
    custodian: { tools: ["GREEN"], maxTokens: 512 },
    archivist: { tools: ["GREEN"], maxTokens: 1024 },
};
exports.roleToAgentMap = {
    receptionist: "frontdesk",
    custodian: "ironclaw",
    clerk: "openclaw",
    specialist: "zeroclaw",
    archivist: "hermitclaw",
    executive: "leslieclaw",
    office_assistant: "openclaw",
    workload_planner: "openclaw",
};
var KB_SERVER_URL = process.env.KB_SERVER_URL || "http://127.0.0.1:8787";
exports.tools = [
    {
        type: "function",
        function: {
            name: "search_knowledge_base",
            description: "Search the knowledge base for relevant documents or information. Use this when the user asks about project documentation, files, or needs to find information in the knowledge base.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to find relevant documents"
                    },
                    top_k: {
                        type: "number",
                        description: "Maximum number of results to return",
                        default: 5
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read the contents of a file from the local filesystem. Use this when the user asks to read or examine a specific file.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Absolute or relative path to the file to read"
                    }
                },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "schedule_scrum",
            description: "Schedule a scrum session to work on improving a document, codebase, or feature. Use this when the user wants to iterate, fix, improve, or build something - it creates a time-boxed improvement session.",
            parameters: {
                type: "object",
                properties: {
                    topic: {
                        type: "string",
                        description: "What to work on (e.g., 'fix the login bug', 'improve the flight-sim README')"
                    },
                    document: {
                        type: "string",
                        description: "Document or file to reference for the session"
                    },
                    deadline: {
                        type: "string",
                        description: "When to complete (e.g., 'in 2 hours', 'tomorrow 3pm', '2024-01-15T17:00:00')"
                    },
                    priority: {
                        type: "string",
                        description: "Priority level",
                        enum: ["low", "normal", "high", "urgent"],
                        default: "normal"
                    }
                },
                required: ["topic"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_calendar_deadline",
            description: "Add a deadline or reminder for a task. Use this to set time-based goals for work items.",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "Title of the deadline/task"
                    },
                    deadline: {
                        type: "string",
                        description: "When the task is due (e.g., 'in 1 hour', 'tomorrow', '2024-01-15T17:00:00')"
                    },
                    assignee: {
                        type: "string",
                        description: "Who should complete this task"
                    },
                    notes: {
                        type: "string",
                        description: "Additional context or details"
                    }
                },
                required: ["title", "deadline"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_improvement_ticket",
            description: "Create a ticket for improving something in the backlog. Use this when issues are found or improvements are identified.",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "Brief title of the improvement needed"
                    },
                    description: {
                        type: "string",
                        description: "Details about what needs improvement"
                    },
                    priority: {
                        type: "string",
                        description: "Priority level",
                        enum: ["low", "normal", "high", "urgent"],
                        default: "normal"
                    },
                    related_document: {
                        type: "string",
                        description: "Related file or document if any"
                    }
                },
                required: ["title"]
            }
        }
    }
];
function getRoleModelConfig(role) {
    var _a, _b;
    var entry = model_role_mapping_json_1.default[role] || model_role_mapping_json_1.default["clerk"];
    if (!entry) {
        throw new Error("No model mapping defined for role: ".concat(role));
    }
    // Check if there's a fallback provider (e.g., NVIDIA for executive)
    if (entry.fallback && entry.provider !== "ollama") {
        console.log("[RoleModel] ".concat(role, " using fallback: ").concat(entry.provider, "/").concat(entry.model_name));
    }
    return {
        role: role || "clerk",
        provider: entry.provider || "ollama",
        modelName: entry.model_name || entry.modelName,
        endpoint: entry.provider === "nvidia" ? "nvidia" : (process.env.OLLAMA_ENDPOINT || "http://localhost:11434"),
        params: {
            temperature: (_a = entry.temperature) !== null && _a !== void 0 ? _a : 0.2,
            max_tokens: (_b = entry.max_tokens) !== null && _b !== void 0 ? _b : 1024,
        },
    };
}
// Get model for quick transitions (handoff/thought loop)
function getQuickTransitionModel() {
    return getRoleModelConfig("handoff");
}
// Get model for executive decisions with reasoning
function getExecutiveModel() {
    return getRoleModelConfig("executive");
}
function approximateTokens(text) {
    if (!text || typeof text !== "string")
        return 0;
    return Math.ceil(text.length / 4);
}
function executeTool(toolCall) {
    return __awaiter(this, void 0, void 0, function () {
        var name, args, _a, resp, data, results, e_1, fs, content, e_2, endpoint, body, resp, data, e_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    name = toolCall.name, args = toolCall.arguments;
                    console.log("[Tools] Executing: ".concat(name), args);
                    _a = name;
                    switch (_a) {
                        case "search_knowledge_base": return [3 /*break*/, 1];
                        case "read_file": return [3 /*break*/, 5];
                        case "schedule_scrum": return [3 /*break*/, 9];
                        case "add_calendar_deadline": return [3 /*break*/, 9];
                        case "create_improvement_ticket": return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 13];
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(KB_SERVER_URL, "/search"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ query: args.query, top_k: args.top_k || 5 }),
                        })];
                case 2:
                    resp = _b.sent();
                    return [4 /*yield*/, resp.json()];
                case 3:
                    data = _b.sent();
                    results = data.results || [];
                    return [2 /*return*/, {
                            content: results.length > 0
                                ? results.map(function (r) { return r.text || JSON.stringify(r); }).join("\n---\n")
                                : "No results found in knowledge base."
                        }];
                case 4:
                    e_1 = _b.sent();
                    return [2 /*return*/, { error: "Knowledge base search failed: ".concat(e_1.message) }];
                case 5:
                    _b.trys.push([5, 8, , 9]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("fs/promises"); })];
                case 6:
                    fs = _b.sent();
                    return [4 /*yield*/, fs.readFile(args.path, "utf-8")];
                case 7:
                    content = _b.sent();
                    return [2 /*return*/, { content: content.slice(0, 8000) }]; // Limit to 8k chars
                case 8:
                    e_2 = _b.sent();
                    return [2 /*return*/, { error: "Could not read file: ".concat(e_2.message) }];
                case 9:
                    _b.trys.push([9, 12, , 13]);
                    endpoint = "http://127.0.0.1:4173/api/calendar/" + (name === "schedule_scrum" ? "scrum" : name === "add_calendar_deadline" ? "deadline" : "ticket");
                    body = __assign({}, args);
                    if (name === "schedule_scrum") {
                        body.workflow_type = "improvement";
                    }
                    return [4 /*yield*/, fetch(endpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })];
                case 10:
                    resp = _b.sent();
                    return [4 /*yield*/, resp.json()];
                case 11:
                    data = _b.sent();
                    return [2 /*return*/, data];
                case 12:
                    e_3 = _b.sent();
                    return [2 /*return*/, { error: "Failed to schedule: ".concat(e_3.message) }];
                case 13: return [2 /*return*/, { error: "Unknown tool: ".concat(name) }];
            }
        });
    });
}
function callChatModelForRole(role_1, messages_1) {
    return __awaiter(this, arguments, void 0, function (role, messages, options) {
        var config, agentName, promptContent, url, payload, startTime, response, latencyMs, result, toolCalls, finalResponse, toolResults, _i, toolCalls_1, tc, toolResult, secondResponse, secondResult, promptTokens, completionTokens;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    config = getRoleModelConfig(role);
                    agentName = exports.roleToAgentMap[role] || role;
                    promptContent = messages.map(function (m) { return m.content; }).join("\n");
                    if (!(config.provider === "ollama")) return [3 /*break*/, 10];
                    url = "".concat(config.endpoint, "/api/chat");
                    payload = {
                        model: config.modelName,
                        messages: messages,
                        stream: false,
                        options: {
                            temperature: (_c = (_a = options.temperature) !== null && _a !== void 0 ? _a : (_b = config.params) === null || _b === void 0 ? void 0 : _b.temperature) !== null && _c !== void 0 ? _c : 0.2,
                            num_predict: (_f = (_d = options.max_tokens) !== null && _d !== void 0 ? _d : (_e = config.params) === null || _e === void 0 ? void 0 : _e.max_tokens) !== null && _f !== void 0 ? _f : 1024,
                        },
                    };
                    // Add tools if not disabled
                    if (options.tools !== false) {
                        payload.tools = exports.tools;
                    }
                    startTime = Date.now();
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        })];
                case 1:
                    response = _q.sent();
                    latencyMs = Date.now() - startTime;
                    if (!response.ok) {
                        console.error("[Office-Chat] Role=".concat(config.role, ", Model=").concat(config.modelName, ", Latency=").concat(latencyMs, "ms, Success=False, Error=").concat(response.statusText));
                        throw new Error("Ollama chat call failed: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    result = _q.sent();
                    console.log("[Office-Chat] Role=".concat(config.role, ", Model=").concat(config.modelName, ", Latency=").concat(latencyMs, "ms, Success=True"));
                    toolCalls = ((_g = result.message) === null || _g === void 0 ? void 0 : _g.tool_calls) || [];
                    finalResponse = (_h = result.message) === null || _h === void 0 ? void 0 : _h.content;
                    toolResults = [];
                    if (!(toolCalls.length > 0)) return [3 /*break*/, 9];
                    console.log("[Tools] Found ".concat(toolCalls.length, " tool call(s) in response"));
                    _i = 0, toolCalls_1 = toolCalls;
                    _q.label = 3;
                case 3:
                    if (!(_i < toolCalls_1.length)) return [3 /*break*/, 6];
                    tc = toolCalls_1[_i];
                    return [4 /*yield*/, executeTool({
                            name: (_j = tc.function) === null || _j === void 0 ? void 0 : _j.name,
                            arguments: typeof ((_k = tc.function) === null || _k === void 0 ? void 0 : _k.arguments) === 'string'
                                ? JSON.parse(tc.function.arguments)
                                : (_l = tc.function) === null || _l === void 0 ? void 0 : _l.arguments
                        })];
                case 4:
                    toolResult = _q.sent();
                    toolResults.push({ tool: (_m = tc.function) === null || _m === void 0 ? void 0 : _m.name, result: toolResult });
                    // Add tool result as a message for the model to incorporate
                    messages.push({
                        role: "tool",
                        content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                        tool_call_id: tc.id || ((_o = tc.function) === null || _o === void 0 ? void 0 : _o.name)
                    });
                    _q.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: config.modelName,
                            messages: messages,
                            stream: false,
                            options: payload.options
                        })
                    })];
                case 7:
                    secondResponse = _q.sent();
                    if (!secondResponse.ok) return [3 /*break*/, 9];
                    return [4 /*yield*/, secondResponse.json()];
                case 8:
                    secondResult = _q.sent();
                    finalResponse = (_p = secondResult.message) === null || _p === void 0 ? void 0 : _p.content;
                    _q.label = 9;
                case 9:
                    promptTokens = result.prompt_eval_count || 0;
                    completionTokens = result.eval_count || 0;
                    return [2 /*return*/, {
                            success: true,
                            role: config.role,
                            agent: agentName,
                            model: config.modelName,
                            provider: config.provider,
                            response: finalResponse,
                            raw_response: result,
                            latency_ms: latencyMs,
                            tool_calls: toolCalls.length > 0 ? toolResults : undefined,
                            usage: {
                                prompt_tokens: promptTokens || approximateTokens(promptContent),
                                completion_tokens: completionTokens || approximateTokens(finalResponse),
                                total_tokens: (promptTokens || approximateTokens(promptContent)) + (completionTokens || approximateTokens(finalResponse)),
                            },
                        }];
                case 10: throw new Error("Provider ".concat(config.provider, " not supported in JS client yet"));
            }
        });
    });
}
