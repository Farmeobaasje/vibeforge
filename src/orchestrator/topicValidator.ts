// ──────────────────────────────────────────────
// topicValidator — rule-based per-topic
// completion checker.
//
// Pure functions, no AI calls, no side effects.
// Determines whether a topic is "complete" based
// on simple, conservative rules:
//
// - Vision: ≥1 zin ≥20 chars, geen placeholder
// - Users: ≥1 doelgroep genoemd
// - Problem: ≥1 pijnpunt genoemd
// - Goals: ≥1 doel genoemd
// - Solution: ≥20 chars
// - MVP: ≥15 chars
// - Tech Stack: ≥1 technologie genoemd
// - Integrations: ≥10 chars
// - Constraints: ≥10 chars
// - Risks: ≥10 chars
// - AI Workflow: ≥5 chars
//
// Placeholder detection: "you decide", "geen idee",
// "n/a", "weet ik niet", "i don't know", "idk",
// "geen", "none", "not sure", "no idea"
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import { INTERVIEW_TOPICS } from "./interviewTopics";

// ── Types ─────────────────────────────────────

export interface TopicValidation {
  /** The canonical topic id */
  topicId: string;
  /** The requirementField name */
  fieldName: string;
  /** Whether this topic is considered complete */
  isComplete: boolean;
  /** Human-readable reason */
  reason: string;
  /** Whether the topic has any answer at all (even if partial) */
  hasAnyAnswer: boolean;
}

export interface ValidationResult {
  /** Per-topic validation results */
  topics: TopicValidation[];
  /** Overall completion percentage (0-100) */
  overall: number;
  /** The next incomplete topic (highest priority first), or null */
  nextIncompleteTopic: string | null;
  /** All incomplete topic ids, sorted by priority */
  incompleteTopics: string[];
  /** All complete topic ids */
  completeTopics: string[];
}

// ── Placeholder detection ─────────────────────

const PLACEHOLDER_PATTERNS = [
  /^(you decide|geen idee|n\/a|weet ik niet|i don'?t know|idk|not sure|no idea|geen|none|nog niet|later|misschien|whatever)$/i,
  /^(geen idee|geen ideeën|geen plan|geen visie)$/i,
  /^(i don'?t have|i have no|don'?t know yet|tbd|to be determined)$/i,
  /^(\?\?\?|\.\.\.|---|\*\*\*)$/,
];

function isPlaceholder(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  if (trimmed.length === 0) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

// ── Per-topic validators ──────────────────────

interface ValidatorInput {
  /** The best answer text for this topic */
  answer: string;
  /** All answers for this topic (for array fields) */
  answers: string[];
}

type TopicValidatorFn = (input: ValidatorInput) => {
  isComplete: boolean;
  reason: string;
};

/**
 * Vision: ≥1 duidelijk antwoord ≥20 chars, geen placeholder.
 */
const validateVision: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No vision provided yet." };
  }
  if (answer.length < 20) {
    return { isComplete: false, reason: "Vision is too short to be meaningful." };
  }
  return { isComplete: true, reason: "Vision has been clearly stated." };
};

/**
 * Users: ≥1 doelgroep genoemd (splits op komma/punt/enter).
 */
const validateUsers: TopicValidatorFn = ({ answers }) => {
  const items = extractListItems(answers);
  if (items.length === 0) {
    return { isComplete: false, reason: "No target users specified yet." };
  }
  const nonPlaceholder = items.filter((i) => !isPlaceholder(i));
  if (nonPlaceholder.length === 0) {
    return { isComplete: false, reason: "Target users contain only placeholders." };
  }
  return { isComplete: true, reason: `Found ${nonPlaceholder.length} target user group(s).` };
};

/**
 * Problems: ≥1 pijnpunt genoemd.
 */
const validateProblems: TopicValidatorFn = ({ answers }) => {
  const items = extractListItems(answers);
  if (items.length === 0) {
    return { isComplete: false, reason: "No problems specified yet." };
  }
  const nonPlaceholder = items.filter((i) => !isPlaceholder(i));
  if (nonPlaceholder.length === 0) {
    return { isComplete: false, reason: "Problems contain only placeholders." };
  }
  return { isComplete: true, reason: `Found ${nonPlaceholder.length} problem(s).` };
};

/**
 * Goals: ≥1 doel genoemd.
 */
const validateGoals: TopicValidatorFn = ({ answers }) => {
  const items = extractListItems(answers);
  if (items.length === 0) {
    return { isComplete: false, reason: "No goals specified yet." };
  }
  const nonPlaceholder = items.filter((i) => !isPlaceholder(i));
  if (nonPlaceholder.length === 0) {
    return { isComplete: false, reason: "Goals contain only placeholders." };
  }
  return { isComplete: true, reason: `Found ${nonPlaceholder.length} goal(s).` };
};

/**
 * Solution: ≥20 chars, geen placeholder.
 */
const validateSolution: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No solution ideas provided yet." };
  }
  if (answer.length < 20) {
    return { isComplete: false, reason: "Solution description is too brief." };
  }
  return { isComplete: true, reason: "Solution approach has been described." };
};

