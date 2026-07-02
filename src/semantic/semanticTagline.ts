// ──────────────────────────────────────────────
// semanticTagline — Domain-aware tagline generation
//
// Generates professional product taglines (max 80
// chars, no ellipsis, no copying solution text).
// Uses domain templates for context-aware output.
// ──────────────────────────────────────────────

import type { DomainTemplate } from "./domainTemplates";

const MAX_TAGLINE_LENGTH = 80;

/**
 * Truncate a string at a word boundary without ellipsis.
 */
function truncateClean(text: string): string {
  if (text.length <= MAX_TAGLINE_LENGTH) return text;
  const truncated = text.slice(0, MAX_TAGLINE_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > MAX_TAGLINE_LENGTH * 0.5) {
    return truncated.slice(0, lastSpace).trim();
  }
  return truncated.trim();
}

/**
 * Generate a professional tagline for a project.
 *
 * Rules:
 *   - Max 80 characters
 *   - No ellipsis — truncate cleanly at word boundary
 *   - Domain-specific template preferred
 *   - Never copies solution/description text
 *   - Product tagline format: "<value prop> — <name>" or domain-specific
 *
 * @param projectName - The project name
 * @param domainTemplate - The detected domain template
 * @returns A professional tagline (max 80 chars)
 */
export function generateSemanticTagline(
  projectName: string,
  domainTemplate: DomainTemplate,
): string {
  // Use domain-specific template
  const tagline = domainTemplate.taglineTemplate(projectName);

  if (tagline && tagline.length > 0) {
    return truncateClean(tagline);
  }

  // Ultimate fallback — never empty
  return truncateClean(`${projectName} — AI-ready software project`);
}
