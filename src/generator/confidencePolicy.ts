// ──────────────────────────────────────────────
// confidencePolicy — Epic 25.2
// Model-aware confidence thresholds for
// AI-powered ProjectDefinition generation.
//
// Defines how the Resolution Pipeline should
// interpret per-field confidence scores based
// on the model being used and the desired
// conservatism level.
// ──────────────────────────────────────────────

import type { GeneratorConfig } from "./generatorTypes";

// ── Policy Names ──────────────────────────────

/**
 * Named confidence policies.
 * - "balanced": Default. Moderate trust in AI output.
 * - "strict": Conservative. High bar for AI values.
 * - "experimental": Permissive. Low bar for AI values.
 */
export type ConfidencePolicyName = "balanced" | "strict" | "experimental";

// ── Policy Definition ─────────────────────────

/**
 * A confidence policy defines thresholds for
 * interpreting per-field confidence scores.
 */
export interface ConfidencePolicy {
  /** Policy name */
  name: ConfidencePolicyName;
  /**
   * Confidence threshold above which the AI value
   * is accepted directly (0-1).
   */
  high: number;
  /**
   * Confidence threshold below which the AI value
   * is replaced with deterministic fallback (0-1).
   */
  low: number;
  /**
   * Minimum acceptable overall confidence (0-1).
   * If overall confidence falls below this, a
   * prominent warning is added to the output.
   */
  minimum: number;
}

// ── Built-in Policies ─────────────────────────

export const CONFIDENCE_POLICIES: Record<ConfidencePolicyName, ConfidencePolicy> = {
  balanced: {
    name: "balanced",
    high: 0.7,
    low: 0.3,
    minimum: 0.5,
  },
  strict: {
    name: "strict",
    high: 0.85,
    low: 0.5,
    minimum: 0.7,
  },
  experimental: {
    name: "experimental",
    high: 0.5,
    low: 0.15,
    minimum: 0.3,
  },
};

// ── Model-Aware Defaults ──────────────────────

/**
 * Known models and their recommended default policy.
 * Unknown models default to "balanced".
 */
const MODEL_POLICY_MAP: Record<string, ConfidencePolicyName> = {
  // Claude models
  "claude-sonnet-4-20250514": "balanced",
  "claude-sonnet-4": "balanced",
  "claude-opus-4": "balanced",
  "claude-3.5-sonnet": "balanced",
  "claude-3-haiku": "strict",
  "claude-haiku-3.5": "strict",

  // GPT models
  "gpt-4o": "balanced",
  "gpt-4o-mini": "strict",
  "gpt-4-turbo": "balanced",
  "gpt-3.5-turbo": "strict",

  // DeepSeek
  "deepseek-v3": "strict",
  "deepseek-coder": "strict",

  // Gemini
  "gemini-2.5-pro": "balanced",
  "gemini-2.0-flash": "strict",

  // Local / open models
  "llama-3": "experimental",
  "mistral": "experimental",
  "codestral": "experimental",
};

/**
 * Resolve the confidence policy to use for a given
 * generator configuration and model.
 *
 * Resolution order:
 * 1. Use explicit policy from config.confidencePolicy
 * 2. Fall back to model-aware default
 * 3. Fall back to "balanced"
 *
 * @param config - Generator configuration (may include confidencePolicy)
 * @param model - Optional model identifier
 * @returns The resolved ConfidencePolicy
 */
export function resolvePolicy(
  config: GeneratorConfig,
  model?: string,
): ConfidencePolicy {
  // 1. Explicit policy from config
  if (config.confidencePolicy) {
    return CONFIDENCE_POLICIES[config.confidencePolicy];
  }

  // 2. Model-aware default
  if (model) {
    const normalizedModel = model.toLowerCase().trim();
    // Try exact match first
    if (MODEL_POLICY_MAP[normalizedModel]) {
      return CONFIDENCE_POLICIES[MODEL_POLICY_MAP[normalizedModel]];
    }
    // Try prefix match (e.g., "claude-sonnet-4-20250514" matches "claude-sonnet-4")
    for (const [key, policy] of Object.entries(MODEL_POLICY_MAP)) {
      if (normalizedModel.startsWith(key)) {
        return CONFIDENCE_POLICIES[policy];
      }
    }
  }

  // 3. Default to balanced
  return CONFIDENCE_POLICIES.balanced;
}

/**
 * Get the recommended policy name for a model.
 * Returns undefined for unknown models.
 */
export function getRecommendedPolicyForModel(
  model: string,
): ConfidencePolicyName | undefined {
  const normalized = model.toLowerCase().trim();
  if (MODEL_POLICY_MAP[normalized]) return MODEL_POLICY_MAP[normalized];
  for (const [key, policy] of Object.entries(MODEL_POLICY_MAP)) {
    if (normalized.startsWith(key)) return policy;
  }
  return undefined;
}
