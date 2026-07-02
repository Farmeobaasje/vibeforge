// ──────────────────────────────────────────────
// docsGenerator — Phase 4.4
// Generates README.md, SPEC.md, PRD.md and
// roadmap.md from a ProjectDefinition via RenderModel.
//
// v0.4: Accepts RenderModel as parameter (no longer
// builds it internally). Renderers never derive.
// Renderers only format.
// ──────────────────────────────────────────────

import type {
  ProjectDefinition,
  GeneratedFile,
} from "../types/projectDefinition";
import type { RenderModel } from "../generator/renderModel";
import { checkDomainConsistency } from "../semantic/domainConsistency";

/**
 * Generate all documentation files based on the given ProjectDefinition
 * and pre-built RenderModel.
 *
 * Includes a domain consistency check at the export boundary.
 *
 * @param pd - The ProjectDefinition (used for domain consistency check)
 * @param rm - The pre-built RenderModel (all generators share this)
 */
export function generateDocumentationFiles(
  pd: ProjectDefinition,
  rm: RenderModel
): GeneratedFile[] {
  // ── Domain consistency check at export boundary ──
  const consistencyReport = checkDomainConsistency(pd);
  const consistencyFiles: GeneratedFile[] = consistencyReport.valid
    ? []
    : [
        {
          path: "domain-consistency-report.md",
          language: "markdown",
          content: formatConsistencyReportForDocs(consistencyReport),
        },
      ];

  return [
    ...consistencyFiles,

    {
      path: "README.md",
      language: "markdown",
      content: readmeMd(rm),
    },
    {
      path: "SPEC.md",
      language: "markdown",
      content: specMd(rm),
    },
    {
      path: "PRD.md",
      language: "markdown",
      content: prdMd(rm),
    },
    {
      path: "roadmap.md",
      language: "markdown",
      content: roadmapMd(rm),
    },
  ];
}

// ── Helpers ─────────────────────────────────────

function contextualFallback(value: string, context: string): string {
  if (value && value.trim()) return value;
  return `_${context} — to be refined during project review._`;
}

function contextualListFallback(items: string[] | undefined | null, context: string): string {
  if (items && items.length > 0) {
    return items.map((i) => `- ${i}`).join("\n");
  }
  return `- _${context} — to be refined during project review._`;
}

// ── README.md ───────────────────────────────────

