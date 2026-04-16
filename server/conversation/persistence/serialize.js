"use strict";
/**
 * Session serialization / deserialization.
 *
 * Converts between the runtime CoolerSession (which has Set, computed
 * fields) and a plain-JSON SerializedSession that can be stored, sent
 * over the wire, or round-tripped through JSON.parse/stringify.
 *
 * Design notes:
 *  - usedPhrases and conversationHistory are rebuilt from utterances
 *    during deserialization, so they never appear in the JSON.
 *  - Unknown extra fields in the input are silently ignored, making
 *    deserialization forward-compatible with future schema additions.
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
exports.SESSION_VERSION = void 0;
exports.serializeSession = serializeSession;
exports.deserializeSession = deserializeSession;
exports.SESSION_VERSION = "cooler_v2";
function serializeSession(session) {
    var utterances = session.utterances.map(function (u, i) {
        var val = session.validationDetails[i];
        var entry = {
            speaker: u.speaker,
            text: u.text,
            intent: u.intent,
            replyTo: u.replyTo,
        };
        if (u.timestamp)
            entry.timestamp = u.timestamp;
        if (val) {
            entry.validation = {
                valid: val.valid,
                retries: val.retries,
                rejected_reasons: __spreadArray([], val.rejected_reasons, true),
            };
        }
        return entry;
    });
    var result = {
        id: session.id,
        version: exports.SESSION_VERSION,
        topic: session.topic,
        participants: __spreadArray([], session.participants, true),
        topicKeywords: __spreadArray([], session.topicKeywords, true),
        utterances: utterances,
        created_at: session.startedAt || new Date().toISOString(),
    };
    if (session.location)
        result.location = session.location;
    if (session.startedAt)
        result.startedAt = session.startedAt;
    return result;
}
function deserializeSession(data) {
    var utterances = data.utterances.map(function (u) {
        var entry = {
            speaker: u.speaker,
            text: u.text,
            intent: u.intent,
            replyTo: u.replyTo,
        };
        if (u.timestamp)
            entry.timestamp = u.timestamp;
        return entry;
    });
    var validationDetails = data.utterances.map(function (u) {
        return u.validation
            ? {
                valid: u.validation.valid,
                retries: u.validation.retries,
                rejected_reasons: __spreadArray([], u.validation.rejected_reasons, true),
            }
            : { valid: true, retries: 0, rejected_reasons: [] };
    });
    var usedPhrases = new Set();
    var conversationHistory = [];
    for (var _i = 0, utterances_1 = utterances; _i < utterances_1.length; _i++) {
        var u = utterances_1[_i];
        usedPhrases.add(u.text.toLowerCase());
        conversationHistory.push("".concat(u.speaker, ": \"").concat(u.text, "\""));
    }
    var session = {
        id: data.id,
        topic: data.topic,
        topicKeywords: __spreadArray([], data.topicKeywords, true),
        participants: __spreadArray([], data.participants, true),
        utterances: utterances,
        currentTurn: utterances.length,
        conversationHistory: conversationHistory,
        usedPhrases: usedPhrases,
        validationDetails: validationDetails,
    };
    if (data.location)
        session.location = data.location;
    if (data.startedAt)
        session.startedAt = data.startedAt;
    return session;
}
