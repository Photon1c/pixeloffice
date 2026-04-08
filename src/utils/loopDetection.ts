// Loop/Stall Detection Heuristics
// Per thought_speech_stigmergy.md Part C

export interface LoopDetectionResult {
  state: "healthy" | "stalled" | "looping";
  loopScore: number;
  noveltyScore: number;
  reason: string;
  recommendedAction: "continue" | "interrupt" | "summarize" | "reanchor" | "handoff";
}

const REPEATED_PHRASES = [
  "in summary", "therefore", "consequently", "as mentioned", "as stated",
  "to summarize", "in conclusion", "basically", "essentially"
];

const REPEATED_SENTENCES_THRESHOLD = 3;
const REPEATED_NGRAM_THRESHOLD = 2;
const NOVELTY_DROP_THRESHOLD = 0.3;

export function detectLoopOrStall(text: string): LoopDetectionResult {
  if (!text || text.length < 50) {
    return {
      state: "healthy",
      loopScore: 0,
      noveltyScore: 1,
      reason: "Text too short to analyze",
      recommendedAction: "continue"
    };
  }

  // 1. Check for repeated sentence patterns
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceFreq: Map<string, number> = new Map();
  sentences.forEach(s => {
    const normalized = s.trim().toLowerCase().slice(0, 30);
    sentenceFreq.set(normalized, (sentenceFreq.get(normalized) || 0) + 1);
  });
  
  const maxSentenceRepeat = Math.max(...Array.from(sentenceFreq.values()));
  const repeatedSentenceCount = maxSentenceRepeat;

  // 2. Check for repeated n-grams (trigrams)
  const words = text.toLowerCase().split(/\s+/);
  const trigramFreq: Map<string, number> = new Map();
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = words.slice(i, i + 3).join(" ");
    trigramFreq.set(trigram, (trigramFreq.get(trigram) || 0) + 1);
  }
  
  const maxTrigramRepeat = Math.max(...Array.from(trigramFreq.values()), 0);
  const repeatedNgramCount = maxTrigramRepeat;

  // 3. Check for repeated discourse markers
  let discourseMarkerCount = 0;
  REPEATED_PHRASES.forEach(phrase => {
    const matches = text.toLowerCase().split(phrase).length - 1;
    discourseMarkerCount += matches;
  });

  // 4. Calculate novelty score (compare first half to second half)
  const mid = Math.floor(text.length / 2);
  const firstHalf = text.slice(0, mid);
  const secondHalf = text.slice(mid);
  
  const firstSet = new Set(firstHalf.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const secondSet = new Set(secondHalf.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const union = new Set([...firstSet, ...secondSet]);
  const intersection = new Set([...firstSet].filter(x => secondSet.has(x)));
  const noveltyScore = union.size > 0 ? intersection.size / union.size : 1;

  // 5. JSON/schema repetition check
  const jsonBraceCount = (text.match(/[{}[\]]/g) || []).length;
  const hasJsonRepetition = jsonBraceCount > 20 && (text.length - text.replace(/[{}[\]]/g, "").length) / text.length > 0.3;

  // Calculate loop score
  let loopScore = 0;
  if (repeatedSentenceCount >= REPEATED_SENTENCES_THRESHOLD) loopScore += 0.3;
  if (repeatedNgramCount >= REPEATED_NGRAM_THRESHOLD) loopScore += 0.25;
  if (noveltyScore < NOVELTY_DROP_THRESHOLD) loopScore += 0.2;
  if (discourseMarkerCount >= 3) loopScore += 0.15;
  if (hasJsonRepetition) loopScore += 0.2;
  
  loopScore = Math.min(loopScore, 1);

  // Determine state and recommended action
  let state: "healthy" | "stalled" | "looping";
  let reason: string;
  let recommendedAction: LoopDetectionResult["recommendedAction"];

  if (loopScore >= 0.7) {
    state = "looping";
    reason = `High loop detected: ${repeatedSentenceCount} repeated sentences, ${repeatedNgramCount} repeated n-grams, novelty ${noveltyScore.toFixed(2)}`;
    recommendedAction = "interrupt";
  } else if (loopScore >= 0.4 || noveltyScore < 0.5) {
    state = "stalled";
    reason = `Stall detected: loop score ${loopScore.toFixed(2)}, novelty ${noveltyScore.toFixed(2)}`;
    recommendedAction = "summarize";
  } else {
    state = "healthy";
    reason = `Normal generation: loop score ${loopScore.toFixed(2)}, novelty ${noveltyScore.toFixed(2)}`;
    recommendedAction = "continue";
  }

  return { state, loopScore, noveltyScore, reason, recommendedAction };
}

export function shouldInterruptBurst(
  currentText: string,
  burstTokenCount: number,
  maxBurstTokens: number
): boolean {
  const loopResult = detectLoopOrStall(currentText);
  
  // Hard stop at max tokens
  if (burstTokenCount >= maxBurstTokens) {
    return true;
  }
  
  // Interrupt on looping state
  if (loopResult.state === "looping") {
    return true;
  }
  
  // Warn at stalled with high token count
  if (loopResult.state === "stalled" && burstTokenCount > maxBurstTokens * 0.7) {
    return true;
  }
  
  return false;
}