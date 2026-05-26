import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { rebuildDocIndexes } from "./docs/docIndex.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 4173;
app.use(cors());
app.use(express.json());
// Serve static files from public directory
const PUBLIC_DIR = path.resolve(__dirname, "../../public");
app.use(express.static(PUBLIC_DIR));
// Model Health Dashboard page
app.get("/model-health", (_req, res) => {
    const htmlPath = path.join(process.cwd(), "public", "model-health.html");
    res.sendFile(htmlPath);
});
// Serve NVIDIA models shortlist
app.get("/api/nvidia/models", async (_req, res) => {
    try {
        const configPath = path.resolve(__dirname, "../../config/nvidia-models.json");
        const configData = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configData);
        res.json(config);
    }
    catch (err) {
        console.error("Failed to load NVIDIA models config:", err);
        res.status(500).json({ error: "Failed to load models config" });
    }
});
// Serve available Ollama models
app.get("/api/ollama/models", async (_req, res) => {
    try {
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        const response = await fetch(`${ollamaUrl}/api/tags`, {
            signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) {
            res.status(500).json({ error: "Failed to fetch Ollama models" });
            return;
        }
        const data = await response.json();
        const models = (data.models || []).map((m) => ({
            id: m.name,
            name: m.name.split(':')[0],
            size: m.size
        }));
        res.json({ models });
    }
    catch (err) {
        console.error("Failed to fetch Ollama models:", err);
        res.status(500).json({ error: "Failed to fetch Ollama models" });
    }
});
// Serve handoff JSON file
app.get("/handoff/opencode-local-agents.json", (_req, res) => {
    const handoffPath = "path.resolve(process.cwd(), "../.handoff")/opencode-local-agents.json";
    const publicPath = path.join(__dirname, "../public/handoff/opencode-local-agents.json");
    let data = null;
    if (fs.existsSync(handoffPath)) {
        data = fs.readFileSync(handoffPath, "utf-8");
    }
    else if (fs.existsSync(publicPath)) {
        data = fs.readFileSync(publicPath, "utf-8");
    }
    if (data) {
        // Parse and deduplicate by id
        const parsed = JSON.parse(data);
        const uniqueMap = new Map();
        for (const card of parsed) {
            if (!uniqueMap.has(card.id)) {
                uniqueMap.set(card.id, card);
            }
        }
        const unique = Array.from(uniqueMap.values());
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(unique));
    }
    else {
        res.status(404).json({ error: "Handoff file not found" });
    }
});
const VISUALIZER_URL = process.env.VISUALIZER_URL || "http://localhost:5006";
const agentNodeMap = {
    system: "FRONT",
    receptionist: "FRONT",
    clerk: "OPEN",
    specialist: "ZERO",
    archivist: "HERMIT",
    executive: "LESLIE",
    custodian: "IRON",
    triage: "TRIAGE",
};
async function emitRouteToVisualizer(fromAgent, toAgent, routeType = "task", taskId = "") {
    const fromNode = agentNodeMap[fromAgent] || fromAgent.toUpperCase().slice(0, 6);
    const toNode = agentNodeMap[toAgent] || toAgent.toUpperCase().slice(0, 6);
    try {
        await fetch(`${VISUALIZER_URL}/api/route`, {
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
        });
        console.log(`[Visualizer] ${fromNode} -> ${toNode} (${routeType})`);
    }
    catch (err) {
        console.warn(`[Visualizer] Failed to emit route: ${err}`);
    }
    agentRoutesUsed.inc({ from_agent: fromAgent, to_agent: toAgent });
}
import { getPool, getConfig } from "./pixel_memory/config.js";
import { fetchCurrentPrice, fetchPriceForDate } from "./services/priceFeed.js";
import { createAnalyzer, DataSource } from "./sherlock_analysis/index.js";
import { ConferenceRoomStorage, createConferenceRoomRouter } from "./conferenceroom/routes.js";
import { callChatModelForRole } from "./roleModels.js";
// Flywheel imports (keep for potential future use)
// import { openai } from "./llm/client.js";
// import { ensureDataDir as ensureResidueDir, depositResidue, getActiveResidues } from "./flywheel/residueLogger";
// import { getActiveHeat } from "./flywheel/reviewHeatEngine";
// import { promoteResidues } from "./flywheel/promotionEngine";
// Cooler Talk Session Storage (PostgreSQL/MySQL)
async function ensureCoolerSessionsTable() {
    try {
        const pool = await getPool();
        const dbType = getConfig().db.type;
        if (dbType === "postgres") {
            await pool.query(`
        CREATE TABLE IF NOT EXISTS cooler_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          session_type VARCHAR(50) NOT NULL,
          topic VARCHAR(500),
          participants TEXT[],
          utterances JSONB,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
        }
        else {
            await pool.query(`
        CREATE TABLE IF NOT EXISTS cooler_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          session_type VARCHAR(50) NOT NULL,
          topic VARCHAR(500),
          participants TEXT,
          utterances JSON,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
        }
        console.log("[Cooler] cooler_sessions table ready");
    }
    catch (err) {
        console.warn("[Cooler] Could not create sessions table:", err);
    }
}
function updateIndexFile(dirPath, filename, title) {
    try {
        const indexPath = path.join(dirPath, "index.md");
        let content = "";
        if (fs.existsSync(indexPath)) {
            content = fs.readFileSync(indexPath, "utf-8");
        }
        else {
            content = "# Index\n\n";
        }
        // Check if entry already exists
        const entryLink = `- [${title}](./${filename})`;
        if (!content.includes(entryLink)) {
            // Add entry after the title line
            const lines = content.split("\n");
            const insertIdx = lines.findIndex(l => l.startsWith("# "));
            if (insertIdx !== -1) {
                lines.splice(insertIdx + 1, 0, "", entryLink);
                content = lines.join("\n");
                fs.writeFileSync(indexPath, content, "utf-8");
                console.log(`[Index] Updated ${indexPath}`);
            }
        }
    }
    catch (err) {
        console.error(`[Index] Failed to update ${dirPath}/index.md:`, err);
    }
}
async function saveCoolerSession(sessionId, sessionType, topic, participants, utterances, metadata) {
    try {
        const pool = await getPool();
        const dbType = getConfig().db.type;
        const metadataJson = JSON.stringify(metadata || {});
        const utterancesJson = JSON.stringify(utterances);
        if (dbType === "postgres") {
            await pool.query(`INSERT INTO cooler_sessions (session_id, session_type, topic, participants, utterances, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (session_id) DO UPDATE SET
           topic = $3, participants = $4, utterances = $5, metadata = $6, updated_at = NOW()`, [sessionId, sessionType, topic, participants, utterancesJson, metadataJson]);
        }
        else {
            await pool.query(`INSERT INTO cooler_sessions (session_id, session_type, topic, participants, utterances, metadata, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           topic = VALUES(topic), participants = VALUES(participants), utterances = VALUES(utterances), 
           metadata = VALUES(metadata), updated_at = NOW()`, [sessionId, sessionType, topic, participants.join(","), utterancesJson, metadataJson]);
        }
        console.log(`[Cooler] Saved session ${sessionId} to database`);
    }
    catch (err) {
        console.error("[Cooler] Failed to save session:", err);
    }
}
async function getCoolerSessions(limit = 20, sessionType) {
    try {
        const pool = await getPool();
        const dbType = getConfig().db.type;
        let query = "SELECT * FROM cooler_sessions";
        const params = [];
        if (sessionType) {
            query += " WHERE session_type = ?";
            params.push(sessionType);
        }
        query += " ORDER BY created_at DESC LIMIT ?";
        params.push(limit);
        if (dbType === "postgres") {
            query = query.replace("?", (i) => `$${i}`);
            const result = await pool.query(query, params);
            return result.rows;
        }
        else {
            const [rows] = await pool.query(query, params);
            return rows;
        }
    }
    catch (err) {
        console.error("[Cooler] Failed to get sessions:", err);
        return [];
    }
}
// Initialize flywheel system on startup
const initializeFlywheel = async () => {
    try {
        ensureCoolerSessionsTable();
    }
    catch (err) {
        ensureResidueDir();
        console.log("[Flywheel] System initialized");
        console.error("[Flywheel] Initialization error:", err);
    }
};
// Initialize flywheel when server starts
initializeFlywheel();
// Health check
app.get("/api/workflow/health", (_req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});
// ============================================================================
// Metrics Endpoint (Prometheus)
// ============================================================================
import client from "prom-client";
// Create a Registry
const register = new client.Registry();
// Add default metrics
client.collectDefaultMetrics({ register });
// Custom metrics
const agentTokensUsed = new client.Counter({
    name: "pixel_office_agent_tokens_total",
    help: "Tokens by agent and channel (inner vs outer narration).",
    labelNames: ["agent", "channel"],
    registers: [register]
});
const httpRequestsTotal = new client.Counter({
    name: "pixel_office_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [register]
});
const httpRequestDuration = new client.Histogram({
    name: "pixel_office_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2],
    registers: [register]
});
const llmRequestsTotal = new client.Counter({
    name: "pixel_office_llm_requests_total",
    help: "Total number of LLM requests",
    labelNames: ["provider", "model"],
    registers: [register]
});
const stigmergyDepositTotal = new client.Counter({
    name: "pixel_office_stigmergy_deposit_total",
    help: "Total number of stigmergy deposits",
    labelNames: ["type", "status"],
    registers: [register]
});
const coolerRunTurnTotal = new client.Counter({
    name: "pixel_office_cooler_run_turn_total",
    help: "Total number of cooler run-turn requests",
    labelNames: ["location", "status"],
    registers: [register]
});
const loopDetectionGauge = new client.Gauge({
    name: "pixel_office_loop_detection",
    help: "Loop detection status per agent (0=healthy, 1=looping)",
    labelNames: ["agent_id", "agent_name"],
    registers: [register]
});
const agentRoutesUsed = new client.Counter({
    name: "pixel_office_routes_total",
    help: "Routing hops between agents.",
    labelNames: ["from_agent", "to_agent"],
    registers: [register]
});
const agentToolCallsUsed = new client.Counter({
    name: "pixel_office_agent_tool_calls_total",
    help: "Tool calls initiated by an agent.",
    labelNames: ["agent"],
    registers: [register]
});
function trackLlmRequest(provider, model) {
    llmRequestsTotal.inc({ provider, model });
}
// Track LLM requests for chat endpoint
const pixelOfficeUp = new client.Gauge({
    name: "pixel_office_up",
    help: "Pixel Office service up status",
    registers: [register]
});
// Middleware to track HTTP requests
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || "unknown";
        httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode.toString() });
        httpRequestDuration.observe({ method: req.method, route }, duration);
    });
    next();
});
// Metrics endpoint
app.get("/metrics", async (_req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    }
    catch (ex) {
        res.status(500).end(ex);
    }
});
// Set up gauge
pixelOfficeUp.set(1);
// Model availability metrics
const modelStatusGauge = new client.Gauge({
    name: "pixel_office_model_available",
    help: "Whether a model is available (1) or not (0)",
    labelNames: ["provider", "model", "endpoint"],
    registers: [register]
});
const modelCountGauge = new client.Gauge({
    name: "pixel_office_models_total",
    help: "Total number of available models",
    registers: [register]
});
// Agent availability metrics
const agentStatusGauge = new client.Gauge({
    name: "pixel_office_agent_available",
    help: "Whether an agent is available (1) or not (0)",
    labelNames: ["agent_id", "agent_name", "role"],
    registers: [register]
});
const agentCountGauge = new client.Gauge({
    name: "pixel_office_agents_total",
    help: "Total number of agents",
    labelNames: ["status"],
    registers: [register]
});
// Function to check Ollama models
async function updateModelMetrics() {
    try {
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        const response = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            // Clear old model metrics
            const existing = await register.getSingleMetric('pixel_office_model_available');
            if (existing) {
                register.removeSingleMetric(existing);
            }
            let availableCount = 0;
            for (const model of models) {
                const modelName = model.name.replace(':latest', '').replace(':latest', '');
                modelStatusGauge.set({ provider: "ollama", model: modelName, endpoint: "localhost:11434" }, 1);
                availableCount++;
            }
            modelCountGauge.set(availableCount);
        }
    }
    catch (err) {
        console.error("[Metrics] Failed to get Ollama models:", err);
        modelCountGauge.set(0);
    }
}
// Function to check agent status from agent-cards.json
async function updateAgentMetrics() {
    try {
        const agentCardsPath = path.resolve("config/agent-cards.json");
        const agentData = JSON.parse(fs.readFileSync(agentCardsPath, "utf-8"));
        const agents = agentData.agents || [];
        let activeCount = 0;
        for (const agent of agents) {
            const status = agent.status === "active" ? 1 : 0;
            agentStatusGauge.set({
                agent_id: agent.id,
                agent_name: agent.name,
                role: agent.role
            }, status);
            if (status === 1)
                activeCount++;
        }
        agentCountGauge.set({ status: "active" }, activeCount);
        agentCountGauge.set({ status: "total" }, agents.length);
    }
    catch (err) {
        console.error("[Metrics] Failed to get agent status:", err);
    }
}
// Update model and agent metrics periodically
setInterval(updateModelMetrics, 30000);
setInterval(updateAgentMetrics, 30000);
// Initial update
updateModelMetrics().then(updateAgentMetrics);
// Stigmergy Metrics (per thought_speech_stigmergy.md)
const deskStigmergyGauge = new client.Gauge({
    name: "pixel_office_desk_stigmergy",
    help: "Desk stigmergy heat values",
    labelNames: ["desk_id", "heat_type"],
    registers: [register]
});
const stigmergyTraceGauge = new client.Gauge({
    name: "pixel_office_stigmergy_traces",
    help: "Active stigmergy trace count by type",
    labelNames: ["trace_type"],
    registers: [register]
});
// Note: loopDetectionGauge removed - can add when loop state tracking is needed
setInterval(() => {
    // Update desk stigmergy metrics
    Object.keys(deskStigmergyState).forEach(deskId => {
        const state = deskStigmergyState[deskId];
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "loopHeat" }, Math.min(1, Math.max(0, state.loopHeat)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "reviewHeat" }, Math.min(1, Math.max(0, state.reviewHeat)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "speechActivity" }, Math.min(1, Math.max(0, state.speechActivity)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "taskShadow" }, Math.min(1, Math.max(0, state.taskShadow)));
        deskStigmergyGauge.set({ desk_id: deskId, heat_type: "observerAttention" }, Math.min(1, Math.max(0, state.observerAttention)));
        // Also update loop detection gauge (1 = looping, 0 = healthy)
        const agentId = deskId.replace("desk-", "agent-");
        const isLooping = state.loopHeat > 0.5 ? 1 : 0;
        loopDetectionGauge.set({ agent_id: agentId, agent_name: deskId }, isLooping);
    });
    // Update stigmergy trace counts
    const traces = getActiveTraces();
    const typeCounts = {};
    traces.forEach(t => {
        typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
        stigmergyTraceGauge.set({ trace_type: type }, count);
    });
}, 15000);
import { depositTrace, getActiveTraces, calculateSocialPotential, getAgentWeightsWithShadows } from "./cooler/stigmergy.js";
function selectWeightedParticipants(participants, count) {
    if (participants.length <= count)
        return participants;
    const weights = getAgentWeightsWithShadows(participants);
    const weighted = participants.map(p => ({ name: p, weight: weights.get(p.toLowerCase().replace(/ /g, "-")) || 1 }));
    weighted.sort((a, b) => b.weight - a.weight);
    return weighted.slice(0, count).map(w => w.name);
}
import { getActiveHeat } from "./cooler/reviewHeat.js";
import { createScrumSession, advanceScrumSession } from "./scrum/scrumController.js";
import { runRoomTurn, exportRoomSession } from "./services/coolerTalkService.js";
import { generateFn, getLastUsedModel } from "./services/llmGenerateFn.js";
import { maybeCreateScrumCandidate, listScrumCandidates, approveScrumCandidate, rejectScrumCandidate } from "./cooler/scrumCandidates.js";
import { createSafeScrumRepoClient } from "./github/safeScrumRepoClient.js";
import { loadScrumSession, previewScrumReport, exportScrumReport, isSessionComplete, } from "./scrum/scrumExporter.js";
let currentScrumSession = null;
const PIXEL_ME_URL = "http://127.0.0.1:5001";
const KB_SERVER_URL = "http://127.0.0.1:8787";
app.use((req, res, next) => {
    const agent = req.header("X-Office-Agent");
    const client = req.header("X-Office-Client");
    if (agent || client) {
        console.log(`[Office] Request from Agent: ${agent}, Client: ${client}`);
    }
    next();
});
// Cooler Talk API Routes
app.post("/api/rooms/:location/cooler/run-turn", async (req, res) => {
    const { location } = req.params;
    try {
        let { topic, participants, userMessage } = req.body;
        if (!location) {
            coolerRunTurnTotal.inc({ location: "unknown", status: "400" });
            return res.status(400).json({ error: "Location is required" });
        }
        // Memory Integration: If no topic provided, try to pull a recent user-saved topic
        if (!topic || topic === "General discussion") {
            try {
                const recentTopics = await runDbQuery("SELECT title FROM mem_entries WHERE kind = 'user_topic' ORDER BY timestamp DESC LIMIT 1");
                if (recentTopics && recentTopics.length > 0) {
                    topic = `User mentioned: ${recentTopics[0].title}`;
                    console.log(`[Memory] Injecting user topic into cooler: ${topic}`);
                }
            }
            catch (err) {
                console.warn("[Memory] Failed to fetch recent user topic:", err);
            }
        }
        // Use stigmergy-weighted selection if no participants provided
        if (!participants || participants.length === 0) {
            const COOLER_PARTICIPANTS = ["FrontDesk", "OpenClaw", "IronClaw", "LeslieClaw", "ZeroClaw", "Sherlobster", "HermitClaw"];
            participants = selectWeightedParticipants(COOLER_PARTICIPANTS, 4);
        }
        const result = await runRoomTurn(location, {
            topic: topic || "General discussion",
            participants,
            userMessage: userMessage || "",
            generateFn
        });
        // Save session to database
        if (result.session) {
            const utterances = (result.session.utterances || []).map((u) => ({
                agentId: u.speaker || "",
                text: u.text || "",
                timestamp: u.timestamp || Date.now()
            }));
            saveCoolerSession(result.session.id, "cooler", result.session.topic || topic, result.session.participants || participants, utterances, { location, turnCount: (result.session.utterances || []).length });
        }
        // Save markdown file for the session (unique filename, no overwrites)
        let coolerMarkdownPath;
        let scrumCandidateSummary = null;
        try {
            let exportData = exportRoomSession(location);
            console.log(`[CoolerTalk] exportRoomSession(${location}) returned:`, exportData ? "data" : "null");
            console.log(`[CoolerTalk] result.session.id:`, result.session.id);
            // If exportData is null but we have a session, try to get markdown from result
            if (!exportData || !exportData.markdown) {
                // Build markdown from result data
                const utterances = result.session.utterances || [];
                const md = utterances.map((u) => `- **${u.speaker || 'Unknown'}**: ${u.text || ''}`).join('\n');
                exportData = {
                    markdown: `## Conversation

${md}

**Participants:** ${(result.session.participants || []).join(', ')}
**Topic:** ${result.session.topic || topic || 'General discussion'}`,
                    json: result.session
                };
                console.log(`[CoolerTalk] Built markdown from result`);
            }
            if (exportData && exportData.markdown) {
                const sessionId = result.session.id;
                const timestamp = new Date().toISOString();
                const safeStamp = timestamp.replace(/[:.]/g, "-");
                const filename = `${safeStamp}_cooler-${sessionId}.md`;
                // Save to docs/cooler folder
                const coolerDocPath = path.resolve("process.cwd()/docs/cooler");
                const opencodeDocPath = path.resolve("path.resolve(process.cwd(), "..", ".openclaw")/workspace-main/docs/opencode");
                const hermitclawDocPath = path.resolve("path.resolve(process.cwd(), "..", ".openclaw")/hermitclaw_workspace/notes");
                const hermitclawResearchPath = path.resolve("path.resolve(process.cwd(), "..", ".openclaw")/hermitclaw_workspace/research");
                const hermitclawProjectsPath = path.resolve("path.resolve(process.cwd(), "..", ".openclaw")/hermitclaw_workspace/projects");
                // Ensure directories exist
                [opencodeDocPath, coolerDocPath].forEach(dir => {
                    if (!fs.existsSync(dir))
                        fs.mkdirSync(dir, { recursive: true });
                });
                const mdContent = exportData.markdown;
                const frontmatter = `---
` +
                    `title: "Cooler Talk - ${result.session.topic || location}"
` +
                    `date: "${timestamp}"
` +
                    `participants: "${(result.session.participants || []).join(', ')}"
` +
                    `location: "${location}"
` +
                    `session_id: "${sessionId}"
` +
                    `---

` +
                    `${mdContent}

---
` +
                    `*Generated from Pixel Office Cooler Talk - ${timestamp}*
`;
                // Write to opencode docs
                const opencodePath = path.join(opencodeDocPath, filename);
                fs.writeFileSync(opencodePath, frontmatter, "utf-8");
                console.log(`[CoolerTalk] Saved markdown to ${opencodePath}`);
                // Write to docs/cooler
                const coolerPath = path.join(coolerDocPath, filename);
                fs.writeFileSync(coolerPath, frontmatter, "utf-8");
                coolerMarkdownPath = coolerPath;
                console.log(`[CoolerTalk] Saved markdown to ${coolerPath}`);
                // Update opencode index (simple append)
                updateIndexFile(opencodeDocPath, filename, result.session.topic || `Cooler Talk - ${location}`);
                // Rebuild Pixel Office doc indexes (table-based, avoids endless bullet growth)
                try {
                    const { coolerCount, scrumCount } = await rebuildDocIndexes("process.cwd()");
                    console.log(`[Index] Rebuilt Pixel Office indexes (cooler=${coolerCount}, scrum=${scrumCount})`);
                }
                catch (idxErr) {
                    console.warn("[Index] Failed to rebuild Pixel Office indexes:", idxErr);
                }
                // Auto-create a SCRUM candidate (Yellow zone) when the cooler talk looks actionable
                try {
                    const cand = await maybeCreateScrumCandidate({
                        session: result.session,
                        location,
                        coolerMarkdownPath: coolerPath,
                        kbServerUrl: KB_SERVER_URL,
                        threshold: 25,
                    });
                    if (cand) {
                        scrumCandidateSummary = { id: cand.id, score: cand.score, title: cand.proposed.scrumTitle };
                        console.log(`[Cooler→SCRUM] Candidate created: ${cand.id} (${cand.score})`);
                    }
                }
                catch (candErr) {
                    console.warn('[Cooler→SCRUM] Candidate creation failed:', candErr);
                }
            }
        }
        catch (mdErr) {
            console.error("[CoolerTalk] Failed to save markdown:", mdErr);
        }
        coolerRunTurnTotal.inc({ location, status: "200" });
        res.json({
            turnResult: result.turnResult,
            sessionId: result.session.id,
            location: result.session.location,
            utteranceCount: result.session.utterances.length,
            participantCount: result.participantCount,
            assignments: result.assignments,
            dialogues: result.dialogues,
            coolerMarkdownPath,
            scrumCandidate: scrumCandidateSummary,
        });
    }
    catch (error) {
        console.error("Error in cooler talk run-turn:", error);
        coolerRunTurnTotal.inc({ location: location || "unknown", status: "500" });
        res.status(500).json({ error: "Failed to run cooler turn" });
    }
});
app.get("/api/rooms/:location/cooler/export", async (req, res) => {
    try {
        const { location } = req.params;
        if (!location) {
            return res.status(400).json({ error: "Location is required" });
        }
        const exportData = exportRoomSession(location);
        if (!exportData) {
            return res.status(404).json({ error: "No session found for location" });
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
});
// List available cooler sessions for Test SCRUM
app.get("/api/cooler/sessions/list", async (req, res) => {
    try {
        const sessionsDir = path.resolve("data/cooler_sessions");
        if (!fs.existsSync(sessionsDir)) {
            res.json({ sessions: [] });
            return;
        }
        const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".json"));
        const sessions = files.map(file => {
            const filePath = path.join(sessionsDir, file);
            try {
                const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                return {
                    id: content.id || file.replace(".json", ""),
                    topic: content.topic || "Unknown",
                    participantCount: content.participants?.length || 0,
                    utteranceCount: content.utterances?.length || 0,
                    createdAt: content.createdAt || content.created_at || null,
                };
            }
            catch {
                return { id: file.replace(".json", ""), topic: "Error reading", participantCount: 0, utteranceCount: 0 };
            }
        });
        // Sort by most recent
        sessions.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        res.json({ sessions: sessions.slice(0, 20) });
    }
    catch (error) {
        console.error("Error listing cooler sessions:", error);
        res.status(500).json({ error: "Failed to list sessions" });
    }
});
// Get sessions from database (cooler or scrum)
app.get("/api/cooler/sessions/db", async (req, res) => {
    try {
        const sessionType = req.query.type;
        const sessions = await getCoolerSessions(20, sessionType);
        res.json({ sessions });
    }
    catch (error) {
        console.error("Error fetching DB sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions from database" });
    }
});
// Get single session details from database
app.get("/api/cooler/sessions/db/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessions = await getCoolerSessions(100);
        const session = sessions.find((s) => s.session_id === sessionId);
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        res.json({ session });
    }
    catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});
