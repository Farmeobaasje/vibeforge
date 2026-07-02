// ──────────────────────────────────────────────
// previewFactory — lightweight preview generator
// Phase 3.3: generates compact previews of what
// the final output will look like.
//
// v0.4: Central pipeline:
//   resolveProjectDefinition() → validateProjectDefinition()
//   → buildRenderModel() → pass to all generators.
//
// All generators receive the SAME RenderModel,
// ensuring cross-document consistency.
// ──────────────────────────────────────────────

import type {
  ProjectDefinition,
  GeneratedFile,
} from "../types/projectDefinition";
import { resolveProjectDefinition } from "../canonical/projectDefinitionResolver";
import { validateProjectDefinition, formatValidationResult } from "../generator/projectDefinitionValidator";
import { buildRenderModel } from "../generator/renderModel";
import { generateClinerulesFiles } from "./clinerulesGenerator";
import { generateMemoryBankFiles } from "./memoryBankGenerator";
import { generateDocumentationFiles } from "./docsGenerator";
import { generateClineBootstrapPrompt } from "./bootstrapPromptGenerator";

/**
 * Generate preview content for all files that VibeForge will eventually
 * produce. Aggregates output from all generators.
 *
 * Central pipeline:
 *   1. resolveProjectDefinition() — enrich gaps, idempotent
 *   2. validateProjectDefinition() — check consistency
 *   3. buildRenderModel() — single rendering model
 *   4. Pass RenderModel to all generators
 *
 * If validation errors are found, a validation report is included
 * in the output and generation proceeds (warnings don't block).
 *
 * @param pd - The ProjectDefinition to generate from
 * @returns Array of generated files
 */
export function generatePreviewFiles(pd: ProjectDefinition): GeneratedFile[] {
  // ── Step 1: Resolve ────────────────────────
  // Enrich gaps using domain templates as enrichers only.
  // Idempotent: calling this multiple times produces same result.
  const resolved = resolveProjectDefinition(pd);

  // ── Step 2: Validate ───────────────────────
  // Check for template leakage, domain consistency, etc.
  // Errors block generation, warnings do not.
  const validationResult = validateProjectDefinition(resolved);

  // ── Step 3: Build RenderModel ──────────────
  // Single rendering model — all generators consume this.
  const rm = buildRenderModel(resolved);

  // ── Step 4: Generate files ─────────────────
  const files: GeneratedFile[] = [];

  // Include validation report if there are issues
  if (validationResult.issues.length > 0) {
    files.push({
      path: "validation-report.md",
      language: "markdown",
      content: formatValidationResult(validationResult),
    });
  }

  // If validation errors block generation, stop here
  if (!validationResult.valid) {
    return files;
  }

  // ── .clinerules/* (via clinerulesGenerator) ─
  files.push(...generateClinerulesFiles(resolved, rm));

  // ── memory-bank files (via memoryBankGenerator) ─
  files.push(...generateMemoryBankFiles(resolved, rm));

  // ── README.md, SPEC.md, PRD.md, roadmap.md (via docsGenerator) ─
  files.push(...generateDocumentationFiles(resolved, rm));

  // ── Bootstrap prompt (via bootstrapPromptGenerator) ─
  files.push({
    path: "bootstrap-prompt.md",
    language: "markdown",
    content: generateClineBootstrapPrompt(resolved, rm),
  });

  return files;
}
