// ──────────────────────────────────────────────
// generatorTypes — Epic 25.1 / 25.2
// Types & interfaces for the ProjectDefinition
// Generator v2 — AI-powered generation from
// workspace state.
//
// The Generator v2 replaces the simple
// requirementsToProjectDefinition bridge with
// an AI-driven pipeline that produces richer,
// more complete ProjectDefinitions.
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import type { ProjectRequirements } from "../models/projectRequirements";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";
import type {
  ProjectDefinition,
  GeneratedFile,
} from "../types/projectDefinition";
import type { Orchestrator } from "../orchestrator";
import type { ConfidencePolicyName } from "./confidencePolicy";
import type { PerFieldConfidence } from "./confidenceTypes";

// ── Generator Input ───────────────────────────

/**
 * Complete input for the ProjectDefinition Generator v2.
 * Aggregates all available context from the workspace.
 */
export interface GeneratorInput {
  /** Conversation memory from the interview phase */
  memory: ConversationMemory;
  /** Extracted project requirements */
  requirements: ProjectRequirements;
  /** Architecture analysis from the architect agent */
  architecture: ArchitectureAnalysis;
  /** Existing project definition (if any) — for incremental updates */
  existing?: ProjectDefinition;
  /** Optional user-provided notes or corrections */
  userNotes?: string;
}

// ── Generator Output ──────────────────────────

/**
 * The result of a generation run.
 */
export interface GeneratorResult {
  /** The generated ProjectDefinition */
  projectDefinition: ProjectDefinition;
  /** Generated document files (README, SPEC, PRD, roadmap, etc.) */
  documents: GeneratedFile[];
  /** Metadata about the generation process */
  metadata: GeneratorMetadata;
  /** Warnings or issues encountered during generation */
  warnings: string[];
  /** Whether the generation succeeded */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Metadata about a generation run.
 */
export interface GeneratorMetadata {
  /** When generation started */
  startedAt: string; // ISO timestamp
  /** When generation completed */
  completedAt: string; // ISO timestamp
  /** How long generation took (ms) */
  durationMs: number;
  /** Which strategy was used */
  strategy: GenerationStrategy;
  /** The model used (if AI-powered) */
  model?: string;
  /** Token usage (if AI-powered) */
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Version of the generator */
  generatorVersion: string;
  // ── Epic 25.2 additions ─────────────────────
  /** Version of the prompt used for generation */
  promptVersion?: string;
  /** Version of the output schema */
  schemaVersion?: string;
  /** Confidence policy used */
  confidencePolicy?: ConfidencePolicyName;
  /** Per-field confidence scores (AI strategy only) */
  perFieldConfidence?: PerFieldConfidence;
  /** Which prompt blocks were included in the prompt */
  blocksUsed?: string[];
  /** Token count per prompt block */
  tokensByBlock?: Record<string, number>;
}

// ── Generation Strategy ───────────────────────

/**
 * Which generation strategy to use.
 * - "ai": Use the LLM to generate the ProjectDefinition
 * - "deterministic": Use the rule-based bridge (requirementsToProjectDefinition)
 * - "hybrid": Use AI with deterministic fallback for missing fields
 */
export type GenerationStrategy = "ai" | "deterministic" | "hybrid";

// ── Generator Configuration ───────────────────

/**
 * Configuration for the ProjectDefinition Generator v2.
 */
export interface GeneratorConfig {
  /** Which strategy to use */
  strategy: GenerationStrategy;
  /** The orchestrator for AI calls (required for "ai" and "hybrid" strategies) */
  orchestrator?: Orchestrator;
  /** System prompt override for the AI generator */
  systemPrompt?: string;
  /** Temperature for LLM calls (default: 0.3) */
  temperature?: number;
  /** Max tokens for LLM responses (default: 8192) */
  maxTokens?: number;
  /** Whether to generate document files alongside the ProjectDefinition */
  generateDocuments: boolean;
  /** Specific document types to generate (empty = all) */
  documentTypes?: DocumentType[];
  /** Whether to include the bootstrap prompt in generated documents */
  includeBootstrapPrompt: boolean;
  // ── Epic 25.2 additions ─────────────────────
  /** Specific sections to generate (empty = all sections) */
  sections?: Array<
    | "project"
    | "product"
    | "tech"
    | "architecture"
    | "roadmap"
    | "memory"
    | "agents"
    | "quality"
    | "options"
  >;
  /** Confidence policy to use (default: model-aware) */
  confidencePolicy?: ConfidencePolicyName;
  /** Maximum tokens for the prompt (default: 8000) */
  maxPromptTokens?: number;
}

/**
 * Types of documents that can be generated.
 */
export type DocumentType =
  | "readme"
  | "spec"
  | "prd"
  | "roadmap"
  | "memory-bank"
  | "clinerules"
  | "bootstrap-prompt";

// ── Generator Interface ───────────────────────

/**
 * The ProjectDefinition Generator interface.
 *
 * Implementations can be AI-powered, deterministic, or hybrid.
 * The generator is a stateless service — all input is passed
 * via GeneratorInput, and all output is returned via GeneratorResult.
 */
export interface ProjectDefinitionGenerator {
  /**
   * Generate a complete ProjectDefinition from workspace state.
   *
   * @param input - All available context for generation
   * @param config - Generator configuration
   * @returns The generation result
   */
  generate(
    input: GeneratorInput,
    config: GeneratorConfig,
  ): Promise<GeneratorResult>;

