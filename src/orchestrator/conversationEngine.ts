// ──────────────────────────────────────────────
// conversationEngine — Epic 23.6B
// Controlled-topic Conversation Engine.
//
// Uses CompletionEvaluator + RequirementExtractor
// to determine topic progression. The LLM only
// formulates questions for the specified topic.
//
// Pure logic engine — no AI calls, no side effects.
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import type { InterviewState, InterviewAction } from "./interviewStateMachine";
import {
  createInitialInterviewState,
  interviewReducer,
  levelToConfidence,
} from "./interviewStateMachine";
import type { PlannedQuestion, PlannerResult } from "./interviewPlanner";
import { planNextQuestion } from "./interviewPlanner";
import type { FollowUpQuestion } from "./followUpEngine";
import type { AssumptionCheckResult } from "./assumptionManager";
import { checkDefaultAssumption, processAnswerAgainstAssumptions } from "./assumptionManager";
import type { CompletionBreakdown } from "./completionScore";
import { calculateCompletion } from "./completionScore";
import type { CompletionEvaluationResult } from "./completionEvaluator";
import { evaluateCompletion } from "./completionEvaluator";
import { topicLabel, topicQuestion, topicPriority } from "./interviewTopics";

// ── Types ─────────────────────────────────────

export interface EngineResult {
  /** The next question to ask (planned or follow-up), or null */
  nextQuestion: PlannedQuestion | FollowUpQuestion | null;
  /** Whether the next question is a follow-up (vs. a planned question) */
  isFollowUp: boolean;
  /** Updated interview state */
  state: InterviewState;
  /** Updated conversation memory (with any new assumptions/decisions) */
  memory: ConversationMemory;
  /** Completion breakdown (legacy, kept for backward compat) */
  completion: CompletionBreakdown;
  /** Epic 23.6B — completion evaluation result */
  evaluation: CompletionEvaluationResult;
  /** Any assumptions that were created or resolved */
  assumptionResult: AssumptionCheckResult | null;
  /** Planner result for reference (legacy, kept for backward compat) */
  plannerResult: PlannerResult;
}

export interface EngineConfig {
  /** Custom topic order (optional) */
  topicOrder?: string[];
}

// ── Engine ────────────────────────────────────

/**
 * ConversationEngine — Epic 23.6B
 *
 * Controlled-topic flow:
 * 1. After each answer, run evaluateCompletion(memory)
 * 2. If currentTopic is still incomplete → ask again about currentTopic
 * 3. If currentTopic is complete → ask nextIncompleteTopic
 * 4. If nextIncompleteTopic === null → interview is done
 *
 * The LLM only formulates questions for the specified topic.
 * No free follow-up topic switching.
 */
export class ConversationEngine {
  private state: InterviewState;
  private config: EngineConfig;

  constructor(config: EngineConfig = {}) {
    this.state = createInitialInterviewState(config.topicOrder);
    this.config = config;
  }

  // ── Public API ──────────────────────────────

  /**
   * Get the current interview state.
   */
  getState(): InterviewState {
    return { ...this.state };
  }

