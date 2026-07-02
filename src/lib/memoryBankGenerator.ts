// ──────────────────────────────────────────────
// memoryBankGenerator — Phase 4.3
// Generates memory-bank/* files from a
// ProjectDefinition via RenderModel.
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

/**
 * Generate all memory-bank files based on the given ProjectDefinition
 * and pre-built RenderModel.
 *
 * @param pd - The ProjectDefinition (unused in this generator, kept for API consistency)
 * @param rm - The pre-built RenderModel (all generators share this)
 */
export function generateMemoryBankFiles(
  _pd: ProjectDefinition,
  rm: RenderModel
): GeneratedFile[] {
  return [
    {
      path: "memory-bank/projectbrief.md",
      language: "markdown",
      content: memoryProjectBrief(rm),
    },
    {
      path: "memory-bank/productContext.md",
      language: "markdown",
      content: memoryProductContext(rm),
    },
    {
      path: "memory-bank/activeContext.md",
      language: "markdown",
      content: memoryActiveContext(rm),
    },
    {
      path: "memory-bank/systemPatterns.md",
      language: "markdown",
      content: memorySystemPatterns(rm),
    },
    {
      path: "memory-bank/techContext.md",
      language: "markdown",
      content: memoryTechContext(rm),
    },
    {
      path: "memory-bank/progress.md",
      language: "markdown",
      content: memoryProgress(rm),
    },
  ];
}

// ── Helpers ─────────────────────────────────────

const FALLBACK_TASKS = "- _(no tasks defined yet)_";

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

// ── memory-bank/projectbrief.md ─────────────────

function memoryProjectBrief(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# Project Brief — ${rm.identity.fullName}`);
  lines.push("");

  // Core requirements
  lines.push("## Core requirements");
  lines.push(contextualFallback(rm.identity.description, `${rm.identity.shortName} core requirements`));
  lines.push("");

  // Goals
  lines.push("## Goals");
  if (rm.product.solution) {
    const goals = rm.product.solution
      .split(/[.,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (goals.length > 0) {
      goals.forEach((g) => lines.push(`- ${g}`));
    } else {
      lines.push(contextualListFallback([], `${rm.identity.shortName} goals`));
    }
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} goals`));
  }
  lines.push("");

  // Scope
  lines.push("## Scope");
  if (rm.product.mvpFeatures && rm.product.mvpFeatures.length > 0) {
    rm.product.mvpFeatures.forEach((f) => lines.push(`- ${f}`));
  } else {
    lines.push(contextualFallback(rm.product.mvpScope, `${rm.identity.shortName} scope`));
  }
  lines.push("");

  // Target users
  lines.push("## Target users");
  lines.push(contextualListFallback(rm.product.targetUsers, `${rm.identity.shortName} target users`));
  lines.push("");

  // Tech stack summary — use categorized for richer display, fall back to flat arrays
  lines.push("## Tech stack");
  const cat = rm.tech.categorized;
  const hasCategorized = cat.frontend.length > 0 || cat.backend.length > 0 || cat.database.length > 0 ||
    cat.infrastructure.length > 0 || cat.deployment.length > 0 || cat.integrations.length > 0 ||
    cat.uncategorized.length > 0;
  if (hasCategorized) {
    if (cat.frontend.length > 0) lines.push(`- **Frontend:** ${cat.frontend.join(", ")}`);
    if (cat.backend.length > 0) lines.push(`- **Backend:** ${cat.backend.join(", ")}`);
    if (cat.database.length > 0) lines.push(`- **Database:** ${cat.database.join(", ")}`);
    if (cat.infrastructure.length > 0) lines.push(`- **Infrastructure:** ${cat.infrastructure.join(", ")}`);
    if (cat.deployment.length > 0) lines.push(`- **Deployment:** ${cat.deployment.join(", ")}`);
    if (cat.integrations.length > 0) lines.push(`- **Integrations:** ${cat.integrations.join(", ")}`);
    if (cat.uncategorized.length > 0) lines.push(`- **Other:** ${cat.uncategorized.join(", ")}`);
  } else if (rm.tech.languages.length > 0 || rm.tech.frameworks.length > 0) {
    lines.push(`- Languages: ${rm.tech.languages.join(", ") || "_(not specified)_"}`);
    lines.push(`- Frameworks: ${rm.tech.frameworks.join(", ") || "_(not specified)_"}`);
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} technology stack`));
  }
  lines.push("");

  // Quality rules
  if (rm.quality.rules.length > 0) {
    lines.push("## Quality rules");
    rm.quality.rules.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  return lines.join("\n");
}

