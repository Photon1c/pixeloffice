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
exports.loadOrCreateSession = loadOrCreateSession;
exports.persistSession = persistSession;
exports.runRoomTurn = runRoomTurn;
exports.exportRoomSession = exportRoomSession;
var api_js_1 = require("../conversation/api.js");
var newsTopics_js_1 = require("./newsTopics.js");
var fs = require("fs");
var path = require("path");
// Define the sessions directory
var SESSIONS_DIR = path.resolve("data/cooler_sessions");
// Ensure the directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}
/**
 * Get the file path for a given location
 */
function getSessionFilePath(location) {
    // Sanitize location to be filesystem-safe
    var safeLocation = location.replace(/[^\w\-]/g, "_");
    return path.join(SESSIONS_DIR, "".concat(safeLocation, ".json"));
}
/**
 * Load a session for a given location, or create a new one if none exists
 */
function loadOrCreateSession(location, createOptions) {
    if (createOptions === void 0) { createOptions = {}; }
    var filePath = getSessionFilePath(location);
    if (fs.existsSync(filePath)) {
        try {
            var data = fs.readFileSync(filePath, "utf8");
            var session_1 = (0, api_js_1.deserializeSession)(JSON.parse(data));
            // Ensure location is set (backward compatibility)
            if (!session_1.location) {
                session_1.location = location;
            }
            // Update topic if provided in options (to get fresh news topics)
            if (createOptions.topic) {
                session_1.topic = createOptions.topic;
                session_1.topicKeywords = createOptions.topic.split(/[\s,]+/).filter(function (k) { return k.length > 2; });
                // Clear conversation history and utterances for fresh start with new topic
                session_1.currentTurn = 0;
                session_1.utterances = [];
                session_1.conversationHistory = [];
                session_1.usedPhrases = new Set();
                console.log("[CoolerTalk] Updated topic to: ".concat(createOptions.topic, ", cleared history"));
            }
            return session_1;
        }
        catch (error) {
            console.error("Failed to load session for ".concat(location, ":"), error);
            // Fall through to create a new session
        }
    }
    // Create a new session
    var session = (0, api_js_1.createCoolerSession)(__assign(__assign({}, createOptions), { location: location }));
    // Persist the new session
    persistSession(session);
    return session;
}
/**
 * Persist a session to disk
 */
function persistSession(session) {
    var filePath = getSessionFilePath(session.location);
    var serialized = (0, api_js_1.serializeSession)(session);
    fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), "utf8");
}
/**
 * Compute a target position within the kitchen for an agent index.
 * Spreads agents in a grid inside the kitchen area.
 */
function computeKitchenPosition(agentIndex, totalParticipants) {
    // Kitchen bounds from layout.ts (hardcoded for now, could import)
    var kitchenX = 960;
    var kitchenY = 10;
    var kitchenWidth = 230;
    var kitchenHeight = 230;
    // Padding from walls
    var padX = 30;
    var padY = 30;
    var usableWidth = kitchenWidth - 2 * padX;
    var usableHeight = kitchenHeight - 2 * padY;
    // Grid layout: up to 4 columns
    var cols = 4;
    var col = agentIndex % cols;
    var row = Math.floor(agentIndex / cols);
    var cellWidth = usableWidth / cols;
    var cellHeight = usableHeight / Math.ceil(totalParticipants / cols);
    var x = kitchenX + padX + col * cellWidth + cellWidth / 2;
    var y = kitchenY + padY + row * cellHeight + cellHeight / 2;
    return { x: x, y: y };
}
/**
 * Run a turn for a given location, generating a multi-turn conversation
 * where each participant gets a turn to speak (by assigning the utterance to them).
 */
