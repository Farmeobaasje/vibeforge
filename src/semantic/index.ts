// ──────────────────────────────────────────────
// Semantic Layer — barrel exports
//
// Public API surface for the semantic intelligence
// layer. All consumers should import from here,
// not from individual files.
// ──────────────────────────────────────────────

export type { DomainEntity, EntityRelationship, DomainModel } from "./domainModelTypes";
export { emptyDomainModel } from "./domainModelTypes";

export type { DomainTemplate } from "./domainTemplates";
export { getDomainTemplate, detectDomainFromText, getDomainNames, ALL_DOMAINS } from "./domainTemplates";

export { generateSemanticTagline } from "./semanticTagline";
export { extractSemanticUsers } from "./semanticUsers";
export { generateSemanticStories } from "./semanticStories";
export { generateSemanticRoadmap } from "./semanticRoadmap";
export {
  deriveSemanticComponentTree,
  deriveSemanticDataFlow,
  deriveArchitecturePattern,
} from "./semanticArchitecture";

export { getCanonicalName, isKnownLanguage, categorizeTechStack } from "./canonicalStack";
export type { CategorizedTechStack } from "./canonicalStack";
export { emptyCategorizedTechStack } from "./canonicalStack";

export type { SemanticConfidence } from "./semanticConfidence";
export { calculateSemanticConfidence } from "./semanticConfidence";

export { buildDomainModel, getEntityNames, getRelationshipDescriptions } from "./domainModelBuilder";

export type { ValidationIssue, ValidationReport } from "./semanticValidator";
export { validateSemanticOutput } from "./semanticValidator";

export type { ConsistencyCheck, ConsistencyReport } from "../types/domainIdentity";
export { checkDomainConsistency, hasValidDomain, formatConsistencyReport } from "./domainConsistency";
