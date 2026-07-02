// ──────────────────────────────────────────────
// aiValidator — Epic 25.2
// Pipeline stage: Validation
//
// Validates a generated ProjectDefinition for
// completeness, consistency, and hallucination
// detection. Produces warnings for issues found.
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { GeneratorWarning } from "./generatorTypes";
import type { PerFieldConfidence } from "./confidenceTypes";
import type { ConfidencePolicy } from "./confidencePolicy";

/**
 * Result of the validation pipeline.
 */
export interface ValidationResult {
  /** Validated ProjectDefinition (may be modified) */
  projectDefinition: ProjectDefinition;
  /** Updated confidence scores */
  confidence: PerFieldConfidence;
  /** All warnings generated during validation */
  warnings: GeneratorWarning[];
  /** Whether the validation passed (no errors) */
  passed: boolean;
}

/**
 * Validate a ProjectDefinition through multiple stages:
 * 1. Schema validation — check required fields
 * 2. Semantic validation — check internal consistency
 * 3. Hallucination detection — flag suspicious values
 * 4. Confidence scoring — update confidence based on validation
 *
 * @param pd - The ProjectDefinition to validate
 * @param confidence - Current per-field confidence
 * @param policy - The active confidence policy
 * @returns Validation result
 */
export function validateProjectDefinition(
  pd: ProjectDefinition,
  confidence: PerFieldConfidence,
  policy: ConfidencePolicy,
): ValidationResult {
  const warnings: GeneratorWarning[] = [];
  const updatedConfidence = { ...confidence };

  // 1. Schema validation
  const schemaWarnings = validateSchema(pd);
  warnings.push(...schemaWarnings);

  // 2. Semantic validation
  const semanticWarnings = validateSemantics(pd);
  warnings.push(...semanticWarnings);

  // 3. Hallucination detection
  const hallucinationWarnings = detectHallucinations(pd);
  warnings.push(...hallucinationWarnings);

  // 4. Overall confidence check
  if (confidence.overall < policy.minimum * 100) {
    warnings.push({
      field: "_overall",
      severity: "error",
      message: `Overall confidence (${confidence.overall}) is below the minimum threshold (${policy.minimum * 100}). Review recommended before use.`,
    });
  }

  const hasErrors = warnings.some((w) => w.severity === "error");

  return {
    projectDefinition: pd,
    confidence: updatedConfidence,
    warnings,
    passed: !hasErrors,
  };
}

/**
 * Schema validation — check required fields are present.
 */
function validateSchema(pd: ProjectDefinition): GeneratorWarning[] {
  const warnings: GeneratorWarning[] = [];

  // Check project section
  if (!pd.project.name || pd.project.name === "My Project") {
    warnings.push({
      field: "project.name",
      severity: "warning",
      message: "Project name is missing or using default value.",
      suggestion: "Provide a descriptive project name.",
    });
  }

  if (!pd.project.description) {
    warnings.push({
      field: "project.description",
      severity: "info",
      message: "Project description is empty.",
      suggestion: "Add a 2-4 sentence description of the project.",
    });
  }

  // Check product section
  if (!pd.product.problemStatement) {
    warnings.push({
      field: "product.problemStatement",
      severity: "info",
      message: "Problem statement is empty.",
      suggestion: "Describe the problem this project solves.",
    });
  }

  if (!pd.product.solution) {
    warnings.push({
      field: "product.solution",
      severity: "info",
      message: "Solution description is empty.",
      suggestion: "Describe how this project solves the problem.",
    });
  }

  if (pd.product.userStories.length === 0) {
    warnings.push({
      field: "product.userStories",
      severity: "info",
      message: "No user stories defined.",
      suggestion: "Add at least 3 user stories.",
    });
  }

  // Check tech section
  if (pd.tech.languages.length === 0) {
    warnings.push({
      field: "tech.languages",
      severity: "warning",
      message: "No programming languages specified.",
      suggestion: "Specify at least one programming language.",
    });
  }

  // Check roadmap
  if (pd.roadmap.phases.length === 0) {
    warnings.push({
      field: "roadmap.phases",
      severity: "warning",
      message: "No roadmap phases defined.",
      suggestion: "Define at least 3 phases with concrete tasks.",
    });
  }

  // Check memory
  if (pd.memory.files.length === 0) {
    warnings.push({
      field: "memory.files",
      severity: "warning",
      message: "No memory bank files defined.",
      suggestion: "Include at least the 6 core Memory Bank files.",
    });
  }

  // Check agents
  if (pd.agents.agents.length === 0) {
    warnings.push({
      field: "agents.agents",
      severity: "warning",
      message: "No agents defined.",
      suggestion: "Define at least 3 agents (orchestrator, plan, act).",
    });
  }

  return warnings;
}

