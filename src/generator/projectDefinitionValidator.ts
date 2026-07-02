// ──────────────────────────────────────────────
// projectDefinitionValidator — Single validator
// with multiple check categories.
//
// Validates a ProjectDefinition before generation.
// ERROR severity blocks generation.
// WARNING severity does not block generation.
//
// Categories:
//   Schema   — structural validity, required fields
//   Domain   — domain consistency, entity alignment
//   Cross    — cross-document consistency
//   Stack    — tech stack coherence
//   Quality  — completeness, fallback quality
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";

// ── Validation Result Types ───────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  category: "Schema" | "Domain" | "Cross" | "Stack" | "Quality";
  severity: ValidationSeverity;
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
}

// ── Domain-specific entity expectations ──────

const DOMAIN_EXPECTED_ENTITIES: Record<string, string[]> = {
  biotech: ["sample", "batch", "assay", "instrument", "reagent", "protocol", "deviation", "auditlog", "qcreport", "experiment", "storagelocation"],
  emulator: ["rom", "emulatorcore", "savestate", "game", "controllerconfig"],
  restaurant: ["customer", "reservation", "order", "menuitem", "table"],
  marketplace: ["user", "product", "order", "review", "category"],
  crm: ["contact", "deal", "activity", "pipeline", "user"],
  fitness: ["user", "workout", "exercise", "progress", "goal"],
  healthcare: ["patient", "appointment", "medicalrecord", "prescription", "doctor"],
  education: ["student", "course", "module", "quiz", "certificate"],
  construction: ["project", "task", "material", "teammember", "document"],
  agency: ["client", "project", "timeentry", "invoice", "teammember"],
  "ai-saas": ["user", "model", "prompt", "result", "usagerecord"],
  "ai-saas/support-platform": ["workspace", "user", "ticket", "conversation", "replysuggestion", "integration"],
  website: ["page", "blogpost", "contactinquiry", "portfolioitem"],
};

// ── PM-related entity names (template leakage markers) ──

const PM_ENTITY_NAMES = new Set([
  "project", "task", "board", "comment", "attachment", "sprint", "backlog",
  "epic", "storypoint", "timesheet", "milestone", "kanban", "scrum",
]);

// ── Main Validator ────────────────────────────

/**
 * Validate a ProjectDefinition before generation.
 *
 * @param pd - The ProjectDefinition to validate
 * @returns A ValidationResult with all issues found
 */
export function validateProjectDefinition(pd: ProjectDefinition): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ── Schema checks ──────────────────────────
  issues.push(...validateSchema(pd));

  // ── Domain checks ──────────────────────────
  issues.push(...validateDomain(pd));

  // ── Cross-document checks ──────────────────
  issues.push(...validateCrossDocument(pd));

  // ── Stack checks ───────────────────────────
  issues.push(...validateStack(pd));

  // ── Quality checks ─────────────────────────
  issues.push(...validateQuality(pd));

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    infos,
  };
}

// ── Schema Validation ────────────────────────

function validateSchema(pd: ProjectDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!pd.project.name || pd.project.name.trim() === "") {
    issues.push({
      category: "Schema",
      severity: "error",
      field: "project.name",
      message: "Project name is required",
      suggestion: "Set a project name in the Project Definition",
    });
  }

  if (!pd.project.tagline || pd.project.tagline.trim() === "") {
    issues.push({
      category: "Schema",
      severity: "warning",
      field: "project.tagline",
      message: "Project tagline is empty",
      suggestion: "Add a brief tagline describing the project",
    });
  }

  if (!pd.architecture.domain) {
    issues.push({
      category: "Schema",
      severity: "warning",
      field: "architecture.domain",
      message: "No domain identity set",
      suggestion: "Run domain detection to set the project domain",
    });
  }

  return issues;
}

// ── Domain Validation ────────────────────────