/**
 * MVP Scope: ≥15 chars, geen placeholder.
 */
const validateMvp: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No MVP scope provided yet." };
  }
  if (answer.length < 15) {
    return { isComplete: false, reason: "MVP scope is too brief." };
  }
  return { isComplete: true, reason: "MVP scope has been defined." };
};

/**
 * Tech Stack: ≥1 technologie genoemd.
 */
const validateTechStack: TopicValidatorFn = ({ answers }) => {
  const items = extractListItems(answers);
  if (items.length === 0) {
    return { isComplete: false, reason: "No tech stack preferences specified yet." };
  }
  const nonPlaceholder = items.filter((i) => !isPlaceholder(i));
  if (nonPlaceholder.length === 0) {
    return { isComplete: false, reason: "Tech stack contains only placeholders." };
  }
  return { isComplete: true, reason: `Found ${nonPlaceholder.length} technology reference(s).` };
};

/**
 * Integrations: ≥10 chars, geen placeholder.
 */
const validateIntegrations: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No integrations specified yet." };
  }
  if (answer.length < 10) {
    return { isComplete: false, reason: "Integration description is too brief." };
  }
  return { isComplete: true, reason: "Integrations have been discussed." };
};

/**
 * Constraints: ≥10 chars, geen placeholder.
 */
const validateConstraints: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No constraints specified yet." };
  }
  if (answer.length < 10) {
    return { isComplete: false, reason: "Constraint description is too brief." };
  }
  return { isComplete: true, reason: "Constraints have been discussed." };
};

/**
 * Risks: ≥10 chars, geen placeholder.
 */
const validateRisks: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No risks specified yet." };
  }
  if (answer.length < 10) {
    return { isComplete: false, reason: "Risk description is too brief." };
  }
  return { isComplete: true, reason: "Risks have been discussed." };
};

/**
 * AI Workflow: ≥5 chars, geen placeholder.
 */
const validateAiWorkflow: TopicValidatorFn = ({ answer }) => {
  if (!answer || isPlaceholder(answer)) {
    return { isComplete: false, reason: "No AI workflow target specified yet." };
  }
  if (answer.length < 5) {
    return { isComplete: false, reason: "AI workflow target is too brief." };
  }
  return { isComplete: true, reason: "AI workflow target has been specified." };
};

/**
 * Project Name: optional topic.
 * Complete if an explicit name pattern (genaamd/called/named) is found
 * in any user message, OR if the project-name question was answered.
 * Otherwise incomplete — but since it's optional, it won't block progress.
 */
const validateProjectName: TopicValidatorFn = ({ answer, answers }) => {
  // Check if the project-name question was answered with a real name
  if (answer && !isPlaceholder(answer) && answer.length >= 3) {
    return { isComplete: true, reason: "Project name has been specified." };
  }

  // Check all answers for explicit name patterns
  for (const ans of answers) {
    if (extractExplicitName(ans)) {
      return { isComplete: true, reason: "Project name extracted from conversation." };
    }
  }

  return { isComplete: false, reason: "Project name has not been specified yet (optional)." };
};

/**
 * Extract an explicit project name from text using known patterns.
 */
function extractExplicitName(text: string): string | null {
  // Pattern: "genaamd <Name>" (Dutch)
  const genaamdMatch = text.match(/genaamd\s+([A-Z][A-Za-z0-9_\-\s]{1,40}?)(?:[.,;!?]|\s+(?:voor|om|die|dat|met|een|de|het|en|of|maar|want|dus|zodat|waarbij|waar|is|wordt|heeft|moet|kan|zal|gaat|zou|werkt|biedt|maakt|ondersteunt|gebruikt|levert|geeft|laat|zorgt|richt))/i);
  if (genaamdMatch) return genaamdMatch[1].trim();

  // Pattern: "called <Name>" or "named <Name>"
  const calledMatch = text.match(/(?:called|named)\s+([A-Z][A-Za-z0-9_\-\s]{1,40}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims))/i);
  if (calledMatch) return calledMatch[1].trim();

  // Pattern: "(a|an|the) <Name> (project|platform|app|tool|system|application|service|dashboard|portal|hub)"
  const projectMatch = text.match(/(?:a|an|the)\s+([A-Z][A-Za-z0-9_\-]{1,30}?)\s+(?:project|platform|app|tool|system|application|service|dashboard|portal|hub)/i);
  if (projectMatch) return projectMatch[1].trim();

  return null;
}

// ── Validator registry ─────────────────────────
// Maps canonical topic id → validator function

const VALIDATOR_REGISTRY: Record<string, TopicValidatorFn> = {
  "vision": validateVision,
  "project-name": validateProjectName,
  "target-users": validateUsers,
  "problems": validateProblems,
  "goals": validateGoals,
  "solution": validateSolution,
  "mvp": validateMvp,
  "tech-stack": validateTechStack,
  "integrations": validateIntegrations,
  "constraints": validateConstraints,
  "risks": validateRisks,
  "ai-workflow": validateAiWorkflow,
};

// ── Helpers ────────────────────────────────────