  /**
   * Process a user answer and determine the next question.
   *
   * Epic 23.6B flow:
   * 1. Run evaluateCompletion(memory) to see what's been extracted
   * 2. If currentTopic is still incomplete → stay on currentTopic
   * 3. If currentTopic is complete → move to nextIncompleteTopic
   * 4. If nextIncompleteTopic === null → interview is done
   *
   * @param memory - The current conversation memory
   * @param topic - The topic being answered
   * @param answer - The user's answer text
   * @returns The engine result with next state and next question
   */
  processAnswer(
    memory: ConversationMemory,
    topic: string,
    answer: string,
  ): EngineResult {
    // ── Step 1: Update state machine ──
    let currentState = this.state;

    // Mark the topic as answered
    const answerAction: InterviewAction = { type: "ANSWER_TOPIC", topic };
    currentState = interviewReducer(currentState, answerAction);

    // ── Step 2: Check assumptions ──
    let assumptionResult: AssumptionCheckResult | null = null;

    assumptionResult = processAnswerAgainstAssumptions(memory, topic, answer);
    if (!assumptionResult.assumptionResolved && !assumptionResult.assumptionCreated) {
      assumptionResult = checkDefaultAssumption(memory, topic);
    }

    // ── Step 3: Evaluate completion (Epic 23.6B) ──
    const evaluation = evaluateCompletion(memory);

    if (import.meta.env.DEV) {
      console.log("[DEBUG conversationEngine] evaluateCompletion:", {
        currentTopic: topic,
        currentTopicComplete: evaluation.topics.find(t => t.topicId === topic)?.isComplete,
        nextIncompleteTopic: evaluation.nextIncompleteTopic,
        overall: evaluation.overall,
        completeTopics: evaluation.completeTopics,
        incompleteTopics: evaluation.incompleteTopics,
      });
    }

    // ── Step 4: Determine next topic ──
    let nextTopicId: string | null = null;
    let isFollowUp = false;

    // Check if the current topic is now complete
    const currentTopicCompletion = evaluation.topics.find(t => t.topicId === topic);
    const currentTopicComplete = currentTopicCompletion?.isComplete ?? false;

    if (currentTopicComplete) {
      // Current topic is done — move to next incomplete topic
      nextTopicId = evaluation.nextIncompleteTopic;
    } else {
      // Current topic is still incomplete — stay on it
      nextTopicId = topic;
      isFollowUp = true;
    }

    // ── Step 5: Build the next question ──
    let nextQuestion: PlannedQuestion | FollowUpQuestion | null = null;

    if (nextTopicId) {
      const questionText = topicQuestion(nextTopicId) ?? `Tell me more about ${topicLabel(nextTopicId)}.`;
      const priority = this.getTopicPriority(nextTopicId);

      if (isFollowUp) {
        nextQuestion = {
          topic: nextTopicId,
          question: questionText,
          rationale: `Still need more information about ${topicLabel(nextTopicId)}.`,
        } as FollowUpQuestion;
      } else {
        nextQuestion = {
          topic: nextTopicId,
          question: questionText,
          rationale: `Moving to next topic: ${topicLabel(nextTopicId)}.`,
          priority,
        } as PlannedQuestion;

        // Start the new topic in the state machine
        const startAction: InterviewAction = {
          type: "START_TOPIC",
          topic: nextTopicId,
        };
        currentState = interviewReducer(currentState, startAction);
      }
    }

    // ── Step 6: Calculate legacy completion score ──
    const completion = calculateCompletion({
      memory,
      state: currentState,
    });

    // Update state with completion and confidence
    const confidenceUpdate: InterviewAction = {
      type: "SET_CONFIDENCE",
      value: levelToConfidence(memory.confidence),
    };
    currentState = interviewReducer(currentState, confidenceUpdate);

    const completionUpdate: InterviewAction = {
      type: "SET_COMPLETION",
      value: completion.total,
    };
    currentState = interviewReducer(currentState, completionUpdate);

    // Store the updated state
    this.state = currentState;

    // ── Step 7: Run legacy planner for backward compat ──
    const plannerResult = planNextQuestion({
      memory,
      state: currentState,
    });

    if (import.meta.env.DEV) {
      console.log("[DEBUG conversationEngine.processAnswer] FINAL STATE:", {
        askedTopics: currentState.askedTopics,
        currentTopic: topic,
        nextTopic: nextTopicId,
        isFollowUp,
        nextIncompleteTopic: evaluation.nextIncompleteTopic,
        done: nextQuestion === null,
      });
    }

    return {
      nextQuestion,
      isFollowUp,
      state: currentState,
      memory,
      completion,
      evaluation,
      assumptionResult,
      plannerResult,
    };
  }

