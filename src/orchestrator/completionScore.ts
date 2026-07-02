// ──────────────────────────────────────────────
// completionScore — calculates a real-time
// completion percentage for the interview
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import type { InterviewState } from "./interviewStateMachine";
import { buildRequirements } from "./requirementsBuilder";
import { REQUIRED_TOPIC_COUNT } from "./interviewTopics";

// ── Types ─────────────────────────────────────

export interface CompletionBreakdown {
  /** Overall completion score (0-100) */
  total: number;
  /** Score based on which fields are filled (0-100) — weight: 40% */
  fields: number;
  /** Score based on confidence level (0-100) — weight: 30% */
  confidence: number;
  /** Score based on validated assumptions (0-100) — weight: 15% */
  assumptions: number;
  /** Score based on answered questions (0-100) — weight: 15% */
  questions: number;
}

export interface CompletionInput {
  /** The current conversation memory */
  memory: ConversationMemory;
  /** The current interview state */
  state: InterviewState;
}

// ── Weights ───────────────────────────────────

const WEIGHTS = {
  fields: 0.40,
  confidence: 0.30,
  assumptions: 0.15,
  questions: 0.15,
} as const;

// ── Score calculation ─────────────────────────

/**
 * Calculate the completion score for the current interview.
 *
 * The score is based on four factors:
 * - **Fields (40%)**: How many of the required fields have been filled
 * - **Confidence (30%)**: The overall confidence level of the conversation
 * - **Assumptions (15%)**: How many assumptions have been validated
 * - **Questions (15%)**: How many questions have been answered vs. skipped
 *
 * All sub-scores are on a 0-100 scale.
 * The total is a weighted average.
 *
 * @param input - The completion input context
 * @returns A breakdown of the completion score
 */
export function calculateCompletion(input: CompletionInput): CompletionBreakdown {
  const { memory, state } = input;

  // ── 1. Fields score (40%) ──
  const fieldsScore = calculateFieldsScore(memory);

  // ── 2. Confidence score (30%) ──
  const confidenceScore = calculateConfidenceScore(state);

  // ── 3. Assumptions score (15%) ──
  const assumptionsScore = calculateAssumptionsScore(memory);

  // ── 4. Questions score (15%) ──
  const questionsScore = calculateQuestionsScore(memory);

  // ── Weighted total ──
  const total = Math.round(
    fieldsScore * WEIGHTS.fields +
    confidenceScore * WEIGHTS.confidence +
    assumptionsScore * WEIGHTS.assumptions +
    questionsScore * WEIGHTS.questions,
  );

  return {
    total: Math.max(0, Math.min(100, total)),
    fields: fieldsScore,
    confidence: confidenceScore,
    assumptions: assumptionsScore,
    questions: questionsScore,
  };
}

// ── Sub-scores ────────────────────────────────

/**
 * Calculate the fields score based on how many required fields
 * have been filled in the requirements.
 *
 * Uses the Requirements Builder to detect missing fields.
 */
function calculateFieldsScore(memory: ConversationMemory): number {
  const buildResult = buildRequirements(memory);

  // Total fields that the builder tracks — derived from central registry
  // Uses REQUIRED_TOPIC_COUNT to exclude optional topics (e.g. project-name)
  const TOTAL_FIELDS = REQUIRED_TOPIC_COUNT;

  const missingCount = buildResult.missingFields.length;
  const filledCount = TOTAL_FIELDS - missingCount;

  return Math.round((filledCount / TOTAL_FIELDS) * 100);
}

/**
 * Calculate the confidence score based on the interview state.
 *
 * Maps the numeric confidence (0-1) to a 0-100 scale.
 */
function calculateConfidenceScore(state: InterviewState): number {
  return Math.round(state.confidence * 100);
}

/**
 * Calculate the assumptions score based on how many assumptions
 * have been validated.
 *
 * Returns 100 if there are no assumptions (nothing to validate).
 */
function calculateAssumptionsScore(memory: ConversationMemory): number {
  const total = memory.assumptions.length;

  if (total === 0) return 100;

  const validated = memory.assumptions.filter((a) => a.validated).length;
  return Math.round((validated / total) * 100);
}

/**
 * Calculate the questions score based on how many questions
 * have been answered vs. skipped or unanswered.
 */
function calculateQuestionsScore(memory: ConversationMemory): number {
  const total = memory.questions.length;

  if (total === 0) return 0;

  const answered = memory.questions.filter(
    (q) => !q.skipped && q.answer.trim().length > 0,
  ).length;

  return Math.round((answered / total) * 100);
}

// ── Helpers ───────────────────────────────────

/**
 * Get a human-readable label for a completion score range.
 */
export function completionLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 25) return "Needs Work";
  return "Just Started";
}

/**
 * Get a visual progress bar string for a score.
 *
 * @param score - The score (0-100)
 * @param width - The width of the bar in characters (default: 20)
 * @returns A string like "████████░░░░░░░░░░░░"
 */
export function progressBar(score: number, width: number = 20): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
