"use strict";
/**
 * Deterministic repair templates.
 *
 * After maxRetries failed validation attempts the engine falls back to
 * these canned lines to keep the conversation moving.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepairText = getRepairText;
// BUG FIX: agree/disagree/answer templates previously omitted the topic,
// which caused them to fail topic-anchoring validation. Repair text must
// always self-validate since it's the last-resort fallback.
var REPAIR_TEMPLATES = {
    ask: function (topic) { return "Did anyone else notice the ".concat(topic, "?"); },
    answer: function (topic) { return "Yeah, I noticed the ".concat(topic, " too."); },
    observe: function (topic) { return "The ".concat(topic, " seems different today."); },
    joke: function (topic) { return "At least the ".concat(topic, " keeps things interesting!"); },
    agree: function (topic) { return "Exactly, good point about the ".concat(topic, "."); },
    disagree: function (topic) { return "I'm not sure about that ".concat(topic, " situation."); },
    redirect: function (topic) { return "Speaking of ".concat(topic, ", should we check on that?"); },
    escalate: function (topic) { return "We should really address the ".concat(topic, " situation!"); },
};
function getRepairText(intent, topic, prevText) {
    return REPAIR_TEMPLATES[intent](topic, prevText);
}