  /**
   * Start a new interview or get the first question.
   *
   * Uses evaluateCompletion() to find the first incomplete topic.
   *
   * @param memory - The conversation memory (can be empty)
   * @returns The engine result with the first question
   */
  startInterview(memory: ConversationMemory): EngineResult {
    // Reset state
    this.state = createInitialInterviewState(this.config.topicOrder);

    // Evaluate completion to find first topic
    const evaluation = evaluateCompletion(memory);
    const firstTopicId = evaluation.nextIncompleteTopic;

    if (!firstTopicId) {
      // Nothing to ask — interview is already complete
      const completion = calculateCompletion({
        memory,
        state: this.state,
      });

      const plannerResult = planNextQuestion({
        memory,
        state: this.state,
      });

      return {
        nextQuestion: null,
        isFollowUp: false,
        state: this.state,
        memory,
        completion,
        evaluation,
        assumptionResult: null,
        plannerResult,
      };
    }

    // Start the first topic
    const startAction: InterviewAction = {
      type: "START_TOPIC",
      topic: firstTopicId,
    };
    this.state = interviewReducer(this.state, startAction);

    // Build the first question
    const questionText = topicQuestion(firstTopicId) ?? `Let's talk about ${topicLabel(firstTopicId)}.`;
    const priority = this.getTopicPriority(firstTopicId);

    const nextQuestion: PlannedQuestion = {
      topic: firstTopicId,
      question: questionText,
      rationale: `Starting with ${topicLabel(firstTopicId)}.`,
      priority,
    };

    // Calculate legacy completion
    const completion = calculateCompletion({
      memory,
      state: this.state,
    });

    const plannerResult = planNextQuestion({
      memory,
      state: this.state,
    });

    return {
      nextQuestion,
      isFollowUp: false,
      state: this.state,
      memory,
      completion,
      evaluation,
      assumptionResult: null,
      plannerResult,
    };
  }

  /**
   * Skip the current topic and move to the next.
   *
   * Forces the current topic to be treated as complete,
   * then finds the next incomplete topic.
   *
   * @param memory - The current conversation memory
   * @returns The engine result with the next question
   */
  skipTopic(memory: ConversationMemory): EngineResult {
    const currentTopic = this.state.currentTopic;

    if (currentTopic) {
      const skipAction: InterviewAction = { type: "SKIP_TOPIC", topic: currentTopic };
      this.state = interviewReducer(this.state, skipAction);
    }

    // Evaluate completion to find next topic
    const evaluation = evaluateCompletion(memory);
    const nextTopicId = evaluation.nextIncompleteTopic;

    if (!nextTopicId) {
      const completion = calculateCompletion({
        memory,
        state: this.state,
      });

      const plannerResult = planNextQuestion({
        memory,
        state: this.state,
      });

      return {
        nextQuestion: null,
        isFollowUp: false,
        state: this.state,
        memory,
        completion,
        evaluation,
        assumptionResult: null,
        plannerResult,
      };
    }

    // Start the next topic
    const startAction: InterviewAction = {
      type: "START_TOPIC",
      topic: nextTopicId,
    };
    this.state = interviewReducer(this.state, startAction);

    const questionText = topicQuestion(nextTopicId) ?? `Let's talk about ${topicLabel(nextTopicId)}.`;
    const priority = this.getTopicPriority(nextTopicId);

    const nextQuestion: PlannedQuestion = {
      topic: nextTopicId,
      question: questionText,
      rationale: `Moving to next topic: ${topicLabel(nextTopicId)}.`,
      priority,
    };

    const completion = calculateCompletion({
      memory,
      state: this.state,
    });

    const plannerResult = planNextQuestion({
      memory,
      state: this.state,
    });

    return {
      nextQuestion,
      isFollowUp: false,
      state: this.state,
      memory,
      completion,
      evaluation,
      assumptionResult: null,
      plannerResult,
    };
  }

  /**
   * Check if the interview is complete.
   */
  isComplete(): boolean {
    return (
      this.state.phase === "complete" ||
      (this.state.remainingTopics.length === 0 &&
        this.state.currentTopic === null)
    );
  }

  /**
   * Restore the engine state from a previously captured snapshot.
   */
  restoreState(state: InterviewState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  /**
   * Reset the engine to its initial state.
   */
  reset(): void {
    this.state = createInitialInterviewState(this.config.topicOrder);
  }

  // ── Helpers ─────────────────────────────────

  /**
   * Get the priority for a topic id (lower = higher priority).
   * Defaults to 99 if not found.
   */
  private getTopicPriority(topicId: string): number {
    return topicPriority(topicId);
  }
}

// ── Factory function ──────────────────────────

/**
 * Create a new ConversationEngine instance.
 */
export function createConversationEngine(
  config?: EngineConfig,
): ConversationEngine {
  return new ConversationEngine(config);
}
