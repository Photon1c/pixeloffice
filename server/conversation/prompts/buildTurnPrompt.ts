/**
 * Prompt builder for Cooler Talk turns.
 *
 * Assembles the model-facing prompt from session state, personality,
 * and intent requirements. Kept separate from the controller so it
 * can be tested and tuned independently.
 */

import type { ConversationIntent, CoolerSession } from "../types";
import { COOLER_CONFIG } from "../config";
import { getPersonality } from "../agentPersonalities";

const INTENT_INSTRUCTIONS: Record<ConversationIntent, string> = {
  ask:      "Your line must be a thoughtful QUESTION with '?'. Ask something specific about the topic that invites discussion - show genuine curiosity! Examples: 'What do you think about...?', 'Have you noticed...?', 'How do you feel about...?'",
  answer:   "Your line must RESPOND to the previous message. Show you listened by referencing what was said, then add your own perspective. Build on their point and share your genuine thoughts. Avoid just agreeing - add value!",
  observe:  "Your line must share an INTERESTING OBSERVATION about the topic. Say something thoughtful or surprising - make people think! Connect it to real workplace or life experiences.",
  joke:     "Your line must be a LIGHT, WORKPLACE-SAFE joke or witty observation related to the topic. Make people smile! Keep it professional but fun.",
  agree:    "Your line must show genuine AGREEMENT. Use words like 'Absolutely!', 'That's so true!', 'I completely agree!' then ADD YOUR OWN THOUGHT - don't just echo, expand on why you agree!",
  disagree: "Your line must offer a respectful DISAGREEMENT. Say something like 'I see it differently because...' or 'That's interesting but have you considered...' - be diplomatic but honest!",
  redirect: "Your line must smoothly SHIFT THE CONVERSATION to a related point. Connect what was just discussed to something new that ties back to the topic - make it flow naturally!",
  escalate: "Your line must add URGENCY or IMPORTANCE. Explain WHY this matters now - what's the consequence of ignoring or embracing this? Make people care!",
};

export function buildTurnPrompt(
  session: CoolerSession,
  agentName: string,
  requiredIntent: ConversationIntent,
): string {
  const personality = getPersonality(agentName);
  const lastUtterance = session.utterances[session.utterances.length - 1];

  // Extract the actual topic (strip "In recent news: " prefix if present)
  let displayTopic = session.topic;
  if (displayTopic.startsWith("In recent news: ")) {
    displayTopic = displayTopic.substring(15);
  }

  // Build conversation history with full context
  let history = `WATER COOLER CONVERSATION\n`;
  history += `Topic: "${displayTopic}"\n`;
  if (session.location) {
    history += `Location: ${session.location}\n`;
  }
  history += `\n--- Conversation So Far ---\n`;
  
  if (session.conversationHistory.length === 0) {
    history += "(No previous messages - you're starting this conversation)\n";
  } else {
    for (let i = 0; i < session.conversationHistory.length; i++) {
      history += `${session.conversationHistory[i]}\n`;
    }
  }
  history += "-------------------------\n";

  let previousContext: string;
  if (lastUtterance) {
    const cleanLastText = lastUtterance.text.replace(/In recent news:?\s*/gi, "").replace(/According to recent news:?\s*/gi, "").trim();
    previousContext = `The last thing ${lastUtterance.speaker} said was: "${cleanLastText}"\n`;
    previousContext += `\nYour turn to respond! Consider:\n`;
    previousContext += `- What did ${lastUtterance.speaker} say that you agree or disagree with?\n`;
    previousContext += `- Do you have a personal experience or opinion to share?\n`;
    previousContext += `- Can you ask a follow-up question or add new information?\n`;
  } else {
    previousContext = `This is the START of the conversation about "${displayTopic}".\n`;
    previousContext += `\nKick things off! You could:\n`;
    previousContext += `- Share something interesting you heard about this topic\n`;
    previousContext += `- Ask what others think about it\n`;
    previousContext += `- Relate it to your own experience at work\n`;
  }

  let personalityContext = "";
  if (personality) {
    personalityContext = `
Your character: ${agentName} (${personality.role})
Style: ${personality.speech_style}
Speak naturally as this person!`;
  }

  return `${history}${previousContext}${personalityContext}

CONVERSATION STYLE:
- Think carefully before responding - give an authentic, thoughtful answer
- This is a casual chat with coworkers, not a formal interview
- Your personality should shine through - be genuine!

REQUIRED INTENT: "${requiredIntent}"
${INTENT_INSTRUCTIONS[requiredIntent]}

RESPONSE RULES:
- Write ${COOLER_CONFIG.promptMaxWords}+ words (2-4 sentences minimum for engaging conversation)
- Write as natural speech, not an essay or narration
- NO quotation marks around your response
- DO NOT say "In recent news" or "According to recent news" - just discuss naturally like you would with colleagues
- If you ignore these rules, your response will be rejected!`;
}
