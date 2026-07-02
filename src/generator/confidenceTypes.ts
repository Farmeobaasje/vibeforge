// ──────────────────────────────────────────────
// confidenceTypes — Epic 25.2
// Per-field confidence scoring types for
// AI-powered ProjectDefinition generation.
//
// Enables field-level confidence tracking so
// the Resolution Pipeline can make intelligent
// decisions about which values to keep from AI
// vs. deterministic fallback.
// ──────────────────────────────────────────────

/**
 * A dot-notation path to a field in the ProjectDefinition.
 * Examples: "project.name", "roadmap.phases", "tech.languages"
 */
export type FieldPath = string;

/**
 * A single confidence entry for one field.
 */
export interface ConfidenceEntry {
  /** The field path (dot-notation) */
  field: FieldPath;
  /** Confidence score 0-1 */
  value: number;
  /** Optional rationale for this confidence level */
  rationale?: string;
}

/**
 * Per-field confidence scores for a generated ProjectDefinition.
 *
 * Tracks confidence at three levels:
 * - overall: aggregate confidence across all fields (0-100)
 * - fields: per-field confidence (0-1)
 * - sections: per-section aggregate confidence (0-1)
 */
export interface PerFieldConfidence {
  /** Aggregate confidence across all fields (0-100) */
  overall: number;
  /** Per-field confidence scores (0-1) */
  fields: Record<FieldPath, number>;
  /** Per-section aggregate confidence (0-1) */
  sections: Record<string, number>;
}

/**
 * Build an empty PerFieldConfidence with all scores at 0.
 */
export function emptyConfidence(): PerFieldConfidence {
  return {
    overall: 0,
    fields: {},
    sections: {},
  };
}

/**
 * Calculate the overall confidence from per-field scores.
 * Uses weighted average — each section contributes equally.
 */
export function calculateOverallConfidence(
  fields: Record<FieldPath, number>,
): number {
  const values = Object.values(fields);
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 100);
}

/**
 * Aggregate per-field scores into section-level scores.
 * Sections are the first segment of the dot-notation path.
 */
export function aggregateSectionConfidence(
  fields: Record<FieldPath, number>,
): Record<string, number> {
  const sections: Record<string, number[]> = {};

  for (const [path, score] of Object.entries(fields)) {
    const section = path.split(".")[0];
    if (!sections[section]) sections[section] = [];
    sections[section].push(score);
  }

  const result: Record<string, number> = {};
  for (const [section, scores] of Object.entries(sections)) {
    result[section] =
      scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
  return result;
}
