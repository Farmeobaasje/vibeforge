// ──────────────────────────────────────────────
// Canonical Extraction Layer — barrel exports
//
// All canonical types and extractors are
// accessible from a single entry point.
// ──────────────────────────────────────────────

export type {
  ExtractionSource,
  CanonicalIdentity,
  CanonicalDomain,
  CanonicalPersona,
  CanonicalUsers,
  CanonicalFeature,
  CanonicalMvpFeatures,
  CanonicalTechItem,
  CanonicalTechStack,
  CanonicalArchitecture,
  CanonicalRoadmapPhase,
  CanonicalRoadmap,
  CanonicalIntegration,
  CanonicalIntegrations,
  CanonicalConstraint,
  CanonicalConstraints,
  CanonicalGoal,
  CanonicalGoals,
  CanonicalRisk,
  CanonicalRisks,
  CanonicalEntity,
  CanonicalEntities,
  CanonicalExtractionResult,
} from "./types";

export { extractDeterministic } from "./deterministicExtractor";
export { extractCanonicalWithLlm } from "./llmExtractor";
export type { CanonicalLlmResult } from "./llmExtractor";
export { buildCanonicalSystemPrompt, buildCanonicalUserPrompt } from "./llmPrompt";
export { canonicalToProjectDefinition } from "./canonicalToProjectDefinition";
