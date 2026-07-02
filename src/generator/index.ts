// ──────────────────────────────────────────────
// Generator — Epic 25
// ProjectDefinition Generator v2
//
// AI-powered generation from workspace state
// (ConversationMemory + ProjectRequirements +
//  ArchitectureAnalysis → ProjectDefinition)
// ──────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type {
  GeneratorInput,
  GeneratorResult,
  GeneratorMetadata,
  GenerationStrategy,
  GeneratorConfig,
  DocumentType,
  ProjectDefinitionGenerator,
  GeneratorWarning,
  PromptBuilderInput,
  PromptBuilderResult,
  FallbackConfig,
} from "./generatorTypes";

export {
  DEFAULT_GENERATOR_CONFIG,
  DEFAULT_FALLBACK_CONFIG,
  GENERATOR_VERSION,
} from "./generatorTypes";

// ── Deterministic Generator (Epic 25.1) ───────

export { DeterministicGenerator, deterministicGenerate } from "./deterministicGenerator";

// ── Epic 25.2: AI Generator ───────────────────

export { AIGenerator } from "./aiGenerator";
export { PromptBuilder, DEFAULT_MAX_PROMPT_TOKENS } from "./promptBuilder";
export { PromptBlockRegistry, createDefaultRegistry } from "./promptBlockRegistry";
export type { PromptBlock, PromptBlockResult } from "./promptBlockRegistry";

// ── Prompt Blocks ─────────────────────────────

export { systemPromptBlock } from "./promptBlocks/systemPrompt";
export { aiContractBlock } from "./promptBlocks/aiContract";
export { workspaceSummaryBlock } from "./promptBlocks/workspaceSummary";
export { requirementsSummaryBlock } from "./promptBlocks/requirementsSummary";
export { architectureSummaryBlock } from "./promptBlocks/architectureSummary";
export { generationRulesBlock } from "./promptBlocks/generationRules";
export { outputSchemaBlock } from "./promptBlocks/outputSchema";
export { fewShotExamplesBlock } from "./promptBlocks/fewShotExamples";
export { userNotesBlock } from "./promptBlocks/userNotes";

// ── Resolution Pipeline ───────────────────────

export { runPipeline } from "./resolutionPipeline";
export type {
  PipelineInput,
  PipelineResult,
  PipelineSource,
  ResolutionMetadata,
  DeterministicFallback,
} from "./resolutionPipeline";

// ── Pipeline Stages ───────────────────────────

export { normalizeOutput } from "./normalizationLayer";
export type { RawLLMOutput, NormalizationResult } from "./normalizationLayer";

export { confidenceMerge } from "./confidenceMerge";
export type { ConfidenceMergeResult } from "./confidenceMerge";

export { validateProjectDefinition } from "./aiValidator";
export type { ValidationResult } from "./aiValidator";

// ── Confidence System ─────────────────────────

export type {
  FieldPath,
  ConfidenceEntry,
  PerFieldConfidence,
} from "./confidenceTypes";
export {
  emptyConfidence,
  calculateOverallConfidence,
  aggregateSectionConfidence,
} from "./confidenceTypes";

export type { ConfidencePolicyName, ConfidencePolicy } from "./confidencePolicy";
export {
  CONFIDENCE_POLICIES,
  resolvePolicy,
  getRecommendedPolicyForModel,
} from "./confidencePolicy";

// ── Fallback System ───────────────────────────

export {
  AIGenerationError,
  runFallbackChain,
  RetryWithHigherTemperature,
  RetryWithCompressedContext,
  FallbackToDeterministic,
  PartialRecovery,
  DEFAULT_FALLBACK_CHAIN,
} from "./aiFallback";
export type { AIGenerationErrorType, FallbackStrategy } from "./aiFallback";

// ── Versioning ────────────────────────────────

export {
  PROMPT_VERSION,
  SCHEMA_VERSION,
  PROMPT_CHANGELOG,
  getLatestChangelog,
  getChangesForVersion,
} from "./promptVersions";
export type { PromptChangelogEntry } from "./promptVersions";
