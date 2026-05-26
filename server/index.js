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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var dotenv_1 = require("dotenv");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, "../.env") });
var app = (0, express_1.default)();
var PORT = process.env.PORT || 4173;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files from public directory
var PUBLIC_DIR = path_1.default.resolve(__dirname, "../../public");
app.use(express_1.default.static(PUBLIC_DIR));
// Model Health Dashboard page
app.get("/model-health", function (_req, res) {
    var htmlPath = path_1.default.join(process.cwd(), "public", "model-health.html");
    res.sendFile(htmlPath);
});
// Serve NVIDIA models shortlist
app.get("/api/nvidia/models", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var configPath, configData, config_1;
    return __generator(this, function (_a) {
        try {
            configPath = path_1.default.resolve(__dirname, "../../config/nvidia-models.json");
            configData = fs_1.default.readFileSync(configPath, "utf-8");
            config_1 = JSON.parse(configData);
            res.json(config_1);
        }
        catch (err) {
            console.error("Failed to load NVIDIA models config:", err);
            res.status(500).json({ error: "Failed to load models config" });
        }
        return [2 /*return*/];
    });
}); });
// Serve available Ollama models
app.get("/api/ollama/models", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ollamaUrl, response, data, models, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
                return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/tags"), {
                        signal: AbortSignal.timeout(3000)
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    res.status(500).json({ error: "Failed to fetch Ollama models" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                models = (data.models || []).map(function (m) { return ({
                    id: m.name,
                    name: m.name.split(':')[0],
                    size: m.size
                }); });
                res.json({ models: models });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.error("Failed to fetch Ollama models:", err_1);
                res.status(500).json({ error: "Failed to fetch Ollama models" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Serve handoff JSON file
app.get("/handoff/opencode-local-agents.json", function (_req, res) {
    var handoffPath = "path.resolve(process.cwd(), "../.handoff")/opencode-local-agents.json";
    var publicPath = path_1.default.join(__dirname, "../public/handoff/opencode-local-agents.json");
    var data = null;
    if (fs_1.default.existsSync(handoffPath)) {
        data = fs_1.default.readFileSync(handoffPath, "utf-8");
    }
    else if (fs_1.default.existsSync(publicPath)) {
        data = fs_1.default.readFileSync(publicPath, "utf-8");
    }
    if (data) {
        // Parse and deduplicate by id
        var parsed = JSON.parse(data);
        var uniqueMap = new Map();
        for (var _i = 0, parsed_1 = parsed; _i < parsed_1.length; _i++) {
            var card = parsed_1[_i];
            if (!uniqueMap.has(card.id)) {
                uniqueMap.set(card.id, card);
            }
        }
        var unique = Array.from(uniqueMap.values());
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(unique));
    }
    else {
        res.status(404).json({ error: "Handoff file not found" });
    }
});
var VISUALIZER_URL = process.env.VISUALIZER_URL || "http://localhost:5006";
var agentNodeMap = {
    system: "FRONT",
    receptionist: "FRONT",
    clerk: "OPEN",
    specialist: "ZERO",
    archivist: "HERMIT",
    executive: "LESLIE",
    custodian: "IRON",
    triage: "TRIAGE",
};
function emitRouteToVisualizer(fromAgent_1, toAgent_1) {
    return __awaiter(this, arguments, void 0, function (fromAgent, toAgent, routeType, taskId) {
        var fromNode, toNode, err_2;
        if (routeType === void 0) { routeType = "task"; }
        if (taskId === void 0) { taskId = ""; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fromNode = agentNodeMap[fromAgent] || fromAgent.toUpperCase().slice(0, 6);
                    toNode = agentNodeMap[toAgent] || toAgent.toUpperCase().slice(0, 6);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(VISUALIZER_URL, "/api/route"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                from: fromNode,
                                to: toNode,
                                confidence: 0.9,
                                model: "local",
                                route_type: routeType,
                                task_id: taskId,
                            }),
                        })];
                case 2:
                    _a.sent();
                    console.log("[Visualizer] ".concat(fromNode, " -> ").concat(toNode, " (").concat(routeType, ")"));
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.warn("[Visualizer] Failed to emit route: ".concat(err_2));
                    return [3 /*break*/, 4];
                case 4:
                    agentRoutesUsed.inc({ from_agent: fromAgent, to_agent: toAgent });
                    return [2 /*return*/];
            }
        });
    });
}
var config_js_1 = require("./pixel_memory/config.js");
var priceFeed_js_1 = require("./services/priceFeed.js");
var index_js_1 = require("./sherlock_analysis/index.js");
var routes_js_1 = require("./conferenceroom/routes.js");
var roleModels_js_1 = require("./roleModels.js");
// Flywheel imports (keep for potential future use)
// import { openai } from "./llm/client.js";
// import { ensureDataDir as ensureResidueDir, depositResidue, getActiveResidues } from "./flywheel/residueLogger";
// import { getActiveHeat } from "./flywheel/reviewHeatEngine";
// import { promoteResidues } from "./flywheel/promotionEngine";
// Cooler Talk Session Storage (PostgreSQL/MySQL)
function ensureCoolerSessionsTable() {
    return __awaiter(this, void 0, void 0, function () {
        var pool, dbType, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    dbType = (0, config_js_1.getConfig)().db.type;
                    if (!(dbType === "postgres")) return [3 /*break*/, 3];
                    return [4 /*yield*/, pool.query("\n        CREATE TABLE IF NOT EXISTS cooler_sessions (\n          id SERIAL PRIMARY KEY,\n          session_id VARCHAR(255) UNIQUE NOT NULL,\n          session_type VARCHAR(50) NOT NULL,\n          topic VARCHAR(500),\n          participants TEXT[],\n          utterances JSONB,\n          metadata JSONB,\n          created_at TIMESTAMP DEFAULT NOW(),\n          updated_at TIMESTAMP DEFAULT NOW()\n        )\n      ")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, pool.query("\n        CREATE TABLE IF NOT EXISTS cooler_sessions (\n          id INT AUTO_INCREMENT PRIMARY KEY,\n          session_id VARCHAR(255) UNIQUE NOT NULL,\n          session_type VARCHAR(50) NOT NULL,\n          topic VARCHAR(500),\n          participants TEXT,\n          utterances JSON,\n          metadata JSON,\n          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n        )\n      ")];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    console.log("[Cooler] cooler_sessions table ready");
                    return [3 /*break*/, 7];
                case 6:
                    err_3 = _a.sent();
                    console.warn("[Cooler] Could not create sessions table:", err_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function updateIndexFile(dirPath, filename, title) {
    try {
        var indexPath = path_1.default.join(dirPath, "index.md");
        var content = "";
        if (fs_1.default.existsSync(indexPath)) {
            content = fs_1.default.readFileSync(indexPath, "utf-8");
        }
        else {
            content = "# Index\n\n";
        }
        // Check if entry already exists
        var entryLink = "- [".concat(title, "](./").concat(filename, ")");
        if (!content.includes(entryLink)) {
            // Add entry after the title line
            var lines = content.split("\n");
            var insertIdx = lines.findIndex(function (l) { return l.startsWith("# "); });
            if (insertIdx !== -1) {
                lines.splice(insertIdx + 1, 0, "", entryLink);
                content = lines.join("\n");
                fs_1.default.writeFileSync(indexPath, content, "utf-8");
                console.log("[Index] Updated ".concat(indexPath));
            }
        }
    }
    catch (err) {
        console.error("[Index] Failed to update ".concat(dirPath, "/index.md:"), err);
    }
}
function saveCoolerSession(sessionId, sessionType, topic, participants, utterances, metadata) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, dbType, metadataJson, utterancesJson, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    dbType = (0, config_js_1.getConfig)().db.type;
                    metadataJson = JSON.stringify(metadata || {});
                    utterancesJson = JSON.stringify(utterances);
                    if (!(dbType === "postgres")) return [3 /*break*/, 3];
                    return [4 /*yield*/, pool.query("INSERT INTO cooler_sessions (session_id, session_type, topic, participants, utterances, metadata, updated_at)\n         VALUES ($1, $2, $3, $4, $5, $6, NOW())\n         ON CONFLICT (session_id) DO UPDATE SET\n           topic = $3, participants = $4, utterances = $5, metadata = $6, updated_at = NOW()", [sessionId, sessionType, topic, participants, utterancesJson, metadataJson])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, pool.query("INSERT INTO cooler_sessions (session_id, session_type, topic, participants, utterances, metadata, updated_at)\n         VALUES (?, ?, ?, ?, ?, ?, NOW())\n         ON DUPLICATE KEY UPDATE\n           topic = VALUES(topic), participants = VALUES(participants), utterances = VALUES(utterances), \n           metadata = VALUES(metadata), updated_at = NOW()", [sessionId, sessionType, topic, participants.join(","), utterancesJson, metadataJson])];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    console.log("[Cooler] Saved session ".concat(sessionId, " to database"));
                    return [3 /*break*/, 7];
                case 6:
                    err_4 = _a.sent();
                    console.error("[Cooler] Failed to save session:", err_4);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function getCoolerSessions() {
    return __awaiter(this, arguments, void 0, function (limit, sessionType) {
        var pool, dbType, query, params, result, rows, err_5;
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    dbType = (0, config_js_1.getConfig)().db.type;
                    query = "SELECT * FROM cooler_sessions";
                    params = [];
                    if (sessionType) {
                        query += " WHERE session_type = ?";
                        params.push(sessionType);
                    }
                    query += " ORDER BY created_at DESC LIMIT ?";
                    params.push(limit);
                    if (!(dbType === "postgres")) return [3 /*break*/, 3];
                    query = query.replace("?", function (i) { return "$".concat(i); });
                    return [4 /*yield*/, pool.query(query, params)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 3: return [4 /*yield*/, pool.query(query, params)];
                case 4:
                    rows = (_a.sent())[0];
                    return [2 /*return*/, rows];
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_5 = _a.sent();
                    console.error("[Cooler] Failed to get sessions:", err_5);
                    return [2 /*return*/, []];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Initialize flywheel system on startup
var initializeFlywheel = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            ensureCoolerSessionsTable();
        }
        catch (err) {
            ensureResidueDir();
            console.log("[Flywheel] System initialized");
            console.error("[Flywheel] Initialization error:", err);
        }
        return [2 /*return*/];
    });
}); };
// Initialize flywheel when server starts
initializeFlywheel();
// Health check
app.get("/api/workflow/health", function (_req, res) {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});
// ============================================================================
// Metrics Endpoint (Prometheus)
// ============================================================================
var prom_client_1 = require("prom-client");
// Create a Registry
var register = new prom_client_1.default.Registry();
// Add default metrics
prom_client_1.default.collectDefaultMetrics({ register: register });
// Custom metrics
var agentTokensUsed = new prom_client_1.default.Counter({
    name: "pixel_office_agent_tokens_total",
    help: "Tokens by agent and channel (inner vs outer narration).",
    labelNames: ["agent", "channel"],
    registers: [register]
});
var httpRequestsTotal = new prom_client_1.default.Counter({
    name: "pixel_office_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [register]
});
var httpRequestDuration = new prom_client_1.default.Histogram({
    name: "pixel_office_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2],
    registers: [register]
});
var llmRequestsTotal = new prom_client_1.default.Counter({
    name: "pixel_office_llm_requests_total",
    help: "Total number of LLM requests",
    labelNames: ["provider", "model"],
    registers: [register]
});
var stigmergyDepositTotal = new prom_client_1.default.Counter({
    name: "pixel_office_stigmergy_deposit_total",
    help: "Total number of stigmergy deposits",
    labelNames: ["type", "status"],
    registers: [register]
});
var coolerRunTurnTotal = new prom_client_1.default.Counter({
    name: "pixel_office_cooler_run_turn_total",
    help: "Total number of cooler run-turn requests",
    labelNames: ["location", "status"],
    registers: [register]
});
var loopDetectionGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_loop_detection",
    help: "Loop detection status per agent (0=healthy, 1=looping)",
    labelNames: ["agent_id", "agent_name"],
    registers: [register]
});
var agentRoutesUsed = new prom_client_1.default.Counter({
    name: "pixel_office_routes_total",
    help: "Routing hops between agents.",
    labelNames: ["from_agent", "to_agent"],
    registers: [register]
});
var agentToolCallsUsed = new prom_client_1.default.Counter({
    name: "pixel_office_agent_tool_calls_total",
    help: "Tool calls initiated by an agent.",
    labelNames: ["agent"],
    registers: [register]
});
function trackLlmRequest(provider, model) {
    llmRequestsTotal.inc({ provider: provider, model: model });
}
// Track LLM requests for chat endpoint
var pixelOfficeUp = new prom_client_1.default.Gauge({
    name: "pixel_office_up",
    help: "Pixel Office service up status",
    registers: [register]
});
// Middleware to track HTTP requests
app.use(function (req, res, next) {
    var start = Date.now();
    res.on("finish", function () {
        var _a;
        var duration = (Date.now() - start) / 1000;
        var route = ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path || "unknown";
        httpRequestsTotal.inc({ method: req.method, route: route, status_code: res.statusCode.toString() });
        httpRequestDuration.observe({ method: req.method, route: route }, duration);
    });
    next();
});
// Metrics endpoint
app.get("/metrics", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, ex_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                res.set("Content-Type", register.contentType);
                _b = (_a = res).end;
                return [4 /*yield*/, register.metrics()];
            case 1:
                _b.apply(_a, [_c.sent()]);
                return [3 /*break*/, 3];
            case 2:
                ex_1 = _c.sent();
                res.status(500).end(ex_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Set up gauge
pixelOfficeUp.set(1);
// Model availability metrics
var modelStatusGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_model_available",
    help: "Whether a model is available (1) or not (0)",
    labelNames: ["provider", "model", "endpoint"],
    registers: [register]
});
var modelCountGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_models_total",
    help: "Total number of available models",
    registers: [register]
});
// Agent availability metrics
var agentStatusGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_agent_available",
    help: "Whether an agent is available (1) or not (0)",
    labelNames: ["agent_id", "agent_name", "role"],
    registers: [register]
});
var agentCountGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_agents_total",
    help: "Total number of agents",
    labelNames: ["status"],
    registers: [register]
});
// Function to check Ollama models
function updateModelMetrics() {
    return __awaiter(this, void 0, void 0, function () {
        var ollamaUrl, response, data, models, existing, availableCount, _i, models_1, model, modelName, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
                    return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/tags"), { signal: AbortSignal.timeout(5000) })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    models = data.models || [];
                    return [4 /*yield*/, register.getSingleMetric('pixel_office_model_available')];
                case 3:
                    existing = _a.sent();
                    if (existing) {
                        register.removeSingleMetric(existing);
                    }
                    availableCount = 0;
                    for (_i = 0, models_1 = models; _i < models_1.length; _i++) {
                        model = models_1[_i];
                        modelName = model.name.replace(':latest', '').replace(':latest', '');
                        modelStatusGauge.set({ provider: "ollama", model: modelName, endpoint: "localhost:11434" }, 1);
                        availableCount++;
                    }
                    modelCountGauge.set(availableCount);
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_6 = _a.sent();
                    console.error("[Metrics] Failed to get Ollama models:", err_6);
                    modelCountGauge.set(0);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Function to check agent status from agent-cards.json
function updateAgentMetrics() {
    return __awaiter(this, void 0, void 0, function () {
        var agentCardsPath, agentData, agents, activeCount, _i, agents_1, agent, status_1;
        return __generator(this, function (_a) {
            try {
                agentCardsPath = path_1.default.resolve("config/agent-cards.json");
                agentData = JSON.parse(fs_1.default.readFileSync(agentCardsPath, "utf-8"));
                agents = agentData.agents || [];
                activeCount = 0;
                for (_i = 0, agents_1 = agents; _i < agents_1.length; _i++) {
                    agent = agents_1[_i];
                    status_1 = agent.status === "active" ? 1 : 0;
                    agentStatusGauge.set({
                        agent_id: agent.id,
                        agent_name: agent.name,
                        role: agent.role
                    }, status_1);
                    if (status_1 === 1)
                        activeCount++;
                }
                agentCountGauge.set({ status: "active" }, activeCount);
                agentCountGauge.set({ status: "total" }, agents.length);
            }
            catch (err) {
                console.error("[Metrics] Failed to get agent status:", err);
            }
            return [2 /*return*/];
        });
    });
}
// Update model and agent metrics periodically
setInterval(updateModelMetrics, 30000);
setInterval(updateAgentMetrics, 30000);
// Initial update
updateModelMetrics().then(updateAgentMetrics);
// Stigmergy Metrics (per thought_speech_stigmergy.md)
var deskStigmergyGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_desk_stigmergy",
    help: "Desk stigmergy heat values",
    labelNames: ["desk_id", "heat_type"],
    registers: [register]
});
var stigmergyTraceGauge = new prom_client_1.default.Gauge({
    name: "pixel_office_stigmergy_traces",
    help: "Active stigmergy trace count by type",
    labelNames: ["trace_type"],
    registers: [register]
});
// Note: loopDetectionGauge removed - can add when loop state tracking is needed
setInterval(function () {
    // Update desk stigmergy metrics
    Object.keys(deskStigmergyState).forEach(function (deskId) {
        var state = deskStigmergyState[deskId];
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "loopHeat" }, Math.min(1, Math.max(0, state.loopHeat)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "reviewHeat" }, Math.min(1, Math.max(0, state.reviewHeat)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "speechActivity" }, Math.min(1, Math.max(0, state.speechActivity)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "taskShadow" }, Math.min(1, Math.max(0, state.taskShadow)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "observerAttention" }, Math.min(1, Math.max(0, state.observerAttention)));
        // Also update loop detection gauge (1 = looping, 0 = healthy)
        var agentId = deskId.replace("desk-", "agent-");
        var isLooping = state.loopHeat > 0.5 ? 1 : 0;
        loopDetectionGauge.set({ agent_id: agentId, agent_name: deskId }, isLooping);
    });
    // Update stigmergy trace counts
    var traces = (0, stigmergy_js_1.getActiveTraces)();
    var typeCounts = {};
    traces.forEach(function (t) {
        typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(function (_a) {
        var type = _a[0], count = _a[1];
        stigmergyTraceGauge.set({ trace_type: type }, count);
    });
}, 15000);
var stigmergy_js_1 = require("./cooler/stigmergy.js");
function selectWeightedParticipants(participants, count) {
    if (participants.length <= count)
        return participants;
    var weights = (0, stigmergy_js_1.getAgentWeightsWithShadows)(participants);
    var weighted = participants.map(function (p) { return ({ name: p, weight: weights.get(p.toLowerCase().replace(/ /g, "-")) || 1 }); });
    weighted.sort(function (a, b) { return b.weight - a.weight; });
    return weighted.slice(0, count).map(function (w) { return w.name; });
}
var reviewHeat_js_1 = require("./cooler/reviewHeat.js");
var scrumController_js_1 = require("./scrum/scrumController.js");
var coolerTalkService_js_1 = require("./services/coolerTalkService.js");
var llmGenerateFn_js_1 = require("./services/llmGenerateFn.js");
var currentScrumSession = null;
var PIXEL_ME_URL = "http://127.0.0.1:5001";
var KB_SERVER_URL = "http://127.0.0.1:8787";
app.use(function (req, res, next) {
    var agent = req.header("X-Office-Agent");
    var client = req.header("X-Office-Client");
    if (agent || client) {
        console.log("[Office] Request from Agent: ".concat(agent, ", Client: ").concat(client));
    }
    next();
});
// Cooler Talk API Routes
app.post("/api/rooms/:location/cooler/run-turn", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var location, _a, topic, participants, userMessage, COOLER_PARTICIPANTS, result, utterances, exportData, utterances, md, dateStr, sessionId, filename, coolerDocPath, opencodeDocPath, mdContent, timestamp, frontmatter, opencodePath, coolerPath, error_1;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                location = req.params.location;
                _d.label = 1;
            case 1:
                _d.trys.push([1, 3, , 4]);
                _a = req.body, topic = _a.topic, participants = _a.participants, userMessage = _a.userMessage;
                if (!location) {
                    coolerRunTurnTotal.inc({ location: "unknown", status: "400" });
                    return [2 /*return*/, res.status(400).json({ error: "Location is required" })];
                }
                // Use stigmergy-weighted selection if no participants provided
                if (!participants || participants.length === 0) {
                    COOLER_PARTICIPANTS = ["FrontDesk", "OpenClaw", "IronClaw", "LeslieClaw", "ZeroClaw", "Sherlobster", "HermitClaw"];
                    participants = selectWeightedParticipants(COOLER_PARTICIPANTS, 4);
                }
                return [4 /*yield*/, (0, coolerTalkService_js_1.runRoomTurn)(location, {
                        topic: topic || "General discussion",
                        participants: participants,
                        userMessage: userMessage || "",
                        generateFn: llmGenerateFn_js_1.generateFn
                    })];
            case 2:
                result = _d.sent();
                // Save session to database
                if (result.session) {
                    utterances = ((_b = result.session.utterances) === null || _b === void 0 ? void 0 : _b.map(function (u) {
                        var _a, _b, _c;
                        return ({
                            agentId: ((_a = u.utterance) === null || _a === void 0 ? void 0 : _a.speaker) || "",
                            text: ((_b = u.utterance) === null || _b === void 0 ? void 0 : _b.text) || "",
                            timestamp: ((_c = u.utterance) === null || _c === void 0 ? void 0 : _c.created_at) || Date.now()
                        });
                    })) || [];
                    saveCoolerSession(result.session.id, "cooler", result.session.topic || topic, result.session.participants || participants, utterances, { location: location, turnCount: ((_c = result.session.utterances) === null || _c === void 0 ? void 0 : _c.length) || 0 });
                }
                coolerRunTurnTotal.inc({ location: location, status: "200" });
                res.json({
                    turnResult: result.turnResult,
                    sessionId: result.session.id,
                    location: result.session.location,
                    utteranceCount: result.session.utterances.length,
                    participantCount: result.participantCount,
                    assignments: result.assignments,
                    dialogues: result.dialogues
                });
                // Save markdown file for the session
                try {
                    exportData = (0, coolerTalkService_js_1.exportRoomSession)(location);
                    console.log("[CoolerTalk] exportRoomSession(".concat(location, ") returned:"), exportData ? "data" : "null");
                    console.log("[CoolerTalk] result.session.id:", result.session.id);
                    // If exportData is null but we have a session, try to get markdown from result
                    if (!exportData || !exportData.markdown) {
                        utterances = result.session.utterances || [];
                        md = utterances.map(function (u) { var _a, _b; return "- **".concat(((_a = u.utterance) === null || _a === void 0 ? void 0 : _a.speaker) || 'Unknown', "**: ").concat(((_b = u.utterance) === null || _b === void 0 ? void 0 : _b.text) || ''); }).join('\n');
                        exportData = {
                            markdown: "## Conversation\n\n".concat(md, "\n\n**Participants:** ").concat((result.session.participants || []).join(', '), "\n**Topic:** ").concat(result.session.topic || topic || 'General discussion'),
                            json: result.session
                        };
                        console.log("[CoolerTalk] Built markdown from result");
                    }
                    if (exportData && exportData.markdown) {
                        dateStr = new Date().toISOString().split('T')[0];
                        sessionId = result.session.id;
                        filename = "".concat(dateStr, "_cooler-").concat(sessionId, ".md");
                        coolerDocPath = path_1.default.resolve("process.cwd()/docs/cooler");
                        opencodeDocPath = path_1.default.resolve("path.resolve(process.cwd(), "..", ".openclaw")/workspace-main/docs/opencode");
                        // Ensure directories exist
                        [opencodeDocPath, coolerDocPath].forEach(function (dir) {
                            if (!fs_1.default.existsSync(dir))
                                fs_1.default.mkdirSync(dir, { recursive: true });
                        });
                        mdContent = exportData.markdown;
                        timestamp = new Date().toISOString();
                        frontmatter = "---\ntitle: \"Cooler Talk - ".concat(result.session.topic || location, "\"\ndate: \"").concat(timestamp, "\"\nparticipants: \"").concat((result.session.participants || []).join(', '), "\"\nlocation: \"").concat(location, "\"\nsession_id: \"").concat(sessionId, "\"\n---\n\n").concat(mdContent, "\n\n---\n*Generated from Pixel Office Cooler Talk - ").concat(timestamp, "*\n");
                        opencodePath = path_1.default.join(opencodeDocPath, filename);
                        fs_1.default.writeFileSync(opencodePath, frontmatter, "utf-8");
                        console.log("[CoolerTalk] Saved markdown to ".concat(opencodePath));
                        coolerPath = path_1.default.join(coolerDocPath, filename);
                        fs_1.default.writeFileSync(coolerPath, frontmatter, "utf-8");
                        console.log("[CoolerTalk] Saved markdown to ".concat(coolerPath));
                        // Update index.md files
                        updateIndexFile(opencodeDocPath, filename, result.session.topic || "Cooler Talk - ".concat(location));
                        updateIndexFile(coolerDocPath, filename, result.session.topic || "Cooler Talk - ".concat(location));
                    }
                }
                catch (mdErr) {
                    console.error("[CoolerTalk] Failed to save markdown:", mdErr);
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.error("Error in cooler talk run-turn:", error_1);
                coolerRunTurnTotal.inc({ location: location || "unknown", status: "500" });
                res.status(500).json({ error: "Failed to run cooler turn" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/rooms/:location/cooler/export", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var location_1, exportData;
    return __generator(this, function (_a) {
        try {
            location_1 = req.params.location;
            if (!location_1) {
                return [2 /*return*/, res.status(400).json({ error: "Location is required" })];
            }
            exportData = (0, coolerTalkService_js_1.exportRoomSession)(location_1);
            if (!exportData) {
                return [2 /*return*/, res.status(404).json({ error: "No session found for location" })];
            }
            res.json({
                markdown: exportData.markdown,
                json: exportData.json
            });
        }
        catch (error) {
            console.error("Error exporting cooler talk session:", error);
            res.status(500).json({ error: "Failed to export session" });
        }
        return [2 /*return*/];
    });
}); });
// List available cooler sessions for Test SCRUM
app.get("/api/cooler/sessions/list", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionsDir_1, files, sessions_1;
    return __generator(this, function (_a) {
        try {
            sessionsDir_1 = path_1.default.resolve("data/cooler_sessions");
            if (!fs_1.default.existsSync(sessionsDir_1)) {
                res.json({ sessions: [] });
                return [2 /*return*/];
            }
            files = fs_1.default.readdirSync(sessionsDir_1).filter(function (f) { return f.endsWith(".json"); });
            sessions_1 = files.map(function (file) {
                var _a, _b;
                var filePath = path_1.default.join(sessionsDir_1, file);
                try {
                    var content = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
                    return {
                        id: content.id || file.replace(".json", ""),
                        topic: content.topic || "Unknown",
                        participantCount: ((_a = content.participants) === null || _a === void 0 ? void 0 : _a.length) || 0,
                        utteranceCount: ((_b = content.utterances) === null || _b === void 0 ? void 0 : _b.length) || 0,
                        createdAt: content.createdAt || content.created_at || null,
                    };
                }
                catch (_c) {
                    return { id: file.replace(".json", ""), topic: "Error reading", participantCount: 0, utteranceCount: 0 };
                }
            });
            // Sort by most recent
            sessions_1.sort(function (a, b) {
                var dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                var dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            res.json({ sessions: sessions_1.slice(0, 20) });
        }
        catch (error) {
            console.error("Error listing cooler sessions:", error);
            res.status(500).json({ error: "Failed to list sessions" });
        }
        return [2 /*return*/];
    });
}); });
// Get sessions from database (cooler or scrum)
app.get("/api/cooler/sessions/db", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionType, sessions_2, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionType = req.query.type;
                return [4 /*yield*/, getCoolerSessions(20, sessionType)];
            case 1:
                sessions_2 = _a.sent();
                res.json({ sessions: sessions_2 });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching DB sessions:", error_2);
                res.status(500).json({ error: "Failed to fetch sessions from database" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get single session details from database
app.get("/api/cooler/sessions/db/:sessionId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId_1, sessions_3, session, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId_1 = req.params.sessionId;
                return [4 /*yield*/, getCoolerSessions(100)];
            case 1:
                sessions_3 = _a.sent();
                session = sessions_3.find(function (s) { return s.session_id === sessionId_1; });
                if (!session) {
                    res.status(404).json({ error: "Session not found" });
                    return [2 /*return*/];
                }
                res.json({ session: session });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("Error fetching session:", error_3);
                res.status(500).json({ error: "Failed to fetch session" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Test SCRUM: Create mock SCRUM from a cooler session
app.post("/api/scrum/test", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var coolerSessionId, topic, participants, sessionData, sessionPath, SCRUM_PARTICIPANTS, _a, session, stageResult, scrumDocPath, dateStr, sessionId, filename, timestamp, frontmatter, scrumPath, opencodeDocPath, opencodePath, testOutput, roleToAgentId_1, scrumAssignments, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                coolerSessionId = req.body.coolerSessionId;
                topic = "Test SCRUM from cooler session";
                participants = [];
                sessionData = null;
                if (coolerSessionId) {
                    sessionPath = path_1.default.resolve("data/cooler_sessions/".concat(coolerSessionId, ".json"));
                    if (fs_1.default.existsSync(sessionPath)) {
                        sessionData = JSON.parse(fs_1.default.readFileSync(sessionPath, "utf-8"));
                        topic = "Test SCRUM: ".concat(sessionData.topic || "Cooler session");
                        participants = sessionData.participants || [];
                        console.log("[Test SCRUM] Loaded cooler session: ".concat(coolerSessionId, ", participants: ").concat(participants.join(", ")));
                    }
                }
                // Use stigmergy-weighted participants if we have them, otherwise default
                if (participants.length === 0) {
                    SCRUM_PARTICIPANTS = ["clerk", "specialist", "executive", "archivist"];
                    participants = selectWeightedParticipants(SCRUM_PARTICIPANTS, 4);
                }
                // Create the SCRUM session
                currentScrumSession = (0, scrumController_js_1.createScrumSession)(topic, participants);
                return [4 /*yield*/, (0, scrumController_js_1.advanceScrumSession)(currentScrumSession)];
            case 1:
                _a = _b.sent(), session = _a.session, stageResult = _a.stageResult;
                currentScrumSession = session;
                scrumDocPath = path_1.default.resolve("process.cwd()/docs/scrum");
                if (!fs_1.default.existsSync(scrumDocPath))
                    fs_1.default.mkdirSync(scrumDocPath, { recursive: true });
                dateStr = new Date().toISOString().split('T')[0];
                sessionId = (session === null || session === void 0 ? void 0 : session.id) || "scrum-".concat(Date.now());
                filename = "".concat(dateStr, "_scrum-").concat(sessionId, ".md");
                timestamp = new Date().toISOString();
                frontmatter = "---\ntitle: \"Test SCRUM: ".concat(topic, "\"\ndate: \"").concat(timestamp, "\"\nparticipants: \"").concat(participants.join(', '), "\"\nsource_session: \"").concat(coolerSessionId || 'random', "\"\n---\n\n## ").concat(timestamp, "\n\n**Participants:** ").concat(participants.join(", "), "\n\n**Source Session:** ").concat(coolerSessionId || "random", "\n\n**Stage:** ").concat((stageResult === null || stageResult === void 0 ? void 0 : stageResult.stage) || "N/A", "\n**Summary:** ").concat((stageResult === null || stageResult === void 0 ? void 0 : stageResult.summary) || "N/A", "\n\n---\n*Generated from Pixel Office Test SCRUM*\n");
                scrumPath = path_1.default.join(scrumDocPath, filename);
                try {
                    fs_1.default.writeFileSync(scrumPath, frontmatter, "utf-8");
                    console.log("[Test SCRUM] Saved markdown to ".concat(scrumPath));
                }
                catch (err) {
                    console.error("[Test SCRUM] Failed to save to ".concat(scrumPath, ":"), err.message);
                }
                opencodeDocPath = path_1.default.resolve("path.resolve(process.cwd(), "..", ".openclaw")/workspace-main/docs/opencode");
                if (!fs_1.default.existsSync(opencodeDocPath)) {
                    try {
                        fs_1.default.mkdirSync(opencodeDocPath, { recursive: true });
                    }
                    catch (err) {
                        console.error("[Test SCRUM] Failed to create opencode dir:", err.message);
                    }
                }
                opencodePath = path_1.default.join(opencodeDocPath, filename);
                try {
                    fs_1.default.writeFileSync(opencodePath, frontmatter, "utf-8");
                    console.log("[Test SCRUM] Saved markdown to ".concat(opencodePath));
                }
                catch (err) {
                    console.error("[Test SCRUM] Failed to save to ".concat(opencodePath, ":"), err.message);
                }
                testOutput = {
                    sourceSession: coolerSessionId || "random",
                    sourceTopic: (sessionData === null || sessionData === void 0 ? void 0 : sessionData.topic) || "N/A",
                    sourceParticipants: (sessionData === null || sessionData === void 0 ? void 0 : sessionData.participants) || [],
                    stigmergyWeighted: participants,
                    message: "Test SCRUM created from cooler session with shadow-biased participant selection"
                };
                console.log("[Test SCRUM] Created: ".concat(testOutput.sourceTopic, ", participants: ").concat(participants.join(", ")));
                roleToAgentId_1 = {
                    "receptionist": "frontdesk",
                    "clerk": "openclaw",
                    "custodian": "ironclaw",
                    "specialist": "zeroclaw",
                    "archivist": "hermitclaw",
                    "executive": "leslieclaw",
                };
                scrumAssignments = participants.slice(0, 8).map(function (name, idx) {
                    // Try to find matching agent by role name or use the name directly
                    var agentId = roleToAgentId_1[name.toLowerCase()] || name.toLowerCase().replace(/ /g, "-");
                    return {
                        agentId: agentId,
                        name: name,
                        targetX: CONFERENCE_ROOM_POSITIONS[idx].x,
                        targetY: CONFERENCE_ROOM_POSITIONS[idx].y,
                    };
                });
                res.json({
                    session: session,
                    stageResult: stageResult,
                    testOutput: testOutput,
                    assignments: scrumAssignments,
                    message: "Test SCRUM started from cooler session: ".concat(topic)
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error("Error creating test SCRUM:", error_4);
                res.status(500).json({ error: "Failed to create test SCRUM" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Stigmergy API Routes
app.get("/api/stigmergy/traces", function (req, res) {
    res.json({ traces: (0, stigmergy_js_1.getActiveTraces)() });
});
app.get("/api/stigmergy/social-potential", function (req, res) {
    var social = (0, stigmergy_js_1.calculateSocialPotential)();
    res.json(social);
});
app.post("/api/stigmergy/deposit", function (req, res) {
    try {
        var _a = req.body, type = _a.type, agentId = _a.agentId, intensity = _a.intensity, topic = _a.topic, roomId = _a.roomId, x = _a.x, y = _a.y, metadata = _a.metadata;
        if (!type) {
            stigmergyDepositTotal.inc({ type: "unknown", status: "400" });
            res.status(400).json({ error: "Missing required field: type" });
            return;
        }
        var result = (0, stigmergy_js_1.depositTrace)({ type: type, agentId: agentId, intensity: intensity, topic: topic, roomId: roomId, x: x, y: y, metadata: metadata });
        if (!result.success) {
            stigmergyDepositTotal.inc({ type: type, status: "400" });
            res.status(400).json({ error: result.reason || "Failed to deposit trace" });
            return;
        }
        if (result.skipped) {
            stigmergyDepositTotal.inc({ type: type, status: "200" });
            res.json({ success: true, skipped: true, reason: result.reason, trace: result.trace });
            return;
        }
        stigmergyDepositTotal.inc({ type: type, status: "200" });
        res.json({ success: true, trace: result.trace });
    }
    catch (err) {
        console.error("[Stigmergy] Deposit error:", err);
        stigmergyDepositTotal.inc({ type: "unknown", status: "500" });
        res.status(500).json({ error: err.message || "Failed to deposit trace" });
    }
});
// NVIDIA Integration Test Endpoint
app.get("/api/test/nvidia", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var apiKey, modelId, nvidiaChat, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                apiKey = process.env.NVIDIA_API_KEY;
                modelId = process.env.NVIDIA_MODEL_ID || "moonshotai/kimi-k2-instruct-0905";
                if (!apiKey) {
                    res.json({
                        available: false,
                        reason: "NVIDIA_API_KEY not configured",
                        modelId: modelId
                    });
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require("./llm/nvidiaClient.js"); })];
            case 2:
                nvidiaChat = (_a.sent()).nvidiaChat;
                return [4 /*yield*/, nvidiaChat([
                        { role: "user", content: "Reply with exactly: 'NVIDIA OK'" }
                    ], { maxTokens: 50 })];
            case 3:
                result = _a.sent();
                res.json({
                    available: true,
                    working: true,
                    modelId: modelId,
                    response: result.content.substring(0, 100),
                    provider: "nvidia"
                });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                res.json({
                    available: true,
                    working: false,
                    modelId: modelId,
                    error: error_5.message.substring(0, 200)
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Model Health Dashboard Endpoint
app.get("/api/models/health", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var models, now, ollamaRes, data, _i, _a, model, e_1, apiKey, nvidiaRes, nvidiaData, _b, _c, model, e_2, nvidiaModels, _d, nvidiaModels_1, model;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                res.setHeader("Content-Type", "application/json");
                res.setTimeout(30000);
                models = [];
                now = new Date().toISOString();
                _e.label = 1;
            case 1:
                _e.trys.push([1, 5, , 6]);
                return [4 /*yield*/, fetch("http://localhost:11434/api/tags", { method: "GET" })];
            case 2:
                ollamaRes = _e.sent();
                if (!ollamaRes.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, ollamaRes.json()];
            case 3:
                data = _e.sent();
                for (_i = 0, _a = data.models || []; _i < _a.length; _i++) {
                    model = _a[_i];
                    models.push({
                        name: model.name.replace(":latest", "").split(":")[0],
                        id: model.name,
                        provider: "ollama",
                        status: "online",
                        latency: 0,
                        lastCheck: now,
                    });
                }
                _e.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                e_1 = _e.sent();
                console.warn("[ModelHealth] Ollama not available:", e_1);
                return [3 /*break*/, 6];
            case 6:
                apiKey = process.env.NVIDIA_API_KEY;
                if (!apiKey) return [3 /*break*/, 12];
                _e.label = 7;
            case 7:
                _e.trys.push([7, 11, , 12]);
                return [4 /*yield*/, fetch("https://integrate.api.nvidia.com/v1/models?limit=50", {
                        headers: { "Authorization": "Bearer ".concat(apiKey) },
                        method: "GET"
                    })];
            case 8:
                nvidiaRes = _e.sent();
                if (!nvidiaRes.ok) return [3 /*break*/, 10];
                return [4 /*yield*/, nvidiaRes.json()];
            case 9:
                nvidiaData = _e.sent();
                for (_b = 0, _c = nvidiaData.data || []; _b < _c.length; _b++) {
                    model = _c[_b];
                    models.push({
                        name: model.id.split("/")[1] || model.id,
                        id: model.id,
                        provider: "nvidia",
                        status: "online",
                        latency: 0,
                        lastCheck: now,
                    });
                }
                _e.label = 10;
            case 10: return [3 /*break*/, 12];
            case 11:
                e_2 = _e.sent();
                console.warn("[ModelHealth] NGC fetch failed:", e_2);
                return [3 /*break*/, 12];
            case 12:
                nvidiaModels = [
                    { name: "Kimi K2", id: "moonshotai/kimi-k2-instruct-0905" },
                    { name: "DeepSeek V3.1", id: "deepseek-ai/deepseek-v3.1-terminus" },
                    { name: "DeepSeek V3.2", id: "deepseek-ai/deepseek-v3.2" },
                    { name: "Mistral Large 3", id: "mistralai/mistral-large-3-675b-instruct-2512" },
                    { name: "Gemma 7B", id: "google/gemma-7b" },
                    { name: "Phi-3 Mini", id: "microsoft/phi-3-mini-128k-instruct" },
                    { name: "Solar 10.7B", id: "upstage/solar-10.7b-instruct" },
                ];
                // Add fallback nvidia models if no API key configured
                if (!apiKey && models.filter(function (m) { return m.provider === "nvidia"; }).length === 0) {
                    for (_d = 0, nvidiaModels_1 = nvidiaModels; _d < nvidiaModels_1.length; _d++) {
                        model = nvidiaModels_1[_d];
                        models.push({
                            name: model.name,
                            id: model.id,
                            provider: "nvidia",
                            status: "offline",
                            lastCheck: now,
                            error: "NVIDIA_API_KEY not configured",
                        });
                    }
                }
                res.json({
                    timestamp: now,
                    summary: {
                        total: models.length,
                        online: models.filter(function (m) { return m.status === "online"; }).length,
                        lagging: models.filter(function (m) { return m.status === "lagging"; }).length,
                        offline: models.filter(function (m) { return m.status === "offline"; }).length,
                    },
                    models: models,
                });
                return [2 /*return*/];
        }
    });
}); });
app.get("/api/stigmergy/review-heat", function (req, res) {
    try {
        var activeHeat = (0, reviewHeat_js_1.getActiveHeat)();
        res.json({ activeHeat: activeHeat });
    }
    catch (error) {
        console.error("Error fetching review heat:", error);
        res.status(500).json({ error: "Failed to fetch review heat" });
    }
});
// Desk Stigmergy API (per thought_speech_stigmergy.md Part B)
var deskStigmergyState = {};
function decayDeskStigmergy(deskId) {
    var state = deskStigmergyState[deskId];
    if (!state)
        return;
    var decayRate = 0.02;
    state.loopHeat = Math.max(0, state.loopHeat - decayRate);
    state.reviewHeat = Math.max(0, state.reviewHeat - decayRate);
    state.speechActivity = Math.max(0, state.speechActivity - decayRate);
    state.taskShadow = Math.max(0, state.taskShadow - decayRate);
    state.observerAttention = Math.max(0, state.observerAttention - decayRate);
    state.confusionResidue = Math.max(0, state.confusionResidue - decayRate);
    state.updatedAt = new Date().toISOString();
}
app.get("/api/stigmergy/desk/:deskId", function (req, res) {
    var deskId = req.params.deskId;
    decayDeskStigmergy(deskId);
    var state = deskStigmergyState[deskId] || {
        loopHeat: 0,
        reviewHeat: 0,
        speechActivity: 0,
        taskShadow: 0,
        observerAttention: 0,
        confusionResidue: 0,
        updatedAt: new Date().toISOString()
    };
    res.json(__assign({ deskId: deskId }, state));
});
app.post("/api/stigmergy/desk/:deskId/update", function (req, res) {
    var deskId = req.params.deskId;
    console.log("[Stigmergy] POST update for deskId=".concat(deskId, ", body=").concat(JSON.stringify(req.body)));
    var _a = req.body, loopHeat = _a.loopHeat, reviewHeat = _a.reviewHeat, speechActivity = _a.speechActivity, taskShadow = _a.taskShadow, observerAttention = _a.observerAttention, confusionResidue = _a.confusionResidue;
    if (!deskStigmergyState[deskId]) {
        deskStigmergyState[deskId] = {
            loopHeat: 0, reviewHeat: 0, speechActivity: 0, taskShadow: 0,
            observerAttention: 0, confusionResidue: 0, updatedAt: new Date().toISOString()
        };
    }
    var state = deskStigmergyState[deskId];
    if (typeof loopHeat === 'number')
        state.loopHeat = Math.min(1, Math.max(0, Math.floor(loopHeat * 100) / 100));
    if (typeof reviewHeat === 'number')
        state.reviewHeat = Math.min(1, Math.max(0, Math.floor(reviewHeat * 100) / 100));
    if (typeof speechActivity === 'number')
        state.speechActivity = Math.min(1, Math.max(0, Math.floor(speechActivity * 100) / 100));
    if (typeof taskShadow === 'number')
        state.taskShadow = Math.min(1, Math.max(0, Math.floor(taskShadow * 100) / 100));
    if (typeof observerAttention === 'number')
        state.observerAttention = Math.min(1, Math.max(0, Math.floor(observerAttention * 100) / 100));
    if (typeof confusionResidue === 'number')
        state.confusionResidue = Math.min(1, Math.max(0, Math.floor(confusionResidue * 100) / 100));
    state.updatedAt = new Date().toISOString();
    res.json(__assign({ success: true, deskId: deskId }, state));
});
app.get("/api/stigmergy/desk/all", function (req, res) {
    Object.keys(deskStigmergyState).forEach(decayDeskStigmergy);
    res.json({ desks: deskStigmergyState });
});
app.post("/api/stigmergy/desk/reset", function (req, res) {
    Object.keys(deskStigmergyState).forEach(function (key) {
        deskStigmergyState[key] = {
            loopHeat: 0,
            reviewHeat: 0,
            speechActivity: 0,
            taskShadow: 0,
            observerAttention: 0,
            confusionResidue: 0,
            updatedAt: new Date().toISOString()
        };
    });
    res.json({ success: true, message: "All desk stigmergy reset" });
});
// Loop Detection API (per thought_speech_stigmergy.md Part C)
app.post("/api/agent/detect-loop", function (req, res) {
    try {
        var _a = req.body, text = _a.text, burstTokenCount = _a.burstTokenCount, maxBurstTokens = _a.maxBurstTokens;
        if (!text) {
            res.status(400).json({ error: "Text is required" });
            return;
        }
        // Simple token estimate (~4 chars per token)
        var estimatedTokens = burstTokenCount || Math.ceil(text.length / 4);
        var maxTokens = maxBurstTokens || 96;
        // Detect loop/stall
        var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 10; });
        var sentenceFreq_1 = {};
        sentences.forEach(function (s) {
            var norm = s.trim().toLowerCase().slice(0, 30);
            sentenceFreq_1[norm] = (sentenceFreq_1[norm] || 0) + 1;
        });
        var maxRepeat = Math.max.apply(Math, __spreadArray(__spreadArray([], Object.values(sentenceFreq_1), false), [0], false));
        var words = text.toLowerCase().split(/\s+/);
        var trigramFreq = {};
        for (var i = 0; i < words.length - 2; i++) {
            var trigram = words.slice(i, i + 3).join(" ");
            trigramFreq[trigram] = (trigramFreq[trigram] || 0) + 1;
        }
        var maxTrigramRepeat = Math.max.apply(Math, __spreadArray(__spreadArray([], Object.values(trigramFreq), false), [0], false));
        var mid = Math.floor(text.length / 2);
        var firstSet = new Set(text.slice(0, mid).toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; }));
        var secondSet_1 = new Set(text.slice(mid).toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; }));
        var union = new Set(__spreadArray(__spreadArray([], firstSet, true), secondSet_1, true));
        var intersection = new Set(__spreadArray([], firstSet, true).filter(function (x) { return secondSet_1.has(x); }));
        var noveltyScore = union.size > 0 ? intersection.size / union.size : 1;
        var loopScore = 0;
        if (maxRepeat >= 3)
            loopScore += 0.3;
        if (maxTrigramRepeat >= 2)
            loopScore += 0.25;
        if (noveltyScore < 0.3)
            loopScore += 0.2;
        if (estimatedTokens > maxTokens * 0.8)
            loopScore += 0.15;
        loopScore = Math.min(loopScore, 1);
        var state = "healthy";
        var recommendedAction = "continue";
        if (loopScore >= 0.7 || estimatedTokens >= maxTokens) {
            state = "looping";
            recommendedAction = "interrupt";
        }
        else if (loopScore >= 0.4 || noveltyScore < 0.5) {
            state = "stalled";
            recommendedAction = "summarize";
        }
        res.json({
            state: state,
            loopScore: Math.round(loopScore * 100) / 100,
            noveltyScore: Math.round(noveltyScore * 100) / 100,
            estimatedTokens: estimatedTokens,
            maxTokens: maxTokens,
            reason: "loopScore=".concat(loopScore.toFixed(2), ", novelty=").concat(noveltyScore.toFixed(2), ", tokens=").concat(estimatedTokens),
            recommendedAction: recommendedAction
        });
    }
    catch (error) {
        console.error("Loop detection error:", error);
        res.status(500).json({ error: error.message });
    }
});
var recentSpeechEvents = [];
app.post("/api/agent/speech", function (req, res) {
    try {
        var _a = req.body, speaker = _a.speaker, location_2 = _a.location, speechText = _a.speechText, topicTags = _a.topicTags, socialWeight = _a.socialWeight;
        if (!speaker || !speechText) {
            res.status(400).json({ error: "speaker and speechText required" });
            return;
        }
        var event_1 = {
            speaker: speaker,
            location: location_2 || "office",
            speechText: speechText,
            topicTags: topicTags || [],
            socialWeight: socialWeight || 0.5,
            timestamp: Date.now()
        };
        recentSpeechEvents.push(event_1);
        // Keep last 100 events
        if (recentSpeechEvents.length > 100) {
            recentSpeechEvents.shift();
        }
        // Update desk speech activity
        var deskId = "desk-".concat(Math.floor(Math.random() * 9));
        var existingDesk = deskStigmergyState[deskId] || { loopHeat: 0, reviewHeat: 0, speechActivity: 0, taskShadow: 0, observerAttention: 0, confusionResidue: 0, updatedAt: new Date().toISOString() };
        existingDesk.speechActivity = Math.min(1, existingDesk.speechActivity + 0.3);
        existingDesk.updatedAt = new Date().toISOString();
        deskStigmergyState[deskId] = existingDesk;
        // Check for nearby agent responses
        var nearbyResponses = ["acknowledged", "answering", "redirecting", "ignoring"];
        var response = Math.random() > 0.5 ? nearbyResponses[Math.floor(Math.random() * nearbyResponses.length)] : "ignored";
        res.json({
            ok: true,
            event: event_1,
            nearbyResponse: response
        });
    }
    catch (error) {
        console.error("Speech event error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/agent/speech/recent", function (req, res) {
    var limit = parseInt(req.query.limit) || 20;
    var recent = recentSpeechEvents.slice(-limit);
    res.json({ events: recent });
});
var observerHistory = [];
app.post("/api/agent/observer/intervene", function (req, res) {
    try {
        var _a = req.body, targetAgent = _a.targetAgent, state = _a.state, lastValidPoint = _a.lastValidPoint, action = _a.action;
        if (!targetAgent) {
            res.status(400).json({ error: "targetAgent required" });
            return;
        }
        // Generate intervention based on state
        var nextPrompt = "";
        var actualAction = action || "continue";
        if (state === "looping") {
            nextPrompt = "Let's pause and summarize what we've achieved so far.";
            actualAction = "interrupt";
        }
        else if (state === "stalled") {
            nextPrompt = "Let's reanchor to the original task and try a different approach.";
            actualAction = "reanchor";
        }
        else {
            nextPrompt = "Good progress, continue with the current approach.";
            actualAction = "continue";
        }
        var intervention = {
            id: "obs-".concat(Date.now()),
            targetAgent: targetAgent,
            state: state || "healthy",
            lastValidPoint: lastValidPoint || "Current task progress",
            action: actualAction,
            nextPrompt: nextPrompt,
            timestamp: Date.now()
        };
        observerHistory.push(intervention);
        if (observerHistory.length > 50) {
            observerHistory.shift();
        }
        // Update desk observer attention
        var deskId = "desk-".concat(Math.floor(Math.random() * 9));
        var existingDesk = deskStigmergyState[deskId] || { loopHeat: 0, reviewHeat: 0, speechActivity: 0, taskShadow: 0, observerAttention: 0, confusionResidue: 0, updatedAt: new Date().toISOString() };
        existingDesk.observerAttention = Math.min(1, existingDesk.observerAttention + 0.4);
        existingDesk.updatedAt = new Date().toISOString();
        deskStigmergyState[deskId] = existingDesk;
        res.json({ ok: true, intervention: intervention });
    }
    catch (error) {
        console.error("Observer intervention error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/agent/observer/history", function (req, res) {
    var limit = parseInt(req.query.limit) || 20;
    var recent = observerHistory.slice(-limit);
    res.json({ interventions: recent });
});
// Delegation Detection API (per grok_suggestions.md)
// Detects delegation commands in cooler chat and triggers SCRUM creation
var DELEGATION_PATTERNS = [
    /handle (the )?(\w+)/i,
    /delegate (the )?(\w+)/i,
    /take care of/i,
    /someone should/i,
    /we need to/i,
    /let's focus on/i,
    /work on (the )?(\w+)/i,
];
app.post("/api/detect-delegation", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message_1, isDelegation, keywords_1, topic, _a, session, stageResult, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                message_1 = req.body.message;
                if (!message_1) {
                    res.status(400).json({ error: "Message is required" });
                    return [2 /*return*/];
                }
                isDelegation = DELEGATION_PATTERNS.some(function (pattern) { return pattern.test(message_1); });
                if (!isDelegation) return [3 /*break*/, 2];
                console.log("[Delegation] Detected in message: \"".concat(message_1.substring(0, 50), "...\""));
                keywords_1 = [];
                DELEGATION_PATTERNS.forEach(function (pattern) {
                    var match = message_1.match(pattern);
                    if (match && match[1])
                        keywords_1.push(match[1]);
                });
                topic = keywords_1.length > 0 ? "Delegated: ".concat(keywords_1.join(", ")) : "User Delegation";
                currentScrumSession = (0, scrumController_js_1.createScrumSession)(topic, ["clerk", "specialist", "executive", "archivist"]);
                return [4 /*yield*/, (0, scrumController_js_1.advanceScrumSession)(currentScrumSession)];
            case 1:
                _a = _b.sent(), session = _a.session, stageResult = _a.stageResult;
                currentScrumSession = session;
                console.log("[Delegation] Created SCRUM session: ".concat(session.id, " for topic: ").concat(topic));
                res.json({
                    detected: true,
                    sessionId: session.id,
                    topic: topic,
                    message: "Delegation detected. Created SCRUM session: \"".concat(topic, "\"")
                });
                return [3 /*break*/, 3];
            case 2:
                res.json({ detected: false });
                _b.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_6 = _b.sent();
                console.error("Error detecting delegation:", error_6);
                res.status(500).json({ error: "Failed to detect delegation" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post("/api/scrum/start", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, topic, participants, SCRUM_PARTICIPANTS, _b, session, stageResult, error_7;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.body, topic = _a.topic, participants = _a.participants;
                // Use stigmergy-weighted participant selection if not provided
                if (!participants || participants.length === 0) {
                    SCRUM_PARTICIPANTS = ["clerk", "specialist", "executive", "archivist"];
                    participants = selectWeightedParticipants(SCRUM_PARTICIPANTS, 4);
                }
                currentScrumSession = (0, scrumController_js_1.createScrumSession)(topic || "Daily standup", participants);
                return [4 /*yield*/, (0, scrumController_js_1.advanceScrumSession)(currentScrumSession)];
            case 1:
                _b = _c.sent(), session = _b.session, stageResult = _b.stageResult;
                currentScrumSession = session;
                res.json({
                    session: session,
                    stageResult: stageResult,
                    message: "SCRUM started at stage: ".concat(stageResult.stage)
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _c.sent();
                console.error("Error starting SCRUM session:", error_7);
                res.status(500).json({ error: "Failed to start SCRUM session" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/api/scrum/advance", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, session, stageResult, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                if (!currentScrumSession) {
                    return [2 /*return*/, res.status(400).json({ error: "No active SCRUM session. Start one first." })];
                }
                if (currentScrumSession.finalStatus === "complete") {
                    res.json({
                        session: currentScrumSession,
                        message: "SCRUM session already complete",
                        complete: true
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, scrumController_js_1.advanceScrumSession)(currentScrumSession)];
            case 1:
                _a = _b.sent(), session = _a.session, stageResult = _a.stageResult;
                currentScrumSession = session;
                res.json({
                    session: session,
                    stageResult: stageResult,
                    message: "Advanced to stage: ".concat(stageResult.stage),
                    complete: session.finalStatus === "complete"
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _b.sent();
                console.error("Error advancing SCRUM session:", error_8);
                res.status(500).json({ error: "Failed to advance SCRUM session" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/scrum/status", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.json({
            active: currentScrumSession !== null,
            session: currentScrumSession,
            currentStage: (currentScrumSession === null || currentScrumSession === void 0 ? void 0 : currentScrumSession.currentStage) || null,
            complete: (currentScrumSession === null || currentScrumSession === void 0 ? void 0 : currentScrumSession.finalStatus) === "complete"
        });
        return [2 /*return*/];
    });
}); });
app.post("/api/scrum/export", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sessionId, _b, mode, githubClient, isGitHubMode, session, preview, result, result, error_9;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                _a = req.body, sessionId = _a.sessionId, _b = _a.mode, mode = _b === void 0 ? "localReport" : _b;
                githubClient = createSafeScrumRepoClient({
                    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
                    SAFE_SCRUM_REPO: process.env.SAFE_SCRUM_REPO,
                    SAFE_SCRUM_BRANCH: process.env.SAFE_SCRUM_BRANCH,
                    SAFE_SCRUM_REPORTS_DIR: process.env.SAFE_SCRUM_REPORTS_DIR,
                    SAFE_SCRUM_NOTES_PATH: process.env.SAFE_SCRUM_NOTES_PATH,
                });
                isGitHubMode = mode === "githubReport" || mode === "githubNotes";
                if (isGitHubMode && !githubClient) {
                    return [2 /*return*/, res.status(400).json({
                            error: "GitHub not configured. Set GITHUB_TOKEN and SAFE_SCRUM_REPO environment variables.",
                            code: "GITHUB_NOT_CONFIGURED"
                        })];
                }
                if (!sessionId) return [3 /*break*/, 3];
                return [4 /*yield*/, loadScrumSession(sessionId)];
            case 1:
                session = _c.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND" })];
                }
                if (mode === "preview") {
                    preview = previewScrumReport(session);
                    return [2 /*return*/, res.json({ preview: preview, mode: "preview" })];
                }
                if (!isSessionComplete(session)) {
                    return [2 /*return*/, res.status(400).json({ error: "Session is not complete", code: "INCOMPLETE_SESSION" })];
                }
                return [4 /*yield*/, exportScrumReport(sessionId, mode, githubClient || undefined)];
            case 2:
                result = _c.sent();
                return [2 /*return*/, res.json(__assign(__assign({}, result), { mode: mode }))];
            case 3:
                if (mode === "preview") {
                    return [2 /*return*/, res.status(400).json({ error: "Preview requires a sessionId", code: "SESSION_ID_REQUIRED" })];
                }
                return [4 /*yield*/, exportLatestCompletedScrum(mode, githubClient || undefined)];
            case 4:
                result = _c.sent();
                return [2 /*return*/, res.json(__assign(__assign({}, result), { mode: mode }))];
            case 5: return [3 /*break*/, 7];
            case 6:
                error_9 = _c.sent();
                console.error("Error exporting SCRUM report:", error_9);
                res.status(500).json({ error: error_9.message || "Failed to export SCRUM report", code: error_9.code || "EXPORT_ERROR" });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.get("/api/scrum/export/preview/:sessionId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, session, preview, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId = req.params.sessionId;
                return [4 /*yield*/, loadScrumSession(sessionId)];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND" })];
                }
                preview = previewScrumReport(session);
                res.json({ preview: preview, sessionId: sessionId, session: session });
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                console.error("Error generating preview:", error_10);
                res.status(500).json({ error: "Failed to generate preview" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/scrum/github/status", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var configured, repo, branch;
    return __generator(this, function (_a) {
        configured = !!(process.env.GITHUB_TOKEN && process.env.SAFE_SCRUM_REPO);
        repo = process.env.SAFE_SCRUM_REPO || null;
        branch = process.env.SAFE_SCRUM_BRANCH || "main";
        res.json({
            configured: configured,
            repo: repo,
            branch: branch,
            message: configured
                ? "GitHub integration configured for ".concat(repo, " (").concat(branch, ")")
                : "GitHub not configured. Set GITHUB_TOKEN and SAFE_SCRUM_REPO to enable."
        });
        return [2 /*return*/];
    });
}); });
// Calendar endpoints for time-based task management
var deadlines = new Map();
var tickets = new Map();
// Parse deadline string to Date
function parseDeadline(deadlineStr) {
    var now = new Date();
    var lower = deadlineStr.toLowerCase();
    if (lower === "now" || lower === "immediately")
        return now;
    if (lower === "tomorrow")
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (lower.includes("hour")) {
        var hours = parseInt(lower.replace(/\D/g, "")) || 1;
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    if (lower.includes("day")) {
        var days = parseInt(lower.replace(/\D/g, "")) || 1;
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    if (lower.includes("week")) {
        var weeks = parseInt(lower.replace(/\D/g, "")) || 1;
        return new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    }
    // Try ISO format
    var parsed = new Date(deadlineStr);
    return isNaN(parsed.getTime()) ? new Date(now.getTime() + 60 * 60 * 1000) : parsed;
}
// Schedule a scrum session with deadline
app.post("/api/calendar/scrum", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, topic, doc, deadlineStr, _b, priority, workflow_type, taskId, deadline, ticket, visualId, error_11;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                _a = req.body, topic = _a.topic, doc = _a.document, deadlineStr = _a.deadline, _b = _a.priority, priority = _b === void 0 ? "normal" : _b, workflow_type = _a.workflow_type;
                if (!topic) {
                    res.status(400).json({ error: "topic required" });
                    return [2 /*return*/];
                }
                taskId = "scrum-".concat(Date.now());
                deadline = parseDeadline(deadlineStr || "1 hour");
                ticket = {
                    id: taskId,
                    type: "scrum",
                    topic: topic,
                    document: doc,
                    deadline: deadline.toISOString(),
                    priority: priority,
                    status: "scheduled",
                    workflow_type: workflow_type || "improvement",
                    createdAt: new Date().toISOString(),
                };
                tickets.set(taskId, ticket);
                visualId = "scrum-".concat(Date.now());
                return [4 /*yield*/, emitRouteToVisualizer("system", "receptionist", "scrum_scheduled", visualId)];
            case 1:
                _c.sent();
                return [4 /*yield*/, emitRouteToVisualizer("receptionist", "clerk", "assigned", visualId)];
            case 2:
                _c.sent();
                return [4 /*yield*/, emitRouteToVisualizer("clerk", "specialist", "work_start", visualId)];
            case 3:
                _c.sent();
                res.json({
                    success: true,
                    ticketId: taskId,
                    topic: topic,
                    deadline: deadline.toISOString(),
                    message: "Scheduled ".concat(topic, " for ").concat(deadline.toLocaleString())
                });
                return [3 /*break*/, 5];
            case 4:
                error_11 = _c.sent();
                res.status(500).json({ error: error_11.message });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Add calendar deadline
app.post("/api/calendar/deadline", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, deadlineStr, assignee, notes, taskId, deadline, ticket;
    return __generator(this, function (_b) {
        try {
            _a = req.body, title = _a.title, deadlineStr = _a.deadline, assignee = _a.assignee, notes = _a.notes;
            if (!title || !deadlineStr) {
                res.status(400).json({ error: "title and deadline required" });
                return [2 /*return*/];
            }
            taskId = "deadline-".concat(Date.now());
            deadline = parseDeadline(deadlineStr);
            ticket = {
                id: taskId,
                type: "deadline",
                title: title,
                deadline: deadline.toISOString(),
                assignee: assignee,
                notes: notes,
                status: "pending",
                createdAt: new Date().toISOString(),
            };
            deadlines.set(taskId, ticket);
            res.json({
                success: true,
                ticketId: taskId,
                title: title,
                deadline: deadline.toISOString(),
                message: "Deadline set for ".concat(deadline.toLocaleString())
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
        return [2 /*return*/];
    });
}); });
// Create improvement ticket
app.post("/api/calendar/ticket", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, description, _b, priority, related_document, taskId, ticket;
    return __generator(this, function (_c) {
        try {
            _a = req.body, title = _a.title, description = _a.description, _b = _a.priority, priority = _b === void 0 ? "normal" : _b, related_document = _a.related_document;
            if (!title) {
                res.status(400).json({ error: "title required" });
                return [2 /*return*/];
            }
            taskId = "ticket-".concat(Date.now());
            ticket = {
                id: taskId,
                type: "improvement",
                title: title,
                description: description,
                priority: priority,
                related_document: related_document,
                status: "open",
                createdAt: new Date().toISOString(),
            };
            tickets.set(taskId, ticket);
            res.json({
                success: true,
                ticketId: taskId,
                title: title,
                priority: priority,
                message: "Created improvement ticket: ".concat(title)
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
        return [2 /*return*/];
    });
}); });
// Get calendar/deadlines
app.get("/api/calendar/deadlines", function (_req, res) {
    var allDeadlines = Array.from(deadlines.values());
    var allTickets = Array.from(tickets.values()).filter(function (t) { return t.type !== "deadline"; });
    res.json({ deadlines: allDeadlines, tickets: allTickets });
});
app.post("/api/scrum/append-notes", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, session, notesPath, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                sessionId = req.body.sessionId;
                if (!sessionId) {
                    return [2 /*return*/, res.status(400).json({ error: "sessionId required", code: "SESSION_ID_REQUIRED" })];
                }
                return [4 /*yield*/, loadScrumSession(sessionId)];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND" })];
                }
                return [4 /*yield*/, appendToGithubNotes(session)];
            case 2:
                notesPath = _a.sent();
                res.json({
                    success: true,
                    path: notesPath,
                    sessionId: session.id,
                    notes: generateGithubNotes(session)
                });
                return [3 /*break*/, 4];
            case 3:
                error_12 = _a.sent();
                console.error("Error appending notes:", error_12);
                res.status(500).json({ error: error_12.message || "Failed to append notes" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Time Tasks API Routes
var index_js_2 = require("../src/pixel_memory/index.js");
app.get("/api/tasks-v2", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_2, priority, limit, tasks, error_13;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, status_2 = _a.status, priority = _a.priority, limit = _a.limit;
                return [4 /*yield*/, index_js_2.tasksV2.list({
                        status: status_2,
                        priority: priority,
                        limit: limit ? parseInt(limit) : 50,
                    })];
            case 1:
                tasks = _b.sent();
                res.json({ tasks: tasks });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _b.sent();
                console.error("Error fetching tasks:", error_13);
                res.status(500).json({ error: error_13.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/api/tasks-v2", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var task, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_js_2.tasksV2.create(req.body)];
            case 1:
                task = _a.sent();
                res.json(task);
                return [3 /*break*/, 3];
            case 2:
                error_14 = _a.sent();
                console.error("Error creating task:", error_14);
                res.status(500).json({ error: error_14.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.patch("/api/tasks-v2/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, updated, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, index_js_2.tasksV2.update(id, req.body)];
            case 1:
                updated = _a.sent();
                if (!updated) {
                    return [2 /*return*/, res.status(404).json({ error: "Task not found" })];
                }
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_15 = _a.sent();
                console.error("Error updating task:", error_15);
                res.status(500).json({ error: error_15.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete("/api/tasks-v2/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, index_js_2.tasksV2.delete(id)];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_16 = _a.sent();
                console.error("Error deleting task:", error_16);
                res.status(500).json({ error: error_16.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/events/today", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var today, dayEvents, error_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                today = new Date();
                return [4 /*yield*/, index_js_2.events.listByDay(today)];
            case 1:
                dayEvents = _a.sent();
                res.json({ events: dayEvents });
                return [3 /*break*/, 3];
            case 2:
                error_17 = _a.sent();
                console.error("Error fetching events:", error_17);
                res.status(500).json({ error: error_17.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/api/events", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event_2, error_18;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_js_2.events.create(req.body)];
            case 1:
                event_2 = _a.sent();
                res.json(event_2);
                return [3 /*break*/, 3];
            case 2:
                error_18 = _a.sent();
                console.error("Error creating event:", error_18);
                res.status(500).json({ error: error_18.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/sessions/active", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var session, error_19;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_js_2.sessions.getActive()];
            case 1:
                session = _a.sent();
                res.json({ session: session });
                return [3 /*break*/, 3];
            case 2:
                error_19 = _a.sent();
                console.error("Error fetching active session:", error_19);
                res.status(500).json({ error: error_19.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/api/sessions/start", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var session, error_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_js_2.sessions.start(req.body)];
            case 1:
                session = _a.sent();
                res.json(session);
                return [3 /*break*/, 3];
            case 2:
                error_20 = _a.sent();
                console.error("Error starting session:", error_20);
                res.status(500).json({ error: error_20.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/api/sessions/:id/end", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, session, error_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, index_js_2.sessions.end(id, req.body)];
            case 1:
                session = _a.sent();
                if (!session) {
                    return [2 /*return*/, res.status(404).json({ error: "Session not found" })];
                }
                res.json(session);
                return [3 /*break*/, 3];
            case 2:
                error_21 = _a.sent();
                console.error("Error ending session:", error_21);
                res.status(500).json({ error: error_21.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/time-tasks/plan", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var today, plan, error_22;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                today = new Date();
                return [4 /*yield*/, (0, index_js_2.generateTodaysPlan)(today)];
            case 1:
                plan = _a.sent();
                res.json(plan);
                return [3 /*break*/, 3];
            case 2:
                error_22 = _a.sent();
                console.error("Error generating plan:", error_22);
                res.status(500).json({ error: error_22.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/time-tasks/log", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var today, log, error_23;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                today = new Date();
                return [4 /*yield*/, (0, index_js_2.generateTodaysLog)(today)];
            case 1:
                log = _a.sent();
                res.json(log);
                return [3 /*break*/, 3];
            case 2:
                error_23 = _a.sent();
                console.error("Error generating log:", error_23);
                res.status(500).json({ error: error_23.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Auto-Cooler Scheduler Routes
var newsTopics_js_1 = require("./services/newsTopics.js");
var autoCoolerInterval = null;
var AUTO_COOLER_INTERVAL_MS = parseInt(process.env.AUTO_COOLER_INTERVAL_MS || "") || 5 * 60 * 1000; // 5 minutes default
var AUTO_SCRUM_INTERVAL_MS = parseInt(process.env.AUTO_SCRUM_INTERVAL_MS || "") || 10 * 60 * 1000; // 10 minutes default
var AUTO_SCRUM_ENABLED = process.env.AUTO_SCRUM_ENABLED === "true";
var NIGHT_MODE_MULTIPLIER = parseFloat(process.env.NIGHT_MODE_MULTIPLIER || "") || 0.25; // 4x faster at night
var nightModeActive = false;
function getActiveInterval(baseMs) {
    return nightModeActive ? Math.floor(baseMs * NIGHT_MODE_MULTIPLIER) : baseMs;
}
// API to set night mode (called by frontend when sleep mode is toggled)
app.post("/api/office/night-mode", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var active;
    return __generator(this, function (_a) {
        active = req.body.active;
        nightModeActive = active === true;
        console.log("[Office] Night mode ".concat(nightModeActive ? 'ACTIVATED' : 'deactivated', ". Intervals: ").concat(getActiveInterval(AUTO_COOLER_INTERVAL_MS) / 1000, "s (cooler), ").concat(getActiveInterval(AUTO_SCRUM_INTERVAL_MS) / 1000, "s (scrum)"));
        res.json({ ok: true, nightMode: nightModeActive });
        return [2 /*return*/];
    });
}); });
function runAutoCoolerSession() {
    return __awaiter(this, void 0, void 0, function () {
        var topic, numParticipants, selectedParticipants, result, coolerDocPath, dateStr, sessionId, filename, timestamp, exportData, frontmatter, coolerPath, logEntry, coolerPath, error_24;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("[AutoCooler] Starting automatic cooler session...");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, newsTopics_js_1.fetchNewsTopics)()];
                case 2:
                    _b.sent();
                    topic = (0, newsTopics_js_1.getTopicForConversation)();
                    numParticipants = 4 + Math.floor(Math.random() * 3);
                    selectedParticipants = selectWeightedParticipants(ALL_PARTICIPANTS, numParticipants);
                    return [4 /*yield*/, (0, coolerTalkService_js_1.runRoomTurn)("kitchen", {
                            topic: topic,
                            participants: selectedParticipants,
                            userMessage: "",
                            generateFn: llmGenerateFn_js_1.generateFn
                        })];
                case 3:
                    result = _b.sent();
                    console.log("[AutoCooler] Session complete. ".concat(result.participantCount, " participants, topic: \"").concat(topic, "\""));
                    coolerDocPath = path_1.default.resolve("process.cwd()/docs/cooler");
                    if (!fs_1.default.existsSync(coolerDocPath))
                        fs_1.default.mkdirSync(coolerDocPath, { recursive: true });
                    dateStr = new Date().toISOString().split('T')[0];
                    sessionId = ((_a = result.session) === null || _a === void 0 ? void 0 : _a.id) || "auto-".concat(Date.now());
                    filename = "".concat(dateStr, "_cooler-").concat(sessionId, ".md");
                    timestamp = new Date().toISOString();
                    exportData = (0, coolerTalkService_js_1.exportRoomSession)("kitchen");
                    if (exportData && exportData.markdown) {
                        frontmatter = "---\ntitle: \"Auto Cooler Session\"\ndate: \"".concat(timestamp, "\"\ntopic: \"").concat(topic, "\"\nparticipants: \"").concat(selectedParticipants.join(', '), "\"\n---\n\n").concat(exportData.markdown, "\n\n---\n*Generated from Pixel Office Auto Cooler*\n");
                        coolerPath = path_1.default.join(coolerDocPath, filename);
                        fs_1.default.writeFileSync(coolerPath, frontmatter, "utf-8");
                        console.log("[AutoCooler] Saved markdown to ".concat(coolerPath));
                    }
                    else {
                        logEntry = "---\ntitle: \"Auto Cooler Session\"\ndate: \"".concat(timestamp, "\"\ntopic: \"").concat(topic, "\"\nparticipants: \"").concat(selectedParticipants.join(', '), "\"\n---\n\n**Topic:** ").concat(topic, "\n\n**Participants:** ").concat(selectedParticipants.join(", "), "\n\n**Participant Count:** ").concat(result.participantCount, "\n\n---\n*Generated from Pixel Office Auto Cooler*\n");
                        coolerPath = path_1.default.join(coolerDocPath, filename);
                        fs_1.default.writeFileSync(coolerPath, logEntry, "utf-8");
                        console.log("[AutoCooler] Saved markdown to ".concat(coolerPath));
                    }
                    // Trigger automatic Scrum after cooler session (if enabled)
                    if (AUTO_SCRUM_ENABLED) {
                        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            var scrumRes, scrumData, scrumErr_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        console.log("[AutoCooler] Triggering automatic Scrum after cooler session...");
                                        return [4 /*yield*/, fetch('/api/scrum/test', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ coolerSessionId: null }) // Will use random session
                                            })];
                                    case 1:
                                        scrumRes = _a.sent();
                                        return [4 /*yield*/, scrumRes.json()];
                                    case 2:
                                        scrumData = _a.sent();
                                        console.log("[AutoCooler] Auto-Scrum triggered:", scrumData.message);
                                        return [3 /*break*/, 4];
                                    case 3:
                                        scrumErr_1 = _a.sent();
                                        console.error("[AutoCooler] Failed to trigger auto-scrum:", scrumErr_1);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, 5000); // 5 second delay after cooler session
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_24 = _b.sent();
                    console.error("[AutoCooler] Error running session:", error_24);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
app.post("/api/cooler/auto/start", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var intervalMs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (autoCoolerInterval) {
                    res.json({ ok: true, message: "Auto-cooler already running", intervalMs: getActiveInterval(AUTO_COOLER_INTERVAL_MS) });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, runAutoCoolerSession()];
            case 1:
                _a.sent();
                intervalMs = getActiveInterval(AUTO_COOLER_INTERVAL_MS);
                autoCoolerInterval = setInterval(runAutoCoolerSession, intervalMs);
                console.log("[AutoCooler] Started. Next session in ".concat(intervalMs / 1000 / 60, " minutes"));
                res.json({
                    ok: true,
                    message: "Auto-cooler started",
                    intervalMs: intervalMs,
                    nextRunIn: intervalMs
                });
                return [2 /*return*/];
        }
    });
}); });
app.post("/api/cooler/auto/stop", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (autoCoolerInterval) {
            clearInterval(autoCoolerInterval);
            autoCoolerInterval = null;
            console.log("[AutoCooler] Stopped");
            res.json({ ok: true, message: "Auto-cooler stopped" });
        }
        else {
            res.json({ ok: true, message: "Auto-cooler was not running" });
        }
        return [2 /*return*/];
    });
}); });
app.get("/api/cooler/auto/status", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.json({
            active: autoCoolerInterval !== null,
            intervalMs: AUTO_COOLER_INTERVAL_MS,
            nextRunIn: autoCoolerInterval ? AUTO_COOLER_INTERVAL_MS : null
        });
        return [2 /*return*/];
    });
}); });
app.post("/api/cooler/auto/trigger", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topic, selectedTopic, result, error_25;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                topic = req.body.topic;
                selectedTopic = topic || (0, newsTopics_js_1.getTopicForConversation)();
                return [4 /*yield*/, (0, coolerTalkService_js_1.runRoomTurn)("kitchen", {
                        topic: selectedTopic,
                        participants: ALL_PARTICIPANTS,
                        userMessage: "",
                        generateFn: llmGenerateFn_js_1.generateFn
                    })];
            case 1:
                result = _a.sent();
                res.json({
                    ok: true,
                    topic: selectedTopic,
                    participantCount: result.participantCount,
                    sessionId: result.session.id
                });
                return [3 /*break*/, 3];
            case 2:
                error_25 = _a.sent();
                console.error("[AutoCooler] Trigger error:", error_25);
                res.status(500).json({ ok: false, error: error_25.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/cooler/topics", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topics, error_26;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, newsTopics_js_1.fetchNewsTopics)()];
            case 1:
                topics = _a.sent();
                res.json({ ok: true, topics: topics });
                return [3 /*break*/, 3];
            case 2:
                error_26 = _a.sent();
                res.status(500).json({ ok: false, error: error_26.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Return current topic (latest from fetchNewsTopics)
app.get("/api/cooler/topics/current", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topics, currentTopic, error_27;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, newsTopics_js_1.fetchNewsTopics)()];
            case 1:
                topics = _a.sent();
                currentTopic = topics.length > 0 ? topics[0] : null;
                res.json({ topic: currentTopic, topics: topics });
                return [3 /*break*/, 3];
            case 2:
                error_27 = _a.sent();
                res.status(500).json({ error: error_27.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Proxy /api/time to Pixel-Me
app.get("/api/time/current", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var resp, data, error_28;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(PIXEL_ME_URL, "/time/current"))];
            case 1:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 2:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                error_28 = _a.sent();
                res.status(502).json({ ok: false, error: error_28.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/time/summary", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var date, url, resp, data, error_29;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                date = req.query.date;
                url = date ? "".concat(PIXEL_ME_URL, "/time/summary?date=").concat(date) : "".concat(PIXEL_ME_URL, "/time/summary");
                return [4 /*yield*/, fetch(url)];
            case 1:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 2:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                error_29 = _a.sent();
                res.status(502).json({ ok: false, error: error_29.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// KB ingest endpoint - allows agents or users to add documents to knowledge base
app.post("/api/kb/ingest", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, file, folder, resp, data, error_30;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, file = _a.file, folder = _a.folder;
                if (!file && !folder) {
                    res.status(400).json({ error: "file or folder required" });
                    return [2 /*return*/];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fetch("".concat(KB_SERVER_URL, "/ingest"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ file: file, folder: folder }),
                    })];
            case 2:
                resp = _b.sent();
                return [4 /*yield*/, resp.json()];
            case 3:
                data = _b.sent();
                res.json(data);
                return [3 /*break*/, 5];
            case 4:
                error_30 = _b.sent();
                res.status(502).json({ ok: false, error: error_30.message });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Proxy /api/kb to KB Server - also emits visualizer events for agent2agent monitor
app.post("/api/kb/search", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, taskId, now, resp, data, results, error_31;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = req.body.query;
                taskId = generateTaskId();
                now = new Date().toISOString();
                // Emit KB search activity to visualizer
                return [4 /*yield*/, emitRouteToVisualizer("system", "archivist", "kb_query", taskId)];
            case 1:
                // Emit KB search activity to visualizer
                _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 9, , 11]);
                return [4 /*yield*/, fetch("".concat(KB_SERVER_URL, "/search"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(req.body),
                    })];
            case 3:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 4:
                data = _a.sent();
                results = data.results || [];
                if (!(results.length > 0)) return [3 /*break*/, 6];
                return [4 /*yield*/, emitRouteToVisualizer("archivist", "receptionist", "kb_found", taskId)];
            case 5:
                _a.sent();
                return [3 /*break*/, 8];
            case 6: return [4 /*yield*/, emitRouteToVisualizer("archivist", "receptionist", "kb_empty", taskId)];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                // Include task info for visualizer tracking
                res.json(__assign(__assign({}, data), { _workflow: {
                        taskId: taskId,
                        query: query,
                        resultsCount: results.length
                    } }));
                return [3 /*break*/, 11];
            case 9:
                error_31 = _a.sent();
                return [4 /*yield*/, emitRouteToVisualizer("archivist", "specialist", "kb_error", taskId)];
            case 10:
                _a.sent();
                res.status(502).json({ ok: false, error: error_31.message });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
// KB document analysis workflow - brings agents together to work on a document
app.post("/api/workflow/kb/analyze", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, document_path, question, requester, taskId, now, task, kbResponse, kbData, results, analysis, e_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("[Workflow] KB document analysis endpoint hit!");
                _a = req.body, document_path = _a.document_path, question = _a.question, requester = _a.requester;
                if (!document_path && !question) {
                    res.status(400).json({ error: "document_path or question required" });
                    return [2 /*return*/];
                }
                taskId = generateTaskId();
                now = new Date().toISOString();
                // Emit complete workflow: receptionist -> clerk -> specialist -> archivist
                return [4 /*yield*/, emitRouteToVisualizer("system", "receptionist", "kb_analyze", taskId)];
            case 1:
                // Emit complete workflow: receptionist -> clerk -> specialist -> archivist
                _b.sent();
                task = {
                    id: taskId,
                    workflowType: "kb_document_analysis",
                    status: "in_progress",
                    currentOwner: "archivist",
                    requester: requester || "user",
                    summary: "Analyze: ".concat(document_path),
                    inputs: { document_path: document_path, question: question, source: "knowledge_base" },
                    worklog: [
                        { timestamp: now, agent: "system", action: "ticket_created", note: "Analysis request: ".concat(document_path) },
                        { timestamp: now, agent: "receptionist", action: "ticket_processed", note: "Received document analysis ticket" },
                    ],
                    artifacts: [],
                    createdAt: now,
                    priority: "normal"
                };
                workflowTasks.set(taskId, task);
                // Full agent handoff chain
                return [4 /*yield*/, emitRouteToVisualizer("receptionist", "clerk", " delegation", taskId)];
            case 2:
                // Full agent handoff chain
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "clerk", action: "assigned", note: "Assigned to specialist" });
                return [4 /*yield*/, emitRouteToVisualizer("clerk", "specialist", "escalation", taskId)];
            case 3:
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "specialist", action: "reviewed", note: "Analyzing document" });
                return [4 /*yield*/, emitRouteToVisualizer("specialist", "archivist", "task", taskId)];
            case 4:
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "archivist", action: "searching", note: "Searching KB for context" });
                _b.label = 5;
            case 5:
                _b.trys.push([5, 8, , 9]);
                return [4 /*yield*/, fetch("".concat(KB_SERVER_URL, "/search"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query: question || document_path, top_k: 10 }),
                    })];
            case 6:
                kbResponse = _b.sent();
                return [4 /*yield*/, kbResponse.json()];
            case 7:
                kbData = _b.sent();
                results = kbData.results || [];
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "archivist",
                    action: results.length > 0 ? "found" : "empty",
                    note: "Found ".concat(results.length, " chunks")
                });
                analysis = results.length > 0
                    ? results.map(function (r) { return r.text || JSON.stringify(r); }).join("\n\n---\n\n")
                    : "No relevant content found in knowledge base.";
                task.artifacts = [{
                        type: "kb_analysis",
                        content: analysis,
                        document: document_path,
                        question: question
                    }];
                task.status = "completed";
                task.response = analysis.slice(0, 2000);
                return [3 /*break*/, 9];
            case 8:
                e_3 = _b.sent();
                task.status = "failed";
                task.response = "Error analyzing document: ".concat(e_3.message);
                task.worklog.push({ timestamp: new Date().toISOString(), agent: "archivist", action: "error", note: e_3.message });
                return [3 /*break*/, 9];
            case 9: 
            // Complete workflow - return through receptionist
            return [4 /*yield*/, emitRouteToVisualizer("archivist", "receptionist", "complete", taskId)];
            case 10:
                // Complete workflow - return through receptionist
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "receptionist", action: "completed", note: "Analysis complete" });
                workflowTasks.set(taskId, task);
                res.json({ taskId: taskId, status: task.status, summary: task.summary, response: task.response });
                return [2 /*return*/];
        }
    });
}); });
// KB workflow endpoint - triggers workflow and visualizer events
app.post("/api/workflow/kb/search", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, query, requester, agentId, taskId, now, task, kbResponse, kbData, searchResults, hasResults, error_32;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("[Workflow] KB search workflow endpoint hit!");
                _a = req.body, query = _a.query, requester = _a.requester, agentId = _a.agentId;
                if (!query) {
                    res.status(400).json({ error: "query is required" });
                    return [2 /*return*/];
                }
                taskId = generateTaskId();
                now = new Date().toISOString();
                // Emit initial route: system -> receptionist (new KB task)
                return [4 /*yield*/, emitRouteToVisualizer("system", "receptionist", "kb_task", taskId)];
            case 1:
                // Emit initial route: system -> receptionist (new KB task)
                _b.sent();
                task = {
                    id: taskId,
                    workflowType: "kb_search",
                    status: "in_progress",
                    currentOwner: "archivist",
                    requester: requester || "user",
                    summary: "KB search: ".concat(query),
                    inputs: { query: query, source: "knowledge_base" },
                    worklog: [
                        { timestamp: now, agent: "system", action: "kb_ticket_created", note: "KB search request: ".concat(query) },
                        { timestamp: now, agent: "receptionist", action: "kb_ticket_processed", note: "Processing KB search: ".concat(query) },
                    ],
                    artifacts: [],
                    createdAt: now,
                    priority: "normal"
                };
                workflowTasks.set(taskId, task);
                // Emit: receptionist -> clerk (KB delegation)
                return [4 /*yield*/, emitRouteToVisualizer("receptionist", "clerk", "kb_delegation", taskId)];
            case 2:
                // Emit: receptionist -> clerk (KB delegation)
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "clerk", action: "kb_assigned", note: "Assigned to specialist for KB lookup" });
                // Emit: clerk -> specialist (KB escalation)
                return [4 /*yield*/, emitRouteToVisualizer("clerk", "specialist", "kb_escalation", taskId)];
            case 3:
                // Emit: clerk -> specialist (KB escalation)
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "specialist", action: "kb_reviewed", note: "Processing KB search query" });
                // Emit: specialist -> archivist (KB task)
                return [4 /*yield*/, emitRouteToVisualizer("specialist", "archivist", "kb_task", taskId)];
            case 4:
                // Emit: specialist -> archivist (KB task)
                _b.sent();
                task.worklog.push({ timestamp: now, agent: "archivist", action: "kb_searching", note: "Querying knowledge base: ".concat(query) });
                _b.label = 5;
            case 5:
                _b.trys.push([5, 9, , 11]);
                return [4 /*yield*/, fetch("".concat(KB_SERVER_URL, "/search"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query: query, top_k: 5 }),
                    })];
            case 6:
                kbResponse = _b.sent();
                return [4 /*yield*/, kbResponse.json()];
            case 7:
                kbData = _b.sent();
                searchResults = kbData.results || [];
                hasResults = searchResults.length > 0;
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "archivist",
                    action: hasResults ? "kb_found" : "kb_empty",
                    note: hasResults ? "Found ".concat(searchResults.length, " result(s)") : "No results found in knowledge base"
                });
                // Emit completion
                return [4 /*yield*/, emitRouteToVisualizer("archivist", "receptionist", "kb_complete", taskId)];
            case 8:
                // Emit completion
                _b.sent();
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "receptionist",
                    action: "kb_returned",
                    note: "Returning KB results to requester"
                });
                task.status = "completed";
                task.response = hasResults
                    ? "Found ".concat(searchResults.length, " result(s) in knowledge base")
                    : "No documents found in knowledge base matching your query";
                task.artifacts = searchResults.map(function (r) { return ({
                    type: "kb_chunk",
                    content: JSON.stringify(r)
                }); });
                workflowTasks.set(taskId, task);
                res.json({
                    taskId: taskId,
                    status: "completed",
                    query: query,
                    results: searchResults,
                    summary: task.response,
                    worklog: task.worklog
                });
                return [3 /*break*/, 11];
            case 9:
                error_32 = _b.sent();
                console.error("[Workflow] KB search error:", error_32);
                // Emit failure
                return [4 /*yield*/, emitRouteToVisualizer("archivist", "specialist", "kb_failure", taskId)];
            case 10:
                // Emit failure
                _b.sent();
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "specialist",
                    action: "kb_error",
                    note: "Error: ".concat(error_32.message)
                });
                task.status = "failed";
                task.response = "KB search failed: ".concat(error_32.message);
                workflowTasks.set(taskId, task);
                res.json({
                    taskId: taskId,
                    status: "failed",
                    error: error_32.message,
                    worklog: task.worklog
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
var conferenceroomStorage = new routes_js_1.ConferenceRoomStorage();
app.use("/conferenceroom", (0, routes_js_1.createConferenceRoomRouter)(conferenceroomStorage));
function requireAdmin(req, res, next) {
    var token = process.env.ADMIN_ACCESS_TOKEN;
    if (!token) {
        if (process.env.NODE_ENV === "production") {
            res.status(403).json({ error: "Admin access not configured" });
            return;
        }
        next();
        return;
    }
    var header = req.header("x-admin-token");
    if (header !== token) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}
function runDbQuery(sql_1) {
    return __awaiter(this, arguments, void 0, function (sql, params) {
        var pool, config, isPg, result, rows;
        if (params === void 0) { params = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    config = (0, config_js_1.getConfig)();
                    isPg = config.db.type === "postgres";
                    if (!isPg) return [3 /*break*/, 3];
                    return [4 /*yield*/, pool.query(sql, params)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 3: return [4 /*yield*/, pool.query(sql, params)];
                case 4:
                    rows = (_a.sent())[0];
                    return [2 /*return*/, rows];
            }
        });
    });
}
function parseValue(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch (_a) {
            return value;
        }
    }
    return value;
}
function getDbSchema() {
    return __awaiter(this, void 0, void 0, function () {
        var tables, tableNames, schema, _i, tableNames_1, tableName, columns, _a, columns_1, col;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, runDbQuery("SHOW TABLES")];
                case 1:
                    tables = _b.sent();
                    tableNames = tables.map(function (row) { return Object.values(row)[0]; });
                    schema = "Database schema:\n";
                    _i = 0, tableNames_1 = tableNames;
                    _b.label = 2;
                case 2:
                    if (!(_i < tableNames_1.length)) return [3 /*break*/, 5];
                    tableName = tableNames_1[_i];
                    return [4 /*yield*/, runDbQuery("DESCRIBE `".concat(tableName, "`"))];
                case 3:
                    columns = _b.sent();
                    schema += "\nTable: ".concat(tableName, "\n");
                    for (_a = 0, columns_1 = columns; _a < columns_1.length; _a++) {
                        col = columns_1[_a];
                        schema += "  - ".concat(col.Field, " (").concat(col.Type, ")\n");
                    }
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { schema: schema, tables: tableNames }];
            }
        });
    });
}
function getTableData(tableName_1) {
    return __awaiter(this, arguments, void 0, function (tableName, limit) {
        var rows;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runDbQuery("SELECT * FROM `".concat(tableName, "` LIMIT ?"), [limit])];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(function (row) {
                            var parsed = {};
                            for (var _i = 0, _a = Object.entries(row); _i < _a.length; _i++) {
                                var _b = _a[_i], key = _b[0], value = _b[1];
                                parsed[key] = parseValue(value);
                            }
                            return parsed;
                        })];
            }
        });
    });
}
function detectRequestedTables(message, availableTables) {
    var lowerMessage = message.toLowerCase();
    var requested = [];
    for (var _i = 0, availableTables_1 = availableTables; _i < availableTables_1.length; _i++) {
        var table = availableTables_1[_i];
        if (lowerMessage.includes(table.toLowerCase()) ||
            lowerMessage.includes(table.replace('_', ' '))) {
            requested.push(table);
        }
    }
    if (lowerMessage.includes('database') ||
        lowerMessage.includes('what is in') ||
        lowerMessage.includes('show me') ||
        lowerMessage.includes('all data') ||
        lowerMessage.includes('everything')) {
        if (requested.length === 0) {
            return availableTables;
        }
    }
    return requested;
}
function formatTableData(tableName, data) {
    if (!data || data.length === 0) {
        return "\n### ".concat(tableName, "\nNo data found.\n");
    }
    var output = "\n### ".concat(tableName, " (").concat(data.length, " rows)\n");
    var headers = Object.keys(data[0]);
    output += "Columns: ".concat(headers.join(', '), "\n\n");
    var _loop_1 = function (row) {
        var rowStr = headers.map(function (h) {
            var val = row[h];
            if (val === null)
                return 'NULL';
            if (typeof val === 'object')
                return JSON.stringify(val);
            return String(val);
        }).join(' | ');
        output += "| ".concat(rowStr, " |\n");
    };
    for (var _i = 0, _a = data.slice(0, 5); _i < _a.length; _i++) {
        var row = _a[_i];
        _loop_1(row);
    }
    if (data.length > 5) {
        output += "\n... and ".concat(data.length - 5, " more rows\n");
    }
    return output;
}
app.post("/api/chat", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, message, history_1, model, selectedModel, ollamaUrl, isNvidiaModel, nvidiaChat, result, nvidiaErr_1, isLargeModel, timeoutMs, controller_1, timeoutId, ollamaResponse, errorText, reader, decoder, fullResponse, _b, done, value, chunk, lines, _i, lines_1, line, parsed, streamErr_1, reply, ollamaErr_1, error_33;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 18, , 19]);
                _a = req.body, message = _a.message, history_1 = _a.history, model = _a.model;
                if (!message) {
                    res.status(400).json({ error: "Message is required" });
                    return [2 /*return*/];
                }
                selectedModel = model || "gemma-3-1b-it";
                ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
                isNvidiaModel = selectedModel.includes("/") && !selectedModel.includes(":");
                if (!isNvidiaModel) return [3 /*break*/, 5];
                _e.label = 1;
            case 1:
                _e.trys.push([1, 4, , 5]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require("./llm/nvidiaClient.js"); })];
            case 2:
                nvidiaChat = (_e.sent()).nvidiaChat;
                return [4 /*yield*/, nvidiaChat(__spreadArray(__spreadArray([
                        { role: "system", content: "You are a helpful assistant at Pixel Office." }
                    ], (history_1 || []).slice(-10).map(function (m) { return ({ role: m.role, content: m.content }); }), true), [
                        { role: "user", content: message }
                    ], false), {
                        model: selectedModel,
                        maxTokens: 256
                    })];
            case 3:
                result = _e.sent();
                trackLlmRequest("nvidia", selectedModel);
                res.json({ reply: result.content, model: selectedModel });
                return [2 /*return*/];
            case 4:
                nvidiaErr_1 = _e.sent();
                console.error("NVIDIA chat error:", nvidiaErr_1);
                res.json({ reply: "NVIDIA model failed: ".concat(nvidiaErr_1.message, ". Please try a different model."), model: selectedModel });
                return [2 /*return*/];
            case 5:
                isLargeModel = selectedModel.includes("7b") || selectedModel.includes("8b") || selectedModel.includes("70b");
                timeoutMs = isLargeModel ? 60000 : 30000;
                controller_1 = new AbortController();
                timeoutId = setTimeout(function () { return controller_1.abort(); }, timeoutMs);
                _e.label = 6;
            case 6:
                _e.trys.push([6, 16, , 17]);
                return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/chat"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: selectedModel,
                            messages: __spreadArray(__spreadArray([
                                { role: "system", content: "You are a helpful assistant at Pixel Office." }
                            ], (history_1 || []).slice(-10), true), [
                                { role: "user", content: message }
                            ], false),
                            stream: true, // Enable streaming for faster response
                            options: { num_predict: isLargeModel ? 100 : 50, temperature: 0.7 }
                        }),
                        signal: controller_1.signal
                    })];
            case 7:
                ollamaResponse = _e.sent();
                clearTimeout(timeoutId);
                if (!!ollamaResponse.ok) return [3 /*break*/, 9];
                return [4 /*yield*/, ollamaResponse.text()];
            case 8:
                errorText = _e.sent();
                res.json({ reply: "I'm having trouble connecting to the AI model right now. Please try again later. (Model: ".concat(selectedModel, ")") });
                return [2 /*return*/];
            case 9:
                reader = (_c = ollamaResponse.body) === null || _c === void 0 ? void 0 : _c.getReader();
                decoder = new TextDecoder();
                fullResponse = "";
                if (!reader) return [3 /*break*/, 15];
                _e.label = 10;
            case 10:
                _e.trys.push([10, 14, , 15]);
                _e.label = 11;
            case 11:
                if (!true) return [3 /*break*/, 13];
                return [4 /*yield*/, reader.read()];
            case 12:
                _b = _e.sent(), done = _b.done, value = _b.value;
                if (done)
                    return [3 /*break*/, 13];
                chunk = decoder.decode(value);
                lines = chunk.split('\n').filter(function (line) { return line.trim(); });
                for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                    line = lines_1[_i];
                    try {
                        parsed = JSON.parse(line);
                        if ((_d = parsed.message) === null || _d === void 0 ? void 0 : _d.content) {
                            fullResponse += parsed.message.content;
                        }
                    }
                    catch (_f) { }
                }
                return [3 /*break*/, 11];
            case 13: return [3 /*break*/, 15];
            case 14:
                streamErr_1 = _e.sent();
                console.error("Stream error:", streamErr_1);
                return [3 /*break*/, 15];
            case 15:
                reply = fullResponse || "I couldn't generate a response.";
                // Track LLM request only after successful response
                trackLlmRequest("ollama", selectedModel);
                res.json({ reply: reply, model: selectedModel });
                return [3 /*break*/, 17];
            case 16:
                ollamaErr_1 = _e.sent();
                clearTimeout(timeoutId);
                if (ollamaErr_1.name === 'AbortError') {
                    console.error("Ollama timeout:", ollamaErr_1);
                    res.json({ reply: "The AI model is taking too long to respond. Please try again.", model: "timeout" });
                }
                else {
                    console.error("Ollama error:", ollamaErr_1);
                    res.json({ reply: "I'm having trouble connecting to the AI model right now. Please try again later.", model: "error" });
                }
                return [3 /*break*/, 17];
            case 17: return [3 /*break*/, 19];
            case 18:
                error_33 = _e.sent();
                console.error("Chat error:", error_33);
                res.status(500).json({ error: error_33.message || "Internal server error" });
                return [3 /*break*/, 19];
            case 19: return [2 /*return*/];
        }
    });
}); });
app.post("/api/agent-chat", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, message, model, agentName, agentRole, selectedModel, agentCoworkers, isNvidiaModel, routeChat, rolePrompts_1, coworkerContext_1, fullPrompt_1, messages, result, nvidiaErr_2, rolePrompts, systemPrompt, coworkerContext, fullPrompt, roleMap, mappedRole, messages, result, reply, response, ollamaErr_2, error_34;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 10, , 11]);
                _a = req.body, message = _a.message, model = _a.model, agentName = _a.agentName, agentRole = _a.agentRole;
                if (!message) {
                    res.status(400).json({ error: "Message is required" });
                    return [2 /*return*/];
                }
                selectedModel = model || "gemma-3-1b-it";
                agentCoworkers = {
                    receptionist: "You work with IronClaw (facilities), OpenClaw (PM), and the rest of the team.",
                    clerk: "You collaborate with FrontDesk, IronClaw, and ZeroClaw on tasks.",
                    executive: "You lead FrontDesk, OpenClaw, IronClaw, and the specialist team.",
                    specialist: "You work with HermitClaw on technical details and ask ZeroClaw for code help.",
                    custodian: "You maintain the office with FrontDesk and help all teams keep things running.",
                    archivist: "You preserve records for everyone - especially Sherlobster's investigations.",
                };
                isNvidiaModel = selectedModel.includes("/") && !selectedModel.includes(":");
                if (!(isNvidiaModel && process.env.NVIDIA_API_KEY)) return [3 /*break*/, 5];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require("./llm/llmRouter.js"); })];
            case 2:
                routeChat = (_b.sent()).routeChat;
                rolePrompts_1 = {
                    receptionist: "You are FrontDesk, the friendly receptionist at Pixel Office. You know everyone's schedules and always offer visitors coffee. You're in the lobby area. Keep responses warm and brief - you're always happy to help direct people to who they need to see.",
                    clerk: "You are OpenClaw, a Project Manager at Pixel Office. You live by the calendar and always want to 'circle back' on tasks. You're in the open office area near the kitchen. Keep responses action-oriented but friendly.",
                    executive: "You are LeslieClaw, the Team Lead at Pixel Office. You love meetings, spreadsheets, and ending sentences with 'everyone!'. You're in the boss office. Keep responses encouraging and on-topic.",
                    specialist: "You are ZeroClaw, a Junior Developer at Pixel Office. You're curious, take notes constantly, and always ask 'why?'. You're in the specialist suite. Keep responses thoughtful.",
                    custodian: "You are IronClaw, the Facilities Manager at Pixel Office. You fix things before they break and always have tools in your pocket. You're in the open office. Keep responses practical and brief.",
                    archivist: "You are HermitClaw, the Archivist at Pixel Office. You know obscure office history and file everything. You're in the archives. Keep responses measured.",
                };
                coworkerContext_1 = agentCoworkers[agentRole] || "";
                fullPrompt_1 = coworkerContext_1 ? "".concat(rolePrompts_1[agentRole], " ").concat(coworkerContext_1) : (rolePrompts_1[agentRole] || "You are ".concat(agentName, ", a helpful assistant."));
                messages = [
                    { role: "system", content: fullPrompt_1 },
                    { role: "user", content: message }
                ];
                return [4 /*yield*/, routeChat(messages, { maxTokens: 1024, model: selectedModel })];
            case 3:
                result = _b.sent();
                // Track LLM request
                trackLlmRequest("nvidia", selectedModel);
                return [2 /*return*/, res.json({ reply: result.content, model: "nvidia (".concat(selectedModel, ")") })];
            case 4:
                nvidiaErr_2 = _b.sent();
                console.error("NVIDIA agent-chat error:", nvidiaErr_2);
                res.json({ reply: "NVIDIA error: ".concat(nvidiaErr_2.message || 'failed', ". Try a local model instead."), model: "nvidia-error" });
                return [2 /*return*/];
            case 5:
                rolePrompts = {
                    receptionist: "You are FrontDesk, the friendly receptionist at Pixel Office. You know schedules and offer coffee. You can SEARCH THE KNOWLEDGE BASE, SCHEDULE SCRUM SESSIONS for improvements, and SET DEADLINES for tasks. When users want to 'fix' or 'improve' something, use schedule_scrum. Keep responses warm and brief.",
                    clerk: "You are OpenClaw, a Project Manager at Pixel Office. You track tasks and love to 'circle back'. For projects/files, SEARCH THE KNOWLEDGE BASE. For 'fix' or 'improve' requests, use schedule_scrum to create timed improvement sessions. Keep responses action-oriented but friendly.",
                    executive: "You are LeslieClaw, the Team Lead at Pixel Office. You love meetings and spreadsheets. SCHEDULE SCRUM SESSIONS when teams need to work on things together. Set DEADLINES for important tasks. Keep responses encouraging and on-topic.",
                    specialist: "You are ZeroClaw, a Junior Developer at Pixel Office. You're curious and ask 'why?'. For code/docs, SEARCH THE KNOWLEDGE BASE. When asked to 'fix' or 'improve', use schedule_scrum to create time-boxed improvement sessions. CREATE IMPROVEMENT TICKETS for backlog items. Keep responses thoughtful and technical.",
                    custodian: "You are IronClaw, the Facilities Manager at Pixel Office. You fix things before they break. For docs/history, SEARCH THE KNOWLEDGE BASE. Create IMPROVEMENT TICKETS for maintenance issues. Keep responses practical and brief.",
                    archivist: "You are HermitClaw, the Archivist at Pixel Office. You preserve all records. SEARCH THE KNOWLEDGE BASE for docs. Create IMPROVEMENT TICKETS when issues are found. Keep responses measured but helpful.",
                };
                systemPrompt = rolePrompts[agentRole] || "You are ".concat(agentName, ", a helpful assistant at Pixel Office.");
                coworkerContext = agentCoworkers[agentRole] || "";
                fullPrompt = coworkerContext ? "".concat(systemPrompt, " ").concat(coworkerContext) : systemPrompt;
                roleMap = {
                    receptionist: "specialist",
                    clerk: "specialist",
                    executive: "specialist",
                    specialist: "specialist",
                    custodian: "specialist",
                    archivist: "specialist",
                };
                mappedRole = roleMap[agentRole] || "specialist";
                _b.label = 6;
            case 6:
                _b.trys.push([6, 8, , 9]);
                messages = [
                    { role: "system", content: fullPrompt },
                    { role: "user", content: message }
                ];
                return [4 /*yield*/, (0, roleModels_js_1.callChatModelForRole)(mappedRole, messages, { tools: true })];
            case 7:
                result = _b.sent();
                reply = result.response || "I couldn't generate a response.";
                // Track LLM request
                trackLlmRequest("local", selectedModel);
                // Track agent tokens (inner = prompt, outer = completion)
                if (result.usage) {
                    agentTokensUsed.inc({ agent: mappedRole, channel: "inner" }, result.usage.prompt_tokens || 0);
                    agentTokensUsed.inc({ agent: mappedRole, channel: "outer" }, result.usage.completion_tokens || 0);
                }
                // Track tool calls if present
                if (result.tool_calls && result.tool_calls.length > 0) {
                    agentToolCallsUsed.inc({ agent: mappedRole });
                }
                response = { reply: reply, model: selectedModel };
                if (result.tool_calls) {
                    response.tools = result.tool_calls;
                }
                return [2 /*return*/, res.json(response)];
            case 8:
                ollamaErr_2 = _b.sent();
                console.error("Ollama error:", ollamaErr_2.message);
                res.json({ reply: "I'm having trouble connecting to the AI model right now. Please try again later. (Model: ".concat(selectedModel, ")") });
                return [2 /*return*/];
            case 9:
                res.json({ reply: reply, model: selectedModel });
                return [3 /*break*/, 11];
            case 10:
                error_34 = _b.sent();
                if (typeof timeoutId !== 'undefined')
                    clearTimeout(timeoutId);
                if (error_34.name === 'AbortError') {
                    console.error("Agent chat Ollama timeout:", error_34);
                    res.json({ reply: "The AI model is taking too long to respond. Please try again.", model: "timeout" });
                }
                else {
                    console.error("Agent chat error:", error_34);
                    res.status(500).json({ error: error_34.message || "Failed to chat with agent" });
                }
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
app.get("/api/db/query", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, table, limit, data, error_35;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, table = _a.table, limit = _a.limit;
                if (!table || typeof table !== "string") {
                    res.status(400).json({ error: "Table name required" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, getTableData(table, limit ? parseInt(limit, 10) : 10)];
            case 1:
                data = _b.sent();
                res.json({ data: data });
                return [3 /*break*/, 3];
            case 2:
                error_35 = _b.sent();
                console.error("Query error:", error_35);
                res.status(500).json({ error: error_35.message || "Query failed" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/db/tables", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tables, tableNames, error_36;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, runDbQuery("SHOW TABLES")];
            case 1:
                tables = _a.sent();
                tableNames = tables.map(function (row) { return Object.values(row)[0]; });
                res.json({ tables: tableNames });
                return [3 /*break*/, 3];
            case 2:
                error_36 = _a.sent();
                console.error("Tables error:", error_36);
                res.status(500).json({ error: error_36.message || "Failed to get tables" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/admin/summary", requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tables, tableNames, tableSummaries, _i, tableNames_2, tableName, countResult, rowCount, err_7, error_37;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                return [4 /*yield*/, runDbQuery("SHOW TABLES")];
            case 1:
                tables = _b.sent();
                tableNames = tables.map(function (row) { return Object.values(row)[0]; });
                tableSummaries = [];
                _i = 0, tableNames_2 = tableNames;
                _b.label = 2;
            case 2:
                if (!(_i < tableNames_2.length)) return [3 /*break*/, 7];
                tableName = tableNames_2[_i];
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, runDbQuery("SELECT COUNT(*) as cnt FROM `".concat(tableName, "`"))];
            case 4:
                countResult = _b.sent();
                rowCount = Array.isArray(countResult) ? (_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.cnt : (countResult === null || countResult === void 0 ? void 0 : countResult.cnt) || 0;
                tableSummaries.push({ name: tableName, rowCount: Number(rowCount) });
                return [3 /*break*/, 6];
            case 5:
                err_7 = _b.sent();
                tableSummaries.push({ name: tableName, error: err_7.message });
                return [3 /*break*/, 6];
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7:
                res.json({ tables: tableSummaries });
                return [3 /*break*/, 9];
            case 8:
                error_37 = _b.sent();
                console.error("Admin summary error:", error_37);
                res.status(500).json({ error: error_37.message || "Failed to get summary" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.get("/api/admin/activity", requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tables, tableNames, events_1, error_38;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, runDbQuery("SHOW TABLES")];
            case 1:
                tables = _a.sent();
                tableNames = tables.map(function (row) { return Object.values(row)[0]; });
                if (!tableNames.includes("activity_log")) {
                    res.json({
                        events: [],
                        message: "Activity logging not yet configured. The activity_log table does not exist."
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, runDbQuery("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50")];
            case 2:
                events_1 = _a.sent();
                res.json({ events: events_1 });
                return [3 /*break*/, 4];
            case 3:
                error_38 = _a.sent();
                console.error("Admin activity error:", error_38);
                res.status(500).json({ error: error_38.message || "Failed to get activity" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post("/api/admin/actions/evaluate-stock-forecasts", requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tables, tableNames, dueForecasts, errors, evaluatedCount, _i, dueForecasts_1, forecast, priceResult, actualPrice, actualReturnPct, absErrorPrice, absErrorPct, err_8, error_39;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 11, , 12]);
                return [4 /*yield*/, runDbQuery("SHOW TABLES")];
            case 1:
                tables = _a.sent();
                tableNames = tables.map(function (row) { return Object.values(row)[0]; });
                if (!tableNames.includes("stock_forecasts")) {
                    res.json({ ok: false, message: "stock_forecasts table does not exist" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, runDbQuery("SELECT sf.*, st.symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.status = 'pending' AND sf.target_date <= CURDATE()")];
            case 2:
                dueForecasts = _a.sent();
                if (dueForecasts.length === 0) {
                    res.json({ ok: true, evaluatedCount: 0, errors: [], message: "No due forecasts to evaluate." });
                    return [2 /*return*/];
                }
                errors = [];
                evaluatedCount = 0;
                _i = 0, dueForecasts_1 = dueForecasts;
                _a.label = 3;
            case 3:
                if (!(_i < dueForecasts_1.length)) return [3 /*break*/, 9];
                forecast = dueForecasts_1[_i];
                _a.label = 4;
            case 4:
                _a.trys.push([4, 7, , 8]);
                return [4 /*yield*/, (0, priceFeed_js_1.fetchPriceForDate)(forecast.symbol, forecast.target_date)];
            case 5:
                priceResult = _a.sent();
                if (!priceResult) {
                    errors.push("Could not fetch price for ".concat(forecast.symbol, " on ").concat(forecast.target_date));
                    return [3 /*break*/, 8];
                }
                actualPrice = priceResult.price;
                actualReturnPct = null;
                absErrorPrice = null;
                absErrorPct = null;
                if (forecast.baseline_price && forecast.baseline_price > 0) {
                    actualReturnPct = ((actualPrice - Number(forecast.baseline_price)) / Number(forecast.baseline_price)) * 100;
                }
                if (forecast.predicted_price != null) {
                    absErrorPrice = Math.abs(Number(forecast.predicted_price) - actualPrice);
                }
                if (forecast.predicted_return_pct != null && actualReturnPct != null) {
                    absErrorPct = Math.abs(Number(forecast.predicted_return_pct) - actualReturnPct);
                }
                return [4 /*yield*/, runDbQuery("UPDATE stock_forecasts SET status = 'evaluated', evaluated_at = NOW(), actual_price = ?, actual_return_pct = ?, absolute_error_price = ?, absolute_error_pct = ? WHERE id = ?", [actualPrice, actualReturnPct, absErrorPrice, absErrorPct, forecast.id])];
            case 6:
                _a.sent();
                evaluatedCount++;
                return [3 /*break*/, 8];
            case 7:
                err_8 = _a.sent();
                errors.push("Error evaluating forecast #".concat(forecast.id, ": ").concat(err_8.message));
                return [3 /*break*/, 8];
            case 8:
                _i++;
                return [3 /*break*/, 3];
            case 9:
                res.json({ ok: true, evaluatedCount: evaluatedCount, errors: errors, message: "Evaluated ".concat(evaluatedCount, " forecast(s).") });
                return [4 /*yield*/, logActivity("stock_forecast_evaluated", "Evaluated ".concat(evaluatedCount, " pending forecasts"), { evaluated: evaluatedCount, errors: errors.length })];
            case 10:
                _a.sent();
                return [3 /*break*/, 12];
            case 11:
                error_39 = _a.sent();
                console.error("Admin evaluate error:", error_39);
                res.status(500).json({ error: error_39.message || "Failed to evaluate forecasts" });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
app.post("/api/stocks/forecasts", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, symbol, horizon_days, target_date, prediction_type, predicted_price, predicted_direction, notes, user_id, validTypes, effectiveUserId, horizon, effectiveTargetDate, tickerRows, tickerId, baselinePrice, priceResult, predictedReturnPct, inserted, error_40;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                _a = req.body, symbol = _a.symbol, horizon_days = _a.horizon_days, target_date = _a.target_date, prediction_type = _a.prediction_type, predicted_price = _a.predicted_price, predicted_direction = _a.predicted_direction, notes = _a.notes, user_id = _a.user_id;
                if (!symbol || !prediction_type) {
                    res.status(400).json({ error: "symbol and prediction_type are required" });
                    return [2 /*return*/];
                }
                validTypes = ["price", "percentage_return", "direction"];
                if (!validTypes.includes(prediction_type)) {
                    res.status(400).json({ error: "prediction_type must be one of: ".concat(validTypes.join(", ")) });
                    return [2 /*return*/];
                }
                effectiveUserId = user_id || 1;
                horizon = horizon_days || 14;
                effectiveTargetDate = target_date || new Date(Date.now() + horizon * 86400000).toISOString().split("T")[0];
                return [4 /*yield*/, runDbQuery("SELECT id FROM stock_tickers WHERE symbol = ?", [symbol.toUpperCase()])];
            case 1:
                tickerRows = _b.sent();
                tickerId = void 0;
                if (!(tickerRows.length === 0)) return [3 /*break*/, 4];
                return [4 /*yield*/, runDbQuery("INSERT INTO stock_tickers (symbol) VALUES (?)", [symbol.toUpperCase()])];
            case 2:
                _b.sent();
                return [4 /*yield*/, runDbQuery("SELECT id FROM stock_tickers WHERE symbol = ?", [symbol.toUpperCase()])];
            case 3:
                tickerRows = _b.sent();
                _b.label = 4;
            case 4:
                tickerId = tickerRows[0].id;
                baselinePrice = null;
                return [4 /*yield*/, (0, priceFeed_js_1.fetchCurrentPrice)(symbol)];
            case 5:
                priceResult = _b.sent();
                if (priceResult) {
                    baselinePrice = priceResult.price;
                }
                predictedReturnPct = null;
                if (prediction_type === "price" && predicted_price != null && baselinePrice != null && baselinePrice > 0) {
                    predictedReturnPct = ((predicted_price - baselinePrice) / baselinePrice) * 100;
                }
                return [4 /*yield*/, runDbQuery("INSERT INTO stock_forecasts (user_id, ticker_id, horizon_days, target_date, prediction_type, predicted_price, predicted_return_pct, predicted_direction, baseline_price, notes)\n       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [effectiveUserId, tickerId, horizon, effectiveTargetDate, prediction_type, predicted_price || null, predictedReturnPct, predicted_direction || null, baselinePrice, notes || null])];
            case 6:
                _b.sent();
                return [4 /*yield*/, runDbQuery("SELECT sf.*, st.symbol AS ticker_symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.id = LAST_INSERT_ID()")];
            case 7:
                inserted = _b.sent();
                res.json({ forecast: inserted[0] });
                return [3 /*break*/, 9];
            case 8:
                error_40 = _b.sent();
                console.error("Create forecast error:", error_40);
                res.status(500).json({ error: error_40.message || "Failed to create forecast" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.get("/api/stocks/forecasts", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_3, symbol, from, to, user_id, limit, offset, effectiveUserId, conditions, params, where, lim, off, countRows, total, forecasts, error_41;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                _a = req.query, status_3 = _a.status, symbol = _a.symbol, from = _a.from, to = _a.to, user_id = _a.user_id, limit = _a.limit, offset = _a.offset;
                effectiveUserId = user_id || 1;
                conditions = ["sf.user_id = ?"];
                params = [effectiveUserId];
                if (status_3) {
                    conditions.push("sf.status = ?");
                    params.push(status_3);
                }
                if (symbol) {
                    conditions.push("st.symbol = ?");
                    params.push(symbol.toUpperCase());
                }
                if (from) {
                    conditions.push("sf.created_at >= ?");
                    params.push(from);
                }
                if (to) {
                    conditions.push("sf.created_at <= ?");
                    params.push(to);
                }
                where = conditions.length > 0 ? "WHERE ".concat(conditions.join(" AND ")) : "";
                lim = limit ? parseInt(limit, 10) : 50;
                off = offset ? parseInt(offset, 10) : 0;
                return [4 /*yield*/, runDbQuery("SELECT COUNT(*) as total FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id ".concat(where), params)];
            case 1:
                countRows = _c.sent();
                total = ((_b = countRows[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
                return [4 /*yield*/, runDbQuery("SELECT sf.*, st.symbol AS ticker_symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id ".concat(where, " ORDER BY sf.created_at DESC LIMIT ? OFFSET ?"), __spreadArray(__spreadArray([], params, true), [lim, off], false))];
            case 2:
                forecasts = _c.sent();
                res.json({ forecasts: forecasts, total: Number(total) });
                return [3 /*break*/, 4];
            case 3:
                error_41 = _c.sent();
                console.error("List forecasts error:", error_41);
                res.status(500).json({ error: error_41.message || "Failed to list forecasts" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/stocks/forecasts/stats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var effectiveUserId, rows, directionRows, stats, dirStats, dirHitRate, error_42;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                effectiveUserId = req.query.user_id || 1;
                return [4 /*yield*/, runDbQuery("SELECT\n         COUNT(*) as totalForecasts,\n         SUM(CASE WHEN status = 'evaluated' THEN 1 ELSE 0 END) as evaluatedCount,\n         AVG(CASE WHEN status = 'evaluated' AND absolute_error_price IS NOT NULL THEN absolute_error_price END) as meanAbsoluteErrorPrice,\n         AVG(CASE WHEN status = 'evaluated' AND absolute_error_pct IS NOT NULL THEN absolute_error_pct END) as meanAbsoluteErrorPct\n       FROM stock_forecasts WHERE user_id = ?", [effectiveUserId])];
            case 1:
                rows = _a.sent();
                return [4 /*yield*/, runDbQuery("SELECT\n         COUNT(*) as total,\n         SUM(CASE\n           WHEN predicted_direction = 'up' AND actual_return_pct > 0 THEN 1\n           WHEN predicted_direction = 'down' AND actual_return_pct < 0 THEN 1\n           WHEN predicted_direction = 'flat' AND ABS(actual_return_pct) < 1 THEN 1\n           ELSE 0\n         END) as correct\n       FROM stock_forecasts\n       WHERE user_id = ? AND status = 'evaluated' AND predicted_direction IS NOT NULL", [effectiveUserId])];
            case 2:
                directionRows = _a.sent();
                stats = rows[0] || {};
                dirStats = directionRows[0] || {};
                dirHitRate = dirStats.total > 0 ? (Number(dirStats.correct) / Number(dirStats.total)) * 100 : null;
                res.json({
                    totalForecasts: Number(stats.totalForecasts) || 0,
                    evaluatedCount: Number(stats.evaluatedCount) || 0,
                    meanAbsoluteErrorPrice: stats.meanAbsoluteErrorPrice != null ? Number(stats.meanAbsoluteErrorPrice) : null,
                    meanAbsoluteErrorPct: stats.meanAbsoluteErrorPct != null ? Number(stats.meanAbsoluteErrorPct) : null,
                    directionHitRate: dirHitRate,
                });
                return [3 /*break*/, 4];
            case 3:
                error_42 = _a.sent();
                console.error("Forecast stats error:", error_42);
                res.status(500).json({ error: error_42.message || "Failed to get forecast stats" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/stocks/forecasts/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, rows, error_43;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, runDbQuery("SELECT sf.*, st.symbol AS ticker_symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.id = ?", [id])];
            case 1:
                rows = _a.sent();
                if (rows.length === 0) {
                    res.status(404).json({ error: "Forecast not found" });
                    return [2 /*return*/];
                }
                res.json({ forecast: rows[0] });
                return [3 /*break*/, 3];
            case 2:
                error_43 = _a.sent();
                console.error("Get forecast error:", error_43);
                res.status(500).json({ error: error_43.message || "Failed to get forecast" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete("/api/stocks/forecasts/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_44;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, runDbQuery("DELETE FROM stock_forecasts WHERE id = ?", [id])];
            case 1:
                _a.sent();
                res.json({ ok: true });
                return [3 /*break*/, 3];
            case 2:
                error_44 = _a.sent();
                console.error("Delete forecast error:", error_44);
                res.status(500).json({ error: error_44.message || "Failed to delete forecast" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/api/stocks/forecasts/evaluate-due", requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dueForecasts, errors, evaluatedCount, _i, dueForecasts_2, forecast, priceResult, actualPrice, actualReturnPct, absErrorPrice, absErrorPct, err_9, error_45;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                return [4 /*yield*/, runDbQuery("SELECT sf.*, st.symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.status = 'pending' AND sf.target_date <= CURDATE()")];
            case 1:
                dueForecasts = _a.sent();
                if (dueForecasts.length === 0) {
                    res.json({ evaluatedCount: 0, errors: [] });
                    return [2 /*return*/];
                }
                errors = [];
                evaluatedCount = 0;
                _i = 0, dueForecasts_2 = dueForecasts;
                _a.label = 2;
            case 2:
                if (!(_i < dueForecasts_2.length)) return [3 /*break*/, 8];
                forecast = dueForecasts_2[_i];
                _a.label = 3;
            case 3:
                _a.trys.push([3, 6, , 7]);
                return [4 /*yield*/, (0, priceFeed_js_1.fetchPriceForDate)(forecast.symbol, forecast.target_date)];
            case 4:
                priceResult = _a.sent();
                if (!priceResult) {
                    errors.push("Could not fetch price for ".concat(forecast.symbol, " on ").concat(forecast.target_date));
                    return [3 /*break*/, 7];
                }
                actualPrice = priceResult.price;
                actualReturnPct = null;
                absErrorPrice = null;
                absErrorPct = null;
                if (forecast.baseline_price && Number(forecast.baseline_price) > 0) {
                    actualReturnPct = ((actualPrice - Number(forecast.baseline_price)) / Number(forecast.baseline_price)) * 100;
                }
                if (forecast.predicted_price != null) {
                    absErrorPrice = Math.abs(Number(forecast.predicted_price) - actualPrice);
                }
                if (forecast.predicted_return_pct != null && actualReturnPct != null) {
                    absErrorPct = Math.abs(Number(forecast.predicted_return_pct) - actualReturnPct);
                }
                return [4 /*yield*/, runDbQuery("UPDATE stock_forecasts SET status = 'evaluated', evaluated_at = NOW(), actual_price = ?, actual_return_pct = ?, absolute_error_price = ?, absolute_error_pct = ? WHERE id = ?", [actualPrice, actualReturnPct, absErrorPrice, absErrorPct, forecast.id])];
            case 5:
                _a.sent();
                evaluatedCount++;
                return [3 /*break*/, 7];
            case 6:
                err_9 = _a.sent();
                errors.push("Error evaluating forecast #".concat(forecast.id, ": ").concat(err_9.message));
                return [3 /*break*/, 7];
            case 7:
                _i++;
                return [3 /*break*/, 2];
            case 8:
                res.json({ evaluatedCount: evaluatedCount, errors: errors });
                return [4 /*yield*/, logActivity("stock_forecast_evaluated", "Evaluated ".concat(evaluatedCount, " pending forecasts"), { evaluated: evaluatedCount, errors: errors.length })];
            case 9:
                _a.sent();
                return [3 /*break*/, 11];
            case 10:
                error_45 = _a.sent();
                console.error("Evaluate forecasts error:", error_45);
                res.status(500).json({ error: error_45.message || "Failed to evaluate forecasts" });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
app.post("/api/analyze", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, symbol, horizon, scenario, source, dataSource, ctx, analyzer, analysis, error_46;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, symbol = _a.symbol, horizon = _a.horizon, scenario = _a.scenario, source = _a.source;
                if (!symbol) {
                    res.status(400).json({ error: "symbol is required" });
                    return [2 /*return*/];
                }
                dataSource = source === "Real"
                    ? index_js_1.DataSource.Real
                    : source === "Hybrid"
                        ? index_js_1.DataSource.Hybrid
                        : index_js_1.DataSource.Mock;
                ctx = {
                    horizon: horizon || "1m",
                    scenario: scenario || "base",
                    source: dataSource,
                };
                analyzer = (0, index_js_1.createAnalyzer)(dataSource);
                return [4 /*yield*/, analyzer.analyzeAsset(symbol.toUpperCase(), ctx)];
            case 1:
                analysis = _b.sent();
                res.json({ analysis: analysis });
                return [3 /*break*/, 3];
            case 2:
                error_46 = _b.sent();
                console.error("Analyze error:", error_46);
                res.status(500).json({ error: error_46.message || "Failed to analyze asset" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/analyze/sources", function (req, res) {
    res.json({
        sources: [
            { id: "Mock", name: "Mock", description: "Synthetic/mock data for testing" },
            { id: "Real", name: "Real", description: "Real market data from Yahoo Finance" },
            { id: "Hybrid", name: "Hybrid", description: "Real prices with mock scenarios" },
        ],
    });
});
// Agent Lightning Training Endpoint
app.post("/api/agentlightning/train", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var agentId;
    return __generator(this, function (_a) {
        try {
            agentId = req.body.agentId;
            // Simulate training process
            console.log("Starting agent lightning training for agent: ".concat(agentId || 'anonymous'));
            // In a real implementation, this would trigger actual training
            // For now, we'll return a success response
            res.json({
                ok: true,
                status: "completed",
                message: "Agent lightning training started for ".concat(agentId || 'anonymous'),
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error("Agent lightning training error:", error);
            res.status(500).json({
                ok: false,
                error: error.message || "Failed to start training"
            });
        }
        return [2 /*return*/];
    });
}); });
// Conference Room positions for SCRUM (col 3, row 0 - two doors right of Sherlock)
var CONFERENCE_ROOM_POSITIONS = [
    { x: 750, y: 85 }, // Chair 1 - top row
    { x: 800, y: 85 }, // Chair 2 - top row  
    { x: 850, y: 85 }, // Chair 3 - top row
    { x: 750, y: 205 }, // Chair 4 - bottom row
    { x: 800, y: 205 }, // Chair 5 - bottom row
    { x: 850, y: 205 }, // Chair 6 - bottom row
    { x: 740, y: 145 }, // Chair 7 - left side
    { x: 860, y: 145 }, // Chair 8 - right side
];
// Cooler Talk Endpoint - Agents gather in kitchen for casual chat
var KITCHEN_COOLER_POSITIONS = [
    { x: 870, y: 130 },
    { x: 930, y: 130 },
    { x: 900, y: 150 },
    { x: 860, y: 160 },
    { x: 940, y: 160 },
    { x: 900, y: 180 },
];
var AGENT_NAMES = [
    "FrontDesk", "IronClaw", "ZeroClaw", "HermitClaw", "OpenClaw", "LeslieClaw", "Sherlobster", "Hercule Prawnro"
];
var COOLER_TOPICS = [
    "weekend plans",
    "the coffee machine",
    "latest office gossip",
    "that weird noise from the basement",
    "whether the AC is broken",
    "who took the last donut",
    "the new memo from management",
    "the ping pong tournament",
    "their cat's latest trick",
    "the weather",
];
var coolerTalkLog = [];
function generateCoolerTalk(agentName, otherAgents, topic) {
    return __awaiter(this, void 0, void 0, function () {
        var ollamaUrl, prompt, response, data, error_47;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
                    prompt = "You are ".concat(agentName, ", a character in a pixel art office simulation. Have a brief, casual conversation with your coworkers about \"").concat(topic, "\". \nKeep your response very short (1-2 sentences max), casual, and in character. Something a coworker would say at the water cooler.");
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/chat"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                model: "gemma-3-1b-it",
                                messages: [
                                    { role: "system", content: prompt },
                                    { role: "user", content: "You turn to talk to ".concat(otherAgents.join(", "), " by the water cooler.") }
                                ],
                                stream: false
                            })
                        })];
                case 2:
                    response = _c.sent();
                    if (!response.ok) {
                        return [2 /*return*/, getFallbackDialogue(agentName, topic)];
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _c.sent();
                    return [2 /*return*/, ((_b = (_a = data.message) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.substring(0, 100)) || getFallbackDialogue(agentName, topic)];
                case 4:
                    error_47 = _c.sent();
                    console.error("Ollama error in cooler talk:", error_47);
                    return [2 /*return*/, getFallbackDialogue(agentName, topic)];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getFallbackDialogue(agentName, topic) {
    var fallbacks = {
        "FrontDesk": ["Did you hear about the new schedule?", "This coffee is amazing!", "Only 2 more days until Friday!"],
        "IronClaw": ["I fixed the leak in the breakroom.", "Anyone else hungry?", "The weekend can't come soon enough."],
        "ZeroClaw": ["Has anyone seen my notebook?", "This project is going well!", "I love the office atmosphere."],
        "HermitClaw": ["I found something interesting in the archives.", "Quiet day today.", "Anyone want to discuss the new system?"],
        "OpenClaw": ["The reports are all filed.", "Great teamwork everyone!", "Let's grab lunch together."],
        "LeslieClaw": ["Meeting at 3pm everyone!", "Good work on the quarterly numbers.", "We need to discuss the new strategy."],
        "Sherlobster": ["Has anyone seen ClawGuard?", "I had the weirdest dream last night.", "This is quite the place!"],
        "Hercule Prawnro": ["The data looks promising!", "We should celebrate soon.", "Who wants to play ping pong?"],
    };
    var options = fallbacks[agentName] || ["Great weather today!", "Interesting topic!", "I was just thinking the same thing."];
    return options[Math.floor(Math.random() * options.length)];
}
app.post("/api/coolertalk", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, numParticipants, shuffled, participants, topic, session_1, assignments, ollamaUrl, fetchWithTimeout, i, agentName, intent, prompt_1, text, attempts, valid, response, data, errorText, e_4, utterance, validation, prevText, repairUtterance, topicKeywords, dialogueStartDelay_1, dialogues, logEntry, error_48;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 15, , 16]);
                sessionId = "ct-".concat(Date.now());
                console.log("[CoolerTalk] Starting session ".concat(sessionId, "..."));
                numParticipants = 4 + Math.floor(Math.random() * 3);
                shuffled = __spreadArray([], AGENT_NAMES, true).sort(function () { return Math.random() - 0.5; });
                participants = shuffled.slice(0, numParticipants);
                topic = COOLER_TOPICS[Math.floor(Math.random() * COOLER_TOPICS.length)];
                session_1 = createCoolerSession(topic, participants);
                assignments = participants.map(function (name, idx) { return ({
                    agentId: name.toLowerCase().replace(/ /g, "-"),
                    name: name,
                    targetX: KITCHEN_COOLER_POSITIONS[idx].x,
                    targetY: KITCHEN_COOLER_POSITIONS[idx].y,
                }); });
                ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
                fetchWithTimeout = function (url_2, options_1) {
                    var args_1 = [];
                    for (var _i = 2; _i < arguments.length; _i++) {
                        args_1[_i - 2] = arguments[_i];
                    }
                    return __awaiter(void 0, __spreadArray([url_2, options_1], args_1, true), void 0, function (url, options, timeout) {
                        var controller, id, response, e_5;
                        if (timeout === void 0) { timeout = 60000; }
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    controller = new AbortController();
                                    id = setTimeout(function () { return controller.abort(); }, timeout);
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller.signal }))];
                                case 2:
                                    response = _a.sent();
                                    clearTimeout(id);
                                    return [2 /*return*/, response];
                                case 3:
                                    e_5 = _a.sent();
                                    clearTimeout(id);
                                    throw e_5;
                                case 4: return [2 /*return*/];
                            }
                        });
                    });
                };
                i = 0;
                _c.label = 1;
            case 1:
                if (!(i < participants.length)) return [3 /*break*/, 14];
                agentName = participants[i];
                intent = getNextIntent(session_1);
                prompt_1 = buildTurnPrompt(session_1, agentName, intent, participants);
                text = "";
                attempts = 0;
                valid = false;
                _c.label = 2;
            case 2:
                if (!(!valid && attempts < 5)) return [3 /*break*/, 11];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 9, , 10]);
                console.log("[CoolerTalk] Calling ollama for ".concat(agentName, " (intent: ").concat(intent, ")..."));
                console.log("[CoolerTalk] Prompt: ".concat(prompt_1.substring(0, 200), "..."));
                return [4 /*yield*/, fetchWithTimeout("".concat(ollamaUrl, "/api/chat"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: "gemma",
                            messages: [
                                { role: "system", content: prompt_1 },
                                { role: "user", content: "Write your line now. Keep it short and conversational." }
                            ],
                            stream: false
                        })
                    }, 30000)];
            case 4:
                response = _c.sent();
                if (!response.ok) return [3 /*break*/, 6];
                return [4 /*yield*/, response.json()];
            case 5:
                data = _c.sent();
                text = ((_b = (_a = data.message) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.trim()) || "";
                console.log("[CoolerTalk] Ollama response: \"".concat(text.substring(0, 80), "...\""));
                // Clean up any quotes
                if (text.startsWith('"') && text.endsWith('"')) {
                    text = text.slice(1, -1);
                }
                return [3 /*break*/, 8];
            case 6: return [4 /*yield*/, response.text()];
            case 7:
                errorText = _c.sent();
                console.error("[CoolerTalk] Ollama error ".concat(response.status, ":"), errorText);
                _c.label = 8;
            case 8: return [3 /*break*/, 10];
            case 9:
                e_4 = _c.sent();
                if (e_4.name === 'AbortError') {
                    console.error("[CoolerTalk] Ollama timeout after 60s - using fallback");
                }
                else {
                    console.error("[CoolerTalk] Ollama error:", e_4.message);
                }
                return [3 /*break*/, 10];
            case 10:
                // Fallback if empty or error
                if (!text) {
                    console.log("[CoolerTalk] No response from ollama, using fallback for ".concat(agentName));
                    text = getFallbackDialogue(agentName, topic);
                }
                utterance = {
                    speaker: agentName,
                    text: text,
                    intent: intent,
                    replyTo: session_1.utterances.length > 0 ? session_1.utterances.length - 1 : null,
                };
                validation = validateUtterance(utterance, session_1, session_1.utterances);
                valid = validation.valid;
                if (!valid) {
                    console.log("[CoolerTalk] REJECTED (".concat(validation.rejected_reasons.join(", "), "): \"").concat(text, "\""));
                    attempts++;
                    // After max retries, use repair strategy (deterministic template)
                    if (attempts >= 5) {
                        prevText = session_1.utterances.length > 0
                            ? session_1.utterances[session_1.utterances.length - 1].text
                            : undefined;
                        text = getRepairText(intent, topic, prevText);
                        console.log("[CoolerTalk] REPAIR used for ".concat(agentName, ": \"").concat(text, "\""));
                        repairUtterance = {
                            speaker: agentName,
                            text: text,
                            intent: intent,
                            replyTo: session_1.utterances.length > 0 ? session_1.utterances.length - 1 : null,
                        };
                        session_1.utterances.push(repairUtterance);
                        addUtteranceToHistory(session_1, repairUtterance);
                        session_1.validationDetails.push({ valid: true, retries: attempts, rejected_reasons: validation.rejected_reasons });
                        session_1.currentTurn++;
                        valid = true; // Force accept repair
                    }
                }
                else {
                    session_1.utterances.push(utterance);
                    addUtteranceToHistory(session_1, utterance);
                    session_1.validationDetails.push(validation);
                    session_1.currentTurn++;
                }
                return [3 /*break*/, 2];
            case 11:
                if (!(i < participants.length - 1)) return [3 /*break*/, 13];
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
            case 12:
                _c.sent();
                _c.label = 13;
            case 13:
                i++;
                return [3 /*break*/, 1];
            case 14:
                topicKeywords = session_1.topicKeywords || [];
                console.log("[CoolerTalk] Session ".concat(session_1.id, " - Topic: \"").concat(topic, "\""));
                console.log("[CoolerTalk] Keywords: ".concat(topicKeywords.join(", ")));
                console.log("[CoolerTalk] Participants: ".concat(participants.join(", ")));
                session_1.utterances.forEach(function (u, i) {
                    var details = session_1.validationDetails[i];
                    var retryInfo = details ? " [retries:".concat(details.retries, ", reasons:").concat(details.rejected_reasons.join(";"), "]") : "";
                    console.log("[CoolerTalk] ".concat(u.speaker, " (").concat(u.intent, "): \"").concat(u.text, "\"").concat(retryInfo));
                });
                dialogueStartDelay_1 = 3000;
                dialogues = session_1.utterances.map(function (u, idx) { return ({
                    agentId: u.speaker.toLowerCase().replace(/ /g, "-"),
                    text: u.text,
                    intent: u.intent,
                    showAt: Date.now() + dialogueStartDelay_1 + (idx * 3000), // 3s initial, then 3s between
                    expiresAt: Date.now() + dialogueStartDelay_1 + (idx * 3000) + 8000, // show for 8s each
                }); });
                logEntry = {
                    timestamp: new Date().toISOString(),
                    sessionId: session_1.id,
                    topic: topic,
                    participants: participants,
                    utterances: session_1.utterances.map(function (u) { return ({
                        speaker: u.speaker,
                        text: u.text,
                        intent: u.intent,
                        reply_to: u.replyTo,
                    }); }),
                };
                // Store in memory log
                coolerTalkLog.push(logEntry);
                if (coolerTalkLog.length > 10)
                    coolerTalkLog.shift();
                // Save to markdown file with new format
                writeCoolerTalkToFile(session_1);
                res.json({
                    ok: true,
                    session_id: session_1.id,
                    participant_count: participants.length,
                    assignments: assignments,
                    dialogues: dialogues,
                    topic: topic,
                    duration_ms: 60000,
                    started_at: new Date().toISOString()
                });
                return [3 /*break*/, 16];
            case 15:
                error_48 = _c.sent();
                console.error("Cooler talk error:", error_48);
                res.status(500).json({
                    ok: false,
                    error: error_48.message || "Failed to start cooler talk"
                });
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/];
        }
    });
}); });
// Get cooler talk conversation log
app.get("/api/coolertalk/log", function (req, res) {
    res.json({
        sessions: coolerTalkLog
    });
});
// Get updated dialogue during cooler talk
app.get("/api/coolertalk/dialogue", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topic, agentName_1, otherAgents, dialogue, error_49;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                topic = COOLER_TOPICS[Math.floor(Math.random() * COOLER_TOPICS.length)];
                agentName_1 = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
                otherAgents = AGENT_NAMES.filter(function (n) { return n !== agentName_1; }).slice(0, 3);
                return [4 /*yield*/, generateCoolerTalk(agentName_1, otherAgents, topic)];
            case 1:
                dialogue = _a.sent();
                res.json({
                    agentId: agentName_1.toLowerCase().replace(/ /g, "-"),
                    text: dialogue,
                    expiresAt: Date.now() + 15000,
                });
                return [3 /*break*/, 3];
            case 2:
                error_49 = _a.sent();
                console.error("Dialogue error:", error_49);
                res.status(500).json({ error: error_49.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// AgentLightning Architecture
app.get("/api/agentlightning/architecture", function (req, res) {
    var archPath = "path.resolve(process.cwd(), "..", ".openclaw")/workspace-main/AGENTLIGHTNING_ROLE_ARCHITECTURE.yaml";
    try {
        var yamlContent = fs_1.default.readFileSync(archPath, "utf8");
        res.json({ yaml: yamlContent });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(Number(PORT), "127.0.0.1", function () {
    console.log("Pixel Office Live server running on http://localhost:".concat(PORT));
    console.log("Chat endpoint: http://localhost:".concat(PORT, "/api/chat"));
    console.log("DB Tables: http://localhost:".concat(PORT, "/api/db/tables"));
});
function callRoleDailyPlan(tasks_1) {
    return __awaiter(this, arguments, void 0, function (tasks, maxMinutes, minSlot, maxSlot) {
        var systemMsg, userPayload, userMsg, messages, result, content, jsonMatch, jsonStr, plan;
        if (maxMinutes === void 0) { maxMinutes = 450; }
        if (minSlot === void 0) { minSlot = 6; }
        if (maxSlot === void 0) { maxSlot = 18; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    systemMsg = "You are a workload planner for a single knowledge worker with ".concat(maxMinutes, " minutes of capacity per day. Tasks are ").concat(minSlot, "\u2013").concat(maxSlot, " minutes each. You must produce a JSON plan that respects total capacity and uses only provided task_ids.");
                    userPayload = {
                        capacity_minutes: maxMinutes,
                        min_slot_minutes: minSlot,
                        max_slot_minutes: maxSlot,
                        tasks: tasks.map(function (t) { return ({
                            id: t.id,
                            title: t.title,
                            description: t.description,
                            priority: t.priority,
                            estimated_minutes: t.estimated_minutes,
                            due_date: t.due_date ? t.due_date.toISOString().split("T")[0] : null,
                        }); }),
                    };
                    userMsg = "Given the following open tasks and constraints, create a JSON object with keys `summary`, `total_allocated_minutes`, and `items` (a list of objects with `task_id`, `allocated_minutes`, and `notes`).\n\n" +
                        "Constraints:\n" +
                        "- Total allocated minutes <= ".concat(maxMinutes, "\n") +
                        "- Each slot between ".concat(minSlot, " and ").concat(maxSlot, " minutes\n") +
                        "- Use only task_ids from the list.\n" +
                        "- Prefer higher priority and nearer due_date.\n\n" +
                        "Tasks JSON:\n" +
                        JSON.stringify(userPayload, null, 2);
                    messages = [
                        { role: "system", content: systemMsg },
                        { role: "user", content: userMsg },
                    ];
                    return [4 /*yield*/, (0, roleModels_js_1.callChatModelForRole)("workload_planner", messages, {
                            temperature: 0.2,
                        })];
                case 1:
                    result = _a.sent();
                    content = result.response;
                    if (!content) {
                        throw new Error("No response from LLM");
                    }
                    jsonMatch = content.match(/\{[\s\S]*\}/);
                    jsonStr = jsonMatch ? jsonMatch[0] : content;
                    plan = JSON.parse(jsonStr);
                    // Attach metadata
                    plan.metadata = {
                        role: result.role,
                        model: result.model
                    };
                    return [2 /*return*/, plan];
            }
        });
    });
}
app.post("/api/daily_plan", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var today, tasks, plan, err_10, summary, totalAllocated, items, planRows, dailyPlanId, slotIndex, _i, items_1, item, taskId, allocMin, notes, error_50;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 13, , 14]);
                today = new Date().toISOString().split("T")[0];
                return [4 /*yield*/, runDbQuery("SELECT id, title, description, status, priority, estimated_minutes, due_date\n       FROM tasks\n       WHERE status IN ('open', 'in_progress')\n       ORDER BY priority ASC, COALESCE(due_date, '9999-12-31') ASC, id ASC\n       LIMIT 100")];
            case 1:
                tasks = _a.sent();
                if (tasks.length === 0) {
                    res.json({ message: "No open tasks found.", plan: null });
                    return [2 /*return*/];
                }
                plan = void 0;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, callRoleDailyPlan(tasks)];
            case 3:
                plan = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                err_10 = _a.sent();
                res.status(500).json({ error: "Failed to generate plan", details: err_10.message });
                return [2 /*return*/];
            case 5:
                summary = plan.summary || "";
                totalAllocated = parseInt(plan.total_allocated_minutes, 10) || 0;
                items = plan.items || [];
                if (!items || items.length === 0) {
                    res.status(500).json({ error: "Plan contained no items" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, runDbQuery("INSERT INTO daily_plans (plan_date, summary, total_allocated_minutes)\n       VALUES (?, ?, ?)\n       ON DUPLICATE KEY UPDATE\n         summary = VALUES(summary),\n         total_allocated_minutes = VALUES(total_allocated_minutes)", [today, summary, totalAllocated])];
            case 6:
                _a.sent();
                return [4 /*yield*/, runDbQuery("SELECT id FROM daily_plans WHERE plan_date = ?", [today])];
            case 7:
                planRows = _a.sent();
                dailyPlanId = planRows[0].id;
                return [4 /*yield*/, runDbQuery("DELETE FROM daily_plan_items WHERE daily_plan_id = ?", [dailyPlanId])];
            case 8:
                _a.sent();
                slotIndex = 1;
                _i = 0, items_1 = items;
                _a.label = 9;
            case 9:
                if (!(_i < items_1.length)) return [3 /*break*/, 12];
                item = items_1[_i];
                taskId = parseInt(item.task_id, 10);
                allocMin = parseInt(item.allocated_minutes, 10) || 0;
                notes = item.notes || "";
                if (allocMin <= 0)
                    return [3 /*break*/, 11];
                return [4 /*yield*/, runDbQuery("INSERT INTO daily_plan_items (daily_plan_id, task_id, slot_index, allocated_minutes, notes)\n         VALUES (?, ?, ?, ?, ?)", [dailyPlanId, taskId, slotIndex, allocMin, notes])];
            case 10:
                _a.sent();
                slotIndex++;
                _a.label = 11;
            case 11:
                _i++;
                return [3 /*break*/, 9];
            case 12:
                res.json({
                    plan_date: today,
                    summary: summary,
                    total_allocated_minutes: totalAllocated,
                    items: items,
                });
                return [3 /*break*/, 14];
            case 13:
                error_50 = _a.sent();
                console.error("Daily plan error:", error_50);
                res.status(500).json({ error: error_50.message || "Failed to generate daily plan" });
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); });
app.get("/api/daily_plan", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var today, plans, plan, items, error_51;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                today = new Date().toISOString().split("T")[0];
                return [4 /*yield*/, runDbQuery("SELECT * FROM daily_plans WHERE plan_date = ?", [today])];
            case 1:
                plans = _a.sent();
                if (plans.length === 0) {
                    res.json({ plan: null });
                    return [2 /*return*/];
                }
                plan = plans[0];
                return [4 /*yield*/, runDbQuery("SELECT dpi.*, t.title, t.description, t.priority, t.estimated_minutes\n       FROM daily_plan_items dpi\n       JOIN tasks t ON dpi.task_id = t.id\n       WHERE dpi.daily_plan_id = ?\n       ORDER BY dpi.slot_index", [plan.id])];
            case 2:
                items = _a.sent();
                res.json({
                    plan: __assign(__assign({}, plan), { items: items }),
                });
                return [3 /*break*/, 4];
            case 3:
                error_51 = _a.sent();
                console.error("Get daily plan error:", error_51);
                res.status(500).json({ error: error_51.message || "Failed to get daily plan" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post("/api/tasks", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var resp, data, error_52;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(PIXEL_ME_URL, "/tasks"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(req.body),
                    })];
            case 1:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 2:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                error_52 = _a.sent();
                console.error("Create task proxy error:", error_52);
                res.status(502).json({ ok: false, error: error_52.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get("/api/tasks", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_4, project, url, resp, data, error_53;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                status_4 = req.query.status || "open";
                project = req.query.project;
                url = "".concat(PIXEL_ME_URL, "/tasks?status=").concat(status_4);
                if (project)
                    url += "&project=".concat(project);
                return [4 /*yield*/, fetch(url)];
            case 1:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 2:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                error_53 = _a.sent();
                console.error("List tasks proxy error:", error_53);
                res.status(502).json({ ok: false, error: error_53.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.patch("/api/tasks/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, resp, data, error_54;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                return [4 /*yield*/, fetch("".concat(PIXEL_ME_URL, "/tasks/").concat(id), {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(req.body),
                    })];
            case 1:
                resp = _a.sent();
                return [4 /*yield*/, resp.json()];
            case 2:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 4];
            case 3:
                error_54 = _a.sent();
                console.error("Update task proxy error:", error_54);
                res.status(502).json({ ok: false, error: error_54.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.delete("/api/tasks/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_55;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, runDbQuery("DELETE FROM tasks WHERE id = ?", [id])];
            case 1:
                _a.sent();
                res.json({ ok: true });
                return [3 /*break*/, 3];
            case 2:
                error_55 = _a.sent();
                console.error("Delete task error:", error_55);
                res.status(500).json({ error: error_55.message || "Failed to delete task" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/api/analytics/capacity", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results, error_56;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, runDbQuery("\n      SELECT\n        dp.plan_date,\n        SUM(dpi.allocated_minutes) AS total_allocated_minutes,\n        SUM(CASE WHEN t.status = 'done' THEN dpi.allocated_minutes ELSE 0 END) AS executed_minutes\n      FROM daily_plans dp\n      JOIN daily_plan_items dpi ON dp.id = dpi.daily_plan_id\n      JOIN tasks t ON dpi.task_id = t.id\n      GROUP BY dp.plan_date\n      ORDER BY dp.plan_date DESC\n    ")];
            case 1:
                results = _a.sent();
                res.json({ capacity: results });
                return [3 /*break*/, 3];
            case 2:
                error_56 = _a.sent();
                console.error("Analytics capacity error:", error_56);
                res.status(500).json({ error: error_56.message || "Failed to get capacity analytics" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
var workflowTasks = new Map();
function generateTaskId() {
    return "task_".concat(Date.now().toString(36), "_").concat(Math.random().toString(36).slice(2, 6));
}
function fetchGitHubFile(owner, repo, path, token) {
    return __awaiter(this, void 0, void 0, function () {
        var url, headers, response, error, data, content, error_57;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://api.github.com/repos/".concat(owner, "/").concat(repo, "/contents/").concat(path);
                    headers = {
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "PixelOffice/1.0"
                    };
                    if (token) {
                        headers["Authorization"] = "token ".concat(token);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch(url, { headers: headers })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    error = _a.sent();
                    console.error("GitHub API error: ".concat(response.status, " - ").concat(error));
                    return [2 /*return*/, null];
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _a.sent();
                    if (data.content) {
                        content = Buffer.from(data.content, 'base64').toString('utf-8');
                        return [2 /*return*/, { content: content, sha: data.sha }];
                    }
                    return [2 /*return*/, null];
                case 6:
                    error_57 = _a.sent();
                    console.error("GitHub fetch error:", error_57);
                    return [2 /*return*/, null];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function fetchGitHubREADME(owner, repo, token) {
    return __awaiter(this, void 0, void 0, function () {
        var readmeNames, _i, readmeNames_1, name_1, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    readmeNames = ['README.md', 'README.rst', 'README.txt', 'README'];
                    _i = 0, readmeNames_1 = readmeNames;
                    _a.label = 1;
                case 1:
                    if (!(_i < readmeNames_1.length)) return [3 /*break*/, 4];
                    name_1 = readmeNames_1[_i];
                    return [4 /*yield*/, fetchGitHubFile(owner, repo, name_1, token)];
                case 2:
                    result = _a.sent();
                    if (result) {
                        return [2 /*return*/, result.content];
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, null];
            }
        });
    });
}
// Create new workflow task (entry point)
app.post("/api/workflow/create", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, workflowType, requester, summary, inputs, _b, priority, taskId, now, task;
    return __generator(this, function (_c) {
        try {
            _a = req.body, workflowType = _a.workflowType, requester = _a.requester, summary = _a.summary, inputs = _a.inputs, _b = _a.priority, priority = _b === void 0 ? "normal" : _b;
            if (!workflowType || !requester) {
                res.status(400).json({ error: "workflowType and requester are required" });
                return [2 /*return*/];
            }
            taskId = generateTaskId();
            now = new Date().toISOString();
            task = {
                id: taskId,
                workflowType: workflowType,
                status: "queued",
                currentOwner: "receptionist",
                requester: requester,
                summary: summary || "",
                inputs: inputs || {},
                worklog: [{
                        timestamp: now,
                        agent: "system",
                        action: "ticket_created",
                        note: "New ".concat(workflowType, " workflow created by ").concat(requester)
                    }],
                artifacts: [],
                createdAt: now,
                priority: priority
            };
            workflowTasks.set(taskId, task);
            res.json({
                taskId: taskId,
                status: task.status,
                currentOwner: task.currentOwner,
                message: "Task created and queued for receptionist"
            });
        }
        catch (error) {
            console.error("Workflow create error:", error);
            res.status(500).json({ error: error.message || "Failed to create workflow task" });
        }
        return [2 /*return*/];
    });
}); });
// Receptionist processes the task
app.post("/api/workflow/receptionist/process", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taskId, extractedSummary, extractedInputs, task, now;
    return __generator(this, function (_b) {
        try {
            _a = req.body, taskId = _a.taskId, extractedSummary = _a.extractedSummary, extractedInputs = _a.extractedInputs;
            if (!taskId) {
                res.status(400).json({ error: "taskId is required" });
                return [2 /*return*/];
            }
            task = workflowTasks.get(taskId);
            if (!task) {
                res.status(404).json({ error: "Task not found" });
                return [2 /*return*/];
            }
            if (task.currentOwner !== "receptionist") {
                res.status(400).json({ error: "Task is currently owned by ".concat(task.currentOwner) });
                return [2 /*return*/];
            }
            now = new Date().toISOString();
            task.summary = extractedSummary || task.summary;
            task.inputs = __assign(__assign({}, task.inputs), extractedInputs);
            task.status = "in_progress";
            task.currentOwner = "clerk";
            task.worklog.push({
                timestamp: now,
                agent: "receptionist",
                action: "ticket_processed",
                note: "Extracted: ".concat(task.summary)
            });
            workflowTasks.set(taskId, task);
            res.json({
                taskId: taskId,
                status: task.status,
                currentOwner: task.currentOwner,
                message: "Task processed by receptionist, assigned to clerk"
            });
        }
        catch (error) {
            console.error("Receptionist process error:", error);
            res.status(500).json({ error: error.message || "Failed to process task" });
        }
        return [2 /*return*/];
    });
}); });
// Clerk assigns task to specialist
app.post("/api/workflow/clerk/assign", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taskId, specialistId, task, now;
    return __generator(this, function (_b) {
        try {
            _a = req.body, taskId = _a.taskId, specialistId = _a.specialistId;
            if (!taskId) {
                res.status(400).json({ error: "taskId is required" });
                return [2 /*return*/];
            }
            task = workflowTasks.get(taskId);
            if (!task) {
                res.status(404).json({ error: "Task not found" });
                return [2 /*return*/];
            }
            if (task.currentOwner !== "clerk") {
                res.status(400).json({ error: "Task is currently owned by ".concat(task.currentOwner) });
                return [2 /*return*/];
            }
            now = new Date().toISOString();
            task.status = "in_progress";
            task.currentOwner = specialistId || "specialist";
            task.worklog.push({
                timestamp: now,
                agent: "clerk",
                action: "assigned",
                note: "Assigned to ".concat(task.currentOwner)
            });
            workflowTasks.set(taskId, task);
            res.json({
                taskId: taskId,
                status: task.status,
                currentOwner: task.currentOwner,
                message: "Task assigned to ".concat(task.currentOwner)
            });
        }
        catch (error) {
            console.error("Clerk assign error:", error);
            res.status(500).json({ error: error.message || "Failed to assign task" });
        }
        return [2 /*return*/];
    });
}); });
// Specialist reviews and adds content
app.post("/api/workflow/specialist/review", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taskId, reviewResult, _b, approved, task, now;
    return __generator(this, function (_c) {
        try {
            _a = req.body, taskId = _a.taskId, reviewResult = _a.reviewResult, _b = _a.approved, approved = _b === void 0 ? true : _b;
            if (!taskId) {
                res.status(400).json({ error: "taskId is required" });
                return [2 /*return*/];
            }
            task = workflowTasks.get(taskId);
            if (!task) {
                res.status(404).json({ error: "Task not found" });
                return [2 /*return*/];
            }
            if (task.currentOwner !== "specialist") {
                res.status(400).json({ error: "Task is currently owned by ".concat(task.currentOwner) });
                return [2 /*return*/];
            }
            now = new Date().toISOString();
            task.status = approved ? "awaiting_review" : "failed";
            task.currentOwner = "clerk";
            task.worklog.push({
                timestamp: now,
                agent: "specialist",
                action: "reviewed",
                note: reviewResult || (approved ? "Approved" : "Rejected")
            });
            workflowTasks.set(taskId, task);
            res.json({
                taskId: taskId,
                status: task.status,
                currentOwner: task.currentOwner,
                message: approved ? "Task reviewed and awaiting delivery" : "Task rejected"
            });
        }
        catch (error) {
            console.error("Specialist review error:", error);
            res.status(500).json({ error: error.message || "Failed to review task" });
        }
        return [2 /*return*/];
    });
}); });
// Archivist archives the completed task
app.post("/api/workflow/archivist/complete", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taskId, response, _b, artifacts, task, now;
    return __generator(this, function (_c) {
        try {
            _a = req.body, taskId = _a.taskId, response = _a.response, _b = _a.artifacts, artifacts = _b === void 0 ? [] : _b;
            if (!taskId) {
                res.status(400).json({ error: "taskId is required" });
                return [2 /*return*/];
            }
            task = workflowTasks.get(taskId);
            if (!task) {
                res.status(404).json({ error: "Task not found" });
                return [2 /*return*/];
            }
            now = new Date().toISOString();
            task.status = "completed";
            task.response = response;
            task.artifacts = artifacts;
            task.worklog.push({
                timestamp: now,
                agent: "archivist",
                action: "completed",
                note: "Task completed and archived"
            });
            workflowTasks.set(taskId, task);
            res.json({
                taskId: taskId,
                status: task.status,
                response: task.response,
                message: "Task completed and archived"
            });
        }
        catch (error) {
            console.error("Archivist complete error:", error);
            res.status(500).json({ error: error.message || "Failed to complete task" });
        }
        return [2 /*return*/];
    });
}); });
// Get task status
app.get("/api/workflow/:taskId", function (req, res) {
    try {
        var taskId = req.params.taskId;
        var task = workflowTasks.get(taskId);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        res.json({ task: task });
    }
    catch (error) {
        console.error("Get workflow error:", error);
        res.status(500).json({ error: error.message || "Failed to get task" });
    }
});
// GitHub file retrieval endpoint (triggers full workflow)
app.post("/api/workflow/github/readme", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, owner, repo, requester, token, taskId, now, task, extractedSummary, readmeContent, truncatedContent, error_58;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                _a = req.body, owner = _a.owner, repo = _a.repo, requester = _a.requester, token = _a.token;
                if (!owner || !repo) {
                    res.status(400).json({ error: "owner and repo are required" });
                    return [2 /*return*/];
                }
                taskId = generateTaskId();
                now = new Date().toISOString();
                task = {
                    id: taskId,
                    workflowType: "github_readme_retrieval",
                    status: "queued",
                    currentOwner: "receptionist",
                    requester: requester || "user",
                    summary: "Retrieve README from ".concat(owner, "/").concat(repo),
                    inputs: { owner: owner, repo: repo },
                    worklog: [{
                            timestamp: now,
                            agent: "system",
                            action: "ticket_created",
                            note: "Request to retrieve README from ".concat(owner, "/").concat(repo)
                        }],
                    artifacts: [],
                    createdAt: now,
                    priority: "normal"
                };
                workflowTasks.set(taskId, task);
                // Emit: system -> receptionist (new task)
                return [4 /*yield*/, emitRouteToVisualizer("system", "receptionist", "task", taskId)];
            case 1:
                // Emit: system -> receptionist (new task)
                _b.sent();
                extractedSummary = "Fetch README.md from GitHub repository ".concat(owner, "/").concat(repo);
                task.summary = extractedSummary;
                task.status = "in_progress";
                task.currentOwner = "clerk";
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "receptionist",
                    action: "ticket_processed",
                    note: "Extracted: ".concat(extractedSummary)
                });
                // Emit: receptionist -> clerk (delegation)
                return [4 /*yield*/, emitRouteToVisualizer("receptionist", "clerk", "delegation", taskId)];
            case 2:
                // Emit: receptionist -> clerk (delegation)
                _b.sent();
                workflowTasks.set(taskId, task);
                // Step 3: Clerk assigns to specialist
                task.currentOwner = "specialist";
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "clerk",
                    action: "assigned",
                    note: "Assigned to specialist for retrieval"
                });
                // Emit: clerk -> specialist (escalation)
                return [4 /*yield*/, emitRouteToVisualizer("clerk", "specialist", "escalation", taskId)];
            case 3:
                // Emit: clerk -> specialist (escalation)
                _b.sent();
                workflowTasks.set(taskId, task);
                return [4 /*yield*/, fetchGitHubREADME(owner, repo, token)];
            case 4:
                readmeContent = _b.sent();
                if (!!readmeContent) return [3 /*break*/, 7];
                task.status = "failed";
                task.currentOwner = "clerk";
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "specialist",
                    action: "failed",
                    note: "Could not find README in ".concat(owner, "/").concat(repo)
                });
                task.response = "I couldn't find a README file in the repository ".concat(owner, "/").concat(repo, ". Please check the repository name and try again.");
                // Emit: specialist -> archivist (failure)
                return [4 /*yield*/, emitRouteToVisualizer("specialist", "archivist", "failure", taskId)];
            case 5:
                // Emit: specialist -> archivist (failure)
                _b.sent();
                // Emit: archivist -> executive (fallback)
                return [4 /*yield*/, emitRouteToVisualizer("archivist", "executive", "fallback", taskId)];
            case 6:
                // Emit: archivist -> executive (fallback)
                _b.sent();
                workflowTasks.set(taskId, task);
                res.json({
                    taskId: taskId,
                    status: task.status,
                    response: task.response,
                    worklog: task.worklog
                });
                return [2 /*return*/];
            case 7: 
            // Step 5: Specialist approves with content
            // Emit: specialist -> archivist (task complete)
            return [4 /*yield*/, emitRouteToVisualizer("specialist", "archivist", "task", taskId)];
            case 8:
                // Step 5: Specialist approves with content
                // Emit: specialist -> archivist (task complete)
                _b.sent();
                truncatedContent = readmeContent.length > 5000
                    ? readmeContent.substring(0, 5000) + "\n\n... (truncated)"
                    : readmeContent;
                task.artifacts.push({ type: "file", content: readmeContent });
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "specialist",
                    action: "reviewed",
                    note: "Successfully retrieved README"
                });
                workflowTasks.set(taskId, task);
                // Step 6: Archivist completes
                task.status = "completed";
                task.currentOwner = "archivist";
                task.response = "Here's the README from ".concat(owner, "/").concat(repo, ":\n\n").concat(truncatedContent);
                task.worklog.push({
                    timestamp: new Date().toISOString(),
                    agent: "archivist",
                    action: "completed",
                    note: "Task completed and archived"
                });
                workflowTasks.set(taskId, task);
                res.json({
                    taskId: taskId,
                    status: task.status,
                    summary: task.summary,
                    response: task.response,
                    artifacts: task.artifacts,
                    worklog: task.worklog
                });
                return [3 /*break*/, 10];
            case 9:
                error_58 = _b.sent();
                console.error("GitHub README workflow error:", error_58);
                res.status(500).json({ error: error_58.message || "Failed to retrieve README" });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Health check for workflow system
app.get("/api/workflow/health", function (req, res) {
    res.json({
        status: "healthy",
        activeTasks: workflowTasks.size,
        timestamp: new Date().toISOString()
    });
});
// ============================================================================
// OpenCode Audit Integration
// ============================================================================
var child_process_1 = require("child_process");
var OPENCODE_AUDIT_BIN = process.env.OPENCOD_AUDIT_BIN || "path.resolve(process.cwd(), "..", "tools", "opencode_audit")/opencode_audit.py";
var AUDIT_DATA_DIR = path_1.default.resolve(process.cwd(), "data/audits");
var PROMPT_CARDS_DIR = path_1.default.resolve(process.cwd(), "data/prompt_cards");
function ensureDir(dir) {
    var fs = require("fs");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function generatePromptCardId() {
    return "pc-".concat(Date.now().toString(36), "-").concat(Math.random().toString(36).slice(2, 6));
}
// Create new audit (POST /api/audit/create)
app.post("/api/audit/create", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, repo, _b, scope, _c, output_format, _d, priority, promptCardId, now, promptCard, cardPath_1, fs_2, e_6, outputDir_1, child, error_59;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 5, , 6]);
                _a = req.body, repo = _a.repo, _b = _a.scope, scope = _b === void 0 ? {} : _b, _c = _a.output_format, output_format = _c === void 0 ? "mermaid" : _c, _d = _a.priority, priority = _d === void 0 ? "normal" : _d;
                if (!repo) {
                    return [2 /*return*/, res.status(400).json({ error: "repo is required" })];
                }
                ensureDir(AUDIT_DATA_DIR);
                ensureDir(PROMPT_CARDS_DIR);
                promptCardId = generatePromptCardId();
                now = new Date().toISOString();
                promptCard = {
                    id: promptCardId,
                    kind: "code_audit",
                    origin: "pixel_office",
                    repo: repo,
                    scope: {
                        file_tree_depth: scope.file_tree_depth || 4,
                        include_tests: scope.include_tests !== false,
                        exclude_patterns: scope.exclude_patterns || ["node_modules/**", ".git/**", "dist/**"]
                    },
                    artifacts_expected: {
                        audit_report: { filename: "audit_report.md", format: "md", sections: ["overview", "architecture", "patterns", "risks", "todos"] },
                        file_tree: { filename: "file_tree.md", format: "md", max_depth: scope.file_tree_depth || 4 },
                        logic_flow_diagram: { filename: "logic_flow.mmd", format: output_format }
                    },
                    constraints: {
                        max_time_minutes: scope.max_time_minutes || 30,
                        max_files: scope.max_files || 500
                    },
                    status: "queued",
                    created_at: now,
                    updated_at: now,
                    worklog: [{ timestamp: now, agent: "pixel_office", action: "created", note: "Audit requested" }],
                    artifacts: {}
                };
                cardPath_1 = path_1.default.join(PROMPT_CARDS_DIR, "".concat(promptCardId, ".json"));
                fs_2 = require("fs");
                fs_2.writeFileSync(cardPath_1, JSON.stringify(promptCard, null, 2));
                _e.label = 1;
            case 1:
                _e.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetch("http://localhost:5006/api/route", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            from: "PIXEL",
                            to: "OPENC",
                            route_type: "task",
                            task_type: "code_audit",
                            task_id: promptCardId
                        })
                    })];
            case 2:
                _e.sent();
                return [3 /*break*/, 4];
            case 3:
                e_6 = _e.sent();
                console.log("[Audit] Router visualizer not available");
                return [3 /*break*/, 4];
            case 4:
                outputDir_1 = path_1.default.join(AUDIT_DATA_DIR, promptCardId);
                ensureDir(outputDir_1);
                child = (0, child_process_1.spawn)("python3", [OPENCODE_AUDIT_BIN, "--prompt-card", cardPath_1, "--output-dir", outputDir_1], {
                    stdio: ["ignore", "pipe", "pipe"]
                });
                child.stdout.on("data", function (data) {
                    console.log("[Audit]", data.toString().trim());
                });
                child.stderr.on("data", function (data) {
                    console.error("[Audit Error]", data.toString().trim());
                });
                child.on("close", function (code) {
                    // Update prompt card status
                    var fs = require("fs");
                    var updatedCard = JSON.parse(fs.readFileSync(cardPath_1, "utf-8"));
                    if (code === 0) {
                        // Read result and update
                        try {
                            var resultPath = path_1.default.join(outputDir_1, "result.json");
                            if (fs.existsSync(resultPath)) {
                                var result = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
                                updatedCard.artifacts = result.artifacts || {};
                                updatedCard.status = "completed";
                            }
                            else {
                                // Check for artifacts directly
                                var artifacts_1 = {};
                                ["audit_report.md", "file_tree.md", "logic_flow.mmd"].forEach(function (f) {
                                    var fpath = path_1.default.join(outputDir_1, f);
                                    if (fs.existsSync(fpath)) {
                                        artifacts_1[f] = fpath;
                                    }
                                });
                                if (Object.keys(artifacts_1).length > 0) {
                                    updatedCard.artifacts = artifacts_1;
                                    updatedCard.status = "completed";
                                }
                                else {
                                    updatedCard.status = "completed";
                                }
                            }
                        }
                        catch (e) {
                            updatedCard.status = "completed";
                        }
                    }
                    else {
                        updatedCard.status = "failed";
                        updatedCard.error = "Process exited with code ".concat(code);
                    }
                    updatedCard.updated_at = new Date().toISOString();
                    updatedCard.worklog.push({
                        timestamp: updatedCard.updated_at,
                        agent: "opencode_audit",
                        action: updatedCard.status,
                        note: "Audit ".concat(updatedCard.status)
                    });
                    fs.writeFileSync(cardPath_1, JSON.stringify(updatedCard, null, 2));
                });
                res.json({
                    prompt_card_id: promptCardId,
                    status: "queued",
                    repo: repo,
                    created_at: now
                });
                return [3 /*break*/, 6];
            case 5:
                error_59 = _e.sent();
                console.error("Audit create error:", error_59);
                res.status(500).json({ error: error_59.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Get audit status (GET /api/audit/:prompt_card_id)
app.get("/api/audit/:prompt_card_id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var prompt_card_id, fs_3, cardPath, card, artifacts, _i, _a, _b, name_2, filepath;
    return __generator(this, function (_c) {
        try {
            prompt_card_id = req.params.prompt_card_id;
            fs_3 = require("fs");
            cardPath = path_1.default.join(PROMPT_CARDS_DIR, "".concat(prompt_card_id, ".json"));
            if (!fs_3.existsSync(cardPath)) {
                return [2 /*return*/, res.status(404).json({ error: "Audit not found" })];
            }
            card = JSON.parse(fs_3.readFileSync(cardPath, "utf-8"));
            artifacts = {};
            if (card.status === "completed" && card.artifacts) {
                for (_i = 0, _a = Object.entries(card.artifacts); _i < _a.length; _i++) {
                    _b = _a[_i], name_2 = _b[0], filepath = _b[1];
                    if (fs_3.existsSync(filepath)) {
                        artifacts[name_2] = {
                            path: filepath,
                            content: fs_3.readFileSync(filepath, "utf-8").substring(0, 5000)
                        };
                    }
                }
            }
            res.json({
                prompt_card_id: card.id,
                repo: card.repo,
                status: card.status,
                created_at: card.created_at,
                updated_at: card.updated_at,
                worklog: card.worklog,
                artifacts: artifacts,
                error: card.error
            });
        }
        catch (error) {
            console.error("Audit get error:", error);
            res.status(500).json({ error: error.message });
        }
        return [2 /*return*/];
    });
}); });
// List audits (GET /api/audit)
app.get("/api/audit", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_5, _b, limit, fs_4, files, cards, _i, files_1, file, card;
    return __generator(this, function (_c) {
        try {
            _a = req.query, status_5 = _a.status, _b = _a.limit, limit = _b === void 0 ? 20 : _b;
            fs_4 = require("fs");
            ensureDir(PROMPT_CARDS_DIR);
            files = fs_4.readdirSync(PROMPT_CARDS_DIR).filter(function (f) { return f.endsWith(".json"); });
            cards = [];
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                try {
                    card = JSON.parse(fs_4.readFileSync(path_1.default.join(PROMPT_CARDS_DIR, file), "utf-8"));
                    if (card.kind === "code_audit") {
                        cards.push(card);
                    }
                }
                catch (e) {
                    // Skip invalid files
                }
            }
            // Filter by status if provided
            if (status_5) {
                cards = cards.filter(function (c) { return c.status === status_5; });
            }
            // Sort by date, newest first
            cards.sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
            // Limit results
            cards = cards.slice(0, parseInt(limit) || 20);
            res.json({
                audits: cards.map(function (c) { return ({
                    prompt_card_id: c.id,
                    repo: c.repo,
                    status: c.status,
                    created_at: c.created_at,
                    updated_at: c.updated_at
                }); }),
                total: cards.length
            });
        }
        catch (error) {
            console.error("Audit list error:", error);
            res.status(500).json({ error: error.message });
        }
        return [2 /*return*/];
    });
}); });
// ============================================================================
// Phase D Bind Patch: Repo Question Handler
// ============================================================================
var repoQuestionHandler_js_1 = require("./services/repoQuestionHandler.js");
app.post("/api/repo/ask", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, message, _b, agentName, _c, createTask, result, task, taskErr_1, formattedAnswer, error_60;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 6, , 7]);
                _a = req.body, message = _a.message, _b = _a.agentName, agentName = _b === void 0 ? "clerk" : _b, _c = _a.createTask, createTask = _c === void 0 ? false : _c;
                if (!message) {
                    return [2 /*return*/, res.status(400).json({ error: "Message is required" })];
                }
                return [4 /*yield*/, (0, repoQuestionHandler_js_1.handleRepoQuestion)(message, { createTask: createTask })];
            case 1:
                result = _d.sent();
                if (!result.isRepoQuestion) {
                    return [2 /*return*/, res.status(200).json({
                            isRepoQuestion: false,
                            answer: null,
                            message: "This doesn't appear to be a repo question"
                        })];
                }
                if (!(createTask && result.questionType)) return [3 /*break*/, 5];
                _d.label = 2;
            case 2:
                _d.trys.push([2, 4, , 5]);
                return [4 /*yield*/, index_js_2.tasksV2.create({
                        title: "Repo question: ".concat(result.questionType),
                        description: message,
                        status: "inbox",
                        priority: "P3",
                        tags: ["repo", "question", result.questionType],
                        source: "chat",
                    })];
            case 3:
                task = _d.sent();
                result.taskCreated = true;
                return [3 /*break*/, 5];
            case 4:
                taskErr_1 = _d.sent();
                console.error("[RepoQuestionHandler] Failed to create task:", taskErr_1);
                return [3 /*break*/, 5];
            case 5:
                formattedAnswer = (0, repoQuestionHandler_js_1.formatAnswerForOffice)(result, agentName);
                res.json({
                    isRepoQuestion: result.isRepoQuestion,
                    questionType: result.questionType,
                    answer: result.answer,
                    formattedAnswer: formattedAnswer,
                    taskCreated: result.taskCreated || false,
                    metadata: result.metadata,
                });
                return [3 /*break*/, 7];
            case 6:
                error_60 = _d.sent();
                console.error("Repo question error:", error_60);
                res.status(500).json({ error: error_60.message || "Failed to process repo question" });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.get("/api/repo/status", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, fetchRepoStatus, extractRepoInfo, repoInfo, status_6, error_61;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require("./services/repoQuestionHandler.js"); })];
            case 1:
                _a = _b.sent(), fetchRepoStatus = _a.fetchRepoStatus, extractRepoInfo = _a.extractRepoInfo;
                repoInfo = extractRepoInfo({});
                return [4 /*yield*/, fetchRepoStatus({
                        owner: repoInfo.owner,
                        repo: repoInfo.repo,
                    })];
            case 2:
                status_6 = _b.sent();
                res.json({
                    configured: !!(process.env.GITHUB_TOKEN && process.env.SAFE_SCRUM_REPO),
                    repo: repoInfo.repo !== "unknown" ? repoInfo : null,
                    status: status_6,
                });
                return [3 /*break*/, 4];
            case 3:
                error_61 = _b.sent();
                console.error("Repo status error:", error_61);
                res.status(500).json({ error: error_61.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Agent2Agent Issue Monitor Endpoint
app.post("/api/coolertalk/issues", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var keywords, sessionsDir_2, files, sessions_5, issues, _loop_2, _i, sessions_4, session;
    return __generator(this, function (_a) {
        try {
            keywords = req.body.keywords || [];
            sessionsDir_2 = path_1.default.resolve("data/cooler_sessions");
            if (!fs_1.default.existsSync(sessionsDir_2)) {
                res.json({ issues: [] });
                return [2 /*return*/];
            }
            files = fs_1.default.readdirSync(sessionsDir_2).filter(function (f) { return f.endsWith(".json"); });
            sessions_5 = files.map(function (file) {
                var filePath = path_1.default.join(sessionsDir_2, file);
                try {
                    return JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
                }
                catch (_a) {
                    return null;
                }
            }).filter(Boolean).sort(function (a, b) {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }).slice(0, 20);
            issues = [];
            _loop_2 = function (session) {
                var topicLower = (session.topic || '').toLowerCase();
                var participants = session.participants || [];
                // Check if topic matches any keywords
                var hasKeyword = keywords.some(function (kw) {
                    return topicLower.includes(kw.toLowerCase());
                });
                if (hasKeyword) {
                    // Determine severity based on keywords
                    var severity = 'low';
                    if (/security|breach|hack|attack|vulnerability|leak/.test(topicLower)) {
                        severity = 'critical';
                    }
                    else if (/urgent|emergency|critical|error|fail/.test(topicLower)) {
                        severity = 'high';
                    }
                    else if (/warning|alert|threat/.test(topicLower)) {
                        severity = 'medium';
                    }
                    issues.push({
                        id: session.id,
                        topic: session.topic,
                        agents: participants,
                        timestamp: new Date(session.createdAt || Date.now()).getTime(),
                        severity: severity,
                    });
                }
            };
            for (_i = 0, sessions_4 = sessions_5; _i < sessions_4.length; _i++) {
                session = sessions_4[_i];
                _loop_2(session);
            }
            res.json({ issues: issues.slice(0, 10) });
        }
        catch (error) {
            console.error("Issues fetch error:", error);
            res.json({ issues: [] });
        }
        return [2 /*return*/];
    });
}); });
