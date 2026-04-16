"use strict";
/**
 * Prompt builder for Cooler Talk turns.
 *
 * Assembles the model-facing prompt from session state, personality,
 * and intent requirements. Kept separate from the controller so it
 * can be tested and tuned independently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTurnPrompt = buildTurnPrompt;
var config_1 = require("../config");
var agentPersonalities_1 = require("../agentPersonalities");
var INTENT_INSTRUCTIONS = {
    ask: "Your line must be a thoughtful QUESTION with '?'. Ask something specific about the topic that invites discussion - show genuine curiosity! Examples: 'What do you think about...?', 'Have you noticed...?', 'How do you feel about...?'",
    answer: "Your line must RESPOND to the previous message. Show you listened by referencing what was said, then add your own perspective. Build on their point and share your genuine thoughts. Avoid just agreeing - add value!",
    observe: "Your line must share an INTERESTING OBSERVATION about the topic. Say something thoughtful or surprising - make people think! Connect it to real workplace or life experiences.",
    joke: "Your line must be a LIGHT, WORKPLACE-SAFE joke or witty observation related to the topic. Make people smile! Keep it professional but fun.",
    agree: "Your line must show genuine AGREEMENT. Use words like 'Absolutely!', 'That's so true!', 'I completely agree!' then ADD YOUR OWN THOUGHT - don't just echo, expand on why you agree!",
    disagree: "Your line must offer a respectful DISAGREEMENT. Say something like 'I see it differently because...' or 'That's interesting but have you considered...' - be diplomatic but honest!",
    redirect: "Your line must smoothly SHIFT THE CONVERSATION to a related point. Connect what was just discussed to something new that ties back to the topic - make it flow naturally!",
    escalate: "Your line must add URGENCY or IMPORTANCE. Explain WHY this matters now - what's the consequence of ignoring or embracing this? Make people care!",
};
var OFFICE_LOCATIONS = [
    "lobby", "kitchen", "open office", "archives", "conference room",
    "specialist suite", "boss office", "Sherlock's office", "lounge", "mission control"
];
var COWORKER_TRIGGERS = {
    "FrontDesk": ["Ask about visitor schedules", "Check with them about office events"],
    "IronClaw": ["Mention a maintenance issue", "Ask if anything needs fixing"],
    "ZeroClaw": ["Ask about their latest code", "Share a tech puzzle"],
    "HermitClaw": ["Ask about archived records", "Inquire about historical data"],
    "OpenClaw": ["Check on task status", "Ask about deadlines"],
    "LeslieClaw": ["Ask about the schedule", "Mention team goals"],
    "Sherlobster": ["Share a strange observation", "Ask about any mysteries"],
    "Hercule Prawnro": ["Ask about recent metrics", "Mention data trends"],
};
function buildTurnPrompt(session, agentName, requiredIntent, otherParticipants) {
    var personality = (0, agentPersonalities_1.getPersonality)(agentName);
    var lastUtterance = session.utterances[session.utterances.length - 1];
    // Extract the actual topic (strip "In recent news: " prefix if present)
    var displayTopic = session.topic;
    if (displayTopic.startsWith("In recent news: ")) {
        displayTopic = displayTopic.substring(15);
    }
    // Build conversation history with full context
    var history = "WATER COOLER CONVERSATION\n";
    history += "Topic: \"" + displayTopic + "\"\n";
    if (session.location) {
        history += "Location: " + session.location + "\n";
    }
    history += "\n--- Conversation So Far ---\n";
    if (session.conversationHistory.length === 0) {
        history += "(No previous messages - you're starting this conversation)\n";
    }
    else {
        for (var i = 0; i < session.conversationHistory.length; i++) {
            history += session.conversationHistory[i] + "\n";
        }
    }
    history += "-------------------------\n";
    var previousContext;
    if (lastUtterance) {
        var cleanLastText = lastUtterance.text.replace(/In recent news:?\s*/gi, "").replace(/According to recent news:?\s*/gi, "").trim();
        previousContext = "The last thing " + lastUtterance.speaker + " said was: \"" + cleanLastText + "\"\n";
        previousContext += "\nYour turn to respond! Consider:\n";
        previousContext += "- What did " + lastUtterance.speaker + " say that you agree or disagree with?\n";
        previousContext += "- Do you have a personal experience or opinion to share?\n";
        previousContext += "- Can you ask a follow-up question or add new information?\n";
    }
    else {
        previousContext = "This is the START of the conversation about \"" + displayTopic + "\".\n";
        previousContext += "\nKick things off! You could:\n";
        previousContext += "- Share something interesting you heard about this topic\n";
        previousContext += "- Ask what others think about it\n";
        previousContext += "- Relate it to your own experience at work\n";
    }
    var personalityContext = "";
    if (personality) {
        personalityContext = "\nYour character: " + agentName + " (" + personality.role + ")\n";
        personalityContext += "Style: " + personality.speech_style + "\n";
        personalityContext += "Speak naturally as this person!";
    }
    // Build office context with coworker names, quirks, and location awareness
    var officeContext = "";
    if (personality) {
        officeContext = "\n--- Your Office Context ---\n";
        officeContext += "Your quirks: " + personality.quirks.join(", ") + "\n";
        officeContext += "Your interests: " + personality.interests.join(", ") + "\n\n";
        // Add coworkers if provided
        if (otherParticipants && otherParticipants.length > 0) {
            var othersNotMe = otherParticipants.filter(function (p) { return p !== agentName; });
            if (othersNotMe.length > 0) {
                officeContext += "Coworkers here: " + othersNotMe.join(", ") + "\n";
                // Add trigger suggestions for interacting with specific coworkers
                var triggers = [];
                for (var _i = 0, othersNotMe_1 = othersNotMe; _i < othersNotMe_1.length; _i++) {
                    var other = othersNotMe_1[_i];
                    var otherTriggers = COWORKER_TRIGGERS[other];
                    if (otherTriggers) {
                        var idx = Math.floor(Math.random() * otherTriggers.length);
                        triggers.push(other + ": " + otherTriggers[idx]);
                    }
                }
                if (triggers.length > 0) {
                    officeContext += "You could: " + triggers.join(" | ") + "\n";
                }
            }
        }
        // Reference location
        var loc = session.location || "kitchen/water cooler";
        officeContext += "\nThis conversation is happening in the " + loc + ".\n";
        officeContext += "Other office areas: " + OFFICE_LOCATIONS.join(", ") + "\n";
    }
    var newline = "\n";
    var prompt = history + previousContext + personalityContext + officeContext + newline;
    prompt += newline;
    prompt += "CONVERSATION STYLE:" + newline;
    prompt += "- Think carefully before responding - give an authentic, thoughtful answer" + newline;
    prompt += "- This is a casual chat with coworkers, not a formal interview" + newline;
    prompt += "- Your personality should shine through - be genuine!" + newline;
    prompt += newline;
    prompt += "REQUIRED INTENT: \"" + requiredIntent + "\"" + newline;
    prompt += INTENT_INSTRUCTIONS[requiredIntent] + newline;
    prompt += newline;
    prompt += "RESPONSE RULES:" + newline;
    prompt += "- Write " + config_1.COOLER_CONFIG.promptMaxWords + "+ words (2-4 sentences minimum for engaging conversation)" + newline;
    prompt += "- Write as natural speech, not an essay or narration" + newline;
    prompt += "- NO quotation marks around your response" + newline;
    prompt += '- DO NOT say "In recent news" or "According to recent news" - just discuss naturally like you would with colleagues' + newline;
    prompt += "- If you ignore these rules, your response will be rejected!";
    return prompt;
}
