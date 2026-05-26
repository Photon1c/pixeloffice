"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSocialPotential = calculateSocialPotential;
exports.getAgentWeightsWithShadows = getAgentWeightsWithShadows;
exports.getActiveTraces = getActiveTraces;
exports.saveTraces = saveTraces;
exports.depositTrace = depositTrace;
exports.getTracesForRoom = getTracesForRoom;
var fs = require("fs");
var path = require("path");
var TRACES_FILE = "process.cwd()/data/stigmergy_traces.json";
function calculateSocialPotential() {
    var sessionsDir = "process.cwd()/data/cooler_sessions";
    var windowMs = 60 * 60 * 1000;
    var now = Date.now();
    var windowStart = new Date(now - windowMs).toISOString();
    var sessionCount = 0;
    var participantCount = 0;
    var recentSessions = [];
    try {
        if (fs.existsSync(sessionsDir)) {
            var files = fs.readdirSync(sessionsDir).filter(function (f) { return f.endsWith('.json'); });
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                try {
                    var filePath = path.join(sessionsDir, file);
                    var raw = fs.readFileSync(filePath, 'utf-8');
                    var session = JSON.parse(raw);
                    var stats = fs.statSync(filePath);
                    var sessionTime = session.created_at || session.startedAt;
                    var mtimeMs = stats.mtimeMs;
                    // Count if session timestamp OR file modification is within window
                    var isRecent = sessionTime > windowStart || mtimeMs > now - windowMs;
                    if (isRecent) {
                        sessionCount++;
                        var participants = session.participants || [];
                        participantCount += participants.length;
                        recentSessions.push({
                            id: session.id,
                            topic: session.topic || '',
                            participants: participants,
                            created_at: sessionTime || stats.mtime.toISOString()
                        });
                    }
                }
                catch (e) {
                    console.log("[Stigmergy] Error reading session:", e);
                }
            }
        }
    }
    catch (e) {
        console.log("[Stigmergy] Error calculating social potential:", e);
    }
    console.log("[Stigmergy] Social potential:", { sessionCount: sessionCount, participantCount: participantCount });
    var maxSessions = 10;
    var maxParticipants = 160;
    var sessionNorm = Math.min(sessionCount / maxSessions, 1);
    var participantNorm = Math.min(participantCount / maxParticipants, 1);
    var intensity = (sessionNorm * 0.6) + (participantNorm * 0.4);
    return { sessionCount: sessionCount, participantCount: participantCount, intensity: intensity, recentSessions: recentSessions };
}
// Get agent selection weights based on task shadow intensity
function getAgentWeightsWithShadows(agentIds) {
    var traces = getActiveTraces();
    var shadowTraces = traces.filter(function (t) { return t.type === 'task_shadow'; });
    // Group by agent
    var agentShadows = {};
    shadowTraces.forEach(function (t) {
        if (t.agentId) {
            if (!agentShadows[t.agentId])
                agentShadows[t.agentId] = { count: 0, totalIntensity: 0 };
            agentShadows[t.agentId].count++;
            agentShadows[t.agentId].totalIntensity += t.intensity;
        }
    });
    // Calculate weights: base weight + shadow bonus
    var weights = new Map();
    var shadowBonusMultiplier = 0.3; // up to 30% bonus for high shadows
    agentIds.forEach(function (agentId) {
        var baseWeight = 1.0;
        var shadowData = agentShadows[agentId];
        var bonus = 0;
        if (shadowData && shadowData.count > 0) {
            var avgIntensity = shadowData.totalIntensity / shadowData.count;
            bonus = avgIntensity * shadowBonusMultiplier;
            console.log("[Stigmergy] Agent ".concat(agentId, " shadow bonus: ").concat(bonus.toFixed(3), " (").concat(shadowData.count, " shadows, avg ").concat(avgIntensity.toFixed(2), ")"));
        }
        weights.set(agentId, baseWeight + bonus);
    });
    return weights;
}
var DEFAULTS = {
    review_heat: { decayMs: 15 * 60 * 1000 },
    task_shadow: { decayMs: 10 * 60 * 1000 },
    social_potential: { decayMs: 5 * 60 * 1000 },
    loop_heat: { decayMs: 8 * 60 * 1000 },
    observer_attention: { decayMs: 10 * 60 * 1000 },
    speech_activity: { decayMs: 5 * 60 * 1000 },
};
var DEFAULT_DECAY_MS = 5 * 60 * 1000;
function ensureDataDir() {
    var dir = path.dirname(TRACES_FILE);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
function getActiveTraces() {
    if (!fs.existsSync(TRACES_FILE))
        return [];
    try {
        var raw = fs.readFileSync(TRACES_FILE, "utf-8");
        if (!raw || raw.trim() === "" || raw.trim() === "null")
            return [];
        var all = JSON.parse(raw);
        var now_1 = new Date().toISOString();
        return all.filter(function (t) { return t.expires_at > now_1; });
    }
    catch (e) {
        return [];
    }
}
function saveTraces(traces) {
    ensureDataDir();
    var data = Array.isArray(traces) ? JSON.stringify(traces, null, 2) : "[]";
    fs.writeFileSync(TRACES_FILE, data);
}
function depositTrace(trace) {
    var _a;
    if (!trace.type)
        return { success: false, reason: "Missing type" };
    var now = new Date();
    var decayConfig = DEFAULTS[trace.type] || { decayMs: DEFAULT_DECAY_MS };
    var decay = decayConfig.decayMs;
    var expires = new Date(now.getTime() + (((_a = trace.metadata) === null || _a === void 0 ? void 0 : _a.ttl) || decay));
    // Deduplication: don't deposit if same type+agent exists within cooldown period
    // For task_shadows, key on agentId only (not roomId) to prevent duplicates
    // when agent moves between zones.
    if (trace.agentId) {
        var active_1 = getActiveTraces();
        var recentDuplicate = active_1.find(function (t) {
            return t.type === trace.type &&
                t.agentId === trace.agentId &&
                (trace.type === "task_shadow" || t.roomId === trace.roomId) &&
                new Date(t.created_at).getTime() > now.getTime() - 5 * 60 * 1000;
        } // 5 min cooldown
        );
        if (recentDuplicate) {
            console.log("[Stigmergy] Skipping duplicate deposit: ".concat(trace.type, " for ").concat(trace.agentId));
            return { success: true, skipped: true, reason: "Duplicate within cooldown period", trace: recentDuplicate };
        }
    }
    var newTrace = {
        id: "trace-".concat(Date.now(), "-").concat(Math.floor(Math.random() * 1000)),
        type: trace.type,
        intensity: trace.intensity || 0.5,
        topic: trace.topic,
        agentId: trace.agentId,
        x: trace.x,
        y: trace.y,
        roomId: trace.roomId,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
        metadata: trace.metadata,
    };
    var active = getActiveTraces();
    active.push(newTrace);
    saveTraces(active);
    return { success: true, trace: newTrace };
}
function getTracesForRoom(roomId) {
    return getActiveTraces().filter(function (t) { return t.roomId === roomId; });
}