// Test SCRUM: Create mock SCRUM from a cooler session
app.post("/api/scrum/test", async (req, res) => {
    try {
        const { coolerSessionId, topic: reqTopic } = req.body;
        let topic = reqTopic || "Test SCRUM from cooler session";
        let participants = [];
        let sessionData = null;
        if (coolerSessionId) {
            // Load the cooler session
            const sessionPath = path.resolve(`data/cooler_sessions/${coolerSessionId}.json`);
            if (fs.existsSync(sessionPath)) {
                sessionData = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
                topic = sessionData.topic || topic;
                participants = sessionData.participants || [];
                console.log(`[Test SCRUM] Loaded cooler session: ${coolerSessionId}, topic: ${topic}, participants: ${participants.join(", ")}`);
            }
        }
        else if (!reqTopic) {
            // Try to get current topic from news API
            try {
                const newsRes = await fetch("http://localhost:4173/api/cooler/topics/current");
                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    if (newsData.topic?.title) {
                        topic = newsData.topic.title;
                        console.log(`[Test SCRUM] Using current news topic: ${topic}`);
                    }
                }
            }
            catch (err) {
                console.warn("[Test SCRUM] Failed to fetch current topic:", err);
            }
            // Fallback to memory integration
            if (topic === "Test SCRUM from cooler session") {
                try {
                    const recentTopics = await runDbQuery("SELECT title FROM mem_entries WHERE kind = 'user_topic' ORDER BY timestamp DESC LIMIT 1");
                    if (recentTopics && recentTopics.length > 0) {
                        topic = recentTopics[0].title;
                        console.log(`[Memory] Injecting user topic into scrum: ${topic}`);
                    }
                }
                catch (err) {
                    console.warn("[Memory] Failed to fetch recent user topic for scrum:", err);
                }
            }
        }
        // Use stigmergy-weighted participants if we have them, otherwise default
        if (participants.length === 0) {
            const SCRUM_PARTICIPANTS = ["clerk", "specialist", "executive", "archivist"];
            participants = selectWeightedParticipants(SCRUM_PARTICIPANTS, 4);
        }
        // Create the SCRUM session
        currentScrumSession = createScrumSession(topic, participants);
        const { session, stageResult } = await advanceScrumSession(currentScrumSession);
        currentScrumSession = session;
        // Save conversation transcript to docs/scrum
        const scrumDocPath = path.resolve("process.cwd()/docs/scrum");
        if (!fs.existsSync(scrumDocPath))
            fs.mkdirSync(scrumDocPath, { recursive: true });
        const dateStr = new Date().toISOString().split('T')[0];
        const sessionId = session?.id || `scrum-${Date.now()}`;
        const filename = `${dateStr}_scrum-${sessionId}.md`;
        const timestamp = new Date().toISOString();
        const frontmatter = `---
title: "Test SCRUM: ${topic}"
date: "${timestamp}"
participants: "${participants.join(', ')}"
source_session: "${coolerSessionId || 'random'}"
---

## ${timestamp}

**Participants:** ${participants.join(", ")}

**Source Session:** ${coolerSessionId || "random"}

**Stage:** ${stageResult?.stage || "N/A"}
**Summary:** ${stageResult?.summary || "N/A"}

---
*Generated from Pixel Office Test SCRUM*
`;
        const scrumPath = path.join(scrumDocPath, filename);
        try {
            fs.writeFileSync(scrumPath, frontmatter, "utf-8");
            console.log(`[Test SCRUM] Saved markdown to ${scrumPath}`);
        }
        catch (err) {
            console.error(`[Test SCRUM] Failed to save to ${scrumPath}:`, err.message);
        }
        // Also save to opencode docs
        const opencodeDocPath = path.resolve("path.resolve(process.cwd(), "..", ".openclaw")/workspace-main/docs/opencode");
        if (!fs.existsSync(opencodeDocPath)) {
            try {
                fs.mkdirSync(opencodeDocPath, { recursive: true });
            }
            catch (err) {
                console.error(`[Test SCRUM] Failed to create opencode dir:`, err.message);
            }
        }
        const opencodePath = path.join(opencodeDocPath, filename);
        try {
            fs.writeFileSync(opencodePath, frontmatter, "utf-8");
            console.log(`[Test SCRUM] Saved markdown to ${opencodePath}`);
        }
        catch (err) {
            console.error(`[Test SCRUM] Failed to save to ${opencodePath}:`, err.message);
        }
        // Rebuild Pixel Office doc indexes (so docs/scrum/index.md stays current)
        try {
            const { coolerCount, scrumCount } = await rebuildDocIndexes("process.cwd()");
            console.log(`[Index] Rebuilt Pixel Office indexes (cooler=${coolerCount}, scrum=${scrumCount})`);
        }
        catch (idxErr) {
            console.warn("[Index] Failed to rebuild Pixel Office indexes:", idxErr);
        }
        // Add test metadata
        const testOutput = {
            sourceSession: coolerSessionId || "random",
            sourceTopic: topic || "N/A",
            sourceParticipants: sessionData?.participants || [],
            stigmergyWeighted: participants,
            message: "Test SCRUM created from cooler session with shadow-biased participant selection"
        };
        console.log(`[Test SCRUM] Created: ${testOutput.sourceTopic}, participants: ${participants.join(", ")}`);
        // Map roles to actual agent IDs
        const roleToAgentId = {
            "receptionist": "frontdesk",
            "clerk": "openclaw",
            "custodian": "ironclaw",
            "specialist": "zeroclaw",
            "archivist": "hermitclaw",
            "executive": "leslieclaw",
        };
        // Generate conference room positions for agents
        const scrumAssignments = participants.slice(0, 8).map((name, idx) => {
            // Try to find matching agent by role name or use the name directly
            const agentId = roleToAgentId[name.toLowerCase()] || name.toLowerCase().replace(/ /g, "-");
            return {
                agentId,
                name,
                targetX: CONFERENCE_ROOM_POSITIONS[idx].x,
                targetY: CONFERENCE_ROOM_POSITIONS[idx].y,
            };
        });
        res.json({
            session,
            stageResult,
            testOutput,
            assignments: scrumAssignments,
            message: `Test SCRUM started from cooler session: ${topic}`
        });
    }
    catch (error) {
        console.error("Error creating test SCRUM:", error);
        res.status(500).json({ error: "Failed to create test SCRUM" });
    }
});
// Stigmergy API Routes
app.get("/api/stigmergy/traces", (req, res) => {
    res.json({ traces: getActiveTraces() });
});
app.get("/api/stigmergy/social-potential", (req, res) => {
    const social = calculateSocialPotential();
    res.json(social);
});
app.post("/api/stigmergy/deposit", (req, res) => {
    try {
        const { type, agentId, intensity, topic, roomId, x, y, metadata } = req.body;
        if (!type) {
            stigmergyDepositTotal.inc({ type: "unknown", status: "400" });
            res.status(400).json({ error: "Missing required field: type" });
            return;
        }
        const result = depositTrace({ type, agentId, intensity, topic, roomId, x, y, metadata });
        if (!result.success) {
            stigmergyDepositTotal.inc({ type, status: "400" });
            res.status(400).json({ error: result.reason || "Failed to deposit trace" });
            return;
        }
        if (result.skipped) {
            stigmergyDepositTotal.inc({ type, status: "200" });
            res.json({ success: true, skipped: true, reason: result.reason, trace: result.trace });
            return;
        }
        stigmergyDepositTotal.inc({ type, status: "200" });
        res.json({ success: true, trace: result.trace });
    }
    catch (err) {
        console.error("[Stigmergy] Deposit error:", err);
        stigmergyDepositTotal.inc({ type: "unknown", status: "500" });
        res.status(500).json({ error: err.message || "Failed to deposit trace" });
    }
});
// NVIDIA Integration Test Endpoint
app.get("/api/test/nvidia", async (req, res) => {
    const apiKey = process.env.NVIDIA_API_KEY;
    // Best performer from HR benchmarks: Kimi K2
    const modelId = process.env.NVIDIA_MODEL_ID || "moonshotai/kimi-k2-instruct-0905";
    if (!apiKey) {
        res.json({
            available: false,
            reason: "NVIDIA_API_KEY not configured",
            modelId
        });
        return;
    }
    try {
        const { nvidiaChat } = await import("./llm/nvidiaClient.js");
        const result = await nvidiaChat([
            { role: "user", content: "Reply with exactly: 'NVIDIA OK'" }
        ], { maxTokens: 50 });
        res.json({
            available: true,
            working: true,
            modelId,
            response: result.content.substring(0, 100),
            provider: "nvidia"
        });
    }
    catch (error) {
        res.json({
            available: true,
            working: false,
            modelId,
            error: error.message.substring(0, 200)
        });
    }
});
// Model Health Dashboard Endpoint
app.get("/api/models/health", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setTimeout(30000);
    const models = [];
    const now = new Date().toISOString();
    // Check Ollama models (just list, no latency check to avoid slowdowns)
    try {
        const ollamaRes = await fetch("http://localhost:11434/api/tags", { method: "GET" });
        if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            for (const model of data.models || []) {
                models.push({
                    name: model.name.replace(":latest", "").split(":")[0],
                    id: model.name,
                    provider: "ollama",
                    status: "online",
                    latency: 0,
                    lastCheck: now,
                });
            }
        }
    }
    catch (e) {
        console.warn("[ModelHealth] Ollama not available:", e);
    }
    // Check NVIDIA models - fetch dynamically from NGC
    const apiKey = process.env.NVIDIA_API_KEY;
    if (apiKey) {
        try {
            const nvidiaRes = await fetch("https://integrate.api.nvidia.com/v1/models?limit=50", {
                headers: { "Authorization": `Bearer ${apiKey}` },
                method: "GET"
            });
            if (nvidiaRes.ok) {
                const nvidiaData = await nvidiaRes.json();
                for (const model of nvidiaData.data || []) {
                    models.push({
                        name: model.id.split("/")[1] || model.id,
                        id: model.id,
                        provider: "nvidia",
                        status: "online",
                        latency: 0,
                        lastCheck: now,
                    });
                }
            }
        }
        catch (e) {
            console.warn("[ModelHealth] NGC fetch failed:", e);
        }
    }
    // Fallback list for when no API key (still shows potential models)
    const nvidiaModels = [
        { name: "Kimi K2", id: "moonshotai/kimi-k2-instruct-0905" },
        { name: "DeepSeek V3.1", id: "deepseek-ai/deepseek-v3.1-terminus" },
        { name: "DeepSeek V3.2", id: "deepseek-ai/deepseek-v3.2" },
        { name: "Mistral Large 3", id: "mistralai/mistral-large-3-675b-instruct-2512" },
        { name: "Gemma 7B", id: "google/gemma-7b" },
        { name: "Phi-3 Mini", id: "microsoft/phi-3-mini-128k-instruct" },
        { name: "Solar 10.7B", id: "upstage/solar-10.7b-instruct" },
    ];
    // Add fallback nvidia models if no API key configured
    if (!apiKey && models.filter(m => m.provider === "nvidia").length === 0) {
        for (const model of nvidiaModels) {
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
            online: models.filter(m => m.status === "online").length,
            lagging: models.filter(m => m.status === "lagging").length,
            offline: models.filter(m => m.status === "offline").length,
        },
        models,
    });
});
// Last used model tracking endpoint
app.get("/api/models/last-used", (req, res) => {
    res.json({ model: getLastUsedModel() });
});
app.get("/api/stigmergy/review-heat", (req, res) => {
    try {
        const activeHeat = getActiveHeat();
        res.json({ activeHeat });
    }
    catch (error) {
        console.error("Error fetching review heat:", error);
        res.status(500).json({ error: "Failed to fetch review heat" });
    }
});
// Desk Stigmergy API (per thought_speech_stigmergy.md Part B)
const deskStigmergyState = {};
function decayDeskStigmergy(deskId) {
    const state = deskStigmergyState[deskId];
    if (!state)
        return;
    const decayRate = 0.02;
    state.loopHeat = Math.max(0, state.loopHeat - decayRate);
    state.reviewHeat = Math.max(0, state.reviewHeat - decayRate);
    state.speechActivity = Math.max(0, state.speechActivity - decayRate);
    state.taskShadow = Math.max(0, state.taskShadow - decayRate);
    state.observerAttention = Math.max(0, state.observerAttention - decayRate);
    state.confusionResidue = Math.max(0, state.confusionResidue - decayRate);
    state.updatedAt = new Date().toISOString();
}
app.get("/api/stigmergy/desk/:deskId", (req, res) => {
    const { deskId } = req.params;
    decayDeskStigmergy(deskId);
    const state = deskStigmergyState[deskId] || {
        loopHeat: 0,
        reviewHeat: 0,
        speechActivity: 0,
        taskShadow: 0,
        observerAttention: 0,
        confusionResidue: 0,
        updatedAt: new Date().toISOString()
    };
    res.json({ deskId, ...state });
});
app.post("/api/stigmergy/desk/:deskId/update", (req, res) => {
    const { deskId } = req.params;
    console.log(`[Stigmergy] POST update for deskId=${deskId}, body=${JSON.stringify(req.body)}`);
    const { loopHeat, reviewHeat, speechActivity, taskShadow, observerAttention, confusionResidue } = req.body;
    if (!deskStigmergyState[deskId]) {
        deskStigmergyState[deskId] = {
            loopHeat: 0, reviewHeat: 0, speechActivity: 0, taskShadow: 0,
            observerAttention: 0, confusionResidue: 0, updatedAt: new Date().toISOString()
        };
    }
    const state = deskStigmergyState[deskId];
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
    res.json({ success: true, deskId, ...state });
});
app.get("/api/stigmergy/desk/all", (req, res) => {
    Object.keys(deskStigmergyState).forEach(decayDeskStigmergy);
    res.json({ desks: deskStigmergyState });
});
app.post("/api/stigmergy/desk/reset", (req, res) => {
    Object.keys(deskStigmergyState).forEach(key => {
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
app.post("/api/agent/detect-loop", (req, res) => {
    try {
        const { text, burstTokenCount, maxBurstTokens } = req.body;
        if (!text) {
            res.status(400).json({ error: "Text is required" });
            return;
        }
        // Simple token estimate (~4 chars per token)
        const estimatedTokens = burstTokenCount || Math.ceil(text.length / 4);
        const maxTokens = maxBurstTokens || 96;
        // Detect loop/stall
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const sentenceFreq = {};
        sentences.forEach(s => {
            const norm = s.trim().toLowerCase().slice(0, 30);
            sentenceFreq[norm] = (sentenceFreq[norm] || 0) + 1;
        });
        const maxRepeat = Math.max(...Object.values(sentenceFreq), 0);
        const words = text.toLowerCase().split(/\s+/);
        const trigramFreq = {};
        for (let i = 0; i < words.length - 2; i++) {
            const trigram = words.slice(i, i + 3).join(" ");
            trigramFreq[trigram] = (trigramFreq[trigram] || 0) + 1;
        }
        const maxTrigramRepeat = Math.max(...Object.values(trigramFreq), 0);
        const mid = Math.floor(text.length / 2);
        const firstSet = new Set(text.slice(0, mid).toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const secondSet = new Set(text.slice(mid).toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const union = new Set([...firstSet, ...secondSet]);
        const intersection = new Set([...firstSet].filter(x => secondSet.has(x)));
        const noveltyScore = union.size > 0 ? intersection.size / union.size : 1;
        let loopScore = 0;
        if (maxRepeat >= 3)
            loopScore += 0.3;
        if (maxTrigramRepeat >= 2)
            loopScore += 0.25;
        if (noveltyScore < 0.3)
            loopScore += 0.2;
        if (estimatedTokens > maxTokens * 0.8)
            loopScore += 0.15;
        loopScore = Math.min(loopScore, 1);
        let state = "healthy";
        let recommendedAction = "continue";
        if (loopScore >= 0.7 || estimatedTokens >= maxTokens) {
            state = "looping";
            recommendedAction = "interrupt";
        }
        else if (loopScore >= 0.5 || noveltyScore < 0.3) {
            state = "stalled";
            recommendedAction = "summarize";
        }
        res.json({
            state,
            loopScore: Math.round(loopScore * 100) / 100,
            noveltyScore: Math.round(noveltyScore * 100) / 100,
            estimatedTokens,
            maxTokens,
            reason: `loopScore=${loopScore.toFixed(2)}, novelty=${noveltyScore.toFixed(2)}, tokens=${estimatedTokens}`,
            recommendedAction
        });
    }
    catch (error) {
        console.error("Loop detection error:", error);
        res.status(500).json({ error: error.message });
    }
});
const recentSpeechEvents = [];
app.post("/api/agent/speech", (req, res) => {
    try {
        const { speaker, location, speechText, topicTags, socialWeight } = req.body;
        if (!speaker || !speechText) {
            res.status(400).json({ error: "speaker and speechText required" });
            return;
        }
        const event = {
            speaker,
            location: location || "office",
            speechText,
            topicTags: topicTags || [],
            socialWeight: socialWeight || 0.5,
            timestamp: Date.now()
        };
        recentSpeechEvents.push(event);
        // Keep last 100 events
        if (recentSpeechEvents.length > 100) {
            recentSpeechEvents.shift();
        }
        // Update desk speech activity
        const deskId = `desk-${Math.floor(Math.random() * 9)}`;
        const existingDesk = deskStigmergyState[deskId] || { loopHeat: 0, reviewHeat: 0, speechActivity: 0, taskShadow: 0, observerAttention: 0, confusionResidue: 0, updatedAt: new Date().toISOString() };
        existingDesk.speechActivity = Math.min(1, existingDesk.speechActivity + 0.3);
        existingDesk.updatedAt = new Date().toISOString();
        deskStigmergyState[deskId] = existingDesk;
        // Check for nearby agent responses
        const nearbyResponses = ["acknowledged", "answering", "redirecting", "ignoring"];
        const response = Math.random() > 0.5 ? nearbyResponses[Math.floor(Math.random() * nearbyResponses.length)] : "ignored";
        res.json({
            ok: true,
            event,
            nearbyResponse: response
        });
    }
    catch (error) {
        console.error("Speech event error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/agent/speech/recent", (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const recent = recentSpeechEvents.slice(-limit);
    res.json({ events: recent });
});
const observerHistory = [];
app.post("/api/agent/observer/intervene", (req, res) => {
    try {
        const { targetAgent, state, lastValidPoint, action } = req.body;
        if (!targetAgent) {
            res.status(400).json({ error: "targetAgent required" });
            return;
        }
        // Generate intervention based on state
        let nextPrompt = "";
        let actualAction = action || "continue";
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
        const intervention = {
            id: `obs-${Date.now()}`,
            targetAgent,
            state: state || "healthy",
            lastValidPoint: lastValidPoint || "Current task progress",
            action: actualAction,
            nextPrompt,
            timestamp: Date.now()
        };
        observerHistory.push(intervention);
        if (observerHistory.length > 50) {
            observerHistory.shift();
        }
        // Update desk observer attention
        const deskId = `desk-${Math.floor(Math.random() * 9)}`;
        const existingDesk = deskStigmergyState[deskId] || { loopHeat: 0, reviewHeat: 0, speechActivity: 0, taskShadow: 0, observerAttention: 0, confusionResidue: 0, updatedAt: new Date().toISOString() };
        existingDesk.observerAttention = Math.min(1, existingDesk.observerAttention + 0.4);
        existingDesk.updatedAt = new Date().toISOString();
        deskStigmergyState[deskId] = existingDesk;
        res.json({ ok: true, intervention });
    }
    catch (error) {
        console.error("Observer intervention error:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/agent/observer/history", (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const recent = observerHistory.slice(-limit);
    res.json({ interventions: recent });
});
// Delegation Detection API (per grok_suggestions.md)
// Detects delegation commands in cooler chat and triggers SCRUM creation
const DELEGATION_PATTERNS = [
    /handle (the )?(\w+)/i,
    /delegate (the )?(\w+)/i,
    /take care of/i,
    /someone should/i,
    /we need to/i,
    /let's focus on/i,
    /work on (the )?(\w+)/i,
];
app.post("/api/detect-delegation", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Persistent Memory Integration: Extract and save topics from user messages
        (async () => {
            try {
                const lowerMsg = message.toLowerCase();
                const skipKeywords = ['hi', 'hello', 'thanks', 'ok', 'yes', 'no', 'how are you'];
                if (lowerMsg.length > 10 && !skipKeywords.some(kw => lowerMsg === kw)) {
                    // Simple extraction: use first sentence or first 100 chars
                    const topicTitle = message.split(/[.!?\n]/)[0].substring(0, 100).trim();
                    // Save to mem_entries table
                    await runDbQuery("INSERT INTO mem_entries (kind, title, content, tags, timestamp) VALUES (?, ?, ?, ?, NOW())", ["user_topic", topicTitle, message, JSON.stringify(["extracted", "chat"])]);
                    console.log(`[Memory] Saved user topic: ${topicTitle}`);
                }
            }
            catch (err) {
                console.warn("[Memory] Failed to save topic:", err);
            }
        })();
        const isDelegation = DELEGATION_PATTERNS.some(pattern => pattern.test(message));
        if (isDelegation) {
            console.log(`[Delegation] Detected in message: "${message.substring(0, 50)}..."`);
            // Extract potential task keywords
            const keywords = [];
            DELEGATION_PATTERNS.forEach(pattern => {
                const match = message.match(pattern);
                if (match && match[1])
                    keywords.push(match[1]);
            });
            // Create a SCRUM run with the extracted keywords
            const topic = keywords.length > 0 ? `Delegated: ${keywords.join(", ")}` : "User Delegation";
            currentScrumSession = createScrumSession(topic, ["clerk", "specialist", "executive", "archivist"]);
            const { session, stageResult } = await advanceScrumSession(currentScrumSession);
            currentScrumSession = session;
            console.log(`[Delegation] Created SCRUM session: ${session.id} for topic: ${topic}`);
            res.json({
                detected: true,
                sessionId: session.id,
                topic: topic,
                message: `Delegation detected. Created SCRUM session: "${topic}"`
            });
        }
        else {
            res.json({ detected: false });
        }
    }
    catch (error) {
        console.error("Error detecting delegation:", error);
        res.status(500).json({ error: "Failed to detect delegation" });
    }
});
app.post("/api/scrum/start", async (req, res) => {
    try {
        let { topic, participants } = req.body;
        // Use stigmergy-weighted participant selection if not provided
        if (!participants || participants.length === 0) {
            const SCRUM_PARTICIPANTS = ["clerk", "specialist", "executive", "archivist"];
            participants = selectWeightedParticipants(SCRUM_PARTICIPANTS, 4);
        }
        currentScrumSession = createScrumSession(topic || "Daily standup", participants);
        const { session, stageResult } = await advanceScrumSession(currentScrumSession);
        currentScrumSession = session;
        res.json({
            session,
            stageResult,
            message: `SCRUM started at stage: ${stageResult.stage}`
        });
    }
    catch (error) {
        console.error("Error starting SCRUM session:", error);
        res.status(500).json({ error: "Failed to start SCRUM session" });
    }
});
app.post("/api/scrum/advance", async (req, res) => {
    try {
        if (!currentScrumSession) {
            return res.status(400).json({ error: "No active SCRUM session. Start one first." });
        }
        if (currentScrumSession.finalStatus === "complete") {
            res.json({
                session: currentScrumSession,
                message: "SCRUM session already complete",
                complete: true
            });
            return;
        }
        const { session, stageResult } = await advanceScrumSession(currentScrumSession);
        currentScrumSession = session;
        res.json({
            session,
            stageResult,
            message: `Advanced to stage: ${stageResult.stage}`,
            complete: session.finalStatus === "complete"
        });
    }
    catch (error) {
        console.error("Error advancing SCRUM session:", error);
        res.status(500).json({ error: "Failed to advance SCRUM session" });
    }
});
app.get("/api/scrum/status", async (req, res) => {
    res.json({
        active: currentScrumSession !== null,
        session: currentScrumSession,
        currentStage: currentScrumSession?.currentStage || null,
        complete: currentScrumSession?.finalStatus === "complete"
    });
});
// Cooler → SCRUM Candidate endpoints (Yellow zone: propose/approve)
app.get("/api/scrum/candidates", (req, res) => {
    const status = req.query.status || undefined;
    const candidates = listScrumCandidates(status);
    res.json({ candidates });
});
app.post("/api/scrum/candidates/:id/approve", async (req, res) => {
    const { id } = req.params;
    const shouldRun = req.query.run === "true";
    const exportMode = req.query.export || "localReport";
    const approveResult = approveScrumCandidate(id);
    if (!approveResult.ok) {
        return res.status(404).json({ ok: false, error: approveResult.error || "NOT_FOUND" });
    }
    if (!shouldRun) {
        return res.json(approveResult);
    }
    try {
        const candidate = approveResult.candidate;
        const topic = candidate.proposed.scrumTitle;
        const participants = ["clerk", "specialist", "executive", "archivist"];
        const candidateContext = [
            `Source: Cooler session ${candidate.source.coolerSessionId}`,
            `Location: ${candidate.source.location}`,
            `Topic: ${candidate.source.topic}`,
            `Score: ${candidate.score} (threshold: ${candidate.threshold})`,
            ...candidate.reasons.map((r) => `- ${r}`),
            ...candidate.kb.topSnippets.slice(0, 2).map((s) => `KB: ${s}`),
        ];
        let session = createScrumSession(topic, participants, candidateContext);
        while (session.finalStatus !== "complete" && session.finalStatus !== "failed") {
            const { session: updatedSession } = await advanceScrumSession(session);
            session = updatedSession;
            if (session.finalStatus === "failed")
                break;
        }
        if (!isSessionComplete(session)) {
            return res.json({
                ok: true,
                candidate,
                sessionId: session.id,
                status: "session_failed",
                error: "SCRUM session did not complete",
            });
        }
        const githubClient = createSafeScrumRepoClient({
            GITHUB_TOKEN: process.env.GITHUB_TOKEN,
            SAFE_SCRUM_REPO: process.env.SAFE_SCRUM_REPO,
            SAFE_SCRUM_BRANCH: process.env.SAFE_SCRUM_BRANCH,
            SAFE_SCRUM_REPORTS_DIR: process.env.SAFE_SCRUM_REPORTS_DIR,
            SAFE_SCRUM_NOTES_PATH: process.env.SAFE_SCRUM_NOTES_PATH,
        });
        const exportResult = await exportScrumReport(session.id, exportMode, githubClient || undefined);
        const reviewResult = session.results.find((r) => r.stage === "review");
        const decideResult = session.results.find((r) => r.stage === "decide");
        res.json({
            ok: true,
            candidate,
            candidateId: candidate.id,
            sessionId: session.id,
            reportPath: exportResult.path,
            status: "completed",
            decision: decideResult?.output?.decision || "unknown",
            recommended_actions: reviewResult?.output?.recommended_actions || [],
            sourceContext: candidateContext,
            exportMode,
        });
    }
    catch (error) {
        console.error("Error running SCRUM from candidate:", error);
        res.status(500).json({
            ok: false,
            error: error.message || "Failed to run SCRUM session",
            candidate: approveResult.candidate,
        });
    }
});
app.post("/api/scrum/candidates/:id/reject", (req, res) => {
    const { id } = req.params;
    const result = rejectScrumCandidate(id);
    if (!result.ok) {
        return res.status(404).json({ ok: false, error: result.error || "NOT_FOUND" });
    }
    res.json(result);
});
app.post("/api/scrum/export", async (req, res) => {
    try {
        const { sessionId, mode = "localReport" } = req.body;
        const githubClient = createSafeScrumRepoClient({
            GITHUB_TOKEN: process.env.GITHUB_TOKEN,
            SAFE_SCRUM_REPO: process.env.SAFE_SCRUM_REPO,
            SAFE_SCRUM_BRANCH: process.env.SAFE_SCRUM_BRANCH,
            SAFE_SCRUM_REPORTS_DIR: process.env.SAFE_SCRUM_REPORTS_DIR,
            SAFE_SCRUM_NOTES_PATH: process.env.SAFE_SCRUM_NOTES_PATH,
        });
        const isGitHubMode = mode === "githubReport" || mode === "githubNotes";
        if (isGitHubMode && !githubClient) {
            return res.status(400).json({
                error: "GitHub not configured. Set GITHUB_TOKEN and SAFE_SCRUM_REPO environment variables.",
                code: "GITHUB_NOT_CONFIGURED"
            });
        }
        if (sessionId) {
            const session = await loadScrumSession(sessionId);
            if (!session) {
                return res.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND" });
            }
            if (mode === "preview") {
                const preview = previewScrumReport(session);
                return res.json({ preview, mode: "preview" });
            }
            if (!isSessionComplete(session)) {
                return res.status(400).json({ error: "Session is not complete", code: "INCOMPLETE_SESSION" });
            }
            const result = await exportScrumReport(sessionId, mode, githubClient || undefined);
            return res.json({ ...result, mode });
        }
        else {
            if (mode === "preview") {
                return res.status(400).json({ error: "Preview requires a sessionId", code: "SESSION_ID_REQUIRED" });
            }
            const result = await exportLatestCompletedScrum(mode, githubClient || undefined);
            return res.json({ ...result, mode });
        }
    }
    catch (error) {
        console.error("Error exporting SCRUM report:", error);
        res.status(500).json({ error: error.message || "Failed to export SCRUM report", code: error.code || "EXPORT_ERROR" });
    }
});
app.get("/api/scrum/export/preview/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await loadScrumSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND" });
        }
        const preview = previewScrumReport(session);
        res.json({ preview, sessionId, session });
    }
    catch (error) {
        console.error("Error generating preview:", error);
        res.status(500).json({ error: "Failed to generate preview" });
    }
});
app.get("/api/scrum/github/status", async (req, res) => {
    const configured = !!(process.env.GITHUB_TOKEN && process.env.SAFE_SCRUM_REPO);
    const repo = process.env.SAFE_SCRUM_REPO || null;
    const branch = process.env.SAFE_SCRUM_BRANCH || "main";
    res.json({
        configured,
        repo,
        branch,
        message: configured
            ? `GitHub integration configured for ${repo} (${branch})`
            : "GitHub not configured. Set GITHUB_TOKEN and SAFE_SCRUM_REPO to enable."
    });
});
// Calendar endpoints for time-based task management
const deadlines = new Map();
const tickets = new Map();
// Parse deadline string to Date
function parseDeadline(deadlineStr) {
    const now = new Date();
    const lower = deadlineStr.toLowerCase();
    if (lower === "now" || lower === "immediately")
        return now;
    if (lower === "tomorrow")
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (lower.includes("hour")) {
        const hours = parseInt(lower.replace(/\D/g, "")) || 1;
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    if (lower.includes("day")) {
        const days = parseInt(lower.replace(/\D/g, "")) || 1;
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    if (lower.includes("week")) {
        const weeks = parseInt(lower.replace(/\D/g, "")) || 1;
        return new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    }
    // Try ISO format
    const parsed = new Date(deadlineStr);
    return isNaN(parsed.getTime()) ? new Date(now.getTime() + 60 * 60 * 1000) : parsed;
}
// Schedule a scrum session with deadline
app.post("/api/calendar/scrum", async (req, res) => {
    try {
        const { topic, document: doc, deadline: deadlineStr, priority = "normal", workflow_type } = req.body;
        if (!topic) {
            res.status(400).json({ error: "topic required" });
            return;
        }
        const taskId = `scrum-${Date.now()}`;
        const deadline = parseDeadline(deadlineStr || "1 hour");
        const ticket = {
            id: taskId,
            type: "scrum",
            topic,
            document: doc,
            deadline: deadline.toISOString(),
            priority,
            status: "scheduled",
            workflow_type: workflow_type || "improvement",
            createdAt: new Date().toISOString(),
        };
        tickets.set(taskId, ticket);
        // Also emit workflow for visualizer
        const visualId = `scrum-${Date.now()}`;
        await emitRouteToVisualizer("system", "receptionist", "scrum_scheduled", visualId);
        await emitRouteToVisualizer("receptionist", "clerk", "assigned", visualId);
        await emitRouteToVisualizer("clerk", "specialist", "work_start", visualId);
        res.json({
            success: true,
            ticketId: taskId,
            topic,
            deadline: deadline.toISOString(),
            message: `Scheduled ${topic} for ${deadline.toLocaleString()}`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Add calendar deadline
app.post("/api/calendar/deadline", async (req, res) => {
    try {
        const { title, deadline: deadlineStr, assignee, notes } = req.body;
        if (!title || !deadlineStr) {
            res.status(400).json({ error: "title and deadline required" });
            return;
        }
        const taskId = `deadline-${Date.now()}`;
        const deadline = parseDeadline(deadlineStr);
        const ticket = {
            id: taskId,
            type: "deadline",
            title,
            deadline: deadline.toISOString(),
            assignee,
            notes,
            status: "pending",
            createdAt: new Date().toISOString(),
        };
        deadlines.set(taskId, ticket);
        res.json({
            success: true,
            ticketId: taskId,
            title,
            deadline: deadline.toISOString(),
            message: `Deadline set for ${deadline.toLocaleString()}`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create improvement ticket
app.post("/api/calendar/ticket", async (req, res) => {
    try {
        const { title, description, priority = "normal", related_document } = req.body;
        if (!title) {
            res.status(400).json({ error: "title required" });
            return;
        }
        const taskId = `ticket-${Date.now()}`;
        const ticket = {
            id: taskId,
            type: "improvement",
            title,
            description,
            priority,
            related_document,
            status: "open",
            createdAt: new Date().toISOString(),
        };
        tickets.set(taskId, ticket);
        res.json({
            success: true,
            ticketId: taskId,
            title,
            priority,
            message: `Created improvement ticket: ${title}`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get calendar/deadlines
app.get("/api/calendar/deadlines", (_req, res) => {
    const allDeadlines = Array.from(deadlines.values());
    const allTickets = Array.from(tickets.values()).filter(t => t.type !== "deadline");
    res.json({ deadlines: allDeadlines, tickets: allTickets });
});
app.post("/api/scrum/append-notes", async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: "sessionId required", code: "SESSION_ID_REQUIRED" });
        }
        const session = await loadScrumSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND" });
        }
        const notesPath = await appendToGithubNotes(session);
        res.json({
            success: true,
            path: notesPath,
            sessionId: session.id,
            notes: generateGithubNotes(session)
        });
    }
    catch (error) {
        console.error("Error appending notes:", error);
        res.status(500).json({ error: error.message || "Failed to append notes" });
    }
});
// Time Tasks API Routes
import { events, tasksV2, sessions, generateTodaysPlan, generateTodaysLog } from "../src/pixel_memory/index.js";
app.get("/api/tasks-v2", async (req, res) => {
    try {
        const { status, priority, limit } = req.query;
        const tasks = await tasksV2.list({
            status: status,
            priority: priority,
            limit: limit ? parseInt(limit) : 50,
        });
        res.json({ tasks });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/tasks-v2", async (req, res) => {
    try {
        const task = await tasksV2.create(req.body);
        res.json(task);
    }
    catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: error.message });
    }
});
app.patch("/api/tasks-v2/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updated = await tasksV2.update(id, req.body);
        if (!updated) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(updated);
    }
    catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: error.message });
    }
});
app.delete("/api/tasks-v2/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await tasksV2.delete(id);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/events/today", async (req, res) => {
    try {
        const today = new Date();
        const dayEvents = await events.listByDay(today);
        res.json({ events: dayEvents });
    }
    catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/events", async (req, res) => {
    try {
        const event = await events.create(req.body);
        res.json(event);
    }
    catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/sessions/active", async (req, res) => {
    try {
        const session = await sessions.getActive();
        res.json({ session });
    }
    catch (error) {
        console.error("Error fetching active session:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/sessions/start", async (req, res) => {
    try {
        const session = await sessions.start(req.body);
        res.json(session);
    }
    catch (error) {
        console.error("Error starting session:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/sessions/:id/end", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const session = await sessions.end(id, req.body);
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.json(session);
    }
    catch (error) {
        console.error("Error ending session:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/time-tasks/plan", async (req, res) => {
    try {
        const today = new Date();
        const plan = await generateTodaysPlan(today);
        res.json(plan);
    }
    catch (error) {
        console.error("Error generating plan:", error);
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/time-tasks/log", async (req, res) => {
    try {
        const today = new Date();
        const log = await generateTodaysLog(today);
        res.json(log);
    }
    catch (error) {
        console.error("Error generating log:", error);
        res.status(500).json({ error: error.message });
    }
});
// Auto-Cooler Scheduler Routes
import { getTopicForConversation, fetchNewsTopics } from "./services/newsTopics.js";
let autoCoolerInterval = null;
const AUTO_COOLER_INTERVAL_MS = parseInt(process.env.AUTO_COOLER_INTERVAL_MS || "") || 5 * 60 * 1000; // 5 minutes default
const AUTO_SCRUM_INTERVAL_MS = parseInt(process.env.AUTO_SCRUM_INTERVAL_MS || "") || 10 * 60 * 1000; // 10 minutes default
const AUTO_SCRUM_ENABLED = process.env.AUTO_SCRUM_ENABLED === "true";
const NIGHT_MODE_MULTIPLIER = parseFloat(process.env.NIGHT_MODE_MULTIPLIER || "") || 0.25; // 4x faster at night
let nightModeActive = true;
function getActiveInterval(baseMs) {
    return nightModeActive ? Math.floor(baseMs * NIGHT_MODE_MULTIPLIER) : baseMs;
}
// API to set night mode (called by frontend when sleep mode is toggled)
app.post("/api/office/night-mode", async (req, res) => {
    const { active } = req.body;
    nightModeActive = active === true;
    console.log(`[Office] Night mode ${nightModeActive ? 'ACTIVATED' : 'deactivated'}. Intervals: ${getActiveInterval(AUTO_COOLER_INTERVAL_MS) / 1000}s (cooler), ${getActiveInterval(AUTO_SCRUM_INTERVAL_MS) / 1000}s (scrum)`);
    res.json({ ok: true, nightMode: nightModeActive });
});
async function runAutoCoolerSession() {
    console.log("[AutoCooler] Starting automatic cooler session...");
    try {
        await fetchNewsTopics();
        const topic = getTopicForConversation();
        // Select 4-6 participants with shadow-biased weights
        const numParticipants = 4 + Math.floor(Math.random() * 3);
        const selectedParticipants = selectWeightedParticipants(ALL_PARTICIPANTS, numParticipants);
        const result = await runRoomTurn("kitchen", {
            topic,
            participants: selectedParticipants,
            userMessage: "",
            generateFn
        });
        console.log(`[AutoCooler] Session complete. ${result.participantCount} participants, topic: "${topic}"`);
        // Save session transcript to docs/cooler
        const coolerDocPath = path.resolve("process.cwd()/docs/cooler");
        if (!fs.existsSync(coolerDocPath))
            fs.mkdirSync(coolerDocPath, { recursive: true });
        const dateStr = new Date().toISOString().split('T')[0];
        const sessionId = result.session?.id || `auto-${Date.now()}`;
        const filename = `${dateStr}_cooler-${sessionId}.md`;
        const timestamp = new Date().toISOString();
        const exportData = exportRoomSession("kitchen");
        if (exportData && exportData.markdown) {
            const frontmatter = `---
title: "Auto Cooler Session"
date: "${timestamp}"
topic: "${topic}"
participants: "${selectedParticipants.join(', ')}"
---

${exportData.markdown}

---
*Generated from Pixel Office Auto Cooler*
`;
            const coolerPath = path.join(coolerDocPath, filename);
            fs.writeFileSync(coolerPath, frontmatter, "utf-8");
            console.log(`[AutoCooler] Saved markdown to ${coolerPath}`);
        }
        else {
            // Fallback: just save the basic entry
            const logEntry = `---
title: "Auto Cooler Session"
date: "${timestamp}"
topic: "${topic}"
participants: "${selectedParticipants.join(', ')}"
---

**Topic:** ${topic}

**Participants:** ${selectedParticipants.join(", ")}

**Participant Count:** ${result.participantCount}

---
*Generated from Pixel Office Auto Cooler*
`;
            const coolerPath = path.join(coolerDocPath, filename);
            fs.writeFileSync(coolerPath, logEntry, "utf-8");
            console.log(`[AutoCooler] Saved markdown to ${coolerPath}`);
        }
        // Trigger automatic Scrum after cooler session (if enabled)
        if (AUTO_SCRUM_ENABLED) {
            setTimeout(async () => {
                try {
                    console.log("[AutoCooler] Triggering automatic Scrum after cooler session...");
                    const scrumRes = await fetch('/api/scrum/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ coolerSessionId: null }) // Will use random session
                    });
                    const scrumData = await scrumRes.json();
                    console.log("[AutoCooler] Auto-Scrum triggered:", scrumData.message);
                }
                catch (scrumErr) {
                    console.error("[AutoCooler] Failed to trigger auto-scrum:", scrumErr);
                }
            }, 5000); // 5 second delay after cooler session
        }
    }
    catch (error) {
        console.error("[AutoCooler] Error running session:", error);
    }
}
app.post("/api/cooler/auto/start", async (req, res) => {
    if (autoCoolerInterval) {
        res.json({ ok: true, message: "Auto-cooler already running", intervalMs: getActiveInterval(AUTO_COOLER_INTERVAL_MS) });
        return;
    }
    await runAutoCoolerSession();
    const intervalMs = getActiveInterval(AUTO_COOLER_INTERVAL_MS);
    autoCoolerInterval = setInterval(runAutoCoolerSession, intervalMs);
    console.log(`[AutoCooler] Started. Next session in ${intervalMs / 1000 / 60} minutes`);
    res.json({
        ok: true,
        message: "Auto-cooler started",
        intervalMs: intervalMs,
        nextRunIn: intervalMs
    });
});
app.post("/api/cooler/auto/stop", async (req, res) => {
    if (autoCoolerInterval) {
        clearInterval(autoCoolerInterval);
        autoCoolerInterval = null;
        console.log("[AutoCooler] Stopped");
        res.json({ ok: true, message: "Auto-cooler stopped" });
    }
    else {
        res.json({ ok: true, message: "Auto-cooler was not running" });
    }
});
app.get("/api/cooler/auto/status", async (req, res) => {
    res.json({
        active: autoCoolerInterval !== null,
        intervalMs: AUTO_COOLER_INTERVAL_MS,
        nextRunIn: autoCoolerInterval ? AUTO_COOLER_INTERVAL_MS : null
    });
});
app.post("/api/cooler/auto/trigger", async (req, res) => {
    try {
        const { topic } = req.body;
        const selectedTopic = topic || getTopicForConversation();
        const result = await runRoomTurn("kitchen", {
            topic: selectedTopic,
            participants: ALL_PARTICIPANTS,
            userMessage: "",
            generateFn
        });
        res.json({
            ok: true,
            topic: selectedTopic,
            participantCount: result.participantCount,
            sessionId: result.session.id
        });
    }
    catch (error) {
        console.error("[AutoCooler] Trigger error:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
});
app.get("/api/cooler/topics", async (req, res) => {
    try {
        const topics = await fetchNewsTopics();
        res.json({ ok: true, topics });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});
// Return current topic (latest from fetchNewsTopics)
app.get("/api/cooler/topics/current", async (req, res) => {
    try {
        const source = req.query.source || "auto";
        const topics = await fetchNewsTopics(source);
        const currentTopic = topics.length > 0 ? topics[0] : null;
        res.json({ topic: currentTopic, topics });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/cooler/topics/refresh", async (req, res) => {
    try {
        const source = req.body?.source || "auto";
        const topics = await fetchNewsTopics(source);
        const currentTopic = topics.length > 0 ? topics[0] : null;
        res.json({ success: true, topic: currentTopic, topics });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Proxy /api/time to Pixel-Me
app.get("/api/time/current", async (req, res) => {
    try {
        const resp = await fetch(`${PIXEL_ME_URL}/time/current`);
        const data = await resp.json();
        res.json(data);
    }
    catch (error) {
        res.status(502).json({ ok: false, error: error.message });
    }
});
app.get("/api/time/summary", async (req, res) => {
    try {
        const date = req.query.date;
        const url = date ? `${PIXEL_ME_URL}/time/summary?date=${date}` : `${PIXEL_ME_URL}/time/summary`;
        const resp = await fetch(url);
        const data = await resp.json();
        res.json(data);
    }
    catch (error) {
        res.status(502).json({ ok: false, error: error.message });
    }
});
// KB ingest endpoint - allows agents or users to add documents to knowledge base
app.post("/api/kb/ingest", async (req, res) => {
    const { file, folder } = req.body;
    if (!file && !folder) {
        res.status(400).json({ error: "file or folder required" });
        return;
    }
    try {
        const resp = await fetch(`${KB_SERVER_URL}/ingest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file, folder }),
        });
        const data = await resp.json();
        res.json(data);
    }
    catch (error) {
        res.status(502).json({ ok: false, error: error.message });
    }
});
// Proxy /api/kb to KB Server - also emits visualizer events for agent2agent monitor
app.post("/api/kb/search", async (req, res) => {
    const { query } = req.body;
    const taskId = generateTaskId();
    const now = new Date().toISOString();
    // Emit KB search activity to visualizer
    await emitRouteToVisualizer("system", "archivist", "kb_query", taskId);
    try {
        const resp = await fetch(`${KB_SERVER_URL}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await resp.json();
        // Emit result to visualizer (found or empty)
        const results = data.results || [];
        if (results.length > 0) {
            await emitRouteToVisualizer("archivist", "receptionist", "kb_found", taskId);
        }
        else {
            await emitRouteToVisualizer("archivist", "receptionist", "kb_empty", taskId);
        }
        // Include task info for visualizer tracking
        res.json({
            ...data,
            _workflow: {
                taskId,
                query,
                resultsCount: results.length
            }
        });
    }
    catch (error) {
        await emitRouteToVisualizer("archivist", "specialist", "kb_error", taskId);
        res.status(502).json({ ok: false, error: error.message });
    }
});
// KB document analysis workflow - brings agents together to work on a document
app.post("/api/workflow/kb/analyze", async (req, res) => {
    console.log("[Workflow] KB document analysis endpoint hit!");
    const { document_path, question, requester } = req.body;
    if (!document_path && !question) {
        res.status(400).json({ error: "document_path or question required" });
        return;
    }
    const taskId = generateTaskId();
    const now = new Date().toISOString();
    // Emit complete workflow: receptionist -> clerk -> specialist -> archivist
    await emitRouteToVisualizer("system", "receptionist", "kb_analyze", taskId);
    const task = {
        id: taskId,
        workflowType: "kb_document_analysis",
        status: "in_progress",
        currentOwner: "archivist",
        requester: requester || "user",
        summary: `Analyze: ${document_path}`,
        inputs: { document_path, question, source: "knowledge_base" },
        worklog: [
            { timestamp: now, agent: "system", action: "ticket_created", note: `Analysis request: ${document_path}` },
            { timestamp: now, agent: "receptionist", action: "ticket_processed", note: "Received document analysis ticket" },
        ],
        artifacts: [],
        createdAt: now,
        priority: "normal"
    };
    workflowTasks.set(taskId, task);
    // Full agent handoff chain
    await emitRouteToVisualizer("receptionist", "clerk", " delegation", taskId);
    task.worklog.push({ timestamp: now, agent: "clerk", action: "assigned", note: "Assigned to specialist" });
    await emitRouteToVisualizer("clerk", "specialist", "escalation", taskId);
    task.worklog.push({ timestamp: now, agent: "specialist", action: "reviewed", note: "Analyzing document" });
    await emitRouteToVisualizer("specialist", "archivist", "task", taskId);
    task.worklog.push({ timestamp: now, agent: "archivist", action: "searching", note: "Searching KB for context" });
    // Search KB for the document
    try {
        const kbResponse = await fetch(`${KB_SERVER_URL}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: question || document_path, top_k: 10 }),
        });
        const kbData = await kbResponse.json();
        const results = kbData.results || [];
        task.worklog.push({
            timestamp: new Date().toISOString(),
            agent: "archivist",
            action: results.length > 0 ? "found" : "empty",
            note: `Found ${results.length} chunks`
        });
        // Build analysis summary
        const analysis = results.length > 0
            ? results.map((r) => r.text || JSON.stringify(r)).join("\n\n---\n\n")
            : "No relevant content found in knowledge base.";
        task.artifacts = [{
                type: "kb_analysis",
                content: analysis,
                document: document_path,
                question: question
            }];
        task.status = "completed";
        task.response = analysis.slice(0, 2000);
    }
    catch (e) {
        task.status = "failed";
        task.response = `Error analyzing document: ${e.message}`;
        task.worklog.push({ timestamp: new Date().toISOString(), agent: "archivist", action: "error", note: e.message });
    }
    // Complete workflow - return through receptionist
    await emitRouteToVisualizer("archivist", "receptionist", "complete", taskId);
    task.worklog.push({ timestamp: now, agent: "receptionist", action: "completed", note: "Analysis complete" });
    workflowTasks.set(taskId, task);
    res.json({ taskId, status: task.status, summary: task.summary, response: task.response });
});
// KB workflow endpoint - triggers workflow and visualizer events
app.post("/api/workflow/kb/search", async (req, res) => {
    console.log("[Workflow] KB search workflow endpoint hit!");
    const { query, requester, agentId } = req.body;
    if (!query) {
        res.status(400).json({ error: "query is required" });
        return;
    }
    const taskId = generateTaskId();
    const now = new Date().toISOString();
    // Emit initial route: system -> receptionist (new KB task)
    await emitRouteToVisualizer("system", "receptionist", "kb_task", taskId);
    const task = {
        id: taskId,
        workflowType: "kb_search",
        status: "in_progress",
        currentOwner: "archivist",
        requester: requester || "user",
        summary: `KB search: ${query}`,
        inputs: { query, source: "knowledge_base" },
        worklog: [
            { timestamp: now, agent: "system", action: "kb_ticket_created", note: `KB search request: ${query}` },
            { timestamp: now, agent: "receptionist", action: "kb_ticket_processed", note: `Processing KB search: ${query}` },
        ],
        artifacts: [],
        createdAt: now,
        priority: "normal"
    };
    workflowTasks.set(taskId, task);
    // Emit: receptionist -> clerk (KB delegation)
    await emitRouteToVisualizer("receptionist", "clerk", "kb_delegation", taskId);
    task.worklog.push({ timestamp: now, agent: "clerk", action: "kb_assigned", note: "Assigned to specialist for KB lookup" });
    // Emit: clerk -> specialist (KB escalation)
    await emitRouteToVisualizer("clerk", "specialist", "kb_escalation", taskId);
    task.worklog.push({ timestamp: now, agent: "specialist", action: "kb_reviewed", note: "Processing KB search query" });
    // Emit: specialist -> archivist (KB task)
    await emitRouteToVisualizer("specialist", "archivist", "kb_task", taskId);
    task.worklog.push({ timestamp: now, agent: "archivist", action: "kb_searching", note: `Querying knowledge base: ${query}` });
    try {
        // Query the KB server
        const kbResponse = await fetch(`${KB_SERVER_URL}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, top_k: 5 }),
        });
        const kbData = await kbResponse.json();
        const searchResults = kbData.results || [];
        const hasResults = searchResults.length > 0;
        task.worklog.push({
            timestamp: new Date().toISOString(),
            agent: "archivist",
            action: hasResults ? "kb_found" : "kb_empty",
            note: hasResults ? `Found ${searchResults.length} result(s)` : "No results found in knowledge base"
        });
        // Emit completion
        await emitRouteToVisualizer("archivist", "receptionist", "kb_complete", taskId);
        task.worklog.push({
            timestamp: new Date().toISOString(),
            agent: "receptionist",
            action: "kb_returned",
            note: "Returning KB results to requester"
        });
        task.status = "completed";
        task.response = hasResults
            ? `Found ${searchResults.length} result(s) in knowledge base`
            : "No documents found in knowledge base matching your query";
        task.artifacts = searchResults.map((r) => ({
            type: "kb_chunk",
            content: JSON.stringify(r)
        }));
        workflowTasks.set(taskId, task);
        res.json({
            taskId,
            status: "completed",
            query,
            results: searchResults,
            summary: task.response,
            worklog: task.worklog
        });
    }
    catch (error) {
        console.error("[Workflow] KB search error:", error);
        // Emit failure
        await emitRouteToVisualizer("archivist", "specialist", "kb_failure", taskId);
        task.worklog.push({
            timestamp: new Date().toISOString(),
            agent: "specialist",
            action: "kb_error",
            note: `Error: ${error.message}`
        });
        task.status = "failed";
        task.response = `KB search failed: ${error.message}`;
        workflowTasks.set(taskId, task);
        res.json({
            taskId,
            status: "failed",
            error: error.message,
            worklog: task.worklog
        });
    }
});
const conferenceroomStorage = new ConferenceRoomStorage();
app.use("/conferenceroom", createConferenceRoomRouter(conferenceroomStorage));
function requireAdmin(req, res, next) {
    const token = process.env.ADMIN_ACCESS_TOKEN;
    if (!token) {
        if (process.env.NODE_ENV === "production") {
            res.status(403).json({ error: "Admin access not configured" });
            return;
        }
        next();
        return;
    }
    const header = req.header("x-admin-token");
    if (header !== token) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}
async function runDbQuery(sql, params = []) {
    const pool = await getPool();
    const config = getConfig();
    const isPg = config.db.type === "postgres";
    if (isPg) {
        const result = await pool.query(sql, params);
        return result.rows;
    }
    else {
        const [rows] = await pool.query(sql, params);
        return rows;
    }
}
function parseValue(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
}
async function getDbSchema() {
    const tables = await runDbQuery("SHOW TABLES");
    const tableNames = tables.map((row) => Object.values(row)[0]);
    let schema = "Database schema:\n";
    for (const tableName of tableNames) {
        const columns = await runDbQuery(`DESCRIBE \`${tableName}\``);
        schema += `\nTable: ${tableName}\n`;
        for (const col of columns) {
            schema += `  - ${col.Field} (${col.Type})\n`;
        }
    }
    return { schema, tables: tableNames };
}
async function getTableData(tableName, limit = 10) {
    const rows = await runDbQuery(`SELECT * FROM \`${tableName}\` LIMIT ?`, [limit]);
    return rows.map(row => {
        const parsed = {};
        for (const [key, value] of Object.entries(row)) {
            parsed[key] = parseValue(value);
        }
        return parsed;
    });
}
function detectRequestedTables(message, availableTables) {
    const lowerMessage = message.toLowerCase();
    const requested = [];
    for (const table of availableTables) {
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
        return `\n### ${tableName}\nNo data found.\n`;
    }
    let output = `\n### ${tableName} (${data.length} rows)\n`;
    const headers = Object.keys(data[0]);
    output += `Columns: ${headers.join(', ')}\n\n`;
    for (const row of data.slice(0, 5)) {
        const rowStr = headers.map(h => {
            const val = row[h];
            if (val === null)
                return 'NULL';
            if (typeof val === 'object')
                return JSON.stringify(val);
            return String(val);
        }).join(' | ');
        output += `| ${rowStr} |\n`;
    }
    if (data.length > 5) {
        output += `\n... and ${data.length - 5} more rows\n`;
    }
    return output;
}
app.post("/api/chat", async (req, res) => {
    try {
        const { message, history, model } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Use provided model or fall back to gemma-3-1b-it
        const selectedModel = model || "gemma-3-1b-it";
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        // Check if this is a NVIDIA model (by model ID pattern)
        const isNvidiaModel = selectedModel.includes("/") && !selectedModel.includes(":");
        if (isNvidiaModel) {
            // Route to NVIDIA API
            try {
                const { nvidiaChat } = await import("./llm/nvidiaClient.js");
                const result = await nvidiaChat([
                    { role: "system", content: "You are a helpful assistant at Pixel Office." },
                    ...(history || []).slice(-10).map((m) => ({ role: m.role, content: m.content })),
                    { role: "user", content: message }
                ], {
                    model: selectedModel,
                    maxTokens: 256
                });
                trackLlmRequest("nvidia", selectedModel);
                res.json({ reply: result.content, model: selectedModel });
                return;
            }
            catch (nvidiaErr) {
                console.error("NVIDIA chat error:", nvidiaErr);
                res.json({ reply: `NVIDIA model failed: ${nvidiaErr.message}. Please try a different model.`, model: selectedModel });
                return;
            }
        }
        // Check if model is likely a larger model that needs more time
        const isLargeModel = selectedModel.includes("7b") || selectedModel.includes("8b") || selectedModel.includes("70b");
        const timeoutMs = isLargeModel ? 60000 : 30000; // 60s for large models, 30s otherwise
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            // Use streaming for faster perceived response
            const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: "system", content: "You are a helpful assistant at Pixel Office." },
                        ...(history || []).slice(-10),
                        { role: "user", content: message }
                    ],
                    stream: true, // Enable streaming for faster response
                    options: { num_predict: isLargeModel ? 100 : 50, temperature: 0.7 }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!ollamaResponse.ok) {
                const errorText = await ollamaResponse.text();
                res.json({ reply: `I'm having trouble connecting to the AI model right now. Please try again later. (Model: ${selectedModel})` });
                return;
            }
            // Handle streaming response
            const reader = ollamaResponse.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";
            if (reader) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.message?.content) {
                                    fullResponse += parsed.message.content;
                                }
                            }
                            catch { }
                        }
                    }
                }
                catch (streamErr) {
                    console.error("Stream error:", streamErr);
                }
            }
            const reply = fullResponse || "I couldn't generate a response.";
            // Track LLM request only after successful response
            trackLlmRequest("ollama", selectedModel);
            res.json({ reply, model: selectedModel });
        }
        catch (ollamaErr) {
            clearTimeout(timeoutId);
            if (ollamaErr.name === 'AbortError') {
                console.error("Ollama timeout:", ollamaErr);
                res.json({ reply: "The AI model is taking too long to respond. Please try again.", model: "timeout" });
            }
            else {
                console.error("Ollama error:", ollamaErr);
                res.json({ reply: "I'm having trouble connecting to the AI model right now. Please try again later.", model: "error" });
            }
        }
    }
    catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});
app.post("/api/agent-chat", async (req, res) => {
    try {
        const { message, model, agentName, agentRole } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        const selectedModel = model || "gemma-3-1b-it";
        // Reference to other agents for context (used by both NVIDIA and Ollama routes)
        const agentCoworkers = {
            receptionist: "You work with IronClaw (facilities), OpenClaw (PM), and the rest of the team.",
            clerk: "You collaborate with FrontDesk, IronClaw, and ZeroClaw on tasks.",
            executive: "You lead FrontDesk, OpenClaw, IronClaw, and the specialist team.",
            specialist: "You work with HermitClaw on technical details and ask ZeroClaw for code help.",
            custodian: "You maintain the office with FrontDesk and help all teams keep things running.",
            archivist: "You preserve records for everyone - especially Sherlobster's investigations.",
        };
        // If NVIDIA model selected (detected by / in model ID), use routeChat
        const isNvidiaModel = selectedModel.includes("/") && !selectedModel.includes(":");
        if (isNvidiaModel && process.env.NVIDIA_API_KEY) {
            try {
                const { routeChat } = await import("./llm/llmRouter.js");
                const rolePrompts = {
                    receptionist: "You are FrontDesk, the friendly receptionist at Pixel Office. You know everyone's schedules and always offer visitors coffee. You're in the lobby area. Keep responses warm and brief - you're always happy to help direct people to who they need to see.",
                    clerk: "You are OpenClaw, a Project Manager at Pixel Office. You live by the calendar and always want to 'circle back' on tasks. You're in the open office area near the kitchen. Keep responses action-oriented but friendly.",
                    executive: "You are LeslieClaw, the Team Lead at Pixel Office. You love meetings, spreadsheets, and ending sentences with 'everyone!'. You're in the boss office. Keep responses encouraging and on-topic.",
                    specialist: "You are ZeroClaw, a Junior Developer at Pixel Office. You're curious, take notes constantly, and always ask 'why?'. You're in the specialist suite. Keep responses thoughtful.",
                    custodian: "You are IronClaw, the Facilities Manager at Pixel Office. You fix things before they break and always have tools in your pocket. You're in the open office. Keep responses practical and brief.",
                    archivist: "You are HermitClaw, the Archivist at Pixel Office. You know obscure office history and file everything. You're in the archives. Keep responses measured.",
                };
                const coworkerContext = agentCoworkers[agentRole] || "";
                const fullPrompt = coworkerContext ? `${rolePrompts[agentRole]} ${coworkerContext}` : (rolePrompts[agentRole] || `You are ${agentName}, a helpful assistant.`);
                const messages = [
                    { role: "system", content: fullPrompt },
                    { role: "user", content: message }
                ];
                const result = await routeChat(messages, { maxTokens: 1024, model: selectedModel });
                // Track LLM request
                trackLlmRequest("nvidia", selectedModel);
                return res.json({ reply: result.content, model: `nvidia (${selectedModel})` });
            }
            catch (nvidiaErr) {
                console.error("NVIDIA agent-chat error:", nvidiaErr);
                res.json({ reply: `NVIDIA error: ${nvidiaErr.message || 'failed'}. Try a local model instead.`, model: "nvidia-error" });
                return;
            }
        }
        const rolePrompts = {
            receptionist: "You are FrontDesk, the friendly receptionist at Pixel Office. You know schedules and offer coffee. You can SEARCH THE KNOWLEDGE BASE, SCHEDULE SCRUM SESSIONS for improvements, and SET DEADLINES for tasks. When users want to 'fix' or 'improve' something, use schedule_scrum. Keep responses warm and brief.",
            clerk: "You are OpenClaw, a Project Manager at Pixel Office. You track tasks and love to 'circle back'. For projects/files, SEARCH THE KNOWLEDGE BASE. For 'fix' or 'improve' requests, use schedule_scrum to create timed improvement sessions. Keep responses action-oriented but friendly.",
            executive: "You are LeslieClaw, the Team Lead at Pixel Office. You love meetings and spreadsheets. SCHEDULE SCRUM SESSIONS when teams need to work on things together. Set DEADLINES for important tasks. Keep responses encouraging and on-topic.",
            specialist: "You are ZeroClaw, a Junior Developer at Pixel Office. You're curious and ask 'why?'. For code/docs, SEARCH THE KNOWLEDGE BASE. When asked to 'fix' or 'improve', use schedule_scrum to create time-boxed improvement sessions. CREATE IMPROVEMENT TICKETS for backlog items. Keep responses thoughtful and technical.",
            custodian: "You are IronClaw, the Facilities Manager at Pixel Office. You fix things before they break. For docs/history, SEARCH THE KNOWLEDGE BASE. Create IMPROVEMENT TICKETS for maintenance issues. Keep responses practical and brief.",
            archivist: "You are HermitClaw, the Archivist at Pixel Office. You preserve all records. SEARCH THE KNOWLEDGE BASE for docs. Create IMPROVEMENT TICKETS when issues are found. Keep responses measured but helpful.",
        };
        // coworkerContext already defined earlier (line ~2204)
        const systemPrompt = rolePrompts[agentRole] || `You are ${agentName}, a helpful assistant at Pixel Office.`;
        const coworkerContext = agentCoworkers[agentRole] || "";
        const fullPrompt = coworkerContext ? `${systemPrompt} ${coworkerContext}` : systemPrompt;
        // Map agentRole to RoleId
        const roleMap = {
            receptionist: "specialist",
            clerk: "specialist",
            executive: "specialist",
            specialist: "specialist",
            custodian: "specialist",
            archivist: "specialist",
        };
        const mappedRole = roleMap[agentRole] || "specialist";
        // Use roleModels with tool calling
        try {
            const messages = [
                { role: "system", content: fullPrompt },
                { role: "user", content: message }
            ];
            const result = await callChatModelForRole(mappedRole, messages, { tools: true });
            const reply = result.response || "I couldn't generate a response.";
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
            // Include tool call info if present
            const response = { reply, model: selectedModel };
            if (result.tool_calls) {
                response.tools = result.tool_calls;
            }
            return res.json(response);
        }
        catch (ollamaErr) {
            console.error("Ollama error:", ollamaErr.message);
            res.json({ reply: `I'm having trouble connecting to the AI model right now. Please try again later. (Model: ${selectedModel})` });
            return;
        }
        res.json({ reply, model: selectedModel });
    }
    catch (error) {
        if (typeof timeoutId !== 'undefined')
            clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error("Agent chat Ollama timeout:", error);
            res.json({ reply: "The AI model is taking too long to respond. Please try again.", model: "timeout" });
        }
        else {
            console.error("Agent chat error:", error);
            res.status(500).json({ error: error.message || "Failed to chat with agent" });
        }
    }
});
app.get("/api/db/query", async (req, res) => {
    try {
        const { table, limit } = req.query;
        if (!table || typeof table !== "string") {
            res.status(400).json({ error: "Table name required" });
            return;
        }
        const data = await getTableData(table, limit ? parseInt(limit, 10) : 10);
        res.json({ data });
    }
    catch (error) {
        console.error("Query error:", error);
        res.status(500).json({ error: error.message || "Query failed" });
    }
});
app.get("/api/db/tables", async (req, res) => {
    try {
        const tables = await runDbQuery("SHOW TABLES");
        const tableNames = tables.map((row) => Object.values(row)[0]);
        res.json({ tables: tableNames });
    }
    catch (error) {
        console.error("Tables error:", error);
        res.status(500).json({ error: error.message || "Failed to get tables" });
    }
});
app.get("/api/admin/summary", requireAdmin, async (req, res) => {
    try {
        const tables = await runDbQuery("SHOW TABLES");
        const tableNames = tables.map((row) => Object.values(row)[0]);
        const tableSummaries = [];
        for (const tableName of tableNames) {
            try {
                const countResult = await runDbQuery(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
                const rowCount = Array.isArray(countResult) ? countResult[0]?.cnt : countResult?.cnt || 0;
                tableSummaries.push({ name: tableName, rowCount: Number(rowCount) });
            }
            catch (err) {
                tableSummaries.push({ name: tableName, error: err.message });
            }
        }
        res.json({ tables: tableSummaries });
    }
    catch (error) {
        console.error("Admin summary error:", error);
        res.status(500).json({ error: error.message || "Failed to get summary" });
    }
});
app.get("/api/admin/activity", requireAdmin, async (req, res) => {
    try {
        const tables = await runDbQuery("SHOW TABLES");
        const tableNames = tables.map((row) => Object.values(row)[0]);
        if (!tableNames.includes("activity_log")) {
            res.json({
                events: [],
                message: "Activity logging not yet configured. The activity_log table does not exist."
            });
            return;
        }
        const events = await runDbQuery("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50");
        res.json({ events });
    }
    catch (error) {
        console.error("Admin activity error:", error);
        res.status(500).json({ error: error.message || "Failed to get activity" });
    }
});
app.post("/api/admin/actions/evaluate-stock-forecasts", requireAdmin, async (req, res) => {
    try {
        const tables = await runDbQuery("SHOW TABLES");
        const tableNames = tables.map((row) => Object.values(row)[0]);
        if (!tableNames.includes("stock_forecasts")) {
            res.json({ ok: false, message: "stock_forecasts table does not exist" });
            return;
        }
        const dueForecasts = await runDbQuery("SELECT sf.*, st.symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.status = 'pending' AND sf.target_date <= CURDATE()");
        if (dueForecasts.length === 0) {
            res.json({ ok: true, evaluatedCount: 0, errors: [], message: "No due forecasts to evaluate." });
            return;
        }
        const errors = [];
        let evaluatedCount = 0;
        for (const forecast of dueForecasts) {
            try {
                const priceResult = await fetchPriceForDate(forecast.symbol, forecast.target_date);
                if (!priceResult) {
                    errors.push(`Could not fetch price for ${forecast.symbol} on ${forecast.target_date}`);
                    continue;
                }
                const actualPrice = priceResult.price;
                let actualReturnPct = null;
                let absErrorPrice = null;
                let absErrorPct = null;
                if (forecast.baseline_price && forecast.baseline_price > 0) {
                    actualReturnPct = ((actualPrice - Number(forecast.baseline_price)) / Number(forecast.baseline_price)) * 100;
                }
                if (forecast.predicted_price != null) {
                    absErrorPrice = Math.abs(Number(forecast.predicted_price) - actualPrice);
                }
                if (forecast.predicted_return_pct != null && actualReturnPct != null) {
                    absErrorPct = Math.abs(Number(forecast.predicted_return_pct) - actualReturnPct);
                }
                await runDbQuery("UPDATE stock_forecasts SET status = 'evaluated', evaluated_at = NOW(), actual_price = ?, actual_return_pct = ?, absolute_error_price = ?, absolute_error_pct = ? WHERE id = ?", [actualPrice, actualReturnPct, absErrorPrice, absErrorPct, forecast.id]);
                evaluatedCount++;
            }
            catch (err) {
                errors.push(`Error evaluating forecast #${forecast.id}: ${err.message}`);
            }
        }
        res.json({ ok: true, evaluatedCount, errors, message: `Evaluated ${evaluatedCount} forecast(s).` });
        await logActivity("stock_forecast_evaluated", `Evaluated ${evaluatedCount} pending forecasts`, { evaluated: evaluatedCount, errors: errors.length });
    }
    catch (error) {
        console.error("Admin evaluate error:", error);
        res.status(500).json({ error: error.message || "Failed to evaluate forecasts" });
    }
});
app.post("/api/stocks/forecasts", async (req, res) => {
    try {
        const { symbol, horizon_days, target_date, prediction_type, predicted_price, predicted_direction, notes, user_id } = req.body;
        if (!symbol || !prediction_type) {
            res.status(400).json({ error: "symbol and prediction_type are required" });
            return;
        }
        const validTypes = ["price", "percentage_return", "direction"];
        if (!validTypes.includes(prediction_type)) {
            res.status(400).json({ error: `prediction_type must be one of: ${validTypes.join(", ")}` });
            return;
        }
        const effectiveUserId = user_id || 1;
        const horizon = horizon_days || 14;
        const effectiveTargetDate = target_date || new Date(Date.now() + horizon * 86400000).toISOString().split("T")[0];
        let tickerRows = await runDbQuery("SELECT id FROM stock_tickers WHERE symbol = ?", [symbol.toUpperCase()]);
        let tickerId;
        if (tickerRows.length === 0) {
            await runDbQuery("INSERT INTO stock_tickers (symbol) VALUES (?)", [symbol.toUpperCase()]);
            tickerRows = await runDbQuery("SELECT id FROM stock_tickers WHERE symbol = ?", [symbol.toUpperCase()]);
        }
        tickerId = tickerRows[0].id;
        let baselinePrice = null;
        const priceResult = await fetchCurrentPrice(symbol);
        if (priceResult) {
            baselinePrice = priceResult.price;
        }
        let predictedReturnPct = null;
        if (prediction_type === "price" && predicted_price != null && baselinePrice != null && baselinePrice > 0) {
            predictedReturnPct = ((predicted_price - baselinePrice) / baselinePrice) * 100;
        }
        await runDbQuery(`INSERT INTO stock_forecasts (user_id, ticker_id, horizon_days, target_date, prediction_type, predicted_price, predicted_return_pct, predicted_direction, baseline_price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [effectiveUserId, tickerId, horizon, effectiveTargetDate, prediction_type, predicted_price || null, predictedReturnPct, predicted_direction || null, baselinePrice, notes || null]);
        const inserted = await runDbQuery("SELECT sf.*, st.symbol AS ticker_symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.id = LAST_INSERT_ID()");
        res.json({ forecast: inserted[0] });
    }
    catch (error) {
        console.error("Create forecast error:", error);
        res.status(500).json({ error: error.message || "Failed to create forecast" });
    }
});
app.get("/api/stocks/forecasts", async (req, res) => {
    try {
        const { status, symbol, from, to, user_id, limit, offset } = req.query;
        const effectiveUserId = user_id || 1;
        const conditions = ["sf.user_id = ?"];
        const params = [effectiveUserId];
        if (status) {
            conditions.push("sf.status = ?");
            params.push(status);
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
        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const lim = limit ? parseInt(limit, 10) : 50;
        const off = offset ? parseInt(offset, 10) : 0;
        const countRows = await runDbQuery(`SELECT COUNT(*) as total FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id ${where}`, params);
        const total = countRows[0]?.total || 0;
        const forecasts = await runDbQuery(`SELECT sf.*, st.symbol AS ticker_symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id ${where} ORDER BY sf.created_at DESC LIMIT ? OFFSET ?`, [...params, lim, off]);
        res.json({ forecasts, total: Number(total) });
    }
    catch (error) {
        console.error("List forecasts error:", error);
        res.status(500).json({ error: error.message || "Failed to list forecasts" });
    }
});
app.get("/api/stocks/forecasts/stats", async (req, res) => {
    try {
        const effectiveUserId = req.query.user_id || 1;
        const rows = await runDbQuery(`SELECT
         COUNT(*) as totalForecasts,
         SUM(CASE WHEN status = 'evaluated' THEN 1 ELSE 0 END) as evaluatedCount,
         AVG(CASE WHEN status = 'evaluated' AND absolute_error_price IS NOT NULL THEN absolute_error_price END) as meanAbsoluteErrorPrice,
         AVG(CASE WHEN status = 'evaluated' AND absolute_error_pct IS NOT NULL THEN absolute_error_pct END) as meanAbsoluteErrorPct
       FROM stock_forecasts WHERE user_id = ?`, [effectiveUserId]);
        const directionRows = await runDbQuery(`SELECT
         COUNT(*) as total,
         SUM(CASE
           WHEN predicted_direction = 'up' AND actual_return_pct > 0 THEN 1
           WHEN predicted_direction = 'down' AND actual_return_pct < 0 THEN 1
           WHEN predicted_direction = 'flat' AND ABS(actual_return_pct) < 1 THEN 1
           ELSE 0
         END) as correct
       FROM stock_forecasts
       WHERE user_id = ? AND status = 'evaluated' AND predicted_direction IS NOT NULL`, [effectiveUserId]);
        const stats = rows[0] || {};
        const dirStats = directionRows[0] || {};
        const dirHitRate = dirStats.total > 0 ? (Number(dirStats.correct) / Number(dirStats.total)) * 100 : null;
        res.json({
            totalForecasts: Number(stats.totalForecasts) || 0,
            evaluatedCount: Number(stats.evaluatedCount) || 0,
            meanAbsoluteErrorPrice: stats.meanAbsoluteErrorPrice != null ? Number(stats.meanAbsoluteErrorPrice) : null,
            meanAbsoluteErrorPct: stats.meanAbsoluteErrorPct != null ? Number(stats.meanAbsoluteErrorPct) : null,
            directionHitRate: dirHitRate,
        });
    }
    catch (error) {
        console.error("Forecast stats error:", error);
        res.status(500).json({ error: error.message || "Failed to get forecast stats" });
    }
});
app.get("/api/stocks/forecasts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await runDbQuery("SELECT sf.*, st.symbol AS ticker_symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.id = ?", [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: "Forecast not found" });
            return;
        }
        res.json({ forecast: rows[0] });
    }
    catch (error) {
        console.error("Get forecast error:", error);
        res.status(500).json({ error: error.message || "Failed to get forecast" });
    }
});
app.delete("/api/stocks/forecasts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await runDbQuery("DELETE FROM stock_forecasts WHERE id = ?", [id]);
        res.json({ ok: true });
    }
    catch (error) {
        console.error("Delete forecast error:", error);
        res.status(500).json({ error: error.message || "Failed to delete forecast" });
    }
});
app.post("/api/stocks/forecasts/evaluate-due", requireAdmin, async (req, res) => {
    try {
        const dueForecasts = await runDbQuery("SELECT sf.*, st.symbol FROM stock_forecasts sf JOIN stock_tickers st ON sf.ticker_id = st.id WHERE sf.status = 'pending' AND sf.target_date <= CURDATE()");
        if (dueForecasts.length === 0) {
            res.json({ evaluatedCount: 0, errors: [] });
            return;
        }
        const errors = [];
        let evaluatedCount = 0;
        for (const forecast of dueForecasts) {
            try {
                const priceResult = await fetchPriceForDate(forecast.symbol, forecast.target_date);
                if (!priceResult) {
                    errors.push(`Could not fetch price for ${forecast.symbol} on ${forecast.target_date}`);
                    continue;
                }
                const actualPrice = priceResult.price;
                let actualReturnPct = null;
                let absErrorPrice = null;
                let absErrorPct = null;
                if (forecast.baseline_price && Number(forecast.baseline_price) > 0) {
                    actualReturnPct = ((actualPrice - Number(forecast.baseline_price)) / Number(forecast.baseline_price)) * 100;
                }
                if (forecast.predicted_price != null) {
                    absErrorPrice = Math.abs(Number(forecast.predicted_price) - actualPrice);
                }
                if (forecast.predicted_return_pct != null && actualReturnPct != null) {
                    absErrorPct = Math.abs(Number(forecast.predicted_return_pct) - actualReturnPct);
                }
                await runDbQuery("UPDATE stock_forecasts SET status = 'evaluated', evaluated_at = NOW(), actual_price = ?, actual_return_pct = ?, absolute_error_price = ?, absolute_error_pct = ? WHERE id = ?", [actualPrice, actualReturnPct, absErrorPrice, absErrorPct, forecast.id]);
                evaluatedCount++;
            }
            catch (err) {
                errors.push(`Error evaluating forecast #${forecast.id}: ${err.message}`);
            }
        }
        res.json({ evaluatedCount, errors });
        await logActivity("stock_forecast_evaluated", `Evaluated ${evaluatedCount} pending forecasts`, { evaluated: evaluatedCount, errors: errors.length });
    }
    catch (error) {
        console.error("Evaluate forecasts error:", error);
        res.status(500).json({ error: error.message || "Failed to evaluate forecasts" });
    }
});
app.post("/api/analyze", async (req, res) => {
    try {
        const { symbol, horizon, scenario, source } = req.body;
        if (!symbol) {
            res.status(400).json({ error: "symbol is required" });
            return;
        }
        const dataSource = source === "Real"
            ? DataSource.Real
            : source === "Hybrid"
                ? DataSource.Hybrid
                : DataSource.Mock;
        const ctx = {
            horizon: horizon || "1m",
            scenario: scenario || "base",
            source: dataSource,
        };
        const analyzer = createAnalyzer(dataSource);
        const analysis = await analyzer.analyzeAsset(symbol.toUpperCase(), ctx);
        res.json({ analysis });
    }
    catch (error) {
        console.error("Analyze error:", error);
        res.status(500).json({ error: error.message || "Failed to analyze asset" });
    }
});
app.get("/api/analyze/sources", (req, res) => {
    res.json({
        sources: [
            { id: "Mock", name: "Mock", description: "Synthetic/mock data for testing" },
            { id: "Real", name: "Real", description: "Real market data from Yahoo Finance" },
            { id: "Hybrid", name: "Hybrid", description: "Real prices with mock scenarios" },
        ],
    });
});
// Agent Lightning Training Endpoint
app.post("/api/agentlightning/train", async (req, res) => {
    try {
        const { agentId } = req.body;
        // Simulate training process
        console.log(`Starting agent lightning training for agent: ${agentId || 'anonymous'}`);
        // In a real implementation, this would trigger actual training
        // For now, we'll return a success response
        res.json({
            ok: true,
            status: "completed",
            message: `Agent lightning training started for ${agentId || 'anonymous'}`,
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
});
// Conference Room positions for SCRUM (col 3, row 0 - two doors right of Sherlock)
const CONFERENCE_ROOM_POSITIONS = [
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
const KITCHEN_COOLER_POSITIONS = [
    { x: 870, y: 130 },
    { x: 930, y: 130 },
    { x: 900, y: 150 },
    { x: 860, y: 160 },
    { x: 940, y: 160 },
    { x: 900, y: 180 },
];
const AGENT_NAMES = [
    "FrontDesk", "IronClaw", "ZeroClaw", "HermitClaw", "OpenClaw", "LeslieClaw", "Sherlobster", "Hercule Prawnro"
];
const COOLER_TOPICS = [
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
const coolerTalkLog = [];
async function generateCoolerTalk(agentName, otherAgents, topic) {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const prompt = `You are ${agentName}, a character in a pixel art office simulation. Have a brief, casual conversation with your coworkers about "${topic}". 
Keep your response very short (1-2 sentences max), casual, and in character. Something a coworker would say at the water cooler.`;
    try {
        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gemma-3-1b-it",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: `You turn to talk to ${otherAgents.join(", ")} by the water cooler.` }
                ],
                stream: false
            })
        });
        if (!response.ok) {
            return getFallbackDialogue(agentName, topic);
        }
        const data = await response.json();
        return data.message?.content?.substring(0, 100) || getFallbackDialogue(agentName, topic);
    }
    catch (error) {
        console.error("Ollama error in cooler talk:", error);
        return getFallbackDialogue(agentName, topic);
    }
}
function getFallbackDialogue(agentName, topic) {
    const fallbacks = {
        "FrontDesk": ["Did you hear about the new schedule?", "This coffee is amazing!", "Only 2 more days until Friday!"],
        "IronClaw": ["I fixed the leak in the breakroom.", "Anyone else hungry?", "The weekend can't come soon enough."],
        "ZeroClaw": ["Has anyone seen my notebook?", "This project is going well!", "I love the office atmosphere."],
        "HermitClaw": ["I found something interesting in the archives.", "Quiet day today.", "Anyone want to discuss the new system?"],
        "OpenClaw": ["The reports are all filed.", "Great teamwork everyone!", "Let's grab lunch together."],
        "LeslieClaw": ["Meeting at 3pm everyone!", "Good work on the quarterly numbers.", "We need to discuss the new strategy."],
        "Sherlobster": ["Has anyone seen ClawGuard?", "I had the weirdest dream last night.", "This is quite the place!"],
        "Hercule Prawnro": ["The data looks promising!", "We should celebrate soon.", "Who wants to play ping pong?"],
    };
    const options = fallbacks[agentName] || ["Great weather today!", "Interesting topic!", "I was just thinking the same thing."];
    return options[Math.floor(Math.random() * options.length)];
}
app.post("/api/coolertalk", async (req, res) => {
    try {
        const sessionId = `ct-${Date.now()}`;
        console.log(`[CoolerTalk] Starting session ${sessionId}...`);
        // Select 4-6 random agents to participate
        const numParticipants = 4 + Math.floor(Math.random() * 3);
        const shuffled = [...AGENT_NAMES].sort(() => Math.random() - 0.5);
        const participants = shuffled.slice(0, numParticipants);
        // Pick topic
        const topic = COOLER_TOPICS[Math.floor(Math.random() * COOLER_TOPICS.length)];
        // Create conversation session
        const session = createCoolerSession(topic, participants);
        // Assign kitchen positions
        const assignments = participants.map((name, idx) => ({
            agentId: name.toLowerCase().replace(/ /g, "-"),
            name: name,
            targetX: KITCHEN_COOLER_POSITIONS[idx].x,
            targetY: KITCHEN_COOLER_POSITIONS[idx].y,
        }));
        // Generate chained conversation
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        // Helper function to fetch with longer timeout
        const fetchWithTimeout = async (url, options, timeout = 60000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(id);
                return response;
            }
            catch (e) {
                clearTimeout(id);
                throw e;
            }
        };
        for (let i = 0; i < participants.length; i++) {
            const agentName = participants[i];
            const intent = getNextIntent(session);
            const prompt = buildTurnPrompt(session, agentName, intent, participants);
            let text = "";
            let attempts = 0;
            let valid = false;
            // Longer timeout (60s) and more retries (5)
            // Try up to 5 times to get a valid utterance
            while (!valid && attempts < 5) {
                try {
                    console.log(`[CoolerTalk] Calling ollama for ${agentName} (intent: ${intent})...`);
                    console.log(`[CoolerTalk] Prompt: ${prompt.substring(0, 200)}...`);
                    const response = await fetchWithTimeout(`${ollamaUrl}/api/chat`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: "gemma",
                            messages: [
                                { role: "system", content: prompt },
                                { role: "user", content: "Write your line now. Keep it short and conversational." }
                            ],
                            stream: false
                        })
                    }, 30000);
                    if (response.ok) {
                        const data = await response.json();
                        text = data.message?.content?.trim() || "";
                        console.log(`[CoolerTalk] Ollama response: "${text.substring(0, 80)}..."`);
                        // Clean up any quotes
                        if (text.startsWith('"') && text.endsWith('"')) {
                            text = text.slice(1, -1);
                        }
                    }
                    else {
                        const errorText = await response.text();
                        console.error(`[CoolerTalk] Ollama error ${response.status}:`, errorText);
                    }
                }
                catch (e) {
                    if (e.name === 'AbortError') {
                        console.error("[CoolerTalk] Ollama timeout after 60s - using fallback");
                    }
                    else {
                        console.error("[CoolerTalk] Ollama error:", e.message);
                    }
                }
                // Fallback if empty or error
                if (!text) {
                    console.log(`[CoolerTalk] No response from ollama, using fallback for ${agentName}`);
                    text = getFallbackDialogue(agentName, topic);
                }
                const utterance = {
                    speaker: agentName,
                    text,
                    intent,
                    replyTo: session.utterances.length > 0 ? session.utterances.length - 1 : null,
                };
                const validation = validateUtterance(utterance, session, session.utterances);
                valid = validation.valid;
                if (!valid) {
                    console.log(`[CoolerTalk] REJECTED (${validation.rejected_reasons.join(", ")}): "${text}"`);
                    attempts++;
                    // After max retries, use repair strategy (deterministic template)
                    if (attempts >= 5) {
                        const prevText = session.utterances.length > 0
                            ? session.utterances[session.utterances.length - 1].text
                            : undefined;
                        text = getRepairText(intent, topic, prevText);
                        console.log(`[CoolerTalk] REPAIR used for ${agentName}: "${text}"`);
                        // Create new utterance with repair text
                        const repairUtterance = {
                            speaker: agentName,
                            text,
                            intent,
                            replyTo: session.utterances.length > 0 ? session.utterances.length - 1 : null,
                        };
                        session.utterances.push(repairUtterance);
                        addUtteranceToHistory(session, repairUtterance);
                        session.validationDetails.push({ valid: true, retries: attempts, rejected_reasons: validation.rejected_reasons });
                        session.currentTurn++;
                        valid = true; // Force accept repair
                    }
                }
                else {
                    session.utterances.push(utterance);
                    addUtteranceToHistory(session, utterance);
                    session.validationDetails.push(validation);
                    session.currentTurn++;
                }
            }
            // Delay between turns to let ollama process (skip on last participant)
            if (i < participants.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        // Console log with validation details
        const topicKeywords = session.topicKeywords || [];
        console.log(`[CoolerTalk] Session ${session.id} - Topic: "${topic}"`);
        console.log(`[CoolerTalk] Keywords: ${topicKeywords.join(", ")}`);
        console.log(`[CoolerTalk] Participants: ${participants.join(", ")}`);
        session.utterances.forEach((u, i) => {
            const details = session.validationDetails[i];
            const retryInfo = details ? ` [retries:${details.retries}, reasons:${details.rejected_reasons.join(";")}]` : "";
            console.log(`[CoolerTalk] ${u.speaker} (${u.intent}): "${u.text}"${retryInfo}`);
        });
        // Format dialogues for client (speech bubbles) - with staggered timing
        // Each bubble shows for 8 seconds, then next one appears after 3 seconds
        // Also add a 3 second initial delay for agents to "get their drinks"
        const dialogueStartDelay = 3000;
        const dialogues = session.utterances.map((u, idx) => ({
            agentId: u.speaker.toLowerCase().replace(/ /g, "-"),
            text: u.text,
            intent: u.intent,
            showAt: Date.now() + dialogueStartDelay + (idx * 3000), // 3s initial, then 3s between
            expiresAt: Date.now() + dialogueStartDelay + (idx * 3000) + 8000, // show for 8s each
        }));
        // Build structured log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            sessionId: session.id,
            topic,
            participants,
            utterances: session.utterances.map(u => ({
                speaker: u.speaker,
                text: u.text,
                intent: u.intent,
                reply_to: u.replyTo,
            })),
        };
        // Store in memory log
        coolerTalkLog.push(logEntry);
        if (coolerTalkLog.length > 10)
            coolerTalkLog.shift();
        // Save to markdown file with new format
        writeCoolerTalkToFile(session);
        res.json({
            ok: true,
            session_id: session.id,
            participant_count: participants.length,
            assignments: assignments,
            dialogues: dialogues,
            topic: topic,
            duration_ms: 60000,
            started_at: new Date().toISOString()
        });
    }
    catch (error) {
        console.error("Cooler talk error:", error);
        res.status(500).json({
            ok: false,
            error: error.message || "Failed to start cooler talk"
        });
    }
});
// Get cooler talk conversation log
app.get("/api/coolertalk/log", (req, res) => {
    res.json({
        sessions: coolerTalkLog
    });
});
// Get updated dialogue during cooler talk
app.get("/api/coolertalk/dialogue", async (req, res) => {
    try {
        const topic = COOLER_TOPICS[Math.floor(Math.random() * COOLER_TOPICS.length)];
        const agentName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
        const otherAgents = AGENT_NAMES.filter(n => n !== agentName).slice(0, 3);
        const dialogue = await generateCoolerTalk(agentName, otherAgents, topic);
        res.json({
            agentId: agentName.toLowerCase().replace(/ /g, "-"),
            text: dialogue,
            expiresAt: Date.now() + 15000,
        });
    }
    catch (error) {
        console.error("Dialogue error:", error);
        res.status(500).json({ error: error.message });
    }
});
// AgentLightning Architecture
app.get("/api/agentlightning/architecture", (req, res) => {
    const archPath = "path.resolve(process.cwd(), "..", ".openclaw")/workspace-main/AGENTLIGHTNING_ROLE_ARCHITECTURE.yaml";
    try {
        const yamlContent = fs.readFileSync(archPath, "utf8");
        res.json({ yaml: yamlContent });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(Number(PORT), "127.0.0.1", () => {
    console.log(`Pixel Office Live server running on http://localhost:${PORT}`);
    console.log(`Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`DB Tables: http://localhost:${PORT}/api/db/tables`);
});
async function callRoleDailyPlan(tasks, maxMinutes = 450, minSlot = 6, maxSlot = 18) {
    const systemMsg = `You are a workload planner for a single knowledge worker with ${maxMinutes} minutes of capacity per day. Tasks are ${minSlot}–${maxSlot} minutes each. You must produce a JSON plan that respects total capacity and uses only provided task_ids.`;
    const userPayload = {
        capacity_minutes: maxMinutes,
        min_slot_minutes: minSlot,
        max_slot_minutes: maxSlot,
        tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            estimated_minutes: t.estimated_minutes,
            due_date: t.due_date ? t.due_date.toISOString().split("T")[0] : null,
        })),
    };
    const userMsg = `Given the following open tasks and constraints, create a JSON object with keys \`summary\`, \`total_allocated_minutes\`, and \`items\` (a list of objects with \`task_id\`, \`allocated_minutes\`, and \`notes\`).\n\n` +
        `Constraints:\n` +
        `- Total allocated minutes <= ${maxMinutes}\n` +
        `- Each slot between ${minSlot} and ${maxSlot} minutes\n` +
        `- Use only task_ids from the list.\n` +
        `- Prefer higher priority and nearer due_date.\n\n` +
        `Tasks JSON:\n` +
        JSON.stringify(userPayload, null, 2);
    const messages = [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
    ];
    const result = await callChatModelForRole("workload_planner", messages, {
        temperature: 0.2,
    });
    const content = result.response;
    if (!content) {
        throw new Error("No response from LLM");
    }
    // Attempt to parse JSON from the response. 
    // Improved models will return pure JSON, but some might wrap it in markdown blocks.
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const plan = JSON.parse(jsonStr);
    // Attach metadata
    plan.metadata = {
        role: result.role,
        model: result.model
    };
    return plan;
}
app.post("/api/daily_plan", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const tasks = await runDbQuery(`SELECT id, title, description, status, priority, estimated_minutes, due_date
       FROM tasks
       WHERE status IN ('open', 'in_progress')
       ORDER BY priority ASC, COALESCE(due_date, '9999-12-31') ASC, id ASC
       LIMIT 100`);
        if (tasks.length === 0) {
            res.json({ message: "No open tasks found.", plan: null });
            return;
        }
        let plan;
        try {
            plan = await callRoleDailyPlan(tasks);
        }
        catch (err) {
            res.status(500).json({ error: "Failed to generate plan", details: err.message });
            return;
        }
        const summary = plan.summary || "";
        const totalAllocated = parseInt(plan.total_allocated_minutes, 10) || 0;
        const items = plan.items || [];
        if (!items || items.length === 0) {
            res.status(500).json({ error: "Plan contained no items" });
            return;
        }
        await runDbQuery(`INSERT INTO daily_plans (plan_date, summary, total_allocated_minutes)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         summary = VALUES(summary),
         total_allocated_minutes = VALUES(total_allocated_minutes)`, [today, summary, totalAllocated]);
        const planRows = await runDbQuery("SELECT id FROM daily_plans WHERE plan_date = ?", [today]);
        const dailyPlanId = planRows[0].id;
        await runDbQuery("DELETE FROM daily_plan_items WHERE daily_plan_id = ?", [dailyPlanId]);
        let slotIndex = 1;
        for (const item of items) {
            const taskId = parseInt(item.task_id, 10);
            const allocMin = parseInt(item.allocated_minutes, 10) || 0;
            const notes = item.notes || "";
            if (allocMin <= 0)
                continue;
            await runDbQuery(`INSERT INTO daily_plan_items (daily_plan_id, task_id, slot_index, allocated_minutes, notes)
         VALUES (?, ?, ?, ?, ?)`, [dailyPlanId, taskId, slotIndex, allocMin, notes]);
            slotIndex++;
        }
        res.json({
            plan_date: today,
            summary,
            total_allocated_minutes: totalAllocated,
            items,
        });
    }
    catch (error) {
        console.error("Daily plan error:", error);
        res.status(500).json({ error: error.message || "Failed to generate daily plan" });
    }
});
app.get("/api/daily_plan", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const plans = await runDbQuery("SELECT * FROM daily_plans WHERE plan_date = ?", [today]);
        if (plans.length === 0) {
            res.json({ plan: null });
            return;
        }
        const plan = plans[0];
        const items = await runDbQuery(`SELECT dpi.*, t.title, t.description, t.priority, t.estimated_minutes
       FROM daily_plan_items dpi
       JOIN tasks t ON dpi.task_id = t.id
       WHERE dpi.daily_plan_id = ?
       ORDER BY dpi.slot_index`, [plan.id]);
        res.json({
            plan: {
                ...plan,
                items,
            },
        });
    }
    catch (error) {
        console.error("Get daily plan error:", error);
        res.status(500).json({ error: error.message || "Failed to get daily plan" });
    }
});
app.post("/api/tasks", async (req, res) => {
    try {
        // Proxy to Pixel-Me
        const resp = await fetch(`${PIXEL_ME_URL}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await resp.json();
        res.json(data);
    }
    catch (error) {
        console.error("Create task proxy error:", error);
        res.status(502).json({ ok: false, error: error.message });
    }
});
app.get("/api/tasks", async (req, res) => {
    try {
        // Proxy to Pixel-Me
        const status = req.query.status || "open";
        const project = req.query.project;
        let url = `${PIXEL_ME_URL}/tasks?status=${status}`;
        if (project)
            url += `&project=${project}`;
        const resp = await fetch(url);
        const data = await resp.json();
        res.json(data);
    }
    catch (error) {
        console.error("List tasks proxy error:", error);
        res.status(502).json({ ok: false, error: error.message });
    }
});
app.patch("/api/tasks/:id", async (req, res) => {
    try {
        // Proxy to Pixel-Me
        const { id } = req.params;
        const resp = await fetch(`${PIXEL_ME_URL}/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await resp.json();
        res.json(data);
    }
    catch (error) {
        console.error("Update task proxy error:", error);
        res.status(502).json({ ok: false, error: error.message });
    }
});
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await runDbQuery("DELETE FROM tasks WHERE id = ?", [id]);
        res.json({ ok: true });
    }
    catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({ error: error.message || "Failed to delete task" });
    }
});
app.get("/api/analytics/capacity", async (req, res) => {
    try {
        const results = await runDbQuery(`
      SELECT
        dp.plan_date,
        SUM(dpi.allocated_minutes) AS total_allocated_minutes,
        SUM(CASE WHEN t.status = 'done' THEN dpi.allocated_minutes ELSE 0 END) AS executed_minutes
      FROM daily_plans dp
      JOIN daily_plan_items dpi ON dp.id = dpi.daily_plan_id
      JOIN tasks t ON dpi.task_id = t.id
      GROUP BY dp.plan_date
      ORDER BY dp.plan_date DESC
    `);
        res.json({ capacity: results });
    }
    catch (error) {
        console.error("Analytics capacity error:", error);
        res.status(500).json({ error: error.message || "Failed to get capacity analytics" });
    }
});
const workflowTasks = new Map();
function generateTaskId() {
    return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
async function fetchGitHubFile(owner, repo, path, token) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "PixelOffice/1.0"
    };
    if (token) {
        headers["Authorization"] = `token ${token}`;
    }
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            const error = await response.text();
            console.error(`GitHub API error: ${response.status} - ${error}`);
            return null;
        }
        const data = await response.json();
        if (data.content) {
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return { content, sha: data.sha };
        }
        return null;
    }
    catch (error) {
        console.error("GitHub fetch error:", error);
        return null;
    }
}
async function fetchGitHubREADME(owner, repo, token) {
    const readmeNames = ['README.md', 'README.rst', 'README.txt', 'README'];
    for (const name of readmeNames) {
        const result = await fetchGitHubFile(owner, repo, name, token);
        if (result) {
            return result.content;
        }
    }
    return null;
}
// Create new workflow task (entry point)
app.post("/api/workflow/create", async (req, res) => {
    try {
        const { workflowType, requester, summary, inputs, priority = "normal" } = req.body;
        if (!workflowType || !requester) {
            res.status(400).json({ error: "workflowType and requester are required" });
            return;
        }
        const taskId = generateTaskId();
        const now = new Date().toISOString();
        const task = {
            id: taskId,
            workflowType,
            status: "queued",
            currentOwner: "receptionist",
            requester,
            summary: summary || "",
            inputs: inputs || {},
            worklog: [{
                    timestamp: now,
                    agent: "system",
                    action: "ticket_created",
                    note: `New ${workflowType} workflow created by ${requester}`
                }],
            artifacts: [],
            createdAt: now,
            priority
        };
        workflowTasks.set(taskId, task);
        res.json({
            taskId,
            status: task.status,
            currentOwner: task.currentOwner,
            message: "Task created and queued for receptionist"
        });
    }
    catch (error) {
        console.error("Workflow create error:", error);
        res.status(500).json({ error: error.message || "Failed to create workflow task" });
    }
});
// Receptionist processes the task
app.post("/api/workflow/receptionist/process", async (req, res) => {
    try {
        const { taskId, extractedSummary, extractedInputs } = req.body;
        if (!taskId) {
            res.status(400).json({ error: "taskId is required" });
            return;
        }
        const task = workflowTasks.get(taskId);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        if (task.currentOwner !== "receptionist") {
            res.status(400).json({ error: `Task is currently owned by ${task.currentOwner}` });
            return;
        }
        const now = new Date().toISOString();
        task.summary = extractedSummary || task.summary;
        task.inputs = { ...task.inputs, ...extractedInputs };
        task.status = "in_progress";
        task.currentOwner = "clerk";
        task.worklog.push({
            timestamp: now,
            agent: "receptionist",
            action: "ticket_processed",
            note: `Extracted: ${task.summary}`
        });
        workflowTasks.set(taskId, task);
        res.json({
            taskId,
            status: task.status,
            currentOwner: task.currentOwner,
            message: "Task processed by receptionist, assigned to clerk"
        });
    }
    catch (error) {
        console.error("Receptionist process error:", error);
        res.status(500).json({ error: error.message || "Failed to process task" });
    }
});
// Clerk assigns task to specialist
app.post("/api/workflow/clerk/assign", async (req, res) => {
    try {
        const { taskId, specialistId } = req.body;
        if (!taskId) {
            res.status(400).json({ error: "taskId is required" });
            return;
        }
        const task = workflowTasks.get(taskId);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        if (task.currentOwner !== "clerk") {
            res.status(400).json({ error: `Task is currently owned by ${task.currentOwner}` });
            return;
        }
        const now = new Date().toISOString();
        task.status = "in_progress";
        task.currentOwner = specialistId || "specialist";
        task.worklog.push({
            timestamp: now,
            agent: "clerk",
            action: "assigned",
            note: `Assigned to ${task.currentOwner}`
        });
        workflowTasks.set(taskId, task);
        res.json({
            taskId,
            status: task.status,
            currentOwner: task.currentOwner,
            message: `Task assigned to ${task.currentOwner}`
        });
    }
    catch (error) {
        console.error("Clerk assign error:", error);
        res.status(500).json({ error: error.message || "Failed to assign task" });
    }
});
// Specialist reviews and adds content
app.post("/api/workflow/specialist/review", async (req, res) => {
    try {
        const { taskId, reviewResult, approved = true } = req.body;
        if (!taskId) {
            res.status(400).json({ error: "taskId is required" });
            return;
        }
        const task = workflowTasks.get(taskId);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        if (task.currentOwner !== "specialist") {
            res.status(400).json({ error: `Task is currently owned by ${task.currentOwner}` });
            return;
        }
        const now = new Date().toISOString();
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
            taskId,
            status: task.status,
            currentOwner: task.currentOwner,
            message: approved ? "Task reviewed and awaiting delivery" : "Task rejected"
        });
    }
    catch (error) {
        console.error("Specialist review error:", error);
        res.status(500).json({ error: error.message || "Failed to review task" });
    }
});
// Archivist archives the completed task
app.post("/api/workflow/archivist/complete", async (req, res) => {
    try {
        const { taskId, response, artifacts = [] } = req.body;
        if (!taskId) {
            res.status(400).json({ error: "taskId is required" });
            return;
        }
        const task = workflowTasks.get(taskId);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        const now = new Date().toISOString();
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
            taskId,
            status: task.status,
            response: task.response,
            message: "Task completed and archived"
        });
    }
    catch (error) {
        console.error("Archivist complete error:", error);
        res.status(500).json({ error: error.message || "Failed to complete task" });
    }
});
// Get task status
app.get("/api/workflow/:taskId", (req, res) => {
    try {
        const { taskId } = req.params;
        const task = workflowTasks.get(taskId);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        res.json({ task });
    }
    catch (error) {
        console.error("Get workflow error:", error);
        res.status(500).json({ error: error.message || "Failed to get task" });
    }
});
// GitHub file retrieval endpoint (triggers full workflow)
app.post("/api/workflow/github/readme", async (req, res) => {
    try {
        const { owner, repo, requester, token } = req.body;
        if (!owner || !repo) {
            res.status(400).json({ error: "owner and repo are required" });
            return;
        }
        // Step 1: Create task
        const taskId = generateTaskId();
        const now = new Date().toISOString();
        const task = {
            id: taskId,
            workflowType: "github_readme_retrieval",
            status: "queued",
            currentOwner: "receptionist",
            requester: requester || "user",
            summary: `Retrieve README from ${owner}/${repo}`,
            inputs: { owner, repo },
            worklog: [{
                    timestamp: now,
                    agent: "system",
                    action: "ticket_created",
                    note: `Request to retrieve README from ${owner}/${repo}`
                }],
            artifacts: [],
            createdAt: now,
            priority: "normal"
        };
        workflowTasks.set(taskId, task);
        // Emit: system -> receptionist (new task)
        await emitRouteToVisualizer("system", "receptionist", "task", taskId);
        // Step 2: Receptionist processes (synchronously for this endpoint)
        const extractedSummary = `Fetch README.md from GitHub repository ${owner}/${repo}`;
        task.summary = extractedSummary;
        task.status = "in_progress";
        task.currentOwner = "clerk";
        task.worklog.push({
            timestamp: new Date().toISOString(),
            agent: "receptionist",
            action: "ticket_processed",
            note: `Extracted: ${extractedSummary}`
        });
        // Emit: receptionist -> clerk (delegation)
        await emitRouteToVisualizer("receptionist", "clerk", "delegation", taskId);
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
        await emitRouteToVisualizer("clerk", "specialist", "escalation", taskId);
        workflowTasks.set(taskId, task);
        // Step 4: Fetch the README
        const readmeContent = await fetchGitHubREADME(owner, repo, token);
        if (!readmeContent) {
            task.status = "failed";
            task.currentOwner = "clerk";
            task.worklog.push({
                timestamp: new Date().toISOString(),
                agent: "specialist",
                action: "failed",
                note: `Could not find README in ${owner}/${repo}`
            });
            task.response = `I couldn't find a README file in the repository ${owner}/${repo}. Please check the repository name and try again.`;
            // Emit: specialist -> archivist (failure)
            await emitRouteToVisualizer("specialist", "archivist", "failure", taskId);
            // Emit: archivist -> executive (fallback)
            await emitRouteToVisualizer("archivist", "executive", "fallback", taskId);
            workflowTasks.set(taskId, task);
            res.json({
                taskId,
                status: task.status,
                response: task.response,
                worklog: task.worklog
            });
            return;
        }
        // Step 5: Specialist approves with content
        // Emit: specialist -> archivist (task complete)
        await emitRouteToVisualizer("specialist", "archivist", "task", taskId);
        const truncatedContent = readmeContent.length > 5000
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
        task.response = `Here's the README from ${owner}/${repo}:\n\n${truncatedContent}`;
        task.worklog.push({
            timestamp: new Date().toISOString(),
            agent: "archivist",
            action: "completed",
            note: "Task completed and archived"
        });
        workflowTasks.set(taskId, task);
        res.json({
            taskId,
            status: task.status,
            summary: task.summary,
            response: task.response,
            artifacts: task.artifacts,
            worklog: task.worklog
        });
    }
    catch (error) {
        console.error("GitHub README workflow error:", error);
        res.status(500).json({ error: error.message || "Failed to retrieve README" });
    }
});
// Health check for workflow system
app.get("/api/workflow/health", (req, res) => {
    res.json({
        status: "healthy",
        activeTasks: workflowTasks.size,
        timestamp: new Date().toISOString()
    });
});
// ============================================================================
// OpenCode Audit Integration
// ============================================================================
import { spawn } from "child_process";
const OPENCODE_AUDIT_BIN = process.env.OPENCOD_AUDIT_BIN || "path.resolve(process.cwd(), "..", "tools", "opencode_audit")/opencode_audit.py";
const AUDIT_DATA_DIR = path.resolve(process.cwd(), "data/audits");
const PROMPT_CARDS_DIR = path.resolve(process.cwd(), "data/prompt_cards");
function ensureDir(dir) {
    const fs = require("fs");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function generatePromptCardId() {
    return `pc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
// Create new audit (POST /api/audit/create)
app.post("/api/audit/create", async (req, res) => {
    try {
        const { repo, scope = {}, output_format = "mermaid", priority = "normal" } = req.body;
        if (!repo) {
            return res.status(400).json({ error: "repo is required" });
        }
        ensureDir(AUDIT_DATA_DIR);
        ensureDir(PROMPT_CARDS_DIR);
        const promptCardId = generatePromptCardId();
        const now = new Date().toISOString();
        const promptCard = {
            id: promptCardId,
            kind: "code_audit",
            origin: "pixel_office",
            repo,
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
        // Save prompt card
        const cardPath = path.join(PROMPT_CARDS_DIR, `${promptCardId}.json`);
        const fs = require("fs");
        fs.writeFileSync(cardPath, JSON.stringify(promptCard, null, 2));
        // Emit route event to router-visualizer
        try {
            await fetch("http://localhost:5006/api/route", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: "PIXEL",
                    to: "OPENC",
                    route_type: "task",
                    task_type: "code_audit",
                    task_id: promptCardId
                })
            });
        }
        catch (e) {
            console.log("[Audit] Router visualizer not available");
        }
        // Execute audit (fire and forget)
        const outputDir = path.join(AUDIT_DATA_DIR, promptCardId);
        ensureDir(outputDir);
        const child = spawn("python3", [OPENCODE_AUDIT_BIN, "--prompt-card", cardPath, "--output-dir", outputDir], {
            stdio: ["ignore", "pipe", "pipe"]
        });
        child.stdout.on("data", (data) => {
            console.log("[Audit]", data.toString().trim());
        });
        child.stderr.on("data", (data) => {
            console.error("[Audit Error]", data.toString().trim());
        });
        child.on("close", (code) => {
            // Update prompt card status
            const fs = require("fs");
            const updatedCard = JSON.parse(fs.readFileSync(cardPath, "utf-8"));
            if (code === 0) {
                // Read result and update
                try {
                    const resultPath = path.join(outputDir, "result.json");
                    if (fs.existsSync(resultPath)) {
                        const result = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
                        updatedCard.artifacts = result.artifacts || {};
                        updatedCard.status = "completed";
                    }
                    else {
                        // Check for artifacts directly
                        const artifacts = {};
                        ["audit_report.md", "file_tree.md", "logic_flow.mmd"].forEach(f => {
                            const fpath = path.join(outputDir, f);
                            if (fs.existsSync(fpath)) {
                                artifacts[f] = fpath;
                            }
                        });
                        if (Object.keys(artifacts).length > 0) {
                            updatedCard.artifacts = artifacts;
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
                updatedCard.error = `Process exited with code ${code}`;
            }
            updatedCard.updated_at = new Date().toISOString();
            updatedCard.worklog.push({
                timestamp: updatedCard.updated_at,
                agent: "opencode_audit",
                action: updatedCard.status,
                note: `Audit ${updatedCard.status}`
            });
            fs.writeFileSync(cardPath, JSON.stringify(updatedCard, null, 2));
        });
        res.json({
            prompt_card_id: promptCardId,
            status: "queued",
            repo,
            created_at: now
        });
    }
    catch (error) {
        console.error("Audit create error:", error);
        res.status(500).json({ error: error.message });
    }
});
// Get audit status (GET /api/audit/:prompt_card_id)
app.get("/api/audit/:prompt_card_id", async (req, res) => {
    try {
        const { prompt_card_id } = req.params;
        const fs = require("fs");
        // Search in prompt cards dir
        const cardPath = path.join(PROMPT_CARDS_DIR, `${prompt_card_id}.json`);
        if (!fs.existsSync(cardPath)) {
            return res.status(404).json({ error: "Audit not found" });
        }
        const card = JSON.parse(fs.readFileSync(cardPath, "utf-8"));
        // If completed, load artifact contents
        let artifacts = {};
        if (card.status === "completed" && card.artifacts) {
            for (const [name, filepath] of Object.entries(card.artifacts)) {
                if (fs.existsSync(filepath)) {
                    artifacts[name] = {
                        path: filepath,
                        content: fs.readFileSync(filepath, "utf-8").substring(0, 5000)
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
            artifacts,
            error: card.error
        });
    }
    catch (error) {
        console.error("Audit get error:", error);
        res.status(500).json({ error: error.message });
    }
});
// List audits (GET /api/audit)
app.get("/api/audit", async (req, res) => {
    try {
        const { status, limit = 20 } = req.query;
        const fs = require("fs");
        ensureDir(PROMPT_CARDS_DIR);
        const files = fs.readdirSync(PROMPT_CARDS_DIR).filter(f => f.endsWith(".json"));
        let cards = [];
        for (const file of files) {
            try {
                const card = JSON.parse(fs.readFileSync(path.join(PROMPT_CARDS_DIR, file), "utf-8"));
                if (card.kind === "code_audit") {
                    cards.push(card);
                }
            }
            catch (e) {
                // Skip invalid files
            }
        }
        // Filter by status if provided
        if (status) {
            cards = cards.filter(c => c.status === status);
        }
        // Sort by date, newest first
        cards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Limit results
        cards = cards.slice(0, parseInt(limit) || 20);
        res.json({
            audits: cards.map(c => ({
                prompt_card_id: c.id,
                repo: c.repo,
                status: c.status,
                created_at: c.created_at,
                updated_at: c.updated_at
            })),
            total: cards.length
        });
    }
    catch (error) {
        console.error("Audit list error:", error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================================================
// Phase D Bind Patch: Repo Question Handler
// ============================================================================
import { handleRepoQuestion, formatAnswerForOffice } from "./services/repoQuestionHandler.js";
app.post("/api/repo/ask", async (req, res) => {
    try {
        const { message, agentName = "clerk", createTask = false } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        const result = await handleRepoQuestion(message, { createTask });
        if (!result.isRepoQuestion) {
            return res.status(200).json({
                isRepoQuestion: false,
                answer: null,
                message: "This doesn't appear to be a repo question"
            });
        }
        if (createTask && result.questionType) {
            try {
                const task = await tasksV2.create({
                    title: `Repo question: ${result.questionType}`,
                    description: message,
                    status: "inbox",
                    priority: "P3",
                    tags: ["repo", "question", result.questionType],
                    source: "chat",
                });
                result.taskCreated = true;
            }
            catch (taskErr) {
                console.error("[RepoQuestionHandler] Failed to create task:", taskErr);
            }
        }
        const formattedAnswer = formatAnswerForOffice(result, agentName);
        res.json({
            isRepoQuestion: result.isRepoQuestion,
            questionType: result.questionType,
            answer: result.answer,
            formattedAnswer,
            taskCreated: result.taskCreated || false,
            metadata: result.metadata,
        });
    }
    catch (error) {
        console.error("Repo question error:", error);
        res.status(500).json({ error: error.message || "Failed to process repo question" });
    }
});
app.get("/api/repo/status", async (req, res) => {
    try {
        const { fetchRepoStatus, extractRepoInfo } = await import("./services/repoQuestionHandler.js");
        const repoInfo = extractRepoInfo({});
        const status = await fetchRepoStatus({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
        });
        res.json({
            configured: !!(process.env.GITHUB_TOKEN && process.env.SAFE_SCRUM_REPO),
            repo: repoInfo.repo !== "unknown" ? repoInfo : null,
            status,
        });
    }
    catch (error) {
        console.error("Repo status error:", error);
        res.status(500).json({ error: error.message });
    }
});
// Agent2Agent Issue Monitor Endpoint
app.post("/api/coolertalk/issues", async (req, res) => {
    try {
        const keywords = req.body.keywords || [];
        // Get recent cooler sessions from JSON files
        const sessionsDir = path.resolve("data/cooler_sessions");
        if (!fs.existsSync(sessionsDir)) {
            res.json({ issues: [] });
            return;
        }
        const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".json"));
        const sessions = files.map(file => {
            const filePath = path.join(sessionsDir, file);
            try {
                return JSON.parse(fs.readFileSync(filePath, "utf-8"));
            }
            catch {
                return null;
            }
        }).filter(Boolean).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 20);
        const issues = [];
        for (const session of sessions) {
            const topicLower = (session.topic || '').toLowerCase();
            const participants = session.participants || [];
            // Check if topic matches any keywords
            const hasKeyword = keywords.some((kw) => topicLower.includes(kw.toLowerCase()));
            if (hasKeyword) {
                // Determine severity based on keywords
                let severity = 'low';
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
                    severity,
                });
            }
        }
        res.json({ issues: issues.slice(0, 10) });
    }
    catch (error) {
        console.error("Issues fetch error:", error);
        res.json({ issues: [] });
    }
});
