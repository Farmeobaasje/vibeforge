// ──────────────────────────────────────────────
// assumptionManager — manages assumptions made
// during the interview process
// ──────────────────────────────────────────────

import type {
  ConversationMemory,
  Assumption,
  Decision,
  ConfidenceLevel,
} from "../models/conversationMemory";

// ── Types ─────────────────────────────────────

export interface AssumptionInput {
  /** Description of what is being assumed */
  description: string;
  /** How confident we are in this assumption */
  confidence: ConfidenceLevel;
  /** The topic this assumption relates to */
  topic: string;
}

export interface AssumptionCheckResult {
  /** Whether a new assumption was created */
  assumptionCreated: boolean;
  /** The assumption that was created, or null */
  assumption: Assumption | null;
  /** Whether an existing assumption was resolved */
  assumptionResolved: boolean;
  /** The decision that replaced the assumption, or null */
  decision: Decision | null;
  /** Human-readable explanation */
  explanation: string;
}

// ── Default assumptions per topic ─────────────
// Conservative: only make assumptions when there's
// a reasonable default that most projects use.

interface DefaultAssumption {
  topic: string;
  description: string;
  confidence: ConfidenceLevel;
}

const DEFAULT_ASSUMPTIONS: DefaultAssumption[] = [
  {
    topic: "tech-stack",
    description: "TypeScript as the primary language",
    confidence: "medium",
  },
  {
    topic: "tech-stack",
    description: "Git for version control",
    confidence: "high",
  },
  {
    topic: "tech-stack",
    description: "npm or yarn for package management",
    confidence: "high",
  },
  {
    topic: "constraints",
    description: "The project will be developed incrementally with iterative releases",
    confidence: "medium",
  },
  {
    topic: "ai-workflow",
    description: "Cline as the primary AI coding assistant",
    confidence: "low",
  },
];

// ── Manager ───────────────────────────────────

/**
 * Check if a default assumption should be created for a topic.
 *
 * Only creates an assumption if:
 * 1. The topic has no answered questions in the conversation
 * 2. No similar assumption already exists
 * 3. A default assumption is defined for this topic
 *
 * @param memory - The current conversation memory
 * @param topic - The topic to check
 * @returns The result of the assumption check
 */
export function checkDefaultAssumption(
  memory: ConversationMemory,
  topic: string,
): AssumptionCheckResult {
  // ── Check if topic already has answered questions ──
  const hasAnswers = memory.questions.some(
    (q) => q.topic === topic && !q.skipped && q.answer.trim().length > 0,
  );

  if (hasAnswers) {
    return {
      assumptionCreated: false,
      assumption: null,
      assumptionResolved: false,
      decision: null,
      explanation: `Topic "${topic}" already has answers — no assumption needed.`,
    };
  }

  // ── Find matching default assumption ──
  const defaultAssumption = DEFAULT_ASSUMPTIONS.find(
    (da) => da.topic === topic,
  );

  if (!defaultAssumption) {
    return {
      assumptionCreated: false,
      assumption: null,
      assumptionResolved: false,
      decision: null,
      explanation: `No default assumption defined for topic "${topic}".`,
    };
  }

  // ── Check if a similar assumption already exists ──
  const existingAssumption = memory.assumptions.find(
    (a) =>
      a.description.toLowerCase() ===
        defaultAssumption.description.toLowerCase() && !a.validated,
  );

  if (existingAssumption) {
    return {
      assumptionCreated: false,
      assumption: existingAssumption,
      assumptionResolved: false,
      decision: null,
      explanation: `Assumption already exists: "${existingAssumption.description}".`,
    };
  }

  // ── Create the assumption ──
  const now = new Date().toISOString();
  const assumption: Assumption = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description: defaultAssumption.description,
    confidence: defaultAssumption.confidence,
    validated: false,
    createdAt: now,
  };

  return {
    assumptionCreated: true,
    assumption,
    assumptionResolved: false,
    decision: null,
    explanation: `Created assumption: "${assumption.description}" (confidence: ${assumption.confidence}). Waiting for user confirmation.`,
  };
}

/**
 * Process a user answer that may confirm or contradict an existing assumption.
 *
 * If the answer clearly contradicts an assumption:
 * - The assumption is marked as validated (resolved)
 * - A new Decision is created with the user's actual choice
 *
 * If the answer confirms an assumption:
 * - The assumption is marked as validated
 * - No decision is created (the assumption was correct)
 *
 * @param memory - The current conversation memory
 * @param topic - The topic of the answer
 * @param answer - The user's answer text
 * @returns The result of processing
 */
