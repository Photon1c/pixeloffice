/**
 * Prompt builder for Cooler Talk turns.
 *
 * Assembles the model-facing prompt from session state, personality,
 * and intent requirements. Kept separate from the controller so it
 * can be tested and tuned independently.
 */
import { getPersonality } from "../agentPersonalities";
const INTENT_INSTRUCTIONS = {
    ask: "Your line must be a question. Ask something specific that invites discussion! Ask what others think, share curiosity about a detail, or dig deeper into an interesting point.",
    answer: "Your line must respond to the previous message. Show you were listening by referencing what was said, then add your own perspective. Don't just agree - build on it!",
    observe: "Your line must share an interesting observation or insight about the topic. Make people think! Connect it to your own experiences.",
    joke: "Your line must be a light, workplace-safe joke or witty comment. Make people smile! Keep it professional but fun.",
    agree: "Your line must show genuine agreement and expand on why. Say something like 'Exactly!' or 'That's so true!' then explain WHY you agree.",
    disagree: "Your line must offer a respectful alternative view. Say something like 'I see it differently because...' or 'Interesting, but have you considered...'",
    redirect: "Your line must shift the conversation smoothly to a related point that builds on what was said.",
    escalate: "Your line must add urgency or highlight why this matters right now.",
};
export function buildTurnPrompt(session, agentName, requiredIntent, otherParticipants) {
    const personality = getPersonality(agentName);
    const lastUtterance = session.utterances[session.utterances.length - 1];
    // Extract the actual topic (strip "In recent news: " prefix if present)
    let displayTopic = session.topic;
    if (displayTopic.startsWith("In recent news: ")) {
        displayTopic = displayTopic.substring(15);
    }
    // Build conversation history
    let history = "WATER COOLER CHAT\n";
    history += "Topic: " + displayTopic + "\n";
    if (session.location) {
        history += "Location: " + session.location + "\n";
    }
    history += "\n--- Recent Discussion ---\n";
    if (session.conversationHistory.length === 0) {
        history += "(Start the conversation!)\n";
    }
    else {
        for (let i = 0; i < session.conversationHistory.length; i++) {
            history += session.conversationHistory[i] + "\n";
        }
    }
    history += "---\n";
    let prompt = history;
    if (lastUtterance) {
        prompt += "\n" + lastUtterance.speaker + " just said: \"" + lastUtterance.text + "\"\n";
        prompt += "\nYou (" + agentName + ") respond as " + agentName + ":\n";
    }
    else {
        prompt += "\nYou (" + agentName + ") start the conversation about: " + displayTopic + "\n";
        prompt += "Share your thoughts, ask what others think, or relate it to your experience!\n";
    }
    if (personality) {
        prompt += "\nYour style: " + personality.speech_style + "\n";
        if (otherParticipants && otherParticipants.length > 0) {
            const others = otherParticipants.filter(p => p !== agentName);
            if (others.length > 0) {
                prompt += "Chatting with: " + others.join(", ") + "\n";
            }
        }
    }
    prompt += "\n--- Your Response Rules ---\n";
    prompt += "- Keep it natural and conversational (2-4 sentences)\n";
    prompt += "- Sound like a real person talking, not a report\n";
    prompt += "- NO quotation marks around your response\n";
    prompt += "- DO NOT say 'In recent news' - just chat naturally\n";
    prompt += "- REQUIRED RESPONSE TYPE: " + requiredIntent.toUpperCase() + "\n";
    prompt += "- " + INTENT_INSTRUCTIONS[requiredIntent] + "\n";
    return prompt;
}
