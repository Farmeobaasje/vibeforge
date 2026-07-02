// ──────────────────────────────────────────────
// resolutionPipeline — Epic 25.2
// Unified pipeline orchestrator for both AI and
// deterministic output.
//
// Pipeline stages:
//   1. Normalization Layer — clean raw output
//   2. Confidence Merge (AI only) — AI vs deterministic
//   3. Resolver Registry (fill gaps) — deterministic fallback
//   4. Validation Pipeline — schema + semantic + hallucination
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { GeneratorWarning } from "./generatorTypes";
import type { PerFieldConfidence } from "./confidenceTypes";
import { normalizeOutput } from "./normalizationLayer";
import type { RawLLMOutput } from "./normalizationLayer";
import { confidenceMerge } from "./confidenceMerge";
import { validateProjectDefinition } from "./aiValidator";
import { resolvePolicy } from "./confidencePolicy";
import { emptyConfidence } from "./confidenceTypes";

/**
 * Source of the ProjectDefinition entering the pipeline.
 */
export type PipelineSource = "ai" | "deterministic";

/**
 * Input to the resolution pipeline.
 */
export interface PipelineInput {
  /** Raw ProjectDefinition (from AI or deterministic generator) */
  projectDefinition: ProjectDefinition | RawLLMOutput;
  /** Source of the input */
  source: PipelineSource;
  /** Per-field confidence (only for AI source) */
  confidence?: PerFieldConfidence;
  /** Generator config for policy resolution */
  config?: {
    confidencePolicy?: import("./confidencePolicy").ConfidencePolicyName;
    model?: string;
  };
}

/**
 * Result of the resolution pipeline.
 */
export interface PipelineResult {
  /** Final, validated ProjectDefinition */
  projectDefinition: ProjectDefinition;
  /** Updated confidence scores */
  confidence: PerFieldConfidence;
  /** All warnings generated during pipeline execution */
  warnings: GeneratorWarning[];
  /** Metadata about the pipeline run */
  metadata: ResolutionMetadata;
}

/**
 * Metadata about a pipeline run.
 */
export interface ResolutionMetadata {
  /** Which stages were executed */
  stagesExecuted: string[];
  /** How many warnings were generated */
  warningCount: number;
  /** Whether the pipeline completed successfully */
  success: boolean;
}

/**
 * Deterministic fallback generator interface.
 * Used by the pipeline to fill gaps.
 */
export interface DeterministicFallback {
  generate(
    input: import("./generatorTypes").GeneratorInput,
  ): Promise<ProjectDefinition>;
}

/**
 * Run the resolution pipeline on a ProjectDefinition.
 *
 * @param input - Pipeline input
 * @param deterministicFallback - Optional deterministic generator for gap filling
 * @param generatorInput - Original generator input (for deterministic fallback)
 * @returns Pipeline result
 */
