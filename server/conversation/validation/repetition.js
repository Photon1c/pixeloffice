"use strict";
/**
 * Anti-repetition: phrase normalization, exact-duplicate detection,
 * and content-word Jaccard similarity.
 *
 * Key improvement over the original: similarity is computed on *content
 * words only* (stopwords removed), so two lines that share common
 * function words but differ in meaning won't be falsely flagged.
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
exports.phraseKey = phraseKey;
exports.contentSimilarity = contentSimilarity;
exports.checkRepetition = checkRepetition;
var config_1 = require("../config");
var topicAnchor_1 = require("./topicAnchor");
/**
 * Returns a normalized key for exact-duplicate comparison.
 * Strips punctuation, collapses whitespace, lowercases.
 */
function phraseKey(text) {
    return (0, topicAnchor_1.normalizeText)(text);
}
/**
 * Extracts content words (removes stopwords + single-char tokens).
 * Used for similarity so filler words don't inflate the score.
 */
function contentWords(text) {
    return (0, topicAnchor_1.normalizeText)(text)
        .split(/\s+/)
        .filter(function (w) { return w.length > 1 && !config_1.STOPWORDS.has(w); });
}
/**
 * Jaccard similarity on content-word sets.
 * Returns 0–1 where 1 means identical content word sets.
 *
 * If both sides have zero content words they're treated as dissimilar
 * (topic anchoring handles whether they're valid at all).
 */
function contentSimilarity(a, b) {
    var wordsA = contentWords(a);
    var wordsB = contentWords(b);
    if (wordsA.length === 0 && wordsB.length === 0)
        return 0;
    var setA = new Set(wordsA);
    var setB = new Set(wordsB);
    var intersection = __spreadArray([], setA, true).filter(function (w) { return setB.has(w); }).length;
    var union = new Set(__spreadArray(__spreadArray([], setA, true), setB, true)).size;
    if (union === 0)
        return 0;
    return intersection / union;
}
/**
 * Checks a candidate phrase against the session's used-phrase memory
 * and the raw utterance history. Returns a structured result with the
 * specific reason and the phrase it matched against.
 */
function checkRepetition(text, usedPhrases, allUtteranceTexts, threshold) {
    if (threshold === void 0) { threshold = config_1.COOLER_CONFIG.similarityThreshold; }
    var key = phraseKey(text);
    for (var _i = 0, usedPhrases_1 = usedPhrases; _i < usedPhrases_1.length; _i++) {
        var used = usedPhrases_1[_i];
        if (phraseKey(used) === key) {
            return { isDuplicate: true, reason: "exact_duplicate", matchedPhrase: used };
        }
    }
    for (var _a = 0, allUtteranceTexts_1 = allUtteranceTexts; _a < allUtteranceTexts_1.length; _a++) {
        var prev = allUtteranceTexts_1[_a];
        if (phraseKey(prev) === key) {
            return { isDuplicate: true, reason: "exact_duplicate", matchedPhrase: prev };
        }
    }
    for (var _b = 0, usedPhrases_2 = usedPhrases; _b < usedPhrases_2.length; _b++) {
        var used = usedPhrases_2[_b];
        var sim = contentSimilarity(text, used);
        if (sim >= threshold) {
            return {
                isDuplicate: true,
                reason: "too_similar",
                similarity: sim,
                matchedPhrase: used,
            };
        }
    }
    return { isDuplicate: false, reason: null };
}
