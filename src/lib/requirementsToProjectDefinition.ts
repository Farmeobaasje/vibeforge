// ──────────────────────────────────────────────
// requirementsToProjectDefinition — bridge
// Maps ProjectRequirements + ArchitectureAnalysis
// → ProjectDefinition (deterministic, no LLM)
//
// REFACTORED: Uses the Semantic Extraction Layer
// (requirementsIntelligence) for all extraction logic.
// No duplicated extraction functions here.
//
// v0.5: Supports canonical extraction pipeline.
// If a CanonicalExtractionResult is provided, it
// takes priority over semantic extraction.
// ──────────────────────────────────────────────

import type { ProjectRequirements } from "../models/projectRequirements";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";
import type {
  ProjectDefinition,
  ProjectInfo,
  ProductInfo,
} from "../types/projectDefinition";
import { defaultProjectDefinition } from "../types/projectDefinition";
import type { ProjectDomain } from "../types/domainIdentity";
import type { CanonicalExtractionResult } from "../canonical/types";
import { normalizeArray, normalizeMvpFeatures } from "./normalize";
import { extractProjectName } from "../intelligence/requirementsIntelligence";
import {
  generateSemanticTagline,
  generateSemanticStories,
  generateSemanticRoadmap,
  categorizeTechStack,
  detectDomainFromText,
  extractSemanticUsers,
  buildDomainModel,
  deriveSemanticComponentTree,
  deriveSemanticDataFlow,
  deriveArchitecturePattern,
} from "../semantic/index";
import { canonicalToProjectDefinition } from "../canonical/canonicalToProjectDefinition";


/**
 * Check if a string looks like a tech-stack listing (multi-line with "Frontend:" / "Backend:" etc.)
 */
function isTechStackListing(text: string): boolean {
  const lower = text.toLowerCase();
  // Common tech stack section headers
  const techHeaders = /^(frontend|backend|database|infrastructure|tech stack|technologies|tools|frameworks|languages|testing|devops|deployment):/im;
  if (techHeaders.test(lower)) return true;

  // If it contains 3+ known tech keywords, it's likely a tech listing
  const techKeywords = [
    "react", "vue", "angular", "svelte", "typescript", "javascript",
    "python", "java", "go", "rust", "node", "deno", "bun",
    "postgresql", "postgres", "mysql", "mongodb", "redis",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "tailwind", "bootstrap", "graphql", "rest", "grpc",
  ];
  let matchCount = 0;
  for (const kw of techKeywords) {
    if (lower.includes(kw)) matchCount++;
    if (matchCount >= 3) return true;
  }

  return false;
}

/**
 * Clean a string to be suitable as a project name.
 * Strips filler prefixes, truncates to 50 chars.
 */