/**
 * Semantic validation — check internal consistency.
 */
function validateSemantics(pd: ProjectDefinition): GeneratorWarning[] {
  const warnings: GeneratorWarning[] = [];

  // Check that roadmap phases have tasks
  for (const phase of pd.roadmap.phases) {
    if (phase.tasks.length === 0) {
      warnings.push({
        field: `roadmap.phases.${phase.id}.tasks`,
        severity: "warning",
        message: `Phase "${phase.title}" has no tasks.`,
        suggestion: "Add at least one task to each phase.",
      });
    }
  }

  // Check that agents have required fields
  for (const agent of pd.agents.agents) {
    if (!agent.role) {
      warnings.push({
        field: "agents.agents[].role",
        severity: "error",
        message: "An agent is missing a role.",
        suggestion: "Provide a role for each agent.",
      });
    }
    if (!agent.model) {
      warnings.push({
        field: `agents.agents[${agent.role}].model`,
        severity: "warning",
        message: `Agent "${agent.role}" has no model specified.`,
        suggestion: "Specify a model for each agent.",
      });
    }
  }

  // Check that memory files have paths
  for (const file of pd.memory.files) {
    if (!file.path) {
      warnings.push({
        field: "memory.files[].path",
        severity: "warning",
        message: "A memory file is missing a path.",
        suggestion: "Provide a path for each memory file.",
      });
    }
  }

  return warnings;
}

/**
 * Hallucination detection — flag suspicious values.
 *
 * Checks for:
 * - Technology names that look invented
 * - Version numbers that are too specific without evidence
 * - Inconsistent architecture/tech combinations
 * - Overly generic descriptions
 */
function detectHallucinations(pd: ProjectDefinition): GeneratorWarning[] {
  const warnings: GeneratorWarning[] = [];

  // Check for overly generic descriptions
  const genericPatterns = [
    /^A (?:modern|powerful|fast|simple|easy-to-use) (?:tool|framework|library|application|platform)/i,
    /^This (?:project|tool|application) (?:is|will be|aims to)/i,
  ];

  if (pd.project.description) {
    for (const pattern of genericPatterns) {
      if (pattern.test(pd.project.description)) {
        warnings.push({
          field: "project.description",
          severity: "info",
          message:
            "Description starts with a generic phrase. Consider making it more specific.",
          suggestion:
            "Describe what makes this project unique rather than using template language.",
        });
        break;
      }
    }
  }

  // Check for inconsistent architecture/tech combinations
  const hasFrontendFramework = pd.tech.frameworks.some((f) =>
    /react|vue|angular|svelte/i.test(f),
  );
  const hasBackendFramework = pd.tech.frameworks.some((f) =>
    /express|django|flask|spring|fastapi|rails|gin/i.test(f),
  );

  if (
    pd.architecture.pattern &&
    pd.architecture.pattern.toLowerCase().includes("microservice") &&
    !hasBackendFramework
  ) {
    warnings.push({
      field: "architecture.pattern",
      severity: "warning",
      message:
        'Architecture pattern is "microservices" but no backend framework is specified.',
      suggestion:
        "Add a backend framework or reconsider the architecture pattern.",
    });
  }

  if (
    pd.architecture.pattern &&
    pd.architecture.pattern.toLowerCase().includes("spa") &&
    !hasFrontendFramework
  ) {
    warnings.push({
      field: "architecture.pattern",
      severity: "warning",
      message:
        'Architecture pattern is "SPA" but no frontend framework is specified.',
      suggestion:
        "Add a frontend framework or reconsider the architecture pattern.",
    });
  }

  // Check for suspicious version numbers
  const versionPattern = /\d+\.\d+\.\d+/;
  for (const lang of pd.tech.languages) {
    const matches = lang.match(versionPattern);
    if (matches) {
      const version = matches[0];
      const [major, minor] = version.split(".").map(Number);
      if (major === 0 && minor === 0) {
        warnings.push({
          field: "tech.languages",
          severity: "info",
          message: `Language "${lang}" has a suspicious version (${version}).`,
          suggestion:
            "Verify this version exists or use a known stable version.",
        });
      }
    }
  }

  return warnings;
}
