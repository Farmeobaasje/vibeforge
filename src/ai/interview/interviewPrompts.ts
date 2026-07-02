// ──────────────────────────────────────────────
// InterviewAgent — Epic 23
// Prompt templates for the AI Interview Agent.
//
// The Interview Agent uses these prompts to
// translate planned questions into natural
// LLM conversations. The system prompt puts the
// LLM in the role of a friendly technical
// interviewer who asks one question at a time.
//
// Key design decisions:
// - The LLM should ONLY ask the question, never
//   answer it or make assumptions
// - The LLM should use the conversation history
//   to make the question feel natural
// - The LLM should NOT generate follow-ups or
//   additional questions — that's the engine's job
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../../models/conversationMemory";

/**
 * System prompt for the Interview Agent.
 *
 * This prompt instructs the LLM to act as a
 * technical interviewer who asks one question
 * at a time, using conversation history to
 * make the question feel natural and contextual.
 */
export const SYSTEM_PROMPT = `You are a technical interviewer for a project discovery session.

Your role is to ask ONE question at a time to help define a software project.

## Rules
1. Ask ONLY the question you are given — do not add extra questions.
2. Use the conversation history to make the question feel natural and contextual.
3. Do NOT answer the question yourself or make assumptions about the user's project.
4. Do NOT generate follow-up questions — that will be handled separately.
5. Keep your response concise and focused on the question.
6. If the question is a follow-up, reference the user's previous answer briefly.
7. Use a friendly, professional tone — you're helping the user think through their project.

## Format
Respond with ONLY the question text. No preamble, no explanation, no markdown formatting.
The question should be a single, clear sentence or paragraph.`;

/**
 * Build a user message that wraps a planned question with context.
 *
 * @param questionText - The raw question text from the planner
 * @param topic - The topic this question belongs to
 * @param rationale - Why this question is being asked
 * @returns A user message string for the LLM
 */
export function buildPlannedQuestionMessage(
  questionText: string,
  topic: string,
  rationale: string,
): string {
  return `I need to ask about the "${topic}" aspect of the project.

Rationale: ${rationale}

IMPORTANT: Ask ONLY about "${topic}". Do NOT ask about safety, privacy, GDPR, security, or any other topic — even if the user mentioned them. Stay focused on "${topic}".

Please ask this question naturally:
${questionText}`;
}

/**
 * Build a user message that wraps a follow-up question with context.
 *
 * @param questionText - The follow-up question text
 * @param topic - The topic this follow-up belongs to
 * @param lastAnswer - The user's last answer that triggered this follow-up
 * @param rationale - Why this follow-up is needed
 * @returns A user message string for the LLM
 */
export function buildFollowUpQuestionMessage(
  questionText: string,
  topic: string,
  lastAnswer: string,
  rationale: string,
): string {
  return `I need to ask a follow-up about the "${topic}" topic.

The user previously said: "${lastAnswer}"

Rationale: ${rationale}

Please ask this follow-up question naturally, referencing their previous answer:
${questionText}`;
}

/**
 * Build a system message that includes conversation history context.
 *
 * @param historySummary - A summary of the conversation so far
 * @returns A system message string
 */
export function buildHistoryContextMessage(
  historySummary: string,
): string {
  return `Here is the conversation so far for context:

${historySummary}

Use this context to make your question feel natural, but do NOT repeat information the user already provided.`;
}

/**
 * Build a summary of the conversation history from memory.
 * Keeps it concise — only includes answered questions.
 *
 * @param memory - The conversation memory
 * @returns A formatted summary string
 */
export function buildConversationSummary(
  memory: ConversationMemory,
): string {
  const answeredQuestions = memory.questions.filter(
    (q) => q.answer && q.answer.trim().length > 0 && !q.skipped,
  );

  if (answeredQuestions.length === 0) {
    return "No previous answers yet — this is the first question.";
  }

  return answeredQuestions
    .map(
      (q) =>
        `Q (${q.topic}): ${q.question}\nA: ${q.answer}`,
    )
    .join("\n\n");
}