function cleanProjectName(raw: string): string {
  let cleaned = raw.trim();
  // Preserve "AI" suffix before any cleaning
  const hasAiSuffix = / AI$/i.test(cleaned);
  // Remove common filler prefixes
  cleaned = cleaned.replace(/^(a |an |the |we should |i want to |let's |create |build |make |develop |ik wil |we gaan |laten we |we moeten |het is |dit is )/i, "");
  // Remove trailing punctuation
  cleaned = cleaned.replace(/[.,;!?]+$/, "").trim();
  // Re-append "AI" suffix if original had it and cleaning removed it
  if (hasAiSuffix && !/ AI$/i.test(cleaned)) {
    cleaned += " AI";
  }
  // Cap at 50 chars; if we cut at a word boundary, do so gracefully
  if (cleaned.length > 50) {
    const truncated = cleaned.slice(0, 50);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 20) {
      cleaned = truncated.slice(0, lastSpace);
    } else {
      cleaned = truncated;
    }
  }
  return cleaned.trim();
}

/**
 * Check if a string is a stale default that should be ignored.
 */
function isStaleDefault(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return (
    lower === "" ||
    lower === "my project" ||
    lower === "myproject" ||
    lower === "new saas project" ||
    lower === "new software project" ||
    lower.startsWith("currently, saasav") ||
    lower.startsWith("saasav") ||
    lower.startsWith("a myproject application") ||
    lower.startsWith("as a user, i want to use myproject")
  );
}

// ── Text normalisation ────────────────────────

/**
 * Normalise an array of text fragments into a single readable sentence/paragraph.
 *
 * - Joins fragments with spaces (not newlines)
 * - Removes double spaces
 * - Fixes space-before-comma and space-before-period
 * - Corrects "aI" → "AI"
 * - Optionally replaces commas+space with comma+space (cleanup)
 */
function normaliseSentenceText(parts: string[]): string {
  return parts
    .join(" ")
    .replace(/ +/g, " ")           // collapse multiple spaces
    .replace(/ ,/g, ",")           // space before comma
    .replace(/ \./g, ".")          // space before period
    .replace(/\baI\b/g, "AI")      // aI → AI
    .trim();
}

// ── Helpers ───────────────────────────────────

/**
 * Known contamination patterns — if the derived name matches any of these,
 * it's not a real project name and should be rejected.
 */
const CONTAMINATION_PATTERNS = [
  /^teams gebruiken/i,
  /^frontend:/i,
  /^backend:/i,
  /^database:/i,
  /^moet /i,
  /^github/i,
  /^jira/i,
  /^slack/i,
  /^notion/i,
  /^react/i,
  /^typescript/i,
  /^node/i,
  /^python/i,
  /^docker/i,
  /^aws/i,
];

/**
 * Check if a string looks like contaminated content (tech stack, problem, etc.)
 * that should never be used as a project name.
 */
function isContaminatedName(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return CONTAMINATION_PATTERNS.some((p) => p.test(lower));
}

/**
 * Derive a short project name from requirements.
 *
 * STRICT strategy — project.name may ONLY come from:
 *   1. requirements.projectName (explicitly extracted from interview)
 *   2. Explicit name patterns in vision (genaamd/called/named — but NOT the full vision text)
 *   3. Fallback "New Software Project"
 *
 * NEVER from: vision text, problems, solutionIdeas, targetUsers, preferredTech,
 * integrations, constraints, risks, or aiWorkflowTarget.
 *
 * Uses extractProjectName from the Semantic Extraction Layer.
 */
export function deriveProjectName(requirements: ProjectRequirements): string {
  // 1. Use explicit projectName from interview (highest priority)
  if (requirements.projectName.trim() && !isStaleDefault(requirements.projectName)) {
    const cleaned = cleanProjectName(requirements.projectName);
    if (cleaned && !isContaminatedName(cleaned)) return cleaned;
  }

  // 2. Try explicit name patterns in vision using intelligence layer
  if (requirements.vision.trim()) {
    const explicit = extractProjectName(requirements.vision);
    if (explicit && !isStaleDefault(explicit) && !isContaminatedName(explicit)) {
      return explicit;
    }
  }

  // 3. Fallback — no guessing from vision/problem/solution/tech
  return "New Software Project";
}

/**
 * Derive a description from requirements.
 * Must be clean prose, 2-3 sentences max.
 * Must NOT contain internal labels like "vision:", "target-users:", etc.
 * Uses vision + solution + target users.
 * Does NOT concatenate raw requirement dumps.
 */
function deriveDescription(requirements: ProjectRequirements): string {
  // 1. Use vision (if not tech stack) — clean prose
  const vision = requirements.vision.trim();
  if (vision && !isTechStackListing(vision)) {
    return normaliseSentenceText([vision]);
  }

  // 2. Build clean prose from solution + target users + goals
  //    Never use "Problem:", "Goals:", "Solution:" labels
  const parts: string[] = [];
  if (requirements.solutionIdeas.length > 0) {
    parts.push(requirements.solutionIdeas.join(". "));
  }
  if (requirements.targetUsers.length > 0) {
    parts.push("The target audience includes " + requirements.targetUsers.join(", ") + ".");
  }
  if (requirements.goals.length > 0) {
    parts.push(requirements.goals.join(". "));
  }

  if (parts.length > 0) {
    return normaliseSentenceText(parts);
  }

  return "";
}

/**
 * Pick the best problem statement from requirements.
 * Uses normaliseSentenceText to produce a single readable paragraph.
 */
function deriveProblemStatement(requirements: ProjectRequirements): string {
  if (requirements.problems.length > 0) {
    return normaliseSentenceText(requirements.problems);
  }
  return "";
}

/**
 * Pick the best solution description from requirements.
 * Returns a clean paragraph from solutionIdeas.
 * Does NOT include tech stack unless solution itself mentions it.
 */
function deriveSolution(requirements: ProjectRequirements): string {
  if (requirements.solutionIdeas.length > 0) {
    return normaliseSentenceText(requirements.solutionIdeas);
  }
  return "";
}

/**
 * Derive individual MVP features from the mvpScope text.
 * Splits on newlines, bullet points, and numbered items.
 * Returns a normalized, deduplicated array of feature descriptions.
 */
function deriveMvpFeatures(requirements: ProjectRequirements): string[] {
  if (!requirements.mvpScope.trim()) return [];

  // Split on newlines, bullet points, numbered items (e.g. "1.", "2.")
  const features = requirements.mvpScope
    .split(/\n|•|-|\d+\.\s*/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  // If splitting didn't produce multiple items, try splitting on commas
  if (features.length <= 1) {
    return normalizeMvpFeatures(
      requirements.mvpScope
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
    );
  }

  return normalizeMvpFeatures(features);
}

// ── Main bridge ───────────────────────────────

/**
 * Build a partial ProjectDefinition from ProjectRequirements
 * and optional ArchitectureAnalysis.
 *
 * This is a **deterministic, pure function** — no AI calls.
 * It only maps fields that have clear equivalents.
 * Existing fields in `existing` (like roadmap, quality, memory, agents)
 * are preserved unless explicitly overridden.
 *
 * If a `canonical` extraction result is provided, it takes priority
 * over semantic extraction for all fields.
 *
 * @param requirements - The current ProjectRequirements
 * @param analysis     - Optional ArchitectureAnalysis (for tech stack enrichment)
 * @param existing     - The current ProjectDefinition to merge into
 * @param canonical    - Optional CanonicalExtractionResult (LLM or deterministic)
 * @returns A merged ProjectDefinition
 */
export function requirementsToProjectDefinition(
  requirements: ProjectRequirements,
  analysis?: ArchitectureAnalysis,
  existing?: ProjectDefinition,
  canonical?: CanonicalExtractionResult,
): ProjectDefinition {
  const base = existing
    ? { ...existing }
    : { ...defaultProjectDefinition };

  // ── If canonical extraction result is provided, use it ──
  if (canonical) {
    return canonicalToProjectDefinition(canonical, base);
  }

  // ── Project info ──────────────────────────
  const projectName = deriveProjectName(requirements);
  // Scan vision + solutionIdeas + targetUsers for broader domain keyword matching
  const domainDetectionText = [
    requirements.vision,
    ...requirements.solutionIdeas,
    ...requirements.targetUsers,
  ]
    .filter(Boolean)
    .join(" ");
  const domainTemplate = detectDomainFromText(domainDetectionText || requirements.vision);
  // Build canonical domain identity — single source of truth, set once here
  const domainIdentity: ProjectDomain = {
    id: domainTemplate.name,
    category: domainTemplate.name === "ai-saas/support-platform" ? "ai_saas"
      : domainTemplate.name === "ai-saas" ? "ai_saas"
      : domainTemplate.name === "emulator" ? "gaming"
      : domainTemplate.name === "marketplace" ? "ecommerce"
      : domainTemplate.name === "restaurant" ? "hospitality"
      : domainTemplate.name === "healthcare" ? "medical"
      : domainTemplate.name === "education" ? "education"
      : domainTemplate.name === "fitness" ? "health"
      : domainTemplate.name === "construction" ? "construction"
      : domainTemplate.name === "agency" ? "services"
      : domainTemplate.name === "crm" ? "sales"
      : domainTemplate.name === "website" ? "web"
      : "software",
    templateId: domainTemplate.name,
    confidence: domainTemplate.name === "generic" ? 0 : 75,
  };
  const tagline = generateSemanticTagline(projectName, domainTemplate);

  const description = deriveDescription(requirements);

  base.project = {
    ...base.project,
    name: projectName,
    tagline,
    description: description || base.project.description,
    repositoryState: requirements.repositoryState || base.project.repositoryState,
    status: base.project.status === "idea" ? "draft" : base.project.status,
  } satisfies ProjectInfo;

  // ── Product info ──────────────────────────
  // Normalize target users through semantic extraction for clean persona names
  const normalizedTargetUsers =
    requirements.targetUsers.length > 0
      ? extractSemanticUsers(requirements.targetUsers.join(" "))
      : [];
  const cleanTargetUsers =
    normalizedTargetUsers.length > 0
      ? normalizedTargetUsers
      : normalizeArray(requirements.targetUsers);

  base.product = {
    ...base.product,
    targetUsers: cleanTargetUsers,
    problemStatement: deriveProblemStatement(requirements) || base.product.problemStatement,
    solution: deriveSolution(requirements) || base.product.solution,
    userStories:
      requirements.goals.length > 0
        ? generateSemanticStories(requirements.goals, cleanTargetUsers)
        : base.product.userStories,
    mvpScope: requirements.mvpScope || base.product.mvpScope,
    mvpFeatures: deriveMvpFeatures(requirements),
  } satisfies ProductInfo;

  // ── Tech stack ────────────────────────────
  const categorized = categorizeTechStack(requirements.preferredTech);
  base.tech = {
    ...base.tech,
    languages:
      categorized.languages.length > 0
        ? categorized.languages
        : base.tech.languages,
    frameworks:
      categorized.frameworks.length > 0
        ? categorized.frameworks
        : base.tech.frameworks,
    tools:
      categorized.tools.length > 0
        ? categorized.tools
        : base.tech.tools,
    dependencies: base.tech.dependencies,
    constraints: [...requirements.constraints],
  };

  // ── Architecture (domain-model-driven) ─────
  // Build domain model from the detected domain template
  const mvpFeatures = deriveMvpFeatures(requirements);
  const domainModel = buildDomainModel(domainTemplate);

  // Derive architecture from domain model (not from MVP features)
  const architecturePattern = deriveArchitecturePattern(domainTemplate);
  const componentTree = deriveSemanticComponentTree(domainTemplate, mvpFeatures);
  const dataFlow = deriveSemanticDataFlow(domainTemplate);

  // Start with domain-model-derived architecture
  base.architecture = {
    ...base.architecture,
    pattern: architecturePattern || base.architecture.pattern,
    componentTree: componentTree || base.architecture.componentTree,
    dataFlow: dataFlow || base.architecture.dataFlow,
    domainModel,
    domain: domainIdentity,
  };


  // Merge analysis data if available and non-generic (overrides domain defaults)
  if (analysis) {
    const isGenericPattern = (p: string): boolean => {
      const lower = p.toLowerCase();
      return (
        lower.includes("placeholder") ||
        lower.includes("to be determined") ||
        lower.includes("tbd") ||
        lower.includes("not specified") ||
        lower.includes("nog niet") ||
        lower.includes("modular monolith") ||
        lower.includes("default for undefined") ||
        lower.includes("default architecture") ||
        lower.includes("not yet defined") ||
        lower.includes("nog te bepalen") ||
        lower.length < 5
      );
    };

    if (analysis.suggestedArchitecture && !isGenericPattern(analysis.suggestedArchitecture)) {
      base.architecture.pattern = analysis.suggestedArchitecture;
    }
    if (analysis.technicalAnalysis?.architecturePattern && !isGenericPattern(analysis.technicalAnalysis.architecturePattern)) {
      base.architecture.pattern = analysis.technicalAnalysis.architecturePattern;
    }
    if (analysis.technicalAnalysis?.dataModel && !isGenericPattern(analysis.technicalAnalysis.dataModel)) {
      base.architecture.dataFlow = analysis.technicalAnalysis.dataModel;
    }
  }

  // ── Roadmap ──────────────────────────────
  // Only derive roadmap if existing has no phases (or no existing at all)
  if (!existing || existing.roadmap.phases.length === 0) {
    const roadmapPhases = generateSemanticRoadmap(domainTemplate, deriveMvpFeatures(requirements));
    if (roadmapPhases.length > 0) {
      base.roadmap = {
        ...base.roadmap,
        phases: roadmapPhases,
        activePhaseId: roadmapPhases[0].id,
      };
    }
  }

  return base;
}