/**
 * Extract list items from one or more answer strings.
 * Splits on common delimiters: comma, semicolon, bullet, newline.
 */
function extractListItems(answers: string[]): string[] {
  const items: string[] = [];
  const seen = new Set<string>();

  for (const ans of answers) {
    if (!ans) continue;
    const parts = ans.split(/[,;•\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);
    for (const part of parts) {
      const key = part.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push(part);
      }
    }
  }

  return items;
}

/**
 * Get the best (longest) answer for a given topic from memory.
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

/**
 * Get ALL answers for a given topic from memory.
 */
function getAllAnswers(memory: ConversationMemory, topicId: string): string[] {
  const answers: string[] = [];
  for (const q of memory.questions) {
    if (q.skipped) continue;
    if (q.topic !== topicId) continue;
    const trimmed = q.answer.trim();
    if (trimmed.length > 0) {
      answers.push(trimmed);
    }
  }
  return answers;
}

// ── Main validation function ──────────────────

/**
 * Validate all topics against the conversation memory.
 *
 * Uses rule-based validators per topic — no confidence scores,
 * no keyword matching. A topic is either complete or not.
 *
 * @param memory - The conversation memory to validate
 * @returns ValidationResult with per-topic results
 */
export function validateTopics(memory: ConversationMemory): ValidationResult {
  const topics: TopicValidation[] = [];

  for (const topic of INTERVIEW_TOPICS) {
    const validator = VALIDATOR_REGISTRY[topic.id];
    if (!validator) {
      // No validator defined — treat as incomplete
      topics.push({
        topicId: topic.id,
        fieldName: topic.requirementField,
        isComplete: false,
        reason: `No validator defined for topic "${topic.id}".`,
        hasAnyAnswer: false,
      });
      continue;
    }

    const answer = getBestAnswer(memory, topic.id);
    const answers = getAllAnswers(memory, topic.id);
    const hasAnyAnswer = answer.length > 0;

    const result = validator({ answer, answers });

    topics.push({
      topicId: topic.id,
      fieldName: topic.requirementField,
      isComplete: result.isComplete,
      reason: result.reason,
      hasAnyAnswer,
    });
  }

  // Calculate overall completion
  const completeTopics = topics.filter((t) => t.isComplete).map((t) => t.topicId);
  const incompleteTopics = topics
    .filter((t) => !t.isComplete)
    .map((t) => t.topicId);

  const overall = topics.length > 0
    ? Math.round((completeTopics.length / topics.length) * 100)
    : 0;

  // Find next incomplete topic (highest priority first)
  const nextIncompleteTopic = findNextIncompleteTopic(incompleteTopics);

  return {
    topics,
    overall,
    nextIncompleteTopic,
    incompleteTopics,
    completeTopics,
  };
}

/**
 * Find the next incomplete topic to ask about.
 *
 * Strategy:
 * 1. Filter out optional topics — they never block interview progress
 * 2. Sort remaining incomplete topics by priority (lower = higher priority)
 * 3. Return the highest-priority non-optional incomplete topic, or null
 */
function findNextIncompleteTopic(incompleteTopics: string[]): string | null {
  // Filter out optional topics — they don't block progress
  const nonOptional = incompleteTopics.filter((id) => {
    const topic = INTERVIEW_TOPICS.find((t) => t.id === id);
    return !topic?.optional;
  });

  if (nonOptional.length === 0) return null;

  // Sort by priority (lower number = higher priority)
  const sorted = [...nonOptional].sort((a, b) => {
    const topicA = INTERVIEW_TOPICS.find((t) => t.id === a);
    const topicB = INTERVIEW_TOPICS.find((t) => t.id === b);
    return (topicA?.priority ?? 99) - (topicB?.priority ?? 99);
  });

  return sorted[0] ?? null;
}

/**
 * Validate a single topic.
 *
 * @param memory - The conversation memory
 * @param topicId - The canonical topic id
 * @returns The topic validation, or null if topic not found
 */
export function validateTopic(
  memory: ConversationMemory,
  topicId: string,
): TopicValidation | null {
  const result = validateTopics(memory);
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
  const validation = validateTopic(memory, topicId);
  return validation?.isComplete ?? false;
}

/**
 * Get a human-readable summary of topic validation.
 *
 * @param memory - The conversation memory
 * @returns A formatted summary string
 */
export function summarizeValidation(memory: ConversationMemory): string {
  const result = validateTopics(memory);
  const lines: string[] = [];

  lines.push("=== Topic Validation Summary ===");
  lines.push(`Overall: ${result.overall}% (${result.completeTopics.length}/${result.topics.length} topics)`);
  lines.push("");

  for (const topic of result.topics) {
    const icon = topic.isComplete ? "✅" : topic.hasAnyAnswer ? "⏳" : "⬜";
    lines.push(`  ${icon} ${topic.topicId}: ${topic.reason}`);
  }

  if (result.nextIncompleteTopic) {
    lines.push("");
    lines.push(`Next topic to ask: ${result.nextIncompleteTopic}`);
  }

  return lines.join("\n");
}
