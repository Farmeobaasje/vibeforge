// ──────────────────────────────────────────────
// semanticValidator — Domain model consistency
// validation.
//
// Validates the domain model and generated output
// for consistency issues before passing to
// ProjectDefinition.
//
// Rules:
//   - No duplicate entities in domain model
//   - No empty roadmap
//   - Component tree references existing entities
//   - Data flow uses known entities
//   - Roadmap and MVP don't conflict
//   - Tech stack matches requirements
// ──────────────────────────────────────────────

import type { DomainModel } from "./domainModelTypes";
import type { DomainTemplate } from "./domainTemplates";

/**
 * Result of a semantic validation check.
 */
export interface ValidationIssue {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
}

/**
 * Complete validation report.
 */
export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: string[];
}

/**
 * Validate that there are no duplicate entities in the domain model.
 */
function validateNoDuplicateEntities(domainModel: DomainModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const entity of domainModel.entities) {
    const lower = entity.name.toLowerCase();
    if (seen.has(lower)) {
      issues.push({
        field: "entities",
        severity: "error",
        message: `Duplicate entity "${entity.name}" found in domain model`,
      });
    }
    seen.add(lower);
  }

  return issues;
}

/**
 * Validate that the roadmap is not empty.
 */
function validateNonEmptyRoadmap(
  phases: Array<{ title: string; tasks: string[] }>,
): ValidationIssue[] {
  if (!phases || phases.length === 0) {
    return [
      {
        field: "roadmap",
        severity: "error",
        message: "Roadmap is empty — no phases defined",
      },
    ];
  }

  const issues: ValidationIssue[] = [];
  for (const phase of phases) {
    if (!phase.tasks || phase.tasks.length === 0) {
      issues.push({
        field: "roadmap",
        severity: "warning",
        message: `Phase "${phase.title}" has no tasks`,
      });
    }
  }

  return issues;
}

/**
 * Validate that the component tree references existing entities.
 */
function validateComponentTreeReferences(
  componentTree: string,
  domainModel: DomainModel,
): ValidationIssue[] {
  if (!componentTree || componentTree.length === 0) {
    return [
      {
        field: "componentTree",
        severity: "warning",
        message: "Component tree is empty",
      },
    ];
  }

  const issues: ValidationIssue[] = [];
  const entityNames = new Set(domainModel.entities.map((e) => e.name.toLowerCase()));

  // Extract component names from tree (lines after "App")
  const lines = componentTree.split("\n").filter((l) => l.trim().length > 0);
  for (const line of lines) {
    const cleaned = line.replace(/^[├└─│\s]+/, "").trim();
    if (!cleaned || cleaned === "App") continue;

    // Check if component name contains an entity name
    const lower = cleaned.toLowerCase();
    const hasEntityRef = [...entityNames].some((entity) => lower.includes(entity));
    if (!hasEntityRef) {
      // This is a soft warning — not all components need entity references
      // Only flag if it looks like a data component without entity backing
      if (cleaned.endsWith("Page") || cleaned.endsWith("List") || cleaned.endsWith("Dashboard")) {
        issues.push({
          field: "componentTree",
          severity: "info",
          message: `Component "${cleaned}" may not reference any domain entity`,
        });
      }
    }
  }

  return issues;
}

/**
 * Validate that the data flow uses known entities.
 */
function validateDataFlowReferences(
  dataFlow: string,
  domainModel: DomainModel,
): ValidationIssue[] {
  if (!dataFlow || dataFlow.length === 0) {
    return [
      {
        field: "dataFlow",
        severity: "warning",
        message: "Data flow description is empty",
      },
    ];
  }

  const issues: ValidationIssue[] = [];
  const entityNames = new Set(domainModel.entities.map((e) => e.name.toLowerCase()));
  const lower = dataFlow.toLowerCase();

  // Check if at least one entity is referenced in the data flow
  const hasEntityRef = [...entityNames].some((entity) => lower.includes(entity));
  if (!hasEntityRef) {
    issues.push({
      field: "dataFlow",
      severity: "info",
      message: "Data flow does not reference any domain entities",
    });
  }

  return issues;
}

/**
 * Validate that roadmap and MVP features don't conflict.
 */
function validateRoadmapMvpAlignment(
  phases: Array<{ title: string; tasks: string[] }>,
  mvpFeatures: string[],
): ValidationIssue[] {
  if (!mvpFeatures || mvpFeatures.length === 0) return [];
  if (!phases || phases.length === 0) return [];

  const issues: ValidationIssue[] = [];

  // Check if MVP features are covered by roadmap tasks
  const allTaskTitles = phases.flatMap((p) => p.tasks.map((t) => t.toLowerCase()));

  for (const feature of mvpFeatures) {
    const lower = feature.toLowerCase();
    const isCovered = allTaskTitles.some((task) => task.includes(lower) || lower.includes(task));
    if (!isCovered) {
      issues.push({
        field: "roadmap",
        severity: "warning",
        message: `MVP feature "${feature}" is not explicitly covered by any roadmap task`,
      });
    }
  }

  return issues;
}

/**
 * Validate that the tech stack matches requirements.
 */
function validateTechStack(
  preferredTech: string[],
  domainTemplate: DomainTemplate,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check if domain suggests specific tech that conflicts with user's choices
  // For now, this is a soft check — just note if domain has expectations
  if (domainTemplate.name === "ai-saas" && preferredTech.length === 0) {
    issues.push({
      field: "techStack",
      severity: "info",
      message: "AI SaaS project has no preferred tech stack specified — consider adding AI/ML frameworks",
    });
  }

  return issues;
}

/**
 * Run all semantic validations on the generated output.
 *
 * @param domainModel - The built domain model
 * @param domainTemplate - The detected domain template
 * @param roadmapPhases - Generated roadmap phases
 * @param componentTree - Generated component tree
 * @param dataFlow - Generated data flow
 * @param mvpFeatures - MVP features from requirements
 * @param preferredTech - User-specified tech stack
 * @returns A ValidationReport with all issues found
 */
export function validateSemanticOutput(
  domainModel: DomainModel,
  domainTemplate: DomainTemplate,
  roadmapPhases: Array<{ title: string; tasks: string[] }>,
  componentTree: string,
  dataFlow: string,
  mvpFeatures: string[],
  preferredTech: string[],
): ValidationReport {
  const allIssues: ValidationIssue[] = [];
  const warnings: string[] = [];

  // Run all validators
  allIssues.push(...validateNoDuplicateEntities(domainModel));
  allIssues.push(...validateNonEmptyRoadmap(roadmapPhases));
  allIssues.push(...validateComponentTreeReferences(componentTree, domainModel));
  allIssues.push(...validateDataFlowReferences(dataFlow, domainModel));
  allIssues.push(...validateRoadmapMvpAlignment(roadmapPhases, mvpFeatures));
  allIssues.push(...validateTechStack(preferredTech, domainTemplate));

  // Collect warnings
  for (const issue of allIssues) {
    if (issue.severity === "warning" || issue.severity === "info") {
      warnings.push(issue.message);
    }
  }

  return {
    valid: allIssues.filter((i) => i.severity === "error").length === 0,
    issues: allIssues,
    warnings,
  };
}
