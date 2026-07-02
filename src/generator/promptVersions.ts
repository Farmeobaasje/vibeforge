// ──────────────────────────────────────────────
// promptVersions — Epic 25.2
// Version tracking for prompts, generator, and
// output schema. Provides a changelog and
// version constants used throughout the system.
// ──────────────────────────────────────────────

/**
 * Current prompt version.
 * Increment when prompt blocks change in a way
 * that affects LLM output quality.
 */
export const PROMPT_VERSION = "2.0.0";

/**
 * Current generator version.
 * Increment when the generator implementation changes.
 */
export const GENERATOR_VERSION = "2.0.0";

/**
 * Current output schema version.
 * Increment when the ProjectDefinition schema changes.
 */
export const SCHEMA_VERSION = "1.0.0";

/**
 * A changelog entry for a prompt version.
 */
export interface PromptChangelogEntry {
  /** Semantic version of the prompt */
  version: string;
  /** Date of the change (ISO format) */
  date: string;
  /** List of changes in this version */
  changes: string[];
}

/**
 * Changelog of prompt versions.
 * Newest entries first.
 */
export const PROMPT_CHANGELOG: PromptChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "2026-06-30",
    changes: [
      "Initial AI-powered prompt architecture",
      "Modular PromptBlockRegistry with token budgeting",
      "AI Contract for hallucination prevention",
      "Per-field confidence scoring via _confidence meta-field",
      "ConfidencePolicy for model-aware thresholds",
      "Resolution Pipeline with Normalization → Merge → Resolvers → Validation",
      "Few-shot examples for weaker models",
      "User notes override support",
    ],
  },
];

/**
 * Get the latest changelog entry.
 */
export function getLatestChangelog(): PromptChangelogEntry | undefined {
  return PROMPT_CHANGELOG[0];
}

/**
 * Get all changes for a specific version.
 */
export function getChangesForVersion(
  version: string,
): PromptChangelogEntry | undefined {
  return PROMPT_CHANGELOG.find((entry) => entry.version === version);
}
