// ──────────────────────────────────────────────
// aiFallback — Epic 25.2
// Fallback chain for AI-powered generation.
//
// When AI generation fails, the fallback chain
// tries progressively more conservative strategies:
//   1. Retry with higher temperature
//   2. Retry with compressed context
//   3. Retry with few-shot examples
//   4. Fallback to deterministic generator
//   5. Partial recovery (parse partial JSON)
// ──────────────────────────────────────────────

import type {
  GeneratorInput,
  GeneratorResult,
  GeneratorConfig,
} from "./generatorTypes";
import type { ProjectDefinition } from "../types/projectDefinition";
import { defaultProjectDefinition } from "../types/projectDefinition";
import { DeterministicGenerator } from "./deterministicGenerator";
import { DEFAULT_GENERATOR_CONFIG } from "./generatorTypes";

/**
 * Types of AI generation errors.
 */
export type AIGenerationErrorType =
  | "invalid-json"
  | "empty-response"
  | "timeout"
  | "api-error"
  | "rate-limited"
  | "context-too-large"
  | "unknown";

/**
 * Wrapper for AI generation errors.
 */
export class AIGenerationError extends Error {
  type: AIGenerationErrorType;
  rawOutput?: string;
  partialJson?: Record<string, unknown>;

  constructor(
    type: AIGenerationErrorType,
    message: string,
    rawOutput?: string,
    partialJson?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AIGenerationError";
    this.type = type;
    this.rawOutput = rawOutput;
    this.partialJson = partialJson;
  }
}

/**
 * A fallback strategy that can handle a specific error type.
 */
export interface FallbackStrategy {
  /** Name of this strategy */
  name: string;
  /** Check if this strategy can handle the error */
  canHandle(error: AIGenerationError): boolean;
  /**
   * Execute this strategy.
   * Returns a GeneratorResult or throws if it can't recover.
   */
  execute(
    input: GeneratorInput,
    config: GeneratorConfig,
  ): Promise<GeneratorResult>;
}

// ── Fallback Strategies ───────────────────────

/**
 * Retry with a higher temperature to get more varied output.
 */
export class RetryWithHigherTemperature implements FallbackStrategy {
  name = "retry-with-higher-temperature";

  canHandle(error: AIGenerationError): boolean {
    return (
      error.type === "invalid-json" ||
      error.type === "empty-response" ||
      error.type === "unknown"
    );
  }

  async execute(
    _input: GeneratorInput,
    _config: GeneratorConfig,
  ): Promise<GeneratorResult> {
    // This would call the AIGenerator again — in practice this is
    // handled by the AIGenerator's retry logic. This strategy exists
    // to document the approach.
    throw new AIGenerationError(
      "unknown",
      "RetryWithHigherTemperature should be handled by AIGenerator retry logic.",
    );
  }
}

/**
 * Retry with compressed context (remove few-shot examples, truncate fields).
 */
export class RetryWithCompressedContext implements FallbackStrategy {
  name = "retry-with-compressed-context";

  canHandle(error: AIGenerationError): boolean {
    return (
      error.type === "context-too-large" ||
      error.type === "timeout"
    );
  }

  async execute(
    _input: GeneratorInput,
    _config: GeneratorConfig,
  ): Promise<GeneratorResult> {
    throw new AIGenerationError(
      "unknown",
      "RetryWithCompressedContext should be handled by AIGenerator retry logic.",
    );
  }
}

/**
 * Fallback to the deterministic generator.
 */
export class FallbackToDeterministic implements FallbackStrategy {
  name = "fallback-to-deterministic";
  private generator: DeterministicGenerator;

  constructor() {
    this.generator = new DeterministicGenerator();
  }

  canHandle(_error: AIGenerationError): boolean {
    // Can handle any error type as last resort
    return true;
  }

  async execute(
    input: GeneratorInput,
    config: GeneratorConfig,
  ): Promise<GeneratorResult> {
    return this.generator.generate(input, {
      ...DEFAULT_GENERATOR_CONFIG,
      strategy: "deterministic",
      generateDocuments: config.generateDocuments,
      includeBootstrapPrompt: config.includeBootstrapPrompt,
    });
  }
}

/**
 * Partial recovery — parse partial JSON from the LLM output
 * and fill the rest from defaults.
 */
export class PartialRecovery implements FallbackStrategy {
  name = "partial-recovery";
  private capturedError: AIGenerationError | null = null;

  canHandle(error: AIGenerationError): boolean {
    this.capturedError = error;
    return (
      error.type === "invalid-json" &&
      error.partialJson !== undefined &&
      error.partialJson !== null
    );
  }

  async execute(
    _input: GeneratorInput,
    _config: GeneratorConfig,
  ): Promise<GeneratorResult> {
    const err = this.capturedError;
    if (!err || !err.partialJson) {
      throw new AIGenerationError(
        "unknown",
        "PartialRecovery.execute() called without a valid error.",
      );
    }
    const partial = err.partialJson;

    // Merge partial JSON with defaults
    const merged: ProjectDefinition = {
      ...JSON.parse(JSON.stringify(defaultProjectDefinition)),
      ...partial,
    };

    return {
      projectDefinition: merged,
      documents: [],
      metadata: {
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
        strategy: "hybrid",
        generatorVersion: "2.0.0-ai",
        promptVersion: "2.0.0",
        schemaVersion: "1.0.0",
      },
      warnings: [
        "AI generation produced invalid JSON. Partial recovery applied.",
      ],
      success: true,
    };
  }
}

// ── Fallback Chain ────────────────────────────

/**
 * Default fallback chain.
 * Strategies are tried in order until one succeeds.
 */
export const DEFAULT_FALLBACK_CHAIN: FallbackStrategy[] = [
  new RetryWithHigherTemperature(),
  new RetryWithCompressedContext(),
  new FallbackToDeterministic(),
];

/**
 * Run the fallback chain for a failed AI generation.
 *
 * @param error - The error that occurred
 * @param input - Original generator input
 * @param config - Generator configuration
 * @param chain - Optional custom fallback chain
 * @returns GeneratorResult from the first successful strategy
 * @throws If all strategies fail
 */
export async function runFallbackChain(
  error: AIGenerationError,
  input: GeneratorInput,
  config: GeneratorConfig,
  chain: FallbackStrategy[] = DEFAULT_FALLBACK_CHAIN,
): Promise<GeneratorResult> {
  const errors: Array<{ strategy: string; error: string }> = [];

  for (const strategy of chain) {
    if (strategy.canHandle(error)) {
      try {
        return await strategy.execute(input, config);
      } catch (e) {
        errors.push({
          strategy: strategy.name,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  // If all strategies failed, throw a comprehensive error
  throw new Error(
    `All fallback strategies failed:\n${errors
      .map((e) => `  - ${e.strategy}: ${e.error}`)
      .join("\n")}`,
  );
}