export function processAnswerAgainstAssumptions(
  memory: ConversationMemory,
  topic: string,
  answer: string,
): AssumptionCheckResult {
  const answerLower = answer.toLowerCase();

  // Find unvalidated assumptions for this topic
  const relevantAssumptions = memory.assumptions.filter(
    (a) => !a.validated && isAssumptionRelevantToTopic(a, topic),
  );

  if (relevantAssumptions.length === 0) {
    return {
      assumptionCreated: false,
      assumption: null,
      assumptionResolved: false,
      decision: null,
      explanation: `No unvalidated assumptions for topic "${topic}".`,
    };
  }

  // Check each assumption for contradiction or confirmation
  for (const assumption of relevantAssumptions) {
    const assumptionLower = assumption.description.toLowerCase();

    // Check for contradiction: answer mentions something different
    const contradiction = detectContradiction(assumptionLower, answerLower);

    if (contradiction) {
      // Create a decision to replace the assumption
      const now = new Date().toISOString();
      const decision: Decision = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        description: answer.trim(),
        rationale: `User explicitly stated "${answer.trim()}", which differs from the assumption "${assumption.description}".`,
        alternatives: [assumption.description],
        createdAt: now,
      };

      return {
        assumptionCreated: false,
        assumption,
        assumptionResolved: true,
        decision,
        explanation: `Assumption "${assumption.description}" contradicted by user. Created decision: "${answer.trim()}".`,
      };
    }

    // Check for confirmation: answer aligns with assumption
    const confirmation = detectConfirmation(assumptionLower, answerLower);

    if (confirmation) {
      return {
        assumptionCreated: false,
        assumption,
        assumptionResolved: true,
        decision: null,
        explanation: `Assumption "${assumption.description}" confirmed by user.`,
      };
    }
  }

  return {
    assumptionCreated: false,
    assumption: null,
    assumptionResolved: false,
    decision: null,
    explanation: `No clear contradiction or confirmation found for topic "${topic}".`,
  };
}

// ── Helpers ───────────────────────────────────

/**
 * Check if an assumption is relevant to a topic based on keywords.
 */
function isAssumptionRelevantToTopic(
  assumption: Assumption,
  topic: string,
): boolean {
  const topicKeywords: Record<string, string[]> = {
    "tech-stack": ["typescript", "javascript", "language", "framework", "version control", "git", "package"],
    "constraints": ["incremental", "iterative", "release", "agile"],
    "ai-workflow": ["cline", "cursor", "copilot", "ai", "assistant"],
  };

  const keywords = topicKeywords[topic];
  if (!keywords) return false;

  const desc = assumption.description.toLowerCase();
  return keywords.some((kw) => desc.includes(kw));
}

/**
 * Detect if an answer contradicts an assumption.
 * Returns true if the answer mentions something clearly different.
 */
function detectContradiction(
  assumptionLower: string,
  answerLower: string,
): boolean {
  // If the answer explicitly mentions a technology that differs
  const techMentions = [
    { assumption: "typescript", alternatives: ["javascript", "python", "java", "go", "rust", "c#", "php"] },
    { assumption: "git", alternatives: ["svn", "mercurial", "perforce"] },
    { assumption: "npm", alternatives: ["pnpm", "yarn", "bun"] },
    { assumption: "cline", alternatives: ["cursor", "copilot", "codeium", "tabnine"] },
  ];

  for (const mention of techMentions) {
    if (assumptionLower.includes(mention.assumption)) {
      // Check if the answer mentions an alternative
      const hasAlternative = mention.alternatives.some((alt) =>
        answerLower.includes(alt),
      );
      if (hasAlternative) return true;
    }
  }

  return false;
}

/**
 * Detect if an answer confirms an assumption.
 * Returns true if the answer aligns with the assumption.
 */
function detectConfirmation(
  assumptionLower: string,
  answerLower: string,
): boolean {
  // Direct mention of the assumption keyword
  const keywords = assumptionLower.split(" ");
  const directMatch = keywords.some(
    (kw) => kw.length > 3 && answerLower.includes(kw),
  );

  if (directMatch) return true;

  // Affirmative language near assumption keywords
  const affirmatives = ["yes", "yeah", "sure", "correct", "right", "agree", "ok", "okay"];
  const hasAffirmative = affirmatives.some((a) => answerLower.includes(a));

  if (hasAffirmative) {
    const assumptionKeywords = assumptionLower.split(" ").filter((kw) => kw.length > 3);
    const hasKeyword = assumptionKeywords.some((kw) => answerLower.includes(kw));
    if (hasKeyword) return true;
  }

  return false;
}
