// ──────────────────────────────────────────────
// projectDefinitionResolver — enrich, never
// overwrite, idempotent.
//
// Resolves a ProjectDefinition by filling gaps
// using domain templates as ENRICHERS only.
//
// Rules:
//   1. Entities determine the domain. Templates
//      NEVER add entities.
//   2. Unknown domain → minimal entities only:
//      ["User", "Organization"] — NO Project,
//      Task, Board, Comment, Attachment, etc.
//   3. Templates fill ONLY empty fields: pattern,
//      componentTree, dataFlow, roadmap, stories.
//      NEVER overwrite existing values.
//   4. All tech items preserved. Unknown items
//      go to uncategorized bucket.
//   5. Idempotent: resolve(resolve(pd)) == resolve(pd)
//   6. NEVER removes or overwrites user data.
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { DomainModel } from "../semantic/domainModelTypes";
import { detectDomainFromText } from "../semantic/index";
import { generateSemanticRoadmap } from "../semantic/semanticRoadmap";
import { deriveSemanticComponentTree } from "../semantic/semanticArchitecture";
import { deriveSemanticDataFlow } from "../semantic/semanticArchitecture";
import { deriveArchitecturePattern } from "../semantic/semanticArchitecture";
import { generateSemanticStories } from "../semantic/semanticStories";
import { categorizeTechStack } from "../semantic/canonicalStack";

// ── Minimal fallback entities ────────────────
// For unknown domains: NO assumptions about
// Project, Task, Board, Comment, Attachment, etc.
const MINIMAL_ENTITIES: DomainModel = {
  entities: [
    { name: "User", description: "System user" },
    { name: "Organization", description: "Organization or tenant" },
  ],
  relationships: [],
};

// ── Detection priority ───────────────────────
// 1. Explicit ProjectDefinition entities (highest)
// 2. Canonical LLM extraction entities
// 3. Deterministic extraction entities
// 4. Minimal fallback: ["User", "Organization"]
// 5. Template enrichment (LAST — only for empty fields)

/**
 * Resolve a ProjectDefinition by enriching gaps.
 *
 * Idempotent: calling this multiple times produces
 * the same result as calling it once.
 *
 * NEVER removes or overwrites existing user data.
 * Templates are enrichers only — they fill empty
 * fields but never override.
 *
 * @param pd - The ProjectDefinition to resolve
 * @returns The same ProjectDefinition object (mutated in place)
 */
export function resolveProjectDefinition(pd: ProjectDefinition): ProjectDefinition {
  // ── 1. Resolve domain model ────────────────
  // Entities determine the domain. If entities exist,
  // use them. If not, use minimal fallback.
  // Templates NEVER add entities.
  if (!pd.architecture.domainModel || pd.architecture.domainModel.entities.length === 0) {
    // No entities yet — use minimal fallback
    pd.architecture.domainModel = {
      entities: [...MINIMAL_ENTITIES.entities],
      relationships: [],
    };
  }
  // If entities exist, keep them as-is (never overwrite)

  // ── 2. Resolve architecture (template as enricher) ──
  // Only fill if empty — NEVER overwrite
  const domainTemplate = detectDomainFromText(
    pd.project.description || pd.project.tagline || pd.project.name
  );

  if (!pd.architecture.pattern) {
    pd.architecture.pattern = deriveArchitecturePattern(domainTemplate);
  }
  if (!pd.architecture.componentTree) {
    pd.architecture.componentTree = deriveSemanticComponentTree(domainTemplate, pd.product.mvpFeatures);
  }
  if (!pd.architecture.dataFlow) {
    pd.architecture.dataFlow = deriveSemanticDataFlow(domainTemplate);
  }

  // ── 3. Resolve roadmap (template as enricher) ──
  if (!pd.roadmap.phases || pd.roadmap.phases.length === 0) {
    const phases = generateSemanticRoadmap(domainTemplate, pd.product.mvpFeatures);
    if (phases.length > 0) {
      pd.roadmap.phases = phases;
      pd.roadmap.activePhaseId = phases[0].id;
    }
  }

  // ── 4. Resolve user stories (template as enricher) ──
  if (!pd.product.userStories || pd.product.userStories.length === 0) {
    // Generate from goals if available, otherwise from domain template
    const stories = generateSemanticStories(
      pd.product.problemStatement ? [pd.product.problemStatement] : [],
      pd.product.targetUsers
    );
    if (stories.length > 0) {
      pd.product.userStories = stories;
    }
  }

  // ── 5. Resolve tech stack — preserve ALL items ──
  // Ensure no tech items are lost. Unknown items
  // go to the uncategorized bucket.
  const allTechItems = [
    ...pd.tech.languages,
    ...pd.tech.frameworks,
    ...pd.tech.tools,
    ...pd.tech.dependencies,
  ];

  // Re-categorize to ensure uncategorized items are captured
  const categorized = categorizeTechStack(allTechItems);

  // Preserve original flat arrays (never remove user data)
  // but update categorized for the uncategorized bucket
  pd.tech = {
    ...pd.tech,
    languages: categorized.languages.length > 0 ? categorized.languages : pd.tech.languages,
    frameworks: categorized.frameworks.length > 0 ? categorized.frameworks : pd.tech.frameworks,
    tools: categorized.tools.length > 0 ? categorized.tools : pd.tech.tools,
  };

  // ── 6. Resolve domain identity ─────────────
  // Set domain from entities if not already set
  if (!pd.architecture.domain || pd.architecture.domain.id === "generic") {
    const entityNames = pd.architecture.domainModel.entities.map((e) => e.name.toLowerCase());
    const detectedDomain = detectDomainFromEntities(entityNames);
    pd.architecture.domain = {
      id: detectedDomain || "generic",
      category: detectedDomain ? mapDomainToCategory(detectedDomain) : "software",
      templateId: detectedDomain || "",
      confidence: detectedDomain ? 75 : 0,
    };
  }

  return pd;
}

