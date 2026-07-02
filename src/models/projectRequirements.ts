// ──────────────────────────────────────────────
// ProjectRequirements — raw project input state
// ──────────────────────────────────────────────

import type { RepositoryState } from "../types/projectDefinition";
import type { ConfidenceLevel } from "./conversationMemory";

// Re-export so consumers can import everything from this module
export type { RepositoryState, ConfidenceLevel };

export interface ProjectRequirements {
  /** Unique identifier */
  id: string;
  /** When the requirements were first created */
  createdAt: string; // ISO timestamp
  /** When the requirements were last updated */
  updatedAt: string; // ISO timestamp

  // ── Raw input fields ────────────────────────

  /** The high-level vision for the project */
  vision: string;
  /** Explicit project name (if provided by user) */
  projectName: string;
  /** Specific goals the project should achieve */
  goals: string[];
  /** Who the project is for */
  targetUsers: string[];
  /** Problems the project aims to solve */
  problems: string[];
  /** Brainstormed solution ideas */
  solutionIdeas: string[];
  /** Scope of the minimum viable product */
  mvpScope: string;
  /** External integrations or services needed */
  integrations: string[];
  /** Hard constraints (time, budget, platform, etc.) */
  constraints: string[];
  /** Preferred technology choices */
  preferredTech: string[];
  /** Target AI workflow (e.g. "Cline", "Cursor", "Claude Code") */
  aiWorkflowTarget: string;
  /** Current state of the repository */
  repositoryState: RepositoryState;
  /** Identified risks */
  risks: string[];
  /** Open unknowns that need research */
  unknowns: string[];
  /** Overall confidence in the requirements */
  confidence: ConfidenceLevel;
}

// ── Default ──────────────────────────────────

export function createEmptyProjectRequirements(): ProjectRequirements {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    vision: "",
    projectName: "",
    goals: [],
    targetUsers: [],
    problems: [],
    solutionIdeas: [],
    mvpScope: "",
    integrations: [],
    constraints: [],
    preferredTech: [],
    aiWorkflowTarget: "",
    repositoryState: "greenfield",
    risks: [],
    unknowns: [],
    confidence: "low",
  };
}