  /**
   * Validate a generated ProjectDefinition for completeness.
   * Returns warnings for missing or incomplete fields.
   *
   * @param pd - The ProjectDefinition to validate
   * @returns A list of warnings
   */
  validate(pd: ProjectDefinition): GeneratorWarning[];

  /**
   * Get the current generator version.
   */
  getVersion(): string;
}

// ── Validation ────────────────────────────────

/**
 * A warning about a field in the generated ProjectDefinition.
 */
export interface GeneratorWarning {
  /** The field path (e.g. "project.name", "product.targetUsers") */
  field: string;
  /** Severity level */
  severity: "info" | "warning" | "error";
  /** Human-readable message */
  message: string;
  /** Suggested value or action */
  suggestion?: string;
}

// ── Prompt Builder Types ──────────────────────

/**
 * Input for building the LLM prompt for AI-powered generation.
 */
export interface PromptBuilderInput {
  /** The conversation memory (for context) */
  memory: ConversationMemory;
  /** The extracted requirements */
  requirements: ProjectRequirements;
  /** The architecture analysis */
  architecture: ArchitectureAnalysis;
  /** Any existing ProjectDefinition to build upon */
  existing?: ProjectDefinition;
  /** User-provided notes or corrections */
  userNotes?: string;
}

/**
 * The result of building an LLM prompt.
 */
export interface PromptBuilderResult {
  /** The system prompt */
  systemPrompt: string;
  /** The user message(s) */
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** Total estimated tokens (rough count) */
  estimatedTokens: number;
}

// ── Fallback Types ────────────────────────────

/**
 * Configuration for deterministic fallback generation.
 * Used when AI generation fails or when strategy is "deterministic".
 */
export interface FallbackConfig {
  /** Whether to use the existing ProjectDefinition as base */
  preserveExisting: boolean;
  /** Whether to derive project name from requirements */
  deriveName: boolean;
  /** Whether to derive tech stack from requirements */
  deriveTechStack: boolean;
  /** Whether to include architecture analysis data */
  includeArchitecture: boolean;
}

// ── Defaults ──────────────────────────────────

export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  strategy: "hybrid",
  temperature: 0.3,
  maxTokens: 8192,
  generateDocuments: true,
  includeBootstrapPrompt: true,
};

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  preserveExisting: true,
  deriveName: true,
  deriveTechStack: true,
  includeArchitecture: true,
};

export const GENERATOR_VERSION = "2.0.0";
