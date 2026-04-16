"use strict";
/**
 * Topic anchoring: keyword extraction and overlap detection.
 *
 * Every utterance must reference the conversation topic OR the previous line.
 * We extract meaningful keywords (filtering stopwords) and check whether the
 * candidate text contains at least one of them.
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
exports.normalizeText = normalizeText;
exports.extractKeywords = extractKeywords;
exports.checkKeywordOverlap = checkKeywordOverlap;
var config_1 = require("../config");
/**
 * Normalizes text for comparison: lowercase, strip punctuation
 * (keeping apostrophes/hyphens for contractions and compound words),
 * and collapse whitespace.
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s'-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
/**
 * Extracts meaningful keywords from a string.
 *
 * Falls back to keeping all non-empty tokens if stopword filtering
 * would produce an empty set (handles very short topics like "AI").
 */
function extractKeywords(text, extraStopwords) {
    var stops = extraStopwords
        ? new Set(__spreadArray(__spreadArray([], config_1.STOPWORDS, true), extraStopwords, true))
        : config_1.STOPWORDS;
    var normalized = normalizeText(text);
    var words = normalized
        .split(/\s+/)
        .filter(function (w) { return w.length >= config_1.COOLER_CONFIG.minKeywordLength && !stops.has(w); });
    if (words.length === 0) {
        return normalized.split(/\s+/).filter(function (w) { return w.length > 0; });
    }
    return words;
}
/**
 * Checks whether `text` contains at least one keyword from the topic
 * or from the previous line. Returns structured result so the caller
 * can log exactly which anchor (or neither) was hit.
 */
function checkKeywordOverlap(text, topicKeywords, prevKeywords) {
    var textNorm = normalizeText(text);
    var matchedTopic = topicKeywords.length > 0 && topicKeywords.some(function (k) { return textNorm.includes(k); });
    var matchedPrev = prevKeywords.length > 0 && prevKeywords.some(function (k) { return textNorm.includes(k); });
    return {
        anchored: matchedTopic || matchedPrev,
        matchedTopic: matchedTopic,
        matchedPrev: matchedPrev,
    };
}
