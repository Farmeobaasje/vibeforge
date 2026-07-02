// ──────────────────────────────────────────────
// requirementsBuilder — heuristically maps
// ConversationMemory → RequirementsUpdate
// Pure function, no AI calls, no side effects.
// Conservative: prefers to leave fields empty
// and generate open questions rather than
// aggressively inferring.
// ──────────────────────────────────────────────

import type { ConversationMemory, ConfidenceLevel } from "../models/conversationMemory";
import type {
  RequirementsBuildResult,
  RequirementsUpdate,
  MissingField,
  OpenQuestion,
  ConfidenceChange,
} from "./requirementsTypes";
import {
  INTERVIEW_TOPICS,
} from "./interviewTopics";
import { normalizeArray, normalizeDutchField } from "../lib/normalize";

// ── Helpers ───────────────────────────────────

/** Check if a string field is effectively empty. */
function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Check if a string array is effectively empty. */
function isEmptyArray(value: string[]): boolean {
  return value.length === 0;
}

/**
 * Collect unique non-empty values from answered questions
 * whose topic matches one of the given topic ids.
 *
 * For target-users topic: does NOT split on commas to preserve
 * Dutch phrases like "lokale zonnepaneleninstallateurs" intact.
 * For other topics: splits on semicolons, bullets, and newlines only
 * (NOT commas, to avoid breaking natural language sentences).
 *
 * @param memory - The conversation memory
 * @param topicIds - Canonical topic ids to match against memory.questions[].topic
 */
