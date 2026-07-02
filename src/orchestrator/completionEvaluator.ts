// ──────────────────────────────────────────────
// completionEvaluator — Epic 23.6A
// Determines per-topic completion based on
// rule-based TopicValidator.
//
// Pure functions, no AI calls, no side effects.
// Uses the TopicValidator to determine whether
// each topic has been sufficiently covered.
//
// Public API (evaluateCompletion, getTopicCompletion,
// isTopicComplete, summarizeCompletion) remains
// unchanged for backward compatibility.
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import { validateTopics, type ValidationResult } from "./topicValidator";

// ── Types ─────────────────────────────────────

export interface TopicCompletion {
  /** The canonical topic id */
  topicId: string;
  /** The requirementField name */
  fieldName: string;
  /** Completion confidence (0-100) — mapped from isComplete */
  confidence: number;
  /** Whether this topic is considered complete */
  isComplete: boolean;
  /** Human-readable reason */
  reason: string;
}

export interface CompletionEvaluationResult {
  /** Per-topic completion scores */
  topics: TopicCompletion[];
  /** Overall completion percentage (0-100) */
  overall: number;
  /** The next incomplete topic (highest priority first), or null */
  nextIncompleteTopic: string | null;
  /** All incomplete topic ids, sorted by priority */
  incompleteTopics: string[];
  /** All complete topic ids */
  completeTopics: string[];
  /** The underlying extraction result (kept for backward compat) */
  extraction: { fields: Record<string, unknown>; missingFields: string[]; filledFields: string[] };
}

// ── Evaluator ─────────────────────────────────

/**
 * Evaluate completion for all topics based on the conversation memory.
 *
 * Uses the TopicValidator (rule-based) to determine which topics
 * have been sufficiently covered.
 *
 * Public API unchanged — returns the same CompletionEvaluationResult
 * shape as before.
 *
 * @param memory - The conversation memory to evaluate
 * @returns CompletionEvaluationResult with per-topic scores
 */
export function evaluateCompletion(
  memory: ConversationMemory,
): CompletionEvaluationResult {
  const validation = validateTopics(memory);

  // Map ValidationResult → CompletionEvaluationResult
  const topics: TopicCompletion[] = validation.topics.map((v) => ({
    topicId: v.topicId,
    fieldName: v.fieldName,
    confidence: v.isComplete ? 100 : v.hasAnyAnswer ? 30 : 0,
    isComplete: v.isComplete,
    reason: v.reason,
  }));

  // Build a minimal extraction stub for backward compat
  const extraction = buildExtractionStub(validation);

  return {
    topics,
    overall: validation.overall,
    nextIncompleteTopic: validation.nextIncompleteTopic,
    incompleteTopics: validation.incompleteTopics,
    completeTopics: validation.completeTopics,
    extraction,
  };
}

// ── Helpers ───────────────────────────────────

/**
 * Build a minimal extraction stub for backward compatibility.
 * The extraction field is still referenced by some consumers,
 * but the real extraction logic lives in requirementExtractor.ts.
 */
function buildExtractionStub(validation: ValidationResult): {
  fields: Record<string, unknown>;
  missingFields: string[];
  filledFields: string[];
} {
  const fields: Record<string, unknown> = {};
  const missingFields: string[] = [];
  const filledFields: string[] = [];

  for (const topic of validation.topics) {
    fields[topic.fieldName] = {
      value: topic.isComplete ? "(validated)" : "",
      confidence: topic.isComplete ? 1 : topic.hasAnyAnswer ? 0.3 : 0,
    };
    if (topic.isComplete) {
      filledFields.push(topic.fieldName);
    } else {
      missingFields.push(topic.fieldName);
    }
  }

  return { fields, missingFields, filledFields };
}

/**
 * Get the completion status for a single topic.
 *
 * @param memory - The conversation memory
 * @param topicId - The canonical topic id
 * @returns The topic completion info
 */
export function getTopicCompletion(
  memory: ConversationMemory,
  topicId: string,
): TopicCompletion | null {
  const result = evaluateCompletion(memory);
  return result.topics.find((t) => t.topicId === topicId) ?? null;
}

/**
 * Check if a specific topic is complete.
 *
 * @param memory - The conversation memory
 * @param topicId - The canonical topic id
 * @returns True if the topic is complete
 */
export function isTopicComplete(
  memory: ConversationMemory,
  topicId: string,
): boolean {
  const completion = getTopicCompletion(memory, topicId);
  return completion?.isComplete ?? false;
}

/**
 * Get a human-readable summary of topic completion.
 *
 * @param memory - The conversation memory
 * @returns A formatted summary string
 */
export function summarizeCompletion(memory: ConversationMemory): string {
  const result = evaluateCompletion(memory);
  const lines: string[] = [];

  lines.push("=== Topic Completion Summary ===");
  lines.push(`Overall: ${result.overall}% (${result.completeTopics.length}/${result.topics.length} topics)`);
  lines.push("");

  for (const topic of result.topics) {
    const icon = topic.isComplete ? "✅" : "⏳";
    lines.push(`  ${icon} ${topic.topicId}: ${topic.confidence}% — ${topic.reason}`);
  }

  if (result.nextIncompleteTopic) {
    lines.push("");
    lines.push(`Next topic to ask: ${result.nextIncompleteTopic}`);
  }

  return lines.join("\n");
}