function validateDomain(pd: ProjectDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const domain = pd.architecture.domain;
  const domainModel = pd.architecture.domainModel;

  if (!domain || domain.id === "generic" || domain.confidence === 0) {
    issues.push({
      category: "Domain",
      severity: "warning",
      field: "architecture.domain",
      message: "Domain is generic or unset — template leakage may occur",
      suggestion: "Provide more project context or set the domain explicitly",
    });
    return issues;
  }

  // Check for PM entity leakage in non-PM domains
  if (domain.id !== "project-management" && domainModel?.entities) {
    const entityNames = domainModel.entities.map((e) => e.name.toLowerCase());
    const pmEntitiesFound = entityNames.filter((name) => PM_ENTITY_NAMES.has(name));

    if (pmEntitiesFound.length >= 2) {
      issues.push({
        category: "Domain",
        severity: "error",
        field: "architecture.domainModel.entities",
        message: `Template leakage detected: domain "${domain.id}" contains PM entities: ${pmEntitiesFound.join(", ")}`,
        suggestion: `Remove PM entities (${pmEntitiesFound.join(", ")}) and add domain-specific entities for "${domain.id}"`,
      });
    } else if (pmEntitiesFound.length === 1) {
      issues.push({
        category: "Domain",
        severity: "warning",
        field: "architecture.domainModel.entities",
        message: `Possible template leakage: entity "${pmEntitiesFound[0]}" is PM-related for domain "${domain.id}"`,
        suggestion: `Consider replacing "${pmEntitiesFound[0]}" with a domain-specific entity`,
      });
    }
  }

  // Check domain model entities match expected domain entities
  if (domainModel?.entities && domainModel.entities.length > 0) {
    const entityNames = domainModel.entities.map((e) => e.name.toLowerCase());
    const expectedEntities = DOMAIN_EXPECTED_ENTITIES[domain.id];

    if (expectedEntities && expectedEntities.length > 0) {
      const missingEntities = expectedEntities.filter(
        (e) => !entityNames.some((name) => name === e || name.includes(e))
      );

      if (missingEntities.length >= 3) {
        issues.push({
          category: "Domain",
          severity: "warning",
          field: "architecture.domainModel.entities",
          message: `Domain "${domain.id}" is missing expected entities: ${missingEntities.join(", ")}`,
          suggestion: `Add entities like: ${missingEntities.slice(0, 5).join(", ")}`,
        });
      }
    }
  }

  // Check domain confidence
  if (domain.confidence < 50 && domain.confidence > 0) {
    issues.push({
      category: "Domain",
      severity: "warning",
      field: "architecture.domain.confidence",
      message: `Domain "${domain.id}" has low confidence (${domain.confidence}%)`,
      suggestion: "Review domain detection or set domain explicitly",
    });
  }

  return issues;
}

// ── Cross-document Validation ────────────────

function validateCrossDocument(pd: ProjectDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check that tagline and description are consistent
  if (pd.project.tagline && pd.project.description) {
    const taglineWords = new Set(pd.project.tagline.toLowerCase().split(/\s+/));
    const descWords = pd.project.description.toLowerCase();
    const hasOverlap = [...taglineWords].some(
      (word) => word.length > 3 && descWords.includes(word)
    );

    if (!hasOverlap) {
      issues.push({
        category: "Cross",
        severity: "info",
        field: "project.tagline vs project.description",
        message: "Tagline and description share no significant keywords",
        suggestion: "Ensure tagline and description reference the same project domain",
      });
    }
  }

  // Check that MVP features are reflected in roadmap
  if (pd.product.mvpFeatures.length > 0 && pd.roadmap.phases.length > 0) {
    const allTaskTitles = pd.roadmap.phases.flatMap((p) =>
      p.tasks.map((t) => t.title.toLowerCase())
    );
    const missingFeatures = pd.product.mvpFeatures.filter(
      (f) => !allTaskTitles.some((task) => task.includes(f.toLowerCase()))
    );

    if (missingFeatures.length > 0) {
      issues.push({
        category: "Cross",
        severity: "info",
        field: "product.mvpFeatures vs roadmap.phases",
        message: `MVP features not reflected in roadmap: ${missingFeatures.join(", ")}`,
        suggestion: "Add tasks for these MVP features to the roadmap",
      });
    }
  }

  return issues;
}

// ── Stack Validation ─────────────────────────