function collectFromQuestions(
  memory: ConversationMemory,
  topicIds: string[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const q of memory.questions) {
    if (q.skipped) continue;
    if (!topicIds.includes(q.topic)) continue;

    const trimmed = q.answer.trim();
    if (trimmed.length === 0) continue;

    // For target-users: do NOT split on commas — preserve Dutch phrases intact
    // Split only on newlines and bullet points
    const isTargetUsers = topicIds.includes("target-users");
    const parts = isTargetUsers
      ? trimmed
          .split(/[•\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : trimmed
          // For other topics: split on semicolons, bullets, and newlines only
          // NOT on commas — to avoid breaking natural language sentences
          .split(/[;•\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

    for (const part of parts) {
      if (!seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    }
  }

  return result;
}

/**
 * Get the single best answer for a topic from the questions.
 * Uses canonical topic id to match memory.questions[].topic.
 */
function getBestAnswer(memory: ConversationMemory, topicId: string): string {
  let best = "";

  for (const q of memory.questions) {
    if (q.skipped) continue;
    if (q.topic !== topicId) continue;

    const trimmed = q.answer.trim();
    if (trimmed.length > best.length) {
      best = trimmed;
    }
  }

  return best;
}

// ── Open question templates ───────────────────
// Derived from the central INTERVIEW_TOPICS registry.
// Keyed by requirementField name.

const QUESTION_TEMPLATES: Record<string, string> = {};
for (const topic of INTERVIEW_TOPICS) {
  QUESTION_TEMPLATES[topic.requirementField] = topic.question;
}

// ── Missing field detection ───────────────────

function detectMissingFields(
  current: RequirementsUpdate,
): MissingField[] {
  const missing: MissingField[] = [];

  for (const topic of INTERVIEW_TOPICS) {
    const field = topic.requirementField as keyof RequirementsUpdate;
    const val = current[field];

    // Determine if the field is missing
    let isMissing = false;
    if (val === undefined) {
      isMissing = true;
    } else if (typeof val === "string") {
      isMissing = isBlank(val);
    } else if (Array.isArray(val)) {
      isMissing = isEmptyArray(val);
    }

    if (isMissing) {
      missing.push({
        field,
        reason: topic.missingReason,
      });
    }
  }

  return missing;
}

// ── Open question generation ──────────────────

function generateOpenQuestions(missingFields: MissingField[]): OpenQuestion[] {
  const questions: OpenQuestion[] = [];

  for (const mf of missingFields) {
    const template = QUESTION_TEMPLATES[mf.field];
    if (template) {
      questions.push({
        targetField: mf.field,
        question: template,
      });
    }
  }

  return questions;
}

// ── Confidence calculation ────────────────────

function calculateConfidenceChange(
  memory: ConversationMemory,
): ConfidenceChange {
  const totalQuestions = memory.questions.length;
  const answeredQuestions = memory.questions.filter(
    (q) => !q.skipped && q.answer.trim().length > 0,
  ).length;

  const totalAssumptions = memory.assumptions.length;
  const validatedAssumptions = memory.assumptions.filter(
    (a) => a.validated,
  ).length;

  // If there's no conversation data yet, confidence is unchanged
  if (totalQuestions === 0 && totalAssumptions === 0) {
    return {
      direction: "unchanged",
      reason: "No conversation data to evaluate.",
    };
  }

  // Calculate a simple score: ratio of answered questions + validated assumptions
  const questionScore = totalQuestions > 0 ? answeredQuestions / totalQuestions : 1;
  const assumptionScore = totalAssumptions > 0 ? validatedAssumptions / totalAssumptions : 1;
  const combinedScore = (questionScore + assumptionScore) / 2;

  if (combinedScore >= 0.8) {
    return {
      direction: "up",
      reason: `High confidence: ${answeredQuestions}/${totalQuestions} questions answered, ${validatedAssumptions}/${totalAssumptions} assumptions validated.`,
    };
  }

  if (combinedScore <= 0.3) {
    return {
      direction: "down",
      reason: `Low confidence: only ${answeredQuestions}/${totalQuestions} questions answered, ${validatedAssumptions}/${totalAssumptions} assumptions validated.`,
    };
  }

  return {
    direction: "unchanged",
    reason: `Moderate signal: ${answeredQuestions}/${totalQuestions} questions answered, ${validatedAssumptions}/${totalAssumptions} assumptions validated.`,
  };
}

// ── Confidence level mapping ──────────────────

function deriveConfidenceLevel(memory: ConversationMemory): ConfidenceLevel {
  const totalQuestions = memory.questions.length;
  const answeredQuestions = memory.questions.filter(
    (q) => !q.skipped && q.answer.trim().length > 0,
  ).length;

  const totalAssumptions = memory.assumptions.length;
  const validatedAssumptions = memory.assumptions.filter(
    (a) => a.validated,
  ).length;

  if (totalQuestions === 0 && totalAssumptions === 0) {
    return "low";
  }

  const questionRatio = totalQuestions > 0 ? answeredQuestions / totalQuestions : 1;
  const assumptionRatio = totalAssumptions > 0 ? validatedAssumptions / totalAssumptions : 1;
  const combined = (questionRatio + assumptionRatio) / 2;

  if (combined >= 0.9) return "confirmed";
  if (combined >= 0.7) return "high";
  if (combined >= 0.4) return "medium";
  return "low";
}

// ── Main builder ──────────────────────────────

/**
 * Build a RequirementsUpdate from a ConversationMemory.
 *
 * This is a **pure, heuristic** function:
 * - It only extracts fields that have clear answers in the conversation.
 * - It never fabricates data.
 * - It detects missing fields and generates open questions.
 * - It calculates a confidence change based on answered questions
 *   and validated assumptions.
 *
 * @param memory - The current ConversationMemory
 * @returns A RequirementsBuildResult with the update, missing fields,
 *          open questions, and confidence change.
 */
export function buildRequirements(
  memory: ConversationMemory,
): RequirementsBuildResult {
  // ── 1. Extract known fields from conversation ──

  const update: RequirementsUpdate = {};

  // String fields — only set if we have a clear answer
  // Use canonical topic ids to match memory.questions[].topic
  const vision = getBestAnswer(memory, "vision");
  if (vision) update.vision = vision;

  const projectName = getBestAnswer(memory, "project-name");
  if (projectName) update.projectName = projectName;

  const mvpScope = getBestAnswer(memory, "mvp");
  if (mvpScope) update.mvpScope = mvpScope;

  const aiWorkflow = getBestAnswer(memory, "ai-workflow");
  if (aiWorkflow) update.aiWorkflowTarget = aiWorkflow;

  // Array fields — collect from matching canonical topic ids
  // Use centralized normalization pipeline for consistent dedup + sorting
  const goals = normalizeArray(collectFromQuestions(memory, ["goals"]));
  if (goals.length > 0) update.goals = goals;

  // target-users uses Dutch-aware normalization (preserves commas in phrases)
  const targetUsers = normalizeDutchField(collectFromQuestions(memory, ["target-users"]));
  if (targetUsers.length > 0) update.targetUsers = targetUsers;

  const problems = normalizeArray(collectFromQuestions(memory, ["problems"]));
  if (problems.length > 0) update.problems = problems;

  const solutionIdeas = normalizeArray(collectFromQuestions(memory, ["solution"]));
  if (solutionIdeas.length > 0) update.solutionIdeas = solutionIdeas;

  const integrations = normalizeArray(collectFromQuestions(memory, ["integrations"]));
  if (integrations.length > 0) update.integrations = integrations;

  const constraints = normalizeArray(collectFromQuestions(memory, ["constraints"]));
  if (constraints.length > 0) update.constraints = constraints;

  const preferredTech = normalizeArray(collectFromQuestions(memory, ["tech-stack"]));
  if (preferredTech.length > 0) update.preferredTech = preferredTech;

  const risks = normalizeArray(collectFromQuestions(memory, ["risks"]));
  if (risks.length > 0) update.risks = risks;

  // ── 2. Map assumptions → risks (unvalidated) ──
  // Conservative: only add assumptions that aren't validated as risks
  const unvalidatedAssumptions = memory.assumptions
    .filter((a) => !a.validated && a.description.trim().length > 0)
    .map((a) => `[Assumption] ${a.description}`);

  if (unvalidatedAssumptions.length > 0) {
    update.risks = [...(update.risks ?? []), ...unvalidatedAssumptions];
  }

  // ── 3. Map decisions → constraints / preferredTech ──
  // Conservative: only extract if the decision description clearly indicates tech or constraint
  const techDecisions = memory.decisions.filter((d) =>
    /tech|framework|language|library|stack/i.test(d.description),
  );
  if (techDecisions.length > 0) {
    const techFromDecisions = techDecisions.map((d) => d.description.trim());
    update.preferredTech = [
      ...new Set([...(update.preferredTech ?? []), ...techFromDecisions]),
    ];
  }

  const constraintDecisions = memory.decisions.filter((d) =>
    /constraint|limit|must|required|platform|deploy/i.test(d.description),
  );
  if (constraintDecisions.length > 0) {
    const constraintFromDecisions = constraintDecisions.map((d) => d.description.trim());
    update.constraints = [
      ...new Set([...(update.constraints ?? []), ...constraintFromDecisions]),
    ];
  }

  // ── 4. Map openQuestions → unknowns ──
  if (memory.openQuestions.length > 0) {
    update.unknowns = [...memory.openQuestions];
  }

  // ── 5. Derive confidence level ──
  update.confidence = deriveConfidenceLevel(memory);

  // ── 6. Detect missing fields ──
  const missingFields = detectMissingFields(update);

  // ── 7. Generate open questions for missing fields ──
  const openQuestions = generateOpenQuestions(missingFields);

  // ── 8. Calculate confidence change ──
  const confidenceChange = calculateConfidenceChange(memory);

  return {
    update,
    missingFields,
    openQuestions,
    confidenceChange,
  };
}
