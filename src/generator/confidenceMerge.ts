// ──────────────────────────────────────────────
// confidenceMerge — Epic 25.2
// Pipeline stage: Confidence Merge
//
// Merges AI-generated values with deterministic
// fallback values based on per-field confidence
// scores and the active ConfidencePolicy.
//
// For each field:
//   AI confidence > policy.high → Use AI value
//   AI confidence < policy.low  → Use deterministic value
//   AI value is empty/default   → Use deterministic value
//   Otherwise                   → Use AI value with warning
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { PerFieldConfidence } from "./confidenceTypes";
import type { ConfidencePolicy } from "./confidencePolicy";
import type { GeneratorWarning } from "./generatorTypes";

/**
 * Result of the confidence merge stage.
 */
export interface ConfidenceMergeResult {
  /** The merged ProjectDefinition */
  projectDefinition: ProjectDefinition;
  /** Updated confidence scores after merge */
  confidence: PerFieldConfidence;
  /** Warnings generated during merge */
  warnings: GeneratorWarning[];
}

/**
 * Merge AI-generated values with deterministic fallback
 * based on per-field confidence and policy.
 *
 * @param aiValue - The AI-generated ProjectDefinition
 * @param deterministicValue - The deterministic fallback ProjectDefinition
 * @param confidence - Per-field confidence from AI
 * @param policy - The active confidence policy
 * @returns Merged result
 */
export function confidenceMerge(
  aiValue: ProjectDefinition,
  deterministicValue: ProjectDefinition,
  confidence: PerFieldConfidence,
  policy: ConfidencePolicy,
): ConfidenceMergeResult {
  const warnings: GeneratorWarning[] = [];
  const merged = JSON.parse(JSON.stringify(deterministicValue)) as ProjectDefinition;
  const updatedFields = { ...confidence.fields };

  // Merge each section field by field
  mergeSection(
    "project",
    aiValue.project as unknown as Record<string, unknown>,
    deterministicValue.project as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "project",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "product",
    aiValue.product as unknown as Record<string, unknown>,
    deterministicValue.product as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "product",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "tech",
    aiValue.tech as unknown as Record<string, unknown>,
    deterministicValue.tech as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "tech",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "architecture",
    aiValue.architecture as unknown as Record<string, unknown>,
    deterministicValue.architecture as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "architecture",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "roadmap",
    aiValue.roadmap as unknown as Record<string, unknown>,
    deterministicValue.roadmap as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "roadmap",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "memory",
    aiValue.memory as unknown as Record<string, unknown>,
    deterministicValue.memory as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "memory",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "agents",
    aiValue.agents as unknown as Record<string, unknown>,
    deterministicValue.agents as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "agents",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "quality",
    aiValue.quality as unknown as Record<string, unknown>,
    deterministicValue.quality as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "quality",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  mergeSection(
    "options",
    aiValue.options as unknown as Record<string, unknown>,
    deterministicValue.options as unknown as Record<string, unknown>,
    merged as unknown as Record<string, unknown>,
    "options",
    confidence,
    policy,
    updatedFields,
    warnings,
  );

  // Recalculate overall confidence
  const fieldValues = Object.values(updatedFields);
  const overall =
    fieldValues.length > 0
      ? Math.round(
          (fieldValues.reduce((sum, v) => sum + v, 0) /
            fieldValues.length) *
            100,
        )
      : 0;

  return {
    projectDefinition: merged,
    confidence: {
      overall,
      fields: updatedFields,
      sections: confidence.sections,
    },
    warnings,
  };
}

/**
 * Merge a single section field by field.
 */
function mergeSection(
  sectionName: string,
  aiSection: Record<string, unknown>,
  deterministicSection: Record<string, unknown>,
  target: Record<string, unknown>,
  prefix: string,
  confidence: PerFieldConfidence,
  policy: ConfidencePolicy,
  updatedFields: Record<string, number>,
  warnings: GeneratorWarning[],
): void {
  const targetSection = target[sectionName] as Record<string, unknown>;
  if (!targetSection) return;

  for (const [key, aiVal] of Object.entries(aiSection)) {
    const fieldPath = `${prefix}.${key}`;
    const detVal = deterministicSection[key];
    const fieldConfidence = confidence.fields[fieldPath] ?? 0.5;

    const decision = decideFieldMerge(
      aiVal,
      detVal,
      fieldConfidence,
      policy,
    );

    switch (decision) {
      case "use-ai":
        targetSection[key] = aiVal;
        updatedFields[fieldPath] = fieldConfidence;
        break;

      case "use-deterministic":
        targetSection[key] = detVal;
        updatedFields[fieldPath] = Math.min(fieldConfidence, 0.3);
        warnings.push({
          field: fieldPath,
          severity: "info",
          message: `AI confidence too low (${fieldConfidence}). Using deterministic fallback.`,
        });
        break;

      case "use-ai-with-warning":
        targetSection[key] = aiVal;
        updatedFields[fieldPath] = fieldConfidence;
        warnings.push({
          field: fieldPath,
          severity: "warning",
          message: `AI confidence moderate (${fieldConfidence}). Value accepted but should be reviewed.`,
        });
        break;
    }
  }
}

/**
 * Decide whether to use AI value, deterministic value, or AI with warning.
 */
function decideFieldMerge(
  aiValue: unknown,
  _deterministicValue: unknown,
  confidence: number,
  policy: ConfidencePolicy,
): "use-ai" | "use-deterministic" | "use-ai-with-warning" {
  // If AI value is empty/null/default, use deterministic
  if (isDefaultOrEmpty(aiValue)) {
    return "use-deterministic";
  }

  // High confidence → use AI
  if (confidence >= policy.high) {
    return "use-ai";
  }

  // Low confidence → use deterministic
  if (confidence < policy.low) {
    return "use-deterministic";
  }

  // Moderate confidence → use AI with warning
  return "use-ai-with-warning";
}

/**
 * Check if a value is empty, null, or a default.
 */
function isDefaultOrEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim().length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
}
