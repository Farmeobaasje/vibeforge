// ──────────────────────────────────────────────
// aiGenerator — Epic 25.2
// AI-powered ProjectDefinition Generator.
//
// Implements the ProjectDefinitionGenerator
// interface using the PromptBuilder + Resolution
// Pipeline + Orchestrator for AI-powered
// ProjectDefinition generation.
// ──────────────────────────────────────────────

import type {
  GeneratorInput,
  GeneratorResult,
  GeneratorConfig,
  GeneratorWarning,
  ProjectDefinitionGenerator,
} from "./generatorTypes";
import type { ProjectDefinition } from "../types/projectDefinition";
import { emptyConfidence } from "./confidenceTypes";
import { validateProjectDefinition } from "./aiValidator";
import { PromptBuilder } from "./promptBuilder";
import { runPipeline } from "./resolutionPipeline";
import type { DeterministicFallback } from "./resolutionPipeline";
import { DeterministicGenerator } from "./deterministicGenerator";
import { resolvePolicy } from "./confidencePolicy";
import { AIGenerationError, runFallbackChain } from "./aiFallback";
import { PROMPT_VERSION, SCHEMA_VERSION } from "./promptVersions";
import { GENERATOR_VERSION } from "./generatorTypes";

/**
 * Maximum number of retry attempts for AI generation.
 */
const MAX_RETRIES = 3;

/**
 * Adapter to wrap DeterministicGenerator so it satisfies
 * the DeterministicFallback interface (which expects
 * generate(input) => Promise<ProjectDefinition>).
 */
class DeterministicFallbackAdapter implements DeterministicFallback {
  private inner: DeterministicGenerator;

  constructor() {
    this.inner = new DeterministicGenerator();
  }

  async generate(input: GeneratorInput): Promise<ProjectDefinition> {
    const result = await this.inner.generate(input, {
      strategy: "deterministic",
      generateDocuments: false,
      includeBootstrapPrompt: false,
    });
    return result.projectDefinition;
  }
}

/**
 * AI-powered ProjectDefinition Generator.
 *
 * Uses the PromptBuilder to construct prompts,
 * the Orchestrator to call the LLM, and the
 * Resolution Pipeline to validate and merge output.
 */
export class AIGenerator implements ProjectDefinitionGenerator {
  private promptBuilder: PromptBuilder;
  private deterministicFallback: DeterministicFallback;

  constructor() {
    this.promptBuilder = new PromptBuilder();
    this.deterministicFallback = new DeterministicFallbackAdapter();
  }

