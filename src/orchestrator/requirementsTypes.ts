// ──────────────────────────────────────────────
// requirementsTypes — output types for the
// Requirements Builder (Epic 22.3)
// ──────────────────────────────────────────────

import type { ConfidenceLevel } from "../models/conversationMemory";

/**
 * A partial ProjectRequirements update.
 * Only fields that actually changed are present.
 */
export interface RequirementsUpdate {
  vision?: string;
  projectName?: string;
  goals?: string[];
  targetUsers?: string[];
  problems?: string[];
  solutionIdeas?: string[];
  mvpScope?: string;
  integrations?: string[];
  constraints?: string[];
  preferredTech?: string[];
  aiWorkflowTarget?: string;
  risks?: string[];
  unknowns?: string[];
  confidence?: ConfidenceLevel;
}

/**
 * A field that is missing or incomplete in the requirements.
 */
export interface MissingField {
  /** The field name (e.g. "vision", "goals") */
  field: string;
  /** Human-readable reason why it's considered missing */
  reason: string;
}

/**
 * A generated open question to ask the user.
 */
export interface OpenQuestion {
  /** The field this question targets */
  targetField: string;
  /** The question text */
  question: string;
}

/**
 * Describes how the overall confidence changed.
 */
export interface ConfidenceChange {
  direction: "up" | "down" | "unchanged";
  reason: string;
}

/**
 * The complete result of a requirements build.
 */
export interface RequirementsBuildResult {
  /** The partial update to apply to ProjectRequirements */
  update: RequirementsUpdate;
  /** Fields that are still missing or incomplete */
  missingFields: MissingField[];
  /** Questions to ask the user to fill gaps */
  openQuestions: OpenQuestion[];
  /** How confidence changed based on the conversation */
  confidenceChange: ConfidenceChange;
}