export async function runPipeline(
  input: PipelineInput,
  deterministicFallback?: DeterministicFallback,
  generatorInput?: import("./generatorTypes").GeneratorInput,
): Promise<PipelineResult> {
  const stagesExecuted: string[] = [];
  const allWarnings: GeneratorWarning[] = [];
  const policy = resolvePolicy(
    { strategy: input.source === "ai" ? "ai" : "deterministic", generateDocuments: false, includeBootstrapPrompt: false } as any,
    input.config?.model,
  );

  let pd: ProjectDefinition;
  let confidence: PerFieldConfidence;

  // ── Stage 1: Normalization ──────────────────
  stagesExecuted.push("normalization");

  if (input.source === "ai") {
    const normalized = normalizeOutput(
      input.projectDefinition as RawLLMOutput,
    );
    pd = normalized.projectDefinition;
    confidence = normalized.confidence;
    allWarnings.push(
      ...normalized.warnings.map((w) => ({
        field: "normalization" as string,
        severity: "warning" as const,
        message: w,
      })),
    );
  } else {
    // Deterministic input — already normalized
    pd = JSON.parse(
      JSON.stringify(input.projectDefinition),
    ) as ProjectDefinition;
    confidence = input.confidence ?? emptyConfidence();
  }

  // ── Stage 2: Confidence Merge (AI only) ─────
  if (input.source === "ai" && deterministicFallback && generatorInput) {
    stagesExecuted.push("confidence-merge");

    const deterministicPd = await deterministicFallback.generate(generatorInput);
    const merged = confidenceMerge(pd, deterministicPd, confidence, policy);
    pd = merged.projectDefinition;
    confidence = merged.confidence;
    allWarnings.push(...merged.warnings);
  }

  // ── Stage 3: Resolver Registry (fill gaps) ──
  stagesExecuted.push("resolver-registry");

  // For now, the resolver registry is a simple pass-through.
  // In Epic 26, this will be replaced with a proper Resolver Registry
  // that can fill individual fields using deterministic logic.
  const resolverWarnings = fillGaps(pd);
  allWarnings.push(...resolverWarnings);

  // ── Stage 4: Validation Pipeline ────────────
  stagesExecuted.push("validation");

  const validationResult = validateProjectDefinition(pd, confidence, policy);
  allWarnings.push(...validationResult.warnings);

  return {
    projectDefinition: validationResult.projectDefinition,
    confidence: validationResult.confidence,
    warnings: allWarnings,
    metadata: {
      stagesExecuted,
      warningCount: allWarnings.length,
      success: validationResult.passed,
    },
  };
}

/**
 * Fill gaps in the ProjectDefinition with sensible defaults.
 * This is a lightweight resolver that will be replaced by
 * the proper Resolver Registry in Epic 26.
 */
function fillGaps(pd: ProjectDefinition): GeneratorWarning[] {
  const warnings: GeneratorWarning[] = [];

  // Fill empty project name
  if (!pd.project.name || pd.project.name === "My Project") {
    pd.project.name = "My Project";
    warnings.push({
      field: "project.name",
      severity: "info",
      message: "Project name was empty. Using default.",
      suggestion: "Provide a descriptive project name.",
    });
  }

  // Fill empty tagline
  if (!pd.project.tagline) {
    pd.project.tagline = "A brief description of what this project does";
    warnings.push({
      field: "project.tagline",
      severity: "info",
      message: "Tagline was empty. Using default.",
      suggestion: "Provide a one-line summary of the project.",
    });
  }

  // Fill empty version
  if (!pd.project.version) {
    pd.project.version = "0.1.0";
  }

  // Fill empty target users
  if (pd.product.targetUsers.length === 0) {
    pd.product.targetUsers = ["developers"];
    warnings.push({
      field: "product.targetUsers",
      severity: "info",
      message: "Target users were empty. Using default.",
      suggestion: "Specify target user personas.",
    });
  }

  // Fill empty memory files
  if (pd.memory.files.length === 0) {
    pd.memory.files = [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ];
    warnings.push({
      field: "memory.files",
      severity: "info",
      message: "Memory files were empty. Using default Memory Bank structure.",
    });
  }

  // Fill empty agents
  if (pd.agents.agents.length === 0) {
    pd.agents.agents = [
      { role: "orchestrator", model: "gpt-4o", promptTemplate: "You are an orchestrator. Convert raw project ideas into a structured ProjectDefinition JSON." },
      { role: "plan", model: "claude-sonnet-4-20250514", promptTemplate: "You are a Cline Plan agent. Read the bootstrap prompt and present a file-by-file implementation plan." },
      { role: "act", model: "claude-sonnet-4-20250514", promptTemplate: "You are a Cline Act agent. Write the exact files specified in the plan." },
    ];
    warnings.push({
      field: "agents.agents",
      severity: "info",
      message: "Agents were empty. Using default agent configuration.",
    });
  }

  return warnings;
}