function runRoomTurn(location, options) {
    return __awaiter(this, void 0, void 0, function () {
        var topic, newsTopic, session, participants, participantCount, recentSpeakers, MAX_RECENT, assignments, dialogues, lastTurnResult, i, participant, prevSpeaker, eligible, turnResult, utterance, assignedUtterance, _a, x, y, showAt, expiresAt, turnResultToReturn;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    topic = options.topic || "";
                    console.log("[CoolerTalk] Input topic: \"".concat(topic, "\""));
                    // Use news topics if no topic specified or if "auto"
                    if (!topic || topic === "auto" || topic === "news") {
                        newsTopic = (0, newsTopics_js_1.getTopicForConversation)();
                        // Format as a complete discussion topic
                        topic = "In recent news: ".concat(newsTopic);
                        console.log("[CoolerTalk] Resolved to news topic: \"".concat(topic, "\""));
                    }
                    session = loadOrCreateSession(location, {
                        topic: topic,
                        participants: options.participants,
                    });
                    console.log("[CoolerTalk] Session topic after loadOrCreate: \"".concat(session.topic, "\""));
                    participants = options.participants || [];
                    participantCount = participants.length;
                    // PRIORITY 1: Guard - require at least 2 participants
                    if (participantCount < 2) {
                        console.log("[CoolerTalk] Aborting - only ".concat(participantCount, " participant(s), need at least 2"));
                        return [2 /*return*/, {
                                turnResult: {
                                    utterance: { speaker: "", text: "", intent: "observe", replyTo: null },
                                    validation: { valid: false, retries: 0, rejected_reasons: ["need_at_least_2_participants"] },
                                    repaired: false,
                                    intent: "observe"
                                },
                                session: session,
                                assignments: [],
                                dialogues: [],
                                participantCount: 0,
                                error: "Need at least 2 participants for a conversation"
                            }];
                    }
                    recentSpeakers = [];
                    MAX_RECENT = 3;
                    assignments = [];
                    dialogues = [];
                    lastTurnResult = null;
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < participantCount)) return [3 /*break*/, 5];
                    participant = participants[i];
                    if (i > 0) {
                        prevSpeaker = participants[i - 1];
                        if (prevSpeaker !== participant && recentSpeakers.length > 0) {
                            eligible = participants.filter(function (p) { return !recentSpeakers.includes(p); });
                            if (eligible.length > 0) {
                                participant = eligible[Math.floor(Math.random() * eligible.length)];
                            }
                        }
                    }
                    // Update recent speakers tracking
                    recentSpeakers.push(participant);
                    if (recentSpeakers.length > MAX_RECENT) {
                        recentSpeakers.shift();
                    }
                    return [4 /*yield*/, (0, api_js_1.runNextTurn)(session, options.generateFn)];
                case 2:
                    turnResult = _b.sent();
                    lastTurnResult = turnResult;
                    utterance = turnResult.utterance;
                    assignedUtterance = __assign(__assign({}, utterance), { speaker: participant });
                    _a = computeKitchenPosition(i, participantCount), x = _a.x, y = _a.y;
                    assignments.push({
                        agentId: participant.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-"),
                        targetX: x,
                        targetY: y,
                    });
                    showAt = Date.now() + i * 4000;
                    expiresAt = showAt + 8000;
                    dialogues.push({
                        agentId: participant.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-"),
                        text: assignedUtterance.text,
                        showAt: showAt,
                        expiresAt: expiresAt,
                    });
                    if (!(i < participantCount - 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5:
                    // Persist the session after we have generated all utterances
                    console.log("[CoolerTalk] About to persist session with topic: \"".concat(session.topic, "\""));
                    persistSession(session);
                    console.log("[CoolerTalk] Session persisted");
                    turnResultToReturn = lastTurnResult !== null ? lastTurnResult :
                        { utterance: { speaker: "", text: "", intent: "", replyTo: null },
                            validation: { valid: true, retries: 0, rejected_reasons: [] },
                            repaired: false,
                            intent: "" };
                    return [2 /*return*/, {
                            turnResult: turnResultToReturn,
                            session: session,
                            assignments: assignments,
                            dialogues: dialogues,
                            participantCount: participantCount
                        }];
            }
        });
    });
}
/**
 * Export a session for a given location
 */
function exportRoomSession(location) {
    var filePath = getSessionFilePath(location);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        var data = fs.readFileSync(filePath, "utf8");
        var serialized = JSON.parse(data);
        var session = (0, api_js_1.deserializeSession)(serialized);
        var exportData = (0, api_js_1.exportSession)(session);
        return exportData;
    }
    catch (error) {
        console.error("Failed to export session for ".concat(location, ":"), error);
        return null;
    }
}