function readmeMd(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# ${rm.identity.fullName}`);
  lines.push("");
  lines.push(`> ${rm.identity.tagline}`);
  lines.push("");

  // Project overview
  lines.push("## Overview");
  lines.push(contextualFallback(rm.identity.description, `${rm.identity.shortName} project overview`));
  lines.push("");

  // Problem
  lines.push("## Problem");
  lines.push(contextualFallback(rm.product.problemStatement, `${rm.identity.shortName} problem statement`));
  lines.push("");

  // Solution
  lines.push("## Solution");
  lines.push(contextualFallback(rm.product.solution, `${rm.identity.shortName} solution description`));
  lines.push("");

  // Tech Stack — use categorized for richer display, fall back to flat arrays
  lines.push("## Tech Stack");
  const cat = rm.tech.categorized;
  const hasCategorized = cat.frontend.length > 0 || cat.backend.length > 0 || cat.database.length > 0 ||
    cat.infrastructure.length > 0 || cat.deployment.length > 0 || cat.integrations.length > 0 ||
    cat.uncategorized.length > 0;
  const hasFlat = rm.tech.languages.length > 0 || rm.tech.frameworks.length > 0 || rm.tech.tools.length > 0 || rm.tech.dependencies.length > 0;

  if (hasCategorized) {
    if (cat.frontend.length > 0) lines.push(`- **Frontend:** ${cat.frontend.join(", ")}`);
    if (cat.backend.length > 0) lines.push(`- **Backend:** ${cat.backend.join(", ")}`);
    if (cat.database.length > 0) lines.push(`- **Database:** ${cat.database.join(", ")}`);
    if (cat.infrastructure.length > 0) lines.push(`- **Infrastructure:** ${cat.infrastructure.join(", ")}`);
    if (cat.deployment.length > 0) lines.push(`- **Deployment:** ${cat.deployment.join(", ")}`);
    if (cat.integrations.length > 0) lines.push(`- **Integrations:** ${cat.integrations.join(", ")}`);
    if (cat.uncategorized.length > 0) lines.push(`- **Other:** ${cat.uncategorized.join(", ")}`);
  } else if (hasFlat) {
    lines.push(`- **Languages:** ${rm.tech.languages.length > 0 ? rm.tech.languages.join(", ") : "_(not specified)_"}`);
    lines.push(`- **Frameworks:** ${rm.tech.frameworks.length > 0 ? rm.tech.frameworks.join(", ") : "_(not specified)_"}`);
    lines.push(`- **Tools:** ${rm.tech.tools.length > 0 ? rm.tech.tools.join(", ") : "_(not specified)_"}`);
    lines.push(`- **Dependencies:** ${rm.tech.dependencies.length > 0 ? rm.tech.dependencies.join(", ") : "_(not specified)_"}`);
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} technology stack`));
  }
  lines.push("");

  // MVP
  lines.push("## MVP");
  if (rm.product.mvpFeatures && rm.product.mvpFeatures.length > 0) {
    rm.product.mvpFeatures.forEach((f) => lines.push(`- ${f}`));
  } else {
    lines.push(contextualFallback(rm.product.mvpScope, `${rm.identity.shortName} MVP scope`));
  }
  lines.push("");

  // Installation
  lines.push("## Getting Started");
  lines.push(`_Setup instructions for ${rm.identity.shortName} — to be added during implementation._`);
  lines.push("");

  // Roadmap overview
  lines.push("## Roadmap");
  if (rm.roadmap.phases.length > 0) {
    for (const phase of rm.roadmap.phases) {
      const isActive = phase.id === rm.roadmap.activePhaseId;
      lines.push(`- **${phase.title}**${isActive ? " ← CURRENT" : ""}`);
      if (phase.tasks.length > 0) {
        for (const task of phase.tasks) {
          const marker = task.status === "done" ? "[x]" : "[ ]";
          lines.push(`  - ${marker} ${task.title}`);
        }
      } else {
        lines.push(`  - _(none specified yet)_`);
      }
    }
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} roadmap phases`));
  }
  lines.push("");

  return lines.join("\n");
}

// ── SPEC.md ─────────────────────────────────────