function validateStack(pd: ProjectDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for contradictory stack items
  const allTech = [
    ...pd.tech.languages.map((t) => t.toLowerCase()),
    ...pd.tech.frameworks.map((t) => t.toLowerCase()),
    ...pd.tech.tools.map((t) => t.toLowerCase()),
    ...pd.tech.dependencies.map((t) => t.toLowerCase()),
  ];

  // React + Vue/Angular/Svelte contradiction
  const hasReact = allTech.some((t) => t === "react");
  const hasOtherFrontend = allTech.some(
    (t) => ["vue", "angular", "svelte"].includes(t)
  );
  if (hasReact && hasOtherFrontend) {
    issues.push({
      category: "Stack",
      severity: "warning",
      field: "tech.frameworks",
      message: "Contradictory frontend frameworks: React with Vue/Angular/Svelte",
      suggestion: "Choose one frontend framework",
    });
  }

  // Node.js + Deno/Bun contradiction
  const hasNode = allTech.some((t) => ["node", "node.js"].includes(t));
  const hasOtherRuntime = allTech.some((t) => ["deno", "bun"].includes(t));
  if (hasNode && hasOtherRuntime) {
    issues.push({
      category: "Stack",
      severity: "warning",
      field: "tech.frameworks",
      message: "Contradictory runtimes: Node.js with Deno/Bun",
      suggestion: "Choose one runtime environment",
    });
  }

  // Check for empty tech stack
  if (allTech.length === 0) {
    issues.push({
      category: "Stack",
      severity: "info",
      field: "tech",
      message: "Tech stack is empty",
      suggestion: "Specify at least a language and framework",
    });
  }

  return issues;
}

// ── Quality Validation ───────────────────────

function validateQuality(pd: ProjectDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check user stories
  if (pd.product.userStories.length === 0) {
    issues.push({
      category: "Quality",
      severity: "info",
      field: "product.userStories",
      message: "No user stories defined",
      suggestion: "Add user stories to guide development",
    });
  }

  // Check tagline quality
  if (pd.project.tagline && pd.project.tagline.length < 20) {
    issues.push({
      category: "Quality",
      severity: "info",
      field: "project.tagline",
      message: "Tagline is very short — may not convey enough context",
      suggestion: "Expand tagline to 20+ characters for better context",
    });
  }

  // Check MVP scope
  if (!pd.product.mvpScope && pd.product.mvpFeatures.length === 0) {
    issues.push({
      category: "Quality",
      severity: "info",
      field: "product.mvpScope",
      message: "No MVP scope or features defined",
      suggestion: "Define MVP scope to guide initial development",
    });
  }

  // Check roadmap
  if (pd.roadmap.phases.length === 0) {
    issues.push({
      category: "Quality",
      severity: "info",
      field: "roadmap.phases",
      message: "Roadmap is empty",
      suggestion: "Define roadmap phases to plan development",
    });
  }

  // Check for empty sections that will get fallback content
  if (!pd.architecture.pattern) {
    issues.push({
      category: "Quality",
      severity: "info",
      field: "architecture.pattern",
      message: "Architecture pattern not specified — will use domain template fallback",
      suggestion: "Specify an architecture pattern for better generated output",
    });
  }

  return issues;
}

/**
 * Format validation result as a human-readable string.
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`# Validation Report`);
  lines.push(`Valid: ${result.valid ? "✅" : "❌"}`);
  lines.push(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}, Info: ${result.infos.length}`);
  lines.push("");

  if (result.errors.length > 0) {
    lines.push("## Errors (blocking)");
    for (const issue of result.errors) {
      lines.push(`- ❌ [${issue.category}] ${issue.field}: ${issue.message}`);
      if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("## Warnings (non-blocking)");
    for (const issue of result.warnings) {
      lines.push(`- ⚠️ [${issue.category}] ${issue.field}: ${issue.message}`);
      if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
    }
    lines.push("");
  }

  if (result.infos.length > 0) {
    lines.push("## Info");
    for (const issue of result.infos) {
      lines.push(`- ℹ️ [${issue.category}] ${issue.field}: ${issue.message}`);
      if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
