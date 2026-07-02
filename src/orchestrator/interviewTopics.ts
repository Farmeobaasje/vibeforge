// ──────────────────────────────────────────────
// interviewTopics — single source of truth for
// all interview topic definitions
// ──────────────────────────────────────────────

export interface InterviewTopic {
  /** Canonical kebab-case id used in state machine, planner, and memory.questions[].topic */
  id: string;
  /** Human-readable display label */
  label: string;
  /** Field name on ProjectRequirements / RequirementsUpdate (camelCase) */
  requirementField: string;
  /** Priority (1 = highest). Lower number = higher priority. */
  priority: number;
  /** Default question text to ask for this topic */
  question: string;
  /** Human-readable reason shown when this field is missing */
  missingReason: string;
  /** If true, this topic is optional and will not block interview progress */
  optional?: boolean;
}

export const INTERVIEW_TOPICS: readonly InterviewTopic[] = [
  {
    id: "vision",
    label: "Vision",
    requirementField: "vision",
    priority: 1,
    question: "What is the high-level vision for this project?",
    missingReason: "Vision has not been provided yet.",
  },
  {
    id: "project-name",
    label: "Project Name",
    requirementField: "projectName",
    priority: 1.5,
    question: "What should we call this project?",
    missingReason: "Project name has not been specified yet.",
    optional: true,
  },
  {
    id: "target-users",
    label: "Users",
    requirementField: "targetUsers",
    priority: 2,
    question: "Who is the target audience or end users?",
    missingReason: "Target users have not been specified yet.",
  },
  {
    id: "problems",
    label: "Problem",
    requirementField: "problems",
    priority: 3,
    question: "What problems does this project aim to solve?",
    missingReason: "Problems have not been specified yet.",
  },
  {
    id: "goals",
    label: "Goals",
    requirementField: "goals",
    priority: 4,
    question: "What specific goals should this project achieve?",
    missingReason: "Goals have not been specified yet.",
  },
  {
    id: "solution",
    label: "Solution",
    requirementField: "solutionIdeas",
    priority: 5,
    question: "Do you have any initial solution ideas or approaches?",
    missingReason: "Solution ideas have not been specified yet.",
  },
  {
    id: "mvp",
    label: "MVP Scope",
    requirementField: "mvpScope",
    priority: 6,
    question: "What would you consider the minimum viable product scope?",
    missingReason: "MVP scope has not been provided yet.",
  },
  {
    id: "tech-stack",
    label: "Tech Stack",
    requirementField: "preferredTech",
    priority: 7,
    question: "Do you have any preferred technologies, languages, or frameworks?",
    missingReason: "Preferred tech has not been specified yet.",
  },
  {
    id: "integrations",
    label: "Integrations",
    requirementField: "integrations",
    priority: 8,
    question: "Are there any external services or APIs this project needs to integrate with?",
    missingReason: "Integrations have not been specified yet.",
  },
  {
    id: "constraints",
    label: "Constraints",
    requirementField: "constraints",
    priority: 9,
    question: "Are there any hard constraints (time, budget, platform, etc.)?",
    missingReason: "Constraints have not been specified yet.",
  },
  {
    id: "risks",
    label: "Risks",
    requirementField: "risks",
    priority: 10,
    question: "What risks or concerns do you foresee?",
    missingReason: "Risks have not been specified yet.",
  },
  {
    id: "ai-workflow",
    label: "AI Workflow",
    requirementField: "aiWorkflowTarget",
    priority: 11,
    question: "Which AI coding workflow are you targeting (e.g. Cline, Cursor, Claude Code)?",
    missingReason: "AI workflow target has not been provided yet.",
  },
] as const;

// ── Lookup helpers ────────────────────────────

/** Get a topic definition by its canonical id. */
export function getTopicById(id: string): InterviewTopic | undefined {
  return INTERVIEW_TOPICS.find((t) => t.id === id);
}

/** Get a topic definition by its requirementField name. */
export function getTopicByField(field: string): InterviewTopic | undefined {
  return INTERVIEW_TOPICS.find((t) => t.requirementField === field);
}

/** Get the canonical id for a requirementField name. */
export function fieldToTopicId(field: string): string | undefined {
  return getTopicByField(field)?.id;
}

/** Get the requirementField name for a canonical id. */
export function topicIdToField(id: string): string | undefined {
  return getTopicById(id)?.requirementField;
}

/** Get the display label for a canonical id. */
export function topicLabel(id: string): string {
  return getTopicById(id)?.label ?? id;
}

/** Get the default question for a canonical id. */
export function topicQuestion(id: string): string | undefined {
  return getTopicById(id)?.question;
}

/** Get the priority for a canonical id (defaults to 99). */
export function topicPriority(id: string): number {
  return getTopicById(id)?.priority ?? 99;
}

/** Get all canonical topic ids in priority order. */
export function getAllTopicIds(): string[] {
  return INTERVIEW_TOPICS.map((t) => t.id);
}

/** Get all requirementField names. */
export function getAllRequirementFields(): string[] {
  return INTERVIEW_TOPICS.map((t) => t.requirementField);
}

/** Total number of tracked topics (including optional). */
export const TOTAL_TOPICS = INTERVIEW_TOPICS.length;

/**
 * Get only the required (non-optional) interview topics.
 * Optional topics like "project-name" are excluded.
 * This is the single source of truth for progress/completion counts.
 */
export function getRequiredInterviewTopics(): readonly InterviewTopic[] {
  return INTERVIEW_TOPICS.filter((t) => !t.optional);
}

/** Get all required (non-optional) topic ids. */
export function getRequiredTopicIds(): string[] {
  return getRequiredInterviewTopics().map((t) => t.id);
}

/** Number of required (non-optional) topics. */
export const REQUIRED_TOPIC_COUNT = getRequiredInterviewTopics().length;