function specMd(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# Technical Specification — ${rm.identity.fullName}`);
  lines.push("");

  // Requirements
  lines.push("## Requirements");
  lines.push(contextualFallback(rm.identity.description, `${rm.identity.shortName} technical requirements`));
  lines.push("");

  // Non-goals
  lines.push("## Non-goals");
  if (rm.tech.constraints.length > 0) {
    rm.tech.constraints.forEach((c) => lines.push(`- ${c}`));
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} non-goals and out-of-scope items`));
  }
  lines.push("");

  // Architecture
  lines.push("## Architecture");
  lines.push(`- **Pattern:** ${contextualFallback(rm.architecture.pattern, `${rm.identity.shortName} architecture pattern`)}`);
  if (rm.architecture.directoryStructure) {
    lines.push("");
    lines.push("### Directory Structure");
    lines.push("```");
    lines.push(rm.architecture.directoryStructure);
    lines.push("```");
  }
  if (rm.architecture.componentTree) {
    lines.push("");
    lines.push("### Component Tree");
    lines.push("```");
    lines.push(rm.architecture.componentTree);
    lines.push("```");
  }
  if (rm.architecture.dataFlow) {
    lines.push("");
    lines.push("### Data Flow");
    lines.push("```");
    lines.push(rm.architecture.dataFlow);
    lines.push("```");
  }
  lines.push("");

  // Data model (from domain model)
  lines.push("## Data Model");
  if (rm.domainModel && rm.domainModel.entities.length > 0) {
    lines.push("### Entities");
    for (const entity of rm.domainModel.entities) {
      const attrs = entity.attributes ? ` (${entity.attributes.join(", ")})` : "";
      lines.push(`- **${entity.name}**: ${entity.description}${attrs}`);
    }
    if (rm.domainModel.relationships.length > 0) {
      lines.push("");
      lines.push("### Relationships");
      for (const rel of rm.domainModel.relationships) {
        lines.push(`- ${rel.from} ${rel.type} ${rel.to} — ${rel.description}`);
      }
    }
  } else {
    lines.push(`_${rm.identity.shortName} data model — to be defined during implementation._`);
  }
  lines.push("");

  // Quality gates
  lines.push("## Quality Gates");
  if (rm.quality.rules.length > 0) {
    rm.quality.rules.forEach((r) => lines.push(`- ${r}`));
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} quality gates`));
  }
  if (rm.quality.codeStyle) {
    lines.push(`- **Code style:** ${rm.quality.codeStyle}`);
  }
  if (rm.quality.testingStrategy) {
    lines.push(`- **Testing:** ${rm.quality.testingStrategy}`);
  }
  if (rm.quality.fallbackBehavior) {
    lines.push(`- **Fallback behavior:** ${rm.quality.fallbackBehavior}`);
  }
  lines.push("");

  return lines.join("\n");
}

// ── PRD.md ──────────────────────────────────────

function prdMd(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# Product Requirements Document — ${rm.identity.fullName}`);
  lines.push("");

  // Target audience
  lines.push("## Target Audience");
  lines.push(contextualListFallback(rm.product.targetUsers, `${rm.identity.shortName} target audience`));
  lines.push("");

  // Problem
  lines.push("## Problem Statement");
  lines.push(contextualFallback(rm.product.problemStatement, `${rm.identity.shortName} problem statement`));
  lines.push("");

  // User flow
  lines.push("## User Flow");
  if (rm.product.userStories.length > 0) {
    rm.product.userStories.forEach((story, i) => {
      lines.push(`- **Story ${i + 1}:** ${story}`);
    });
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} user stories`));
  }
  lines.push("");

  // MVP scope
  lines.push("## MVP Scope");
  if (rm.product.mvpFeatures && rm.product.mvpFeatures.length > 0) {
    rm.product.mvpFeatures.forEach((f) => lines.push(`- ${f}`));
  } else {
    lines.push(contextualFallback(rm.product.mvpScope, `${rm.identity.shortName} MVP scope`));
  }
  lines.push("");

  // Future extensions
  lines.push("## Future Extensions");
  if (rm.options.extraDocs.length > 0) {
    rm.options.extraDocs.forEach((doc) => lines.push(`- ${doc}`));
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} future extensions`));
  }
  lines.push("");

  return lines.join("\n");
}

// ── roadmap.md ──────────────────────────────────

function roadmapMd(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# Roadmap — ${rm.identity.fullName}`);
  lines.push("");

  if (rm.roadmap.phases.length === 0) {
    lines.push("_(no phases defined yet)_");
    lines.push("");
    return lines.join("\n");
  }

  for (const phase of rm.roadmap.phases) {
    const isActive = phase.id === rm.roadmap.activePhaseId;
    lines.push(`## ${phase.title}${isActive ? " ← CURRENT" : ""}`);
    if (phase.tasks.length === 0) {
      lines.push("- _(no tasks defined yet)_");
    } else {
      for (const task of phase.tasks) {
        const marker = task.status === "done" ? "[x]" : "[ ]";
        lines.push(`- ${marker} ${task.title}`);
      }
    }
    lines.push("");
  }

  lines.push("Legend: [x] done · [ ] pending · ← CURRENT marks the active task.");
  lines.push("");

  return lines.join("\n");
}

// ── Domain consistency report formatter ─────────

function formatConsistencyReportForDocs(report: import("../types/domainIdentity").ConsistencyReport): string {
  const lines: string[] = [];
  lines.push("# Domain Consistency Report");
  lines.push("");
  lines.push(`Domain: ${report.domain.id} (${report.domain.category})`);
  lines.push(`Confidence: ${report.domain.confidence}%`);
  lines.push(`Valid: ${report.valid ? "✅" : "❌"}`);
  lines.push("");

  if (report.warnings.length > 0) {
    lines.push("## Warnings");
    for (const w of report.warnings) {
      lines.push(`- ⚠️ ${w}`);
    }
    lines.push("");
  }

  lines.push("## Checks");
  for (const check of report.checks) {
    const icon = check.match ? "✅" : check.severity === "error" ? "❌" : "⚠️";
    lines.push(`### ${icon} ${check.field}`);
    lines.push(`- Expected: ${check.expected}`);
    lines.push(`- Actual: ${check.actual}`);
    lines.push("");
  }

  return lines.join("\n");
}
