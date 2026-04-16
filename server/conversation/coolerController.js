"use strict";
/**
 * Cooler Talk Conversation Controller
 *
 * Thin orchestration layer. All heavy lifting is delegated to:
 *   validation/*   — intent rules, topic anchoring, repetition
 *   repair/*       — deterministic fallback templates
 *   prompts/*      — model-facing prompt builder
 *   persistence/*  — serialize / deserialize sessions
 *   config.ts      — shared constants
 *   types.ts       — shared interfaces
 *
 * This file owns session lifecycle, intent sequencing, history
 * management, and serialization. It re-exports everything that
 * server/index.ts (and downstream consumers) expect.
 */
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
exports.buildTurnPrompt = exports.getRepairText = exports.validateUtterance = void 0;
exports.createCoolerSession = createCoolerSession;
exports.getNextIntent = getNextIntent;
exports.addUtteranceToHistory = addUtteranceToHistory;
exports.serializeSessionLog = serializeSessionLog;
exports.sessionToMarkdown = sessionToMarkdown;
var topicAnchor_1 = require("./validation/topicAnchor");
// ── Re-exports (backwards-compatible public API) ────────────────────
var index_1 = require("./validation/index");
Object.defineProperty(exports, "validateUtterance", { enumerable: true, get: function () { return index_1.validateUtterance; } });
var repairTemplates_1 = require("./repair/repairTemplates");
Object.defineProperty(exports, "getRepairText", { enumerable: true, get: function () { return repairTemplates_1.getRepairText; } });
var buildTurnPrompt_1 = require("./prompts/buildTurnPrompt");
Object.defineProperty(exports, "buildTurnPrompt", { enumerable: true, get: function () { return buildTurnPrompt_1.buildTurnPrompt; } });
// ── Intent sequencing ───────────────────────────────────────────────
var INTENT_SEQUENCE = {
    first: ["ask", "observe"],
    afterAsk: ["answer", "agree", "disagree", "joke"],
    afterAnswer: ["joke", "redirect", "agree", "observe"],
    afterJoke: ["observe", "ask", "agree", "redirect"],
    afterAgree: ["observe", "redirect", "ask"],
    afterDisagree: ["answer", "observe", "joke"],
    afterObserve: ["answer", "ask", "joke", "agree"],
    afterRedirect: ["agree", "observe", "answer"],
    closing: ["redirect", "agree", "escalate"],
};
function getAllowedIntents(utterances, turnIndex) {
    if (turnIndex === 0)
        return INTENT_SEQUENCE.first;
    var lastUtterance = utterances[turnIndex - 1];
    var remaining = utterances.length > 0 ? utterances.length - (turnIndex - 1) : 3;
    if (remaining <= 1)
        return INTENT_SEQUENCE.closing;
    switch (lastUtterance.intent) {
        case "ask": return INTENT_SEQUENCE.afterAsk;
        case "answer": return INTENT_SEQUENCE.afterAnswer;
        case "joke": return INTENT_SEQUENCE.afterJoke;
        case "agree": return INTENT_SEQUENCE.afterAgree;
        case "disagree": return INTENT_SEQUENCE.afterDisagree;
        case "observe": return INTENT_SEQUENCE.afterObserve;
        case "redirect": return INTENT_SEQUENCE.afterRedirect;
        default: return INTENT_SEQUENCE.afterObserve;
    }
}
function needsQuestion(utterances) {
    return !utterances.some(function (u) { return u.intent === "ask"; });
}
function needsAnswer(utterances) {
    var askIndex = utterances.findIndex(function (u) { return u.intent === "ask"; });
    if (askIndex === -1)
        return false;
    return !utterances
        .slice(askIndex)
        .some(function (u) {
        return u.intent === "answer" ||
            u.intent === "agree" ||
            u.intent === "disagree";
    });
}
function createCoolerSession(topicOrOpts, participantsArg) {
    var topic;
    var participants;
    var location;
    if (typeof topicOrOpts === "string") {
        topic = topicOrOpts;
        participants = participantsArg;
    }
    else {
        topic = topicOrOpts.topic;
        participants = topicOrOpts.participants;
        location = topicOrOpts.location;
    }
    var shuffled = __spreadArray([], participants, true).sort(function () { return Math.random() - 0.5; });
    var session = {
        id: "ct-".concat(Date.now()),
        topic: topic,
        topicKeywords: (0, topicAnchor_1.extractKeywords)(topic),
        participants: shuffled,
        utterances: [],
        currentTurn: 0,
        conversationHistory: [],
        usedPhrases: new Set(),
        validationDetails: [],
        startedAt: new Date().toISOString(),
    };
    if (location)
        session.location = location;
    return session;
}
function getNextIntent(session) {
    var allowed = getAllowedIntents(session.utterances, session.currentTurn);
    if (needsQuestion(session.utterances) && allowed.includes("ask")) {
        return "ask";
    }
    if (needsAnswer(session.utterances) && allowed.includes("answer")) {
        return "answer";
    }
    return allowed[Math.floor(Math.random() * allowed.length)];
}
function addUtteranceToHistory(session, utterance) {
    var cleanedText = utterance.text.replace(/In recent news:?\s*/gi, "").replace(/According to recent news:?\s*/gi, "").trim();
    session.conversationHistory.push("".concat(utterance.speaker, ": \"").concat(cleanedText, "\""));
    session.usedPhrases.add(cleanedText.toLowerCase());
}
// ── Serialization ───────────────────────────────────────────────────
function serializeSessionLog(session) {
    return session.utterances
        .map(function (u, i) {
        var details = session.validationDetails[i];
        var retryInfo = details
            ? " (valid: ".concat(details.valid, ", retries: ").concat(details.retries, ")")
            : "";
        return "- **".concat(u.speaker, "** (").concat(u.intent).concat(u.replyTo !== null ? ", reply_to: ".concat(u.replyTo) : "", "): ").concat(u.text).concat(retryInfo);
    })
        .join("\n");
}
function sessionToMarkdown(session) {
    var locationLine = session.location
        ? "\n**Location:** ".concat(session.location)
        : "";
    return "\n## Cooler Talk Session - ".concat(session.id, "\n\n**Topic:** ").concat(session.topic).concat(locationLine, "\n**Keywords:** ").concat(session.topicKeywords.join(", "), "\n**Participants:** ").concat(session.participants.join(", "), "\n\n### Dialogue\n\n").concat(serializeSessionLog(session), "\n---\n");
}
