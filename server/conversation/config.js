"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STOPWORDS = exports.COOLER_CONFIG = void 0;
/**
 * Cooler Talk configuration constants.
 *
 * promptMaxWords is what we tell the model to aim for (50).
 * maxWords is the hard validation reject threshold (60) — gives the model
 * some slack before we throw the line out entirely.
 */
exports.COOLER_CONFIG = {
    maxWords: 60,
    promptMaxWords: 50,
    minWords: 5,
    similarityThreshold: 0.7,
    maxRetries: 5,
    minKeywordLength: 2,
};
exports.STOPWORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "about", "from", "or", "and", "if", "to", "in", "on", "at", "of", "for",
    "who", "what", "why", "how", "when", "where", "whether",
    "that", "this", "these", "those",
    "i", "you", "we", "they", "it", "he", "she",
    "my", "your", "our", "their", "its", "his", "her",
    "me", "us", "them", "him",
    "do", "does", "did", "has", "have", "had",
    "not", "no", "but", "so", "just", "too", "also",
    "can", "could", "would", "should", "will", "shall", "may", "might",
    "with", "by", "up", "out", "off",
]);
