// ──────────────────────────────────────────────
// bootstrapPromptGenerator — Phase 4.1
// Generates a complete Cline bootstrap prompt
// from a ProjectDefinition via RenderModel.
//
// v0.4: Accepts RenderModel as parameter (no longer
// builds it internally). Renderers never derive.
// Renderers only format.
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { RenderModel } from "../generator/renderModel";
import { checkDomainConsistency } from "../semantic/domainConsistency";

/**
 * Generate a Cline bootstrap prompt based on the given ProjectDefinition
 * and pre-built RenderModel.
 *
 * The prompt instructs Cline to create an implementation plan and file plan,
 * without writing code itself.
 *
 * Includes a domain consistency check at the export boundary.
 * If the domain is inconsistent, a warning is prepended to the prompt.
 *
 * @param pd - The ProjectDefinition (used for domain consistency check)
 * @param rm - The pre-built RenderModel (all generators share this)
 */
export function generateClineBootstrapPrompt(
  pd: ProjectDefinition,
  rm: RenderModel
): string {
  // ── Domain consistency check at export boundary ──
  const consistencyReport = checkDomainConsistency(pd);
  const consistencyWarning = consistencyReport.valid
    ? ""
    : `⚠️ **Domain consistency warning:** The generated output may contain vocabulary inconsistent with the project domain "${consistencyReport.domain.id}". Review the following fields:\n${
        consistencyReport.checks
          .filter((c) => !c.match)
          .map((c) => `  - ${c.field}: ${c.actual}`)
          .join("\n")
      }\n\n`;

  const lines: string[] = [];

  // ── Domain consistency warning (if any) ─────
  if (consistencyWarning) {
    lines.push(consistencyWarning);
  }

  // ── Repository state indicator (top) ────────
  const state = rm.repositoryState;
  lines.push(`Repository state: ${state}`);
  lines.push("");

  // ── Decision tree ────────────────────────────
  lines.push("### Decision tree — inspect before planning");
  lines.push("");
  lines.push("Inspect the repository before planning.");
  lines.push("");
  lines.push("1. **Existing code found**");
  lines.push("   → Continue implementation within the current structure.");
  lines.push("2. **Empty repository found**");
  lines.push("   → Initialize the scaffold described in the ProjectDefinition.");
  lines.push("3. **Repository structure differs from the ProjectDefinition**");
  lines.push("   → Explain the mismatch and ask for confirmation before continuing.");
  lines.push("");

  // ── Header ──────────────────────────────────
  lines.push(`# Cline Bootstrap — ${rm.identity.fullName}`);
  lines.push("");
  lines.push(
    "You are receiving a complete project definition. " +
    "Read it carefully and then create an implementation plan and file-by-file plan. " +
    "**Do not write any code yet.**"
  );
  lines.push("");

  // ── State-specific instructions ────────────
  if (state === "greenfield") {
    lines.push("### 🆕 Greenfield project");
    lines.push("");
    lines.push(
      "Create a brand new project from scratch. Initialize the scaffold, install dependencies, " +
      "and set up the full project structure before implementing any features."
    );
  } else if (state === "empty-repository") {
    lines.push("### 📂 Empty repository");
    lines.push("");
    lines.push(
      "The repository exists but contains no application scaffold yet. " +
      "Initialize the project according to the technology stack before implementing features."
    );
  } else {
    lines.push("### 📦 Existing project");
    lines.push("");
    lines.push(
      "Continue implementing the existing repository. Do NOT recreate the scaffold. " +
      "Work within the current project structure."
    );
  }
  lines.push("");

  // ── 1. Project Overview ─────────────────────
  lines.push("## 1. Project Overview");
  lines.push("");
  lines.push(`**Name:** ${rm.identity.fullName}`);
  lines.push(`**Tagline:** ${rm.identity.tagline}`);
  lines.push(`**Version:** ${rm.version}`);
  lines.push(`**Status:** ${rm.status}`);
  if (rm.identity.description) {
    lines.push("");
    lines.push("**Description:**");
    lines.push(rm.identity.description);
  }
  lines.push("");

  // ── 2. Goals and Scope ──────────────────────
  lines.push("## 2. Goals and Scope");
  lines.push("");
  if (rm.product.problemStatement) {
    lines.push(`**Problem:** ${rm.product.problemStatement}`);
  }
  if (rm.product.solution) {
    lines.push(`**Solution:** ${rm.product.solution}`);
  }
  if (rm.product.targetUsers.length > 0) {
    lines.push("**Target users:**");
    rm.product.targetUsers.forEach((u) => lines.push(`- ${u}`));
  }
  if (rm.product.userStories.length > 0) {
    lines.push("**User stories:**");
    rm.product.userStories.forEach((s) => lines.push(`- ${s}`));
  }
  if (rm.product.mvpFeatures && rm.product.mvpFeatures.length > 0) {
    lines.push("**MVP features:**");
    rm.product.mvpFeatures.forEach((f) => lines.push(`- ${f}`));
  } else if (rm.product.mvpScope) {
    lines.push(`**MVP scope:** ${rm.product.mvpScope}`);
  }
  if (!rm.product.problemStatement && !rm.product.solution && rm.product.targetUsers.length === 0) {
    lines.push("_(not yet specified)_");
  }
  lines.push("");

  // ── 3. Technology Stack ─────────────────────
  lines.push("## 3. Technology Stack");
  lines.push("");
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
    if (rm.tech.languages.length > 0) {
      lines.push(`**Languages:** ${rm.tech.languages.join(", ")}`);
    }
    if (rm.tech.frameworks.length > 0) {
      lines.push(`**Frameworks:** ${rm.tech.frameworks.join(", ")}`);
    }
    if (rm.tech.tools.length > 0) {
      lines.push(`**Tools:** ${rm.tech.tools.join(", ")}`);
    }
    if (rm.tech.dependencies.length > 0) {
      lines.push(`**Dependencies:** ${rm.tech.dependencies.join(", ")}`);
    }
  }
  if (rm.tech.constraints.length > 0) {
    lines.push("**Constraints:**");
    rm.tech.constraints.forEach((c) => lines.push(`- ${c}`));
  }
  if (
    !hasCategorized &&
    rm.tech.languages.length === 0 &&
    rm.tech.frameworks.length === 0 &&
    rm.tech.tools.length === 0
  ) {
    lines.push("_(not yet specified)_");
  }
  lines.push("");

  // ── 4. Architecture ─────────────────────────
  lines.push("## 4. Architecture");
  lines.push("");
  if (rm.architecture.pattern) {
    lines.push(`**Pattern:** ${rm.architecture.pattern}`);
  }
  if (rm.architecture.directoryStructure) {
    lines.push("**Directory structure:**");
    lines.push("```");
    lines.push(rm.architecture.directoryStructure);
    lines.push("```");
  }
  if (rm.architecture.componentTree) {
    lines.push("**Component tree:**");
    lines.push("```");
    lines.push(rm.architecture.componentTree);
    lines.push("```");
  }
  if (rm.architecture.dataFlow) {
    lines.push("**Data flow:**");
    lines.push("```");
    lines.push(rm.architecture.dataFlow);
    lines.push("```");
  }
  if (
    !rm.architecture.pattern &&
    !rm.architecture.directoryStructure &&
    !rm.architecture.componentTree &&
    !rm.architecture.dataFlow
  ) {
    lines.push("_(not yet specified)_");
  }
  lines.push("");

  // ── 4b. Domain Model ─────────────────────────
  if (rm.domainModel && rm.domainModel.entities.length > 0) {
    lines.push("## 4b. Domain Model");
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

  // ── 5. Roadmap ──────────────────────────────
  lines.push("## 5. Roadmap");
  lines.push("");
  if (rm.roadmap.phases.length === 0) {
    lines.push("_(no phases defined yet)_");
  } else {
    for (const phase of rm.roadmap.phases) {
      const isActive = phase.id === rm.roadmap.activePhaseId;
      lines.push(`### ${phase.title}${isActive ? " ← CURRENT" : ""}`);
      if (phase.tasks.length === 0) {
        lines.push("- _(no tasks yet)_");
      } else {
        for (const task of phase.tasks) {
          const marker = task.status === "done" ? "[x]" : "[ ]";
          lines.push(`- ${marker} ${task.title}`);
        }
      }
      lines.push("");
    }
  }

  // ── 6. Memory Bank Instructions ──────────────
  lines.push("## 6. Memory Bank Instructions");
  lines.push("");
  lines.push(
    "Cline uses a Memory Bank to maintain context between sessions. " +
    "The following files must be created and maintained:"
  );
  lines.push("");
  if (rm.memory.files.length === 0) {
    lines.push("_(no files defined yet)_");
  } else {
    for (const file of rm.memory.files) {
      const req = file.required ? "required" : "optional";
      lines.push(`- \`${file.path}\` — ${file.description} (${req})`);
    }
  }
  if (rm.memory.updateCadence) {
    lines.push("");
    lines.push(`**Update cadence:** ${rm.memory.updateCadence}`);
  }
  if (rm.memory.patterns.length > 0) {
    lines.push("**Patterns:**");
    rm.memory.patterns.forEach((p) => lines.push(`- ${p}`));
  }
  lines.push("");

  // ── 7. Work Instructions for Cline ───────────
  lines.push("## 7. Work Instructions for Cline");
  lines.push("");
  lines.push(
    "You work in two modes: **Plan** and **Act**. Follow these steps:"
  );
  lines.push("");
  lines.push("### Plan mode");
  lines.push("");
  lines.push(
    "1. Read the full bootstrap prompt and the ProjectDefinition above."
  );
  lines.push(
    "2. Analyze the roadmap and determine which phase and task should be tackled first."
  );
  lines.push(
    "3. Create an **implementation plan** with a clear order of steps."
  );
  lines.push(
    "4. Create a **file-by-file plan** with per-file: path, content description, and any dependencies."
  );
  lines.push(
    "5. Present the plan to the user and wait for approval."
  );
  lines.push("");
  lines.push("### Act mode");
  lines.push("");
  lines.push(
    "1. After plan approval, write the exact files as specified."
  );
  lines.push(
    "2. Adhere to the architecture, technology stack, and quality rules from the project definition."
  );
  lines.push(
    "3. Follow the roadmap: mark completed tasks as `done` and update the Memory Bank."
  );
  lines.push(
    "4. After each session: update `activeContext.md` and `progress.md` with progress."
  );
  lines.push("");

  // ── Quality Rules ──
  if (
    rm.quality.rules.length > 0 ||
    rm.quality.codeStyle ||
    rm.quality.testingStrategy
  ) {
    lines.push("## 8. Quality Rules");
    lines.push("");
    if (rm.quality.codeStyle) {
      lines.push(`**Code style:** ${rm.quality.codeStyle}`);
    }
    if (rm.quality.testingStrategy) {
      lines.push(`**Testing strategy:** ${rm.quality.testingStrategy}`);
    }
    if (rm.quality.rules.length > 0) {
      lines.push("**Validation rules:**");
      rm.quality.rules.forEach((r) => lines.push(`- ${r}`));
    }
    if (rm.quality.fallbackBehavior) {
      lines.push(`**Fallback behavior:** ${rm.quality.fallbackBehavior}`);
    }
    lines.push("");
  }

  // ── Agents (optional) ───────────────────────
  if (rm.agents.agents.length > 0) {
    lines.push("## 9. Agent Configuration");
    lines.push("");
    for (const agent of rm.agents.agents) {
      lines.push(`- **${agent.role}** (${agent.model}): ${agent.promptTemplate}`);
    }
    lines.push("");
  }

  // ── Closing ─────────────────────────────────
  lines.push("---");
  lines.push("");

  if (state === "greenfield") {
    lines.push(
      "**Assignment:** Now create an implementation plan and a file-by-file plan " +
      "based on the above project definition. Do not write any code yet. " +
      "Wait for approval before creating files."
    );
  } else if (state === "empty-repository") {
    lines.push(
      "**Assignment:** Create an implementation plan and a file-by-file plan " +
      "based on the above project definition. Do not write any code yet. " +
      "Wait for approval before creating files."
    );
    lines.push("");
    lines.push("**Before scaffolding:**");
    lines.push("1. Inspect the repository — it exists but is empty.");
    lines.push("2. Initialize the scaffold according to the technology stack.");
    lines.push("3. Only then proceed with feature implementation.");
  } else {
    lines.push(
      "**Assignment:** Create an implementation plan and a file-by-file plan " +
      "based on the above project definition. Do not write any code yet. " +
      "Wait for approval before creating files."
    );
    lines.push("");
    lines.push("**Before proposing new files:**");
    lines.push("1. Inspect the existing repository.");
    lines.push("2. Reuse existing components whenever possible.");
    lines.push("3. Modify existing files instead of creating duplicates.");
    lines.push("4. Only introduce new files when no suitable location exists.");
  }

  return lines.join("\n");
}
