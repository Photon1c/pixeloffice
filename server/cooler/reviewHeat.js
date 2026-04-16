"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDataDir = ensureDataDir;
exports.getActiveHeat = getActiveHeat;
exports.saveHeat = saveHeat;
exports.depositReviewHeat = depositReviewHeat;
exports.getTotalHeatIntensity = getTotalHeatIntensity;
var fs = require("fs");
var path = require("path");
var HEAT_FILE = path.resolve(process.cwd(), "data/review_heat.json");
var DECAY_TIME_MS = 10 * 60 * 1000; // 10 minutes for prototype
function ensureDataDir() {
    var dir = path.dirname(HEAT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function getActiveHeat() {
    if (!fs.existsSync(HEAT_FILE))
        return [];
    try {
        var raw = fs.readFileSync(HEAT_FILE, "utf-8");
        var all = JSON.parse(raw);
        var now_1 = new Date().toISOString();
        return all.filter(function (h) { return h.expires_at > now_1; });
    }
    catch (e) {
        console.error("[ReviewHeat] Error reading heat file:", e);
        return [];
    }
}
function saveHeat(heat) {
    ensureDataDir();
    fs.writeFileSync(HEAT_FILE, JSON.stringify(heat, null, 2));
}
function depositReviewHeat(sessionId, topic, content, anchor) {
    if (anchor === void 0) { anchor = "kitchen"; }
    var keywords = ["review", "pr", "pull request", "backlog", "blocked", "approval", "stale", "merge", "bottleneck"];
    var contentLower = content.toLowerCase();
    var hitCount = 0;
    keywords.forEach(function (k) {
        if (contentLower.includes(k))
            hitCount++;
    });
    if (hitCount === 0)
        return null;
    var intensity = Math.min(1, hitCount * 0.2);
    var now = new Date();
    var expires = new Date(now.getTime() + DECAY_TIME_MS);
    var newTrace = {
        id: "heat-".concat(Date.now(), "-").concat(Math.floor(Math.random() * 1000)),
        trace_type: "review_heat",
        source_session_id: sessionId,
        intensity: intensity,
        topic: topic,
        anchor: anchor,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
    };
    var active = getActiveHeat();
    active.push(newTrace);
    saveHeat(active);
    console.log("[ReviewHeat] Deposited heat for session ".concat(sessionId, ": intensity ").concat(intensity.toFixed(2), ", topic: ").concat(topic));
    return newTrace;
}
function getTotalHeatIntensity() {
    var active = getActiveHeat();
    if (active.length === 0)
        return 0;
    var total = active.reduce(function (sum, h) { return sum + h.intensity; }, 0);
    return Math.min(1, total);
}
