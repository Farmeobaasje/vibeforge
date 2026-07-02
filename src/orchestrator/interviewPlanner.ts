// ──────────────────────────────────────────────
// interviewPlanner — decides which question to
// ask next based on missing fields and state
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import type { OpenQuestion } from "./requirementsTypes";
import { buildRequirements } from "./requirementsBuilder";
import type { InterviewState } from "./interviewStateMachine";
import { getNextTopic } from "./interviewStateMachine";
import { topicLabel, topicQuestion, topicPriority, fieldToTopicId, getAllTopicIds } from "./interviewTopics";

// ── Types ─────────────────────────────────────

export interface PlannedQuestion {
  /** The topic this question belongs to */
  topic: string;
  /** The question text to ask */
  question: string;
  /** Why this question is being asked now */
  rationale: string;
  /** Priority (1 = highest). Lower number = higher priority. */
  priority: number;
}

export interface PlannerInput {
  /** Current conversation memory */
  memory: ConversationMemory;
  /** Current interview state */
  state: InterviewState;
}

export interface PlannerResult {
  /** The next question to ask, or null if nothing to ask */
  nextQuestion: PlannedQuestion | null;
  /** All remaining open questions (for reference) */
  remainingQuestions: OpenQuestion[];
  /** Topics that still need coverage */
  missingTopics: string[];
}

// ── Planner ───────────────────────────────────

/**
 * Plan the next question to ask based on the current conversation
 * memory and interview state.
 *
 * Strategy:
 * 1. First, check if there are open questions from the requirements builder
 * 2. Then, check if there are topics that haven't been asked yet
 * 3. Finally, check if we need to deepen understanding of already-asked topics
 *
 * Conservative: prefers to ask rather than assume.
 */
export function planNextQuestion(input: PlannerInput): PlannerResult {
  const { memory, state } = input;

  // ── Step 1: Build requirements to get missing fields ──
  const buildResult = buildRequirements(memory);

  if (import.meta.env.DEV) {
    console.log("[DEBUG planNextQuestion] INPUT STATE:", {
      askedTopics: state.askedTopics,
      askedTopicsCount: state.askedTopics.length,
      remainingTopics: state.remainingTopics,
      remainingTopicsCount: state.remainingTopics.length,
      currentTopic: state.currentTopic,
      missingFields: buildResult.missingFields.map(mf => mf.field),
      expectedTopics: getAllTopicIds(),
      expectedCount: getAllTopicIds().length,
    });
  }

  // ── Step 2: Determine which topics are still missing ──
  // missingFields use requirementField names (camelCase).
  // We need to map them to canonical topic ids for the planner.
  const missingTopicIds = buildResult.missingFields
    .map((mf) => fieldToTopicId(mf.field))
    .filter((id): id is string => id !== undefined);

  // ── Step 3: Filter out topics already asked in this session ──
  const unaskedMissingTopics = missingTopicIds.filter(
    (topicId) => !state.askedTopics.includes(topicId),
  );

  // ── Step 4: Sort by priority ──
  const sortedMissingTopics = [...unaskedMissingTopics].sort((a, b) => {
    const pa = topicPriority(a);
    const pb = topicPriority(b);
    return pa - pb;
  });

  // ── Step 5: Pick the highest-priority missing topic ──
  if (sortedMissingTopics.length > 0) {
    const topicId = sortedMissingTopics[0];
    const question = topicQuestion(topicId) ?? `Tell me more about ${topicLabel(topicId)}.`;
    const priority = topicPriority(topicId);

    if (import.meta.env.DEV) {
      console.log("[DEBUG planNextQuestion] Step 5 — missing topic found:", {
        answeredTopics: state.askedTopics,
        missingCanonicalTopics: sortedMissingTopics,
        nextQuestionTopic: topicId,
      });
    }

    return {
      nextQuestion: {
        topic: topicId,
        question,
        rationale: `${topicLabel(topicId)} has not been covered yet.`,
        priority,
      },
      remainingQuestions: buildResult.openQuestions,
      missingTopics: sortedMissingTopics,
    };
  }

  // ── Step 5.5: Complete-state guard ──
  // If all canonical INTERVIEW_TOPICS have been asked and no fields
  // are missing, the interview is done. Do NOT fall through to Step 6
  // which would pick a stale remainingTopic and restart the loop.
  const allTopicIds = getAllTopicIds();
  const allCanonicalTopicsAsked = allTopicIds.every((id) =>
    state.askedTopics.includes(id),
  );

  if (import.meta.env.DEV) {
    console.log("[DEBUG planNextQuestion] Step 5.5 — complete-state guard:", {
      answeredTopics: state.askedTopics,
      missingCanonicalTopics: sortedMissingTopics,
      allCanonicalTopicsAsked,
      remainingTopics: state.remainingTopics,
    });
  }

  if (allCanonicalTopicsAsked) {
    return {
      nextQuestion: null,
      remainingQuestions: buildResult.openQuestions,
      missingTopics: [],
    };
  }

  // ── Step 6: If no missing topics, check the next topic from state ──
  const nextTopicId = getNextTopic(state);
  if (nextTopicId) {
    const question = topicQuestion(nextTopicId) ?? `Let's talk about ${topicLabel(nextTopicId)}.`;
    const priority = topicPriority(nextTopicId);

    if (import.meta.env.DEV) {
      console.log("[DEBUG planNextQuestion] Step 6 — next topic from state:", {
        answeredTopics: state.askedTopics,
        missingCanonicalTopics: sortedMissingTopics,
        nextQuestionTopic: nextTopicId,
      });
    }

    return {
      nextQuestion: {
        topic: nextTopicId,
        question,
        rationale: `Moving to next topic: ${topicLabel(nextTopicId)}.`,
        priority,
      },
      remainingQuestions: buildResult.openQuestions,
      missingTopics: [],
    };
  }

  // ── Step 7: Nothing to ask ──
  if (import.meta.env.DEV) {
    console.log("[DEBUG planNextQuestion] Step 7 — nothing to ask:", {
      answeredTopics: state.askedTopics,
      missingCanonicalTopics: sortedMissingTopics,
      nextQuestionTopic: null,
      done: true,
    });
  }

  return {
    nextQuestion: null,
    remainingQuestions: buildResult.openQuestions,
    missingTopics: [],
  };
}