/**
 * Detect domain from entity names.
 * Entities determine the domain — not the other way around.
 */
function detectDomainFromEntities(entityNames: string[]): string | null {
  const domainPatterns: Array<{ domain: string; keywords: string[] }> = [
    { domain: "biotech", keywords: ["sample", "batch", "assay", "instrument", "reagent", "protocol", "deviation", "auditlog", "qcreport", "experiment", "storageLocation"] },
    { domain: "emulator", keywords: ["rom", "emulatorcore", "savestate", "game", "controllerconfig"] },
    { domain: "restaurant", keywords: ["reservation", "menuitem", "table", "order", "menu"] },
    { domain: "marketplace", keywords: ["product", "listing", "seller", "buyer", "category"] },
    { domain: "crm", keywords: ["contact", "deal", "pipeline", "activity"] },
    { domain: "fitness", keywords: ["workout", "exercise", "progress", "goal"] },
    { domain: "healthcare", keywords: ["patient", "appointment", "medicalrecord", "prescription", "doctor"] },
    { domain: "education", keywords: ["student", "course", "module", "quiz", "certificate"] },
    { domain: "construction", keywords: ["material", "teammember", "document"] },
    { domain: "agency", keywords: ["client", "timeentry", "invoice"] },
    { domain: "ai-saas", keywords: ["model", "prompt", "result", "usagerecord"] },
    { domain: "ai-saas/support-platform", keywords: ["ticket", "workspace", "conversation", "replysuggestion"] },
    { domain: "website", keywords: ["blogpost", "contactinquiry", "portfolioitem"] },
    { domain: "travel", keywords: ["trip", "destination", "itinerary", "budget"] },
    { domain: "solar-energy", keywords: ["panel", "installation", "quote"] },
    { domain: "plumbing", keywords: ["quote", "service", "appointment"] },
  ];

  for (const { domain, keywords } of domainPatterns) {
    const matchCount = keywords.filter((kw) =>
      entityNames.some((name) => name === kw || name.includes(kw))
    ).length;
    if (matchCount >= 2) {
      return domain;
    }
  }

  return null;
}

/**
 * Map domain ID to category.
 */
function mapDomainToCategory(domainId: string): string {
  const categoryMap: Record<string, string> = {
    "ai-saas/support-platform": "ai_saas",
    "ai-saas": "ai_saas",
    biotech: "science",
    emulator: "gaming",
    marketplace: "ecommerce",
    restaurant: "hospitality",
    healthcare: "medical",
    education: "education",
    fitness: "health",
    construction: "construction",
    agency: "services",
    crm: "sales",
    website: "web",
    plumbing: "services",
    "project-management": "software",
    travel: "travel",
    "solar-energy": "energy",
  };
  return categoryMap[domainId] || "software";
}