  /**
   * Generate a ProjectDefinition using AI.
   *
   * Process:
   * 1. Build prompt via PromptBuilder
   * 2. Call Orchestrator.generate() with retry logic
   * 3. Parse LLM output as JSON
   * 4. Extract per-field confidence from _confidence meta-field
   * 5. Run Resolution Pipeline (Normalization → Merge → Resolvers → Validation)
   * 6. Build GeneratorResult with metadata
   * 7. Return result
   */
  async generate(
    input: GeneratorInput,
    config: GeneratorConfig,
  ): Promise<GeneratorResult> {
    const startedAt = new Date().toISOString();
    const warnings: GeneratorWarning[] = [];
    const policy = resolvePolicy(config);

    try {
      // 1. Build prompt
      const promptResult = this.promptBuilder.build(input, config);

      // 2. Call Orchestrator with retry logic
      let lastError: Error | null = null;
      let rawOutput = "";

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (!config.orchestrator) {
            throw new AIGenerationError(
              "api-error",
              "No orchestrator configured. AI generation requires an orchestrator.",
            );
          }

          const result = await config.orchestrator.generate(
            [
              { role: "system", content: promptResult.systemPrompt },
              ...promptResult.messages,
            ],
            {
              temperature: config.temperature ?? 0.3,
              maxTokens: config.maxTokens ?? 8192,
            },
          );

          rawOutput = result.content;
          break; // Success — exit retry loop
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < MAX_RETRIES - 1) {
            // Wait before retry (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000),
            );
          }
        }
      }

      // If all retries failed, run fallback chain
      if (!rawOutput && lastError) {
        const fallbackResult = await runFallbackChain(
          new AIGenerationError(
            "api-error",
            lastError.message,
          ),
          input,
          config,
        );
        return fallbackResult;
      }

      // 3. Parse LLM output as JSON
      let parsedJson: Record<string, unknown>;
      try {
        parsedJson = JSON.parse(rawOutput);
      } catch {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            parsedJson = JSON.parse(jsonMatch[1]);
          } catch {
            // Fallback chain for invalid JSON
            return await runFallbackChain(
              new AIGenerationError(
                "invalid-json",
                "Failed to parse LLM output as JSON",
                rawOutput,
              ),
              input,
              config,
            );
          }
        } else {
          return await runFallbackChain(
            new AIGenerationError(
              "invalid-json",
              "Failed to parse LLM output as JSON",
              rawOutput,
            ),
            input,
            config,
          );
        }
      }

      // 4. Run Resolution Pipeline
      const pipelineResult = await runPipeline(
        {
          projectDefinition: parsedJson,
          source: "ai",
          config: {
            confidencePolicy: config.confidencePolicy,
            model: config.orchestrator?.getActiveEndpoint()?.model,
          },
        },
        this.deterministicFallback,
        input,
      );

      warnings.push(...pipelineResult.warnings);

      const completedAt = new Date().toISOString();
      const durationMs =
        new Date(completedAt).getTime() - new Date(startedAt).getTime();

      return {
        projectDefinition: pipelineResult.projectDefinition,
        documents: [],
        metadata: {
          startedAt,
          completedAt,
          durationMs,
          strategy: config.strategy,
          model: config.orchestrator?.getActiveEndpoint()?.model,
          tokenUsage: {
            promptTokens: promptResult.estimatedTokens,
            completionTokens: 0, // Would come from orchestrator response
            totalTokens: promptResult.estimatedTokens,
          },
          generatorVersion: `${GENERATOR_VERSION}-ai`,
          promptVersion: PROMPT_VERSION,
          schemaVersion: SCHEMA_VERSION,
          confidencePolicy: policy.name,
          perFieldConfidence: pipelineResult.confidence,
          blocksUsed: [], // Would be populated by PromptBuilder
          tokensByBlock: {}, // Would be populated by PromptBuilder
        },
        warnings: warnings.map(w => typeof w === "string" ? w : `${w.field}: ${w.message}`),
        success: pipelineResult.metadata.success,
      };
    } catch (error) {
      // Final fallback — deterministic generation
      const completedAt = new Date().toISOString();
      const durationMs =
        new Date(completedAt).getTime() - new Date(startedAt).getTime();

      try {
        const fallbackResult = await this.deterministicFallback.generate(input);

        return {
          projectDefinition: fallbackResult,
          documents: [],
          metadata: {
            startedAt,
            completedAt,
            durationMs,
            strategy: "deterministic",
            generatorVersion: `${GENERATOR_VERSION}-ai`,
            promptVersion: PROMPT_VERSION,
            schemaVersion: SCHEMA_VERSION,
          },
          warnings: [
            ...warnings.map(w => typeof w === "string" ? w : `${w.field}: ${w.message}`),
            `_generator: AI generation failed. Fell back to deterministic. Error: ${error instanceof Error ? error.message : String(error)}`,
          ],
          success: true,
        };
      } catch (fallbackError) {
        return {
          projectDefinition: null as unknown as ProjectDefinition,
          documents: [],
          metadata: {
            startedAt,
            completedAt,
            durationMs,
            strategy: "deterministic",
            generatorVersion: `${GENERATOR_VERSION}-ai`,
          },
          warnings: [
            ...warnings.map(w => typeof w === "string" ? w : `${w.field}: ${w.message}`),
            `_generator: AI generation failed and deterministic fallback also failed. Error: ${error instanceof Error ? error.message : String(error)}`,
          ],
          success: false,
          error: `AI generation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
  }

  /**
   * Validate a ProjectDefinition for completeness.
   * Delegates to the Resolution Pipeline's validation stage.
   */
  validate(pd: ProjectDefinition): GeneratorWarning[] {
    const policy = resolvePolicy({
      strategy: "ai",
      generateDocuments: false,
      includeBootstrapPrompt: false,
    });
    const result = validateProjectDefinition(pd, emptyConfidence(), policy);
    return result.warnings;
  }

  /**
   * Get the current generator version.
   */
  getVersion(): string {
    return `${GENERATOR_VERSION}-ai`;
  }
}
