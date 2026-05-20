/**
 * Deterministic repair templates.
 *
 * After maxRetries failed validation attempts the engine falls back to
 * these canned lines to keep the conversation moving.
 */
// Varied, natural-sounding repair templates that avoid repetition
const REPAIR_TEMPLATES = {
    ask: [
        "Has anyone else been thinking about this?",
        "What do you all think about what was just said?",
        "I'm curious what others think here.",
        "Do you see what I mean about this?",
    ],
    answer: [
        "That's an interesting point, I hadn't looked at it that way before.",
        "I can see where you're coming from, and here's my take on it.",
        "Fair point! In my experience though, sometimes things are more nuanced.",
        "Yeah, I've seen this play out before at work.",
    ],
    observe: [
        "This reminds me of something similar that happened last week.",
        "I wonder if this will change how we do things around here.",
        "It's interesting to see how this is developing.",
        "The more I think about it, the more this makes sense.",
    ],
    joke: [
        "Well, at least we'll have a good story to tell later!",
        "Only at this office would we end up discussing this.",
        "You know what they say - variety is the spice of work life!",
        "And here I thought today was going to be boring.",
    ],
    agree: [
        "Exactly what I was thinking!",
        "I couldn't agree more - that's spot on.",
        "Absolutely, you've nailed it.",
        "For sure. This is exactly the kind of thing we needed to talk about.",
    ],
    disagree: [
        "That's an interesting perspective, though I'm not entirely convinced.",
        "I see it differently - there are other factors to consider.",
        "I'm not sure that's quite right, but I appreciate the thought.",
        "Hmm, I'm not sure I agree with that take.",
    ],
    redirect: [
        "This makes me think of something else we should discuss.",
        "On a related note, has anyone brought up the other angle?",
        "Shifting gears a bit - what about the bigger picture here?",
        "That reminds me - we should also consider what happens next.",
    ],
    escalate: [
        "We really need to take action on this soon.",
        "This is getting important - we shouldn't wait much longer.",
        "The stakes are higher than we might think.",
        "We need to prioritize this before it becomes a bigger issue.",
    ],
};
export function getRepairText(intent, topic, prevText) {
    const templates = REPAIR_TEMPLATES[intent] || REPAIR_TEMPLATES.observe;
    const idx = Math.floor(Math.random() * templates.length);
    const template = templates[idx];
    // Insert topic naturally into the template
    if (topic && topic.length > 0) {
        // Extract a short topic phrase (first 3-4 words)
        const topicWords = topic.split(/\s+/).slice(0, 4).join(" ");
        const topicLower = topicWords.toLowerCase();
        // For ask intent, make sure question relates to topic
        if (intent === "ask") {
            return `What does everyone think about ${topicWords}?`;
        }
        // For agree/disagree, reference the topic
        if (intent === "agree") {
            if (!template.toLowerCase().includes(topicLower)) {
                return `Exactly! ${topicWords} is such an important point. ${template}`;
            }
        }
        if (intent === "disagree") {
            if (!template.toLowerCase().includes(topicLower)) {
                return `I see it differently regarding ${topicWords}. ${template}`;
            }
        }
        // For observe, anchor to topic
        if (intent === "observe") {
            if (!template.toLowerCase().includes(topicLower)) {
                return `Regarding ${topicWords}: ${template}`;
            }
        }
        // For redirect, bridge to topic
        if (intent === "redirect") {
            if (!template.toLowerCase().includes(topicLower)) {
                return `Speaking of ${topicWords}, ${template}`;
            }
        }
        // For answer, reference topic if not already present
        if (intent === "answer") {
            if (!template.toLowerCase().includes(topicLower)) {
                return `About ${topicWords}: ${template}`;
            }
        }
        // For joke, naturally weave in topic reference
        if (intent === "joke") {
            if (!template.toLowerCase().includes(topicLower) && Math.random() > 0.5) {
                return `Guess ${topicWords} is keeping us busy! ${template}`;
            }
        }
        // For escalate, anchor to topic importance
        if (intent === "escalate") {
            if (!template.toLowerCase().includes(topicLower)) {
                return `${topicWords} is getting urgent. ${template}`;
            }
        }
    }
    return template;
}
