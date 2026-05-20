/**
 * Cooler Talk configuration constants.
 *
 * promptMaxWords is what we tell the model to aim for (50).
 * maxWords is the hard validation reject threshold (60) — gives the model
 * some slack before we throw the line out entirely.
 */
export const COOLER_CONFIG = {
    maxWords: 80,
    promptMaxWords: 50,
    minWords: 3,
    similarityThreshold: 0.5,
    maxRetries: 3,
    minKeywordLength: 2,
};
export const STOPWORDS = new Set([
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
