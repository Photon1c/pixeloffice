"use strict";
/**
 * Validation orchestrator.
 *
 * Composes intent rules, topic anchoring, and repetition detection into
 * a single validateUtterance call. Collects *all* failing reasons rather
 * than short-circuiting so logs capture every rule that fired.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUtterance = validateUtterance;
var config_1 = require("../config");
var intentRules_1 = require("./intentRules");
var topicAnchor_1 = require("./topicAnchor");
var repetition_1 = require("./repetition");
function validateUtterance(utterance, session, allUtterances) {
    var reasons = [];
    var text = utterance.text;
    var wordCount = text.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    if (wordCount > config_1.COOLER_CONFIG.maxWords) {
        reasons.push("too_long");
    }
    if (wordCount < config_1.COOLER_CONFIG.minWords) {
        reasons.push("too_short");
    }
    var intentResult = (0, intentRules_1.checkIntentRules)(utterance.intent, text);
    if (!intentResult.valid && intentResult.reason) {
        reasons.push(intentResult.reason);
    }
    var lastUtterance = allUtterances[allUtterances.length - 1];
    var prevKeywords = lastUtterance ? (0, topicAnchor_1.extractKeywords)(lastUtterance.text) : [];
    var anchor = (0, topicAnchor_1.checkKeywordOverlap)(text, session.topicKeywords, prevKeywords);
    if (!anchor.anchored) {
        reasons.push("no_topic_or_prev_reference");
    }
    var allTexts = allUtterances.map(function (u) { return u.text; });
    var rep = (0, repetition_1.checkRepetition)(text, session.usedPhrases, allTexts);
    if (rep.isDuplicate && rep.reason) {
        reasons.push(rep.reason);
    }
    return {
        valid: reasons.length === 0,
        retries: 0,
        rejected_reasons: reasons,
    };
}
