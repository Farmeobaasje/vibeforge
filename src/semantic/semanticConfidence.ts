// ──────────────────────────────────────────────
// semanticConfidence — Per-field confidence scoring
//
// Scores each generated field (tagline, roadmap,
// architecture, entities, dataFlow, componentTree,
// techStack) with a 0-100% confidence value.
//
// Guides generation decisions: low-confidence fields
// get more conservative fallbacks.
// ──────────────────────────────────────────────

import type { DomainTemplate } from "./domainTemplates";
import type { DomainModel } from "./domainModelTypes";

/**
 * Per-field semantic confidence scores (0-100).
 */
export interface SemanticConfidence {
  tagline: number;
  roadmap: number;
  architecture: number;
  entities: number;
  dataFlow: number;
  componentTree: number;
  techStack: number;
  overall: number;
}

/**
 * Score the confidence of a generated tagline.
 */
function scoreTaglineConfidence(tagline: string, domainTemplate: DomainTemplate): number {
  if (!tagline || tagline.length === 0) return 0;
  if (tagline.length > 80) return 50; // Too long, truncated
  if (tagline.includes("—") || tagline.includes("–")) return 90; // Has separator, looks professional
  if (domainTemplate.name !== "generic") return 85; // Domain-specific
  return 70; // Generic but valid
}

/**
 * Score the confidence of a generated roadmap.
 */
function scoreRoadmapConfidence(
  phases: Array<{ title: string; tasks: string[] }>,
  domainTemplate: DomainTemplate,
): number {
  if (!phases || phases.length === 0) return 0;
  if (phases.length >= 4) return 90; // Full roadmap
  if (phases.length >= 2) return 70; // Partial roadmap
  if (domainTemplate.name !== "generic") return 80; // Domain-specific phases
  return 50; // Generic fallback
}

/**
 * Score the confidence of generated architecture.
 */
function scoreArchitectureConfidence(
  pattern: string,
  domainTemplate: DomainTemplate,
): number {
  if (!pattern || pattern.length === 0) return 0;
  if (domainTemplate.name !== "generic") return 85;
  return 60;
}

/**
 * Score the confidence of generated entities.
 */
function scoreEntitiesConfidence(
  domainModel: DomainModel,
  domainTemplate: DomainTemplate,
): number {
  if (!domainModel.entities || domainModel.entities.length === 0) return 0;
  if (domainModel.entities.length >= 4 && domainModel.relationships.length > 0) return 90;
  if (domainModel.entities.length >= 2) return 70;
  if (domainTemplate.name !== "generic") return 75;
  return 50;
}

/**
 * Score the confidence of generated data flow.
 */
function scoreDataFlowConfidence(
  dataFlow: string,
  domainTemplate: DomainTemplate,
): number {
  if (!dataFlow || dataFlow.length === 0) return 0;
  if (dataFlow.includes("→") && dataFlow.length > 50) return 90; // Has arrows and detail
  if (domainTemplate.name !== "generic") return 80;
  return 60;
}

/**
 * Score the confidence of generated component tree.
 */
function scoreComponentTreeConfidence(
  componentTree: string,
  domainTemplate: DomainTemplate,
): number {
  if (!componentTree || componentTree.length === 0) return 0;
  const lines = componentTree.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length >= 6) return 90; // Rich tree
  if (lines.length >= 3) return 70;
  if (domainTemplate.name !== "generic") return 75;
  return 50;
}

/**
 * Score the confidence of tech stack.
 */
function scoreTechStackConfidence(preferredTech: string[]): number {
  if (!preferredTech || preferredTech.length === 0) return 0;
  if (preferredTech.length >= 3) return 90;
  if (preferredTech.length >= 1) return 60;
  return 0;
}

/**
 * Calculate per-field semantic confidence scores.
 *
 * @param tagline - Generated tagline
 * @param roadmapPhases - Generated roadmap phases
 * @param architecturePattern - Generated architecture pattern
 * @param domainModel - Generated domain model
 * @param dataFlow - Generated data flow
 * @param componentTree - Generated component tree
 * @param preferredTech - User-specified tech stack
 * @param domainTemplate - Detected domain template
 * @returns SemanticConfidence with per-field and overall scores
 */
export function calculateSemanticConfidence(
  tagline: string,
  roadmapPhases: Array<{ title: string; tasks: string[] }>,
  architecturePattern: string,
  domainModel: DomainModel,
  dataFlow: string,
  componentTree: string,
  preferredTech: string[],
  domainTemplate: DomainTemplate,
): SemanticConfidence {
  const taglineScore = scoreTaglineConfidence(tagline, domainTemplate);
  const roadmapScore = scoreRoadmapConfidence(roadmapPhases, domainTemplate);
  const architectureScore = scoreArchitectureConfidence(architecturePattern, domainTemplate);
  const entitiesScore = scoreEntitiesConfidence(domainModel, domainTemplate);
  const dataFlowScore = scoreDataFlowConfidence(dataFlow, domainTemplate);
  const componentTreeScore = scoreComponentTreeConfidence(componentTree, domainTemplate);
  const techStackScore = scoreTechStackConfidence(preferredTech);

  // Overall: weighted average
  const weights = {
    tagline: 0.10,
    roadmap: 0.20,
    architecture: 0.15,
    entities: 0.15,
    dataFlow: 0.10,
    componentTree: 0.10,
    techStack: 0.20,
  };

  const overall =
    taglineScore * weights.tagline +
    roadmapScore * weights.roadmap +
    architectureScore * weights.architecture +
    entitiesScore * weights.entities +
    dataFlowScore * weights.dataFlow +
    componentTreeScore * weights.componentTree +
    techStackScore * weights.techStack;

  return {
    tagline: taglineScore,
    roadmap: roadmapScore,
    architecture: architectureScore,
    entities: entitiesScore,
    dataFlow: dataFlowScore,
    componentTree: componentTreeScore,
    techStack: techStackScore,
    overall: Math.round(overall),
  };
}