// ── memory-bank/productContext.md ───────────────

function memoryProductContext(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# Product Context — ${rm.identity.fullName}`);
  lines.push("");

  // Why this exists
  lines.push("## Why this exists");
  lines.push(contextualFallback(rm.product.problemStatement, `${rm.identity.shortName} problem context`));
  lines.push("");

  // How it should work
  lines.push("## How it should work");
  lines.push(contextualFallback(rm.product.solution, `${rm.identity.shortName} solution overview`));
  lines.push("");

  // Target users
  lines.push("## Target users");
  lines.push(contextualListFallback(rm.product.targetUsers, `${rm.identity.shortName} target users`));
  lines.push("");

  // User stories
  lines.push("## User stories");
  lines.push(contextualListFallback(rm.product.userStories, `${rm.identity.shortName} user stories`));
  lines.push("");

  // MVP scope
  lines.push("## MVP scope");
  if (rm.product.mvpFeatures && rm.product.mvpFeatures.length > 0) {
    rm.product.mvpFeatures.forEach((f) => lines.push(`- ${f}`));
  } else {
    lines.push(contextualFallback(rm.product.mvpScope, `${rm.identity.shortName} MVP scope`));
  }
  lines.push("");

  // Quality rules
  if (rm.quality.rules.length > 0) {
    lines.push("## Quality rules");
    rm.quality.rules.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  return lines.join("\n");
}

// ── memory-bank/activeContext.md ────────────────

function memoryActiveContext(rm: RenderModel): string {
  const lines: string[] = [];
  const activePhase = rm.roadmap.phases.find(
    (p) => p.id === rm.roadmap.activePhaseId
  );

  lines.push(`# Active Context — ${rm.identity.fullName}`);
  lines.push("");

  // Current focus
  lines.push("## Current focus");
  if (activePhase) {
    lines.push(`Phase: ${activePhase.title}`);
    const activeTask = activePhase.tasks.find((t) => t.status === "pending");
    if (activeTask) {
      lines.push(`Active task: ${activeTask.title}`);
    }
  } else {
    lines.push(`_${rm.identity.shortName} — no active phase set._`);
  }
  lines.push("");

  // Recent changes
  lines.push("## Recent changes");
  lines.push("- Project bootstrapped via VibeForge");
  lines.push("");

  // Next steps
  lines.push("## Next steps");
  if (rm.roadmap.phases.length > 0) {
    for (const phase of rm.roadmap.phases) {
      const isActive = phase.id === rm.roadmap.activePhaseId;
      const pendingTasks = phase.tasks.filter((t) => t.status === "pending");
      if (pendingTasks.length > 0) {
        lines.push(`- ${phase.title}${isActive ? " ← CURRENT" : ""}`);
        pendingTasks.forEach((t) => lines.push(`  - ${t.title}`));
      } else if (phase.tasks.length === 0) {
        lines.push(`- ${phase.title}${isActive ? " ← CURRENT" : ""} — ${FALLBACK_TASKS}`);
      }
    }
  } else {
    lines.push(contextualListFallback([], `${rm.identity.shortName} next steps`));
  }
  lines.push("");

  // Active decisions
  lines.push("## Active decisions");
  if (rm.tech.languages.length > 0 || rm.tech.frameworks.length > 0) {
    lines.push(`- Stack: ${rm.tech.languages.join(", ")} / ${rm.tech.frameworks.join(", ")}`);
  }
  if (rm.architecture.pattern) {
    lines.push(`- Architecture: ${rm.architecture.pattern}`);
  }
  if (rm.tech.constraints.length > 0) {
    lines.push("- Constraints:");
    rm.tech.constraints.forEach((c) => lines.push(`  - ${c}`));
  }
  if (rm.tech.languages.length === 0 && rm.tech.frameworks.length === 0 && !rm.architecture.pattern) {
    lines.push(contextualListFallback([], `${rm.identity.shortName} active decisions`));
  }
  lines.push("");

  return lines.join("\n");
}

// ── memory-bank/systemPatterns.md ───────────────

function memorySystemPatterns(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# System Patterns — ${rm.identity.fullName}`);
  lines.push("");

  // Architecture
  lines.push("## Architecture");
  lines.push(contextualFallback(rm.architecture.pattern, `${rm.identity.shortName} architecture pattern`));
  lines.push("");

  // Directory structure
  lines.push("## Directory structure");
  if (rm.architecture.directoryStructure) {
    lines.push("```");
    lines.push(rm.architecture.directoryStructure);
    lines.push("```");
  } else {
    lines.push(contextualFallback("", `${rm.identity.shortName} directory structure`));
  }
  lines.push("");

  // Component tree
  lines.push("## Component tree");
  if (rm.architecture.componentTree) {
    lines.push("```");
    lines.push(rm.architecture.componentTree);
    lines.push("```");
  } else {
    lines.push(contextualFallback("", `${rm.identity.shortName} component tree`));
  }
  lines.push("");

  // Data flow
  lines.push("## Data flow");
  if (rm.architecture.dataFlow) {
    lines.push("```");
    lines.push(rm.architecture.dataFlow);
    lines.push("```");
  } else {
    lines.push(contextualFallback("", `${rm.identity.shortName} data flow`));
  }
  lines.push("");

  // Key technical decisions
  lines.push("## Key technical decisions");
  if (rm.tech.languages.length > 0) {
    lines.push(`- Languages: ${rm.tech.languages.join(", ")}`);
  }
  if (rm.tech.frameworks.length > 0) {
    lines.push(`- Frameworks: ${rm.tech.frameworks.join(", ")}`);
  }
  if (rm.tech.tools.length > 0) {
    lines.push(`- Tools: ${rm.tech.tools.join(", ")}`);
  }
  if (rm.tech.dependencies.length > 0) {
    lines.push(`- Dependencies: ${rm.tech.dependencies.join(", ")}`);
  }
  if (rm.tech.languages.length === 0 && rm.tech.frameworks.length === 0) {
    lines.push(contextualListFallback([], `${rm.identity.shortName} key technical decisions`));
  }
  lines.push("");

  // Constraints
  if (rm.tech.constraints.length > 0) {
    lines.push("## Constraints");
    rm.tech.constraints.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  // Domain model (from canonical domain model)
  if (rm.domainModel && rm.domainModel.entities.length > 0) {
    lines.push("## Domain Model");
    lines.push("");
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
    lines.push("");
  }

  return lines.join("\n");
}

// ── memory-bank/techContext.md ──────────────────

function memoryTechContext(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# Tech Context — ${rm.identity.fullName}`);
  lines.push("");

  // Technologies used — use categorized for richer display, fall back to flat arrays
  lines.push("## Technologies used");
  const cat = rm.tech.categorized;
  const hasCategorized = cat.frontend.length > 0 || cat.backend.length > 0 || cat.database.length > 0 ||
    cat.infrastructure.length > 0 || cat.deployment.length > 0 || cat.integrations.length > 0 ||
    cat.uncategorized.length > 0;
  if (hasCategorized) {
    if (cat.frontend.length > 0) lines.push(`- **Frontend:** ${cat.frontend.join(", ")}`);
    if (cat.backend.length > 0) lines.push(`- **Backend:** ${cat.backend.join(", ")}`);
    if (cat.database.length > 0) lines.push(`- **Database:** ${cat.database.join(", ")}`);
    if (cat.infrastructure.length > 0) lines.push(`- **Infrastructure:** ${cat.infrastructure.join(", ")}`);
    if (cat.deployment.length > 0) lines.push(`- **Deployment:** ${cat.deployment.join(", ")}`);
    if (cat.integrations.length > 0) lines.push(`- **Integrations:** ${cat.integrations.join(", ")}`);
    if (cat.uncategorized.length > 0) lines.push(`- **Other:** ${cat.uncategorized.join(", ")}`);
  } else {
    lines.push(`- Languages: ${rm.tech.languages.join(", ") || "_(not specified)_"}`);
    lines.push(`- Frameworks: ${rm.tech.frameworks.join(", ") || "_(not specified)_"}`);
    lines.push(`- Tools: ${rm.tech.tools.join(", ") || "_(not specified)_"}`);
    lines.push(`- Dependencies: ${rm.tech.dependencies.join(", ") || "_(not specified)_"}`);
  }
  lines.push("");

  // Constraints
  lines.push("## Constraints");
  lines.push(contextualListFallback(rm.tech.constraints, `${rm.identity.shortName} constraints`));
  lines.push("");

  // Setup
  lines.push("## Setup");
  lines.push(contextualFallback("", `${rm.identity.shortName} setup instructions`));
  lines.push("");

  // Development
  lines.push("## Development");
  lines.push(`- Code style: ${rm.quality.codeStyle || contextualFallback("", `${rm.identity.shortName} code style`)}`);
  lines.push(`- Testing: ${rm.quality.testingStrategy || contextualFallback("", `${rm.identity.shortName} testing strategy`)}`);
  if (rm.quality.fallbackBehavior) {
    lines.push(`- Fallback behavior: ${rm.quality.fallbackBehavior}`);
  }
  lines.push("");

  // Quality rules
  if (rm.quality.rules.length > 0) {
    lines.push("## Quality rules");
    rm.quality.rules.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  return lines.join("\n");
}

// ── memory-bank/progress.md ─────────────────────

function memoryProgress(rm: RenderModel): string {
  const lines: string[] = [];
  const activePhase = rm.roadmap.phases.find(
    (p) => p.id === rm.roadmap.activePhaseId
  );

  lines.push(`# Progress — ${rm.identity.fullName}`);
  lines.push("");

  // ── STATUS block ─────────────────────────────
  lines.push("## STATUS");

  const currentPhaseTitle = activePhase
    ? activePhase.title
    : "_(not set)_";

  const allDoneTasks = rm.roadmap.phases.flatMap((p) =>
    p.tasks.filter((t) => t.status === "done")
  );
  const allPendingTasks = rm.roadmap.phases.flatMap((p) =>
    p.tasks.filter((t) => t.status === "pending")
  );

  lines.push(`CURRENT_PHASE: ${currentPhaseTitle}`);
  lines.push(
    `DONE_LAST_SESSION: ${
      allDoneTasks.length > 0
        ? allDoneTasks.map((t) => t.title).join(", ")
        : "none"
    }`
  );
  lines.push(
    `NEXT: ${
      allPendingTasks.length > 0
        ? allPendingTasks[0].title
        : "_(all tasks complete)_"
    }`
  );
  lines.push("BLOCKERS: none");
  lines.push("");

  // ── What works ───────────────────────────────
  lines.push("## What works");
  if (allDoneTasks.length > 0) {
    allDoneTasks.forEach((t) => lines.push(`- ${t.title}`));
  } else {
    lines.push("- _(nothing completed yet)_");
  }
  lines.push("");

  // ── What's left ──────────────────────────────
  lines.push("## What's left");
  if (allPendingTasks.length > 0) {
    allPendingTasks.forEach((t) => lines.push(`- ${t.title}`));
  } else {
    lines.push("- _(no pending tasks)_");
  }
  lines.push("");

  // ── Per-phase breakdown ──────────────────────
  if (rm.roadmap.phases.length > 0) {
    lines.push("## Phase breakdown");
    lines.push("");
    for (const phase of rm.roadmap.phases) {
      const isActive = phase.id === rm.roadmap.activePhaseId;
      lines.push(`### ${phase.title}${isActive ? " ← CURRENT" : ""}`);
      if (phase.tasks.length === 0) {
        lines.push(FALLBACK_TASKS);
      } else {
        for (const task of phase.tasks) {
          const marker = task.status === "done" ? "[x]" : "[ ]";
          lines.push(`- ${marker} ${task.title}`);
        }
      }
      lines.push("");
    }
  }

  // ── Known issues ─────────────────────────────
  lines.push("## Known issues");
  lines.push("- none yet");
  lines.push("");

  return lines.join("\n");
}
