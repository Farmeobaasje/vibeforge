// ──────────────────────────────────────────────
// canonicalToProjectDefinition — Bridge
//
// Maps CanonicalExtractionResult → ProjectDefinition.
//
// Architecture rule: Canonical objects exist ONLY
// within the extraction layer. After this bridge,
// ProjectDefinition is the single source of truth.
//
// This bridge:
//   - Maps typed canonical fields → ProjectDefinition fields
//   - Sets identity (source tracing) and confidence scores
//   - Uses canonicalStack for tech categorization
//   - Preserves existing fields that weren't extracted
// ──────────────────────────────────────────────

import type { ProjectDefinition, ExtractionIdentity, ConfidenceScores } from "../types/projectDefinition";
import { defaultProjectDefinition } from "../types/projectDefinition";
import type { ProjectDomain } from "../types/domainIdentity";
import type { CanonicalExtractionResult } from "./types";
import { categorizeTechStack } from "../semantic/canonicalStack";

/**
 * Map a CanonicalExtractionResult into a ProjectDefinition.
 *
 * @param canonical - The canonical extraction result (from LLM or deterministic)
 * @param existing  - Optional existing ProjectDefinition to merge into
 * @returns A merged ProjectDefinition with canonical data applied
 */
export function canonicalToProjectDefinition(
  canonical: CanonicalExtractionResult,
  existing?: ProjectDefinition,
): ProjectDefinition {
  const base = existing
    ? JSON.parse(JSON.stringify(existing)) as ProjectDefinition
    : JSON.parse(JSON.stringify(defaultProjectDefinition)) as ProjectDefinition;

  // ── Identity & source tracing ──────────────
  const fieldSources: Record<string, "llm" | "deterministic" | "fallback"> = {
    identity: canonical.source,
    users: canonical.users.source,
    mvpFeatures: canonical.mvpFeatures.source,
    techStack: canonical.techStack.source,
    architecture: canonical.architecture.source,
    roadmap: canonical.roadmap.source,
    integrations: canonical.integrations.source,
    constraints: canonical.constraints.source,
    goals: canonical.goals.source,
    risks: canonical.risks.source,
    entities: canonical.entities.source,
  };

  base.identity = {
    source: canonical.source,
    fieldSources,
  } satisfies ExtractionIdentity;

  base.confidence = {
    overall: canonical.overallConfidence,
    byField: { ...canonical.confidenceByField },
  } satisfies ConfidenceScores;

  // ── Project info ──────────────────────────
  // Canonical tagline gets priority over base/default tagline.
  // The canonical result may contain a domain-specific tagline from the LLM.
  const canonicalTagline = canonical.identity.tagline
    || `${canonical.identity.projectName} — ${canonical.identity.projectType}`;
  base.project = {
    ...base.project,
    name: canonical.identity.projectName || base.project.name,
    tagline: canonicalTagline,
    description: base.project.description || "",
    status: base.project.status === "idea" ? "draft" : base.project.status,
  };

  // ── Domain identity ───────────────────────
  // v0.6: LLM-first domain extraction.
  // domainLabel and domainCategory come from the LLM directly.
  // templateId is OPTIONAL — only set if the LLM explicitly provided it.
  // If no templateId, we don't force-fit into a template.
  const domainCategory = canonical.identity.domainCategory
    || mapDomainIdToCategory(canonical.identity.domain.id);

  const domainIdentity: ProjectDomain = {
    id: canonical.identity.domain.id,
    domainLabel: canonical.identity.domainLabel || "",
    domainCategory,
    category: domainCategory,
    templateId: canonical.identity.templateId || "", // optional — empty string is valid
    confidence: canonical.identity.domain.confidence,
    scores: { ...canonical.identity.domain.scores },
    evidence: [...canonical.identity.domain.evidence],
    source: canonical.identity.domain.source,
  };


  base.architecture = {
    ...base.architecture,
    domain: domainIdentity,
  };

  // ── Product info ──────────────────────────
  const targetUsers = canonical.users.personas
    .filter((p) => p.confidence >= 30)
    .map((p) => p.name)
    .filter(Boolean);

  const mvpFeatures = canonical.mvpFeatures.features
    .filter((f) => f.confidence >= 30)
    .map((f) => f.name)
    .filter(Boolean);

  base.product = {
    ...base.product,
    targetUsers: targetUsers.length > 0 ? targetUsers : base.product.targetUsers,
    mvpFeatures: mvpFeatures.length > 0 ? mvpFeatures : base.product.mvpFeatures,
  };

  // ── Tech stack ────────────────────────────
  // Map canonical tech items to flat arrays for ProjectDefinition
  const techNames = canonical.techStack.items
    .filter((item) => item.confidence >= 30)
    .map((item) => item.canonicalName || item.name)
    .filter(Boolean);

  const categorized = categorizeTechStack(techNames);

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
    constraints: [
      ...canonical.constraints.items
        .filter((c) => c.confidence >= 30)
        .map((c) => c.description),
      ...base.tech.constraints,
    ],
  };

  // ── Architecture ──────────────────────────
  base.architecture = {
    ...base.architecture,
    pattern: canonical.architecture.pattern || base.architecture.pattern,
    componentTree: canonical.architecture.componentTree || base.architecture.componentTree,
    dataFlow: canonical.architecture.dataFlow || base.architecture.dataFlow,
  };

  // ── Domain Model (entities → architecture.domainModel) ──
  // Map canonical entities to the domain model if not already set
  if (canonical.entities.items.length > 0 && (!existing || !existing.architecture.domainModel || existing.architecture.domainModel.entities.length === 0)) {
    base.architecture.domainModel = {
      entities: canonical.entities.items.map((item) => ({
        name: item.name,
        description: `${item.name} entity`,
        attributes: [],
      })),
      relationships: [],
    };
  }

  // ── Roadmap ──────────────────────────────
  // Only set roadmap if canonical has phases and existing has none
  if (canonical.roadmap.phases.length > 0 && (!existing || existing.roadmap.phases.length === 0)) {
    const phases = canonical.roadmap.phases.map((phase, idx) => ({
      id: `phase-${idx + 1}`,
      title: phase.title,
      tasks: phase.tasks.map((task, tIdx) => ({
        id: `task-${idx + 1}-${tIdx + 1}`,
        title: task,
        status: "pending" as const,
      })),
    }));

    base.roadmap = {
      ...base.roadmap,
      phases,
      activePhaseId: phases.length > 0 ? phases[0].id : null,
    };
  }

  // ── Integrations (stored in tech.dependencies) ──
  const integrationNames = canonical.integrations.items
    .filter((i) => i.confidence >= 30)
    .map((i) => i.name)
    .filter(Boolean);

  if (integrationNames.length > 0) {
    base.tech.dependencies = [
      ...new Set([...base.tech.dependencies, ...integrationNames]),
    ];
  }

  // ── Goals → user stories (if no existing stories) ──
  if (!existing || existing.product.userStories.length === 0) {
    const goalStories = canonical.goals.items
      .filter((g) => g.confidence >= 30)
      .map((g) => g.description)
      .filter(Boolean);

    if (goalStories.length > 0) {
      base.product.userStories = goalStories;
    }
  }

  // ── Warnings ──────────────────────────────
  // Store warnings in quality.validationRules for visibility
  if (canonical.warnings.length > 0) {
    const warningRules = canonical.warnings.map((w) => `⚠️ ${w}`);
    base.quality = {
      ...base.quality,
      validationRules: [
        ...warningRules,
        ...base.quality.validationRules,
      ],
    };
  }

  return base;
}

/**
 * Map a domain ID to a category for backward compatibility.
 * Used when domainCategory is not provided by the canonical result.
 */
function mapDomainIdToCategory(domainId: string): string {
  const categoryMap: Record<string, string> = {
    "ai-saas/support-platform": "ai_saas",
    "ai-saas": "ai_saas",
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
