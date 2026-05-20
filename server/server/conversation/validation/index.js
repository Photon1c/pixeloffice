/**
 * Validation orchestrator.
 *
 * Composes intent rules, topic anchoring, and repetition detection into
 * a single validateUtterance call. Collects *all* failing reasons rather
 * than short-circuiting so logs capture every rule that fired.
 */
import { COOLER_CONFIG } from "../config";
import { checkIntentRules } from "./intentRules";
import { checkRepetition } from "./repetition";
import { extractKeywords, normalizeText } from "./topicAnchor";
export function validateUtterance(utterance, session, allUtterances) {
    const reasons = [];
    const text = utterance.text;
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
    // Length validation - be more lenient for natural speech
    if (wordCount > COOLER_CONFIG.maxWords) {
        reasons.push("too_long");
    }
    if (wordCount < COOLER_CONFIG.minWords) {
        reasons.push("too_short");
    }
    // Intent validation
    const intentResult = checkIntentRules(utterance.intent, text);
    if (!intentResult.valid && intentResult.reason) {
        reasons.push(intentResult.reason);
    }
    // Repetition check
    const allTexts = allUtterances.map((u) => u.text);
    const rep = checkRepetition(text, session.usedPhrases, allTexts);
    if (rep.isDuplicate && rep.reason) {
        reasons.push(rep.reason);
    }
    // Topic anchoring: enforce for first 2 turns only, then let conversation flow naturally
    // This ensures agents start discussing the topic but allows natural conversation to develop
    if (allUtterances.length < 2) {
        const topicNorm = normalizeText(session.topic);
        const topicKeywords = extractKeywords(session.topic);
        const textNorm = normalizeText(text);
        // Check if at least one topic keyword appears in the response
        const hasTopicRef = topicKeywords.some(kw => textNorm.includes(kw));
        // Also accept if any significant word from topic appears (longer matching)
        const topicWords = session.topic.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const hasDirectRef = topicWords.some(w => textNorm.includes(w));
        if (!hasTopicRef && !hasDirectRef) {
            reasons.push("no_topic_anchor_early");
        }
    }
    return {
        valid: reasons.length === 0,
        retries: 0,
        rejected_reasons: reasons,
    };
}
