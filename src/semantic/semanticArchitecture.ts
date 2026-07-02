// ──────────────────────────────────────────────
// semanticArchitecture — Domain-aware architecture
// derivation.
//
// Generates component tree, data flow, and
// architecture pattern from domain templates and
// MVP features.
// ──────────────────────────────────────────────

import type { DomainTemplate } from "./domainTemplates";

/**
 * Derive a grouped component tree from domain templates and MVP features.
 *
 * Returns a hierarchical tree structure (not a flat feature list).
 * Uses domain template components as the base, then adds
 * feature-derived components.
 *
 * @param domainTemplate - The detected domain template
 * @param mvpFeatures - Array of MVP feature descriptions
 * @returns A formatted component tree string
 */
export function deriveSemanticComponentTree(
  domainTemplate: DomainTemplate,
  mvpFeatures: string[],
): string {
  const treeLines: string[] = [];
  treeLines.push("App");

  // Use domain templates as base
  for (const component of domainTemplate.componentTemplates) {
    treeLines.push(`├── ${component}`);
  }

  // Add feature-derived components (skip if already in domain templates)
  const existingNames = new Set(
    domainTemplate.componentTemplates.map((c) => c.toLowerCase().replace(/page$/, ""))
  );

  for (const feature of mvpFeatures) {
    const cleaned = feature.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
    if (words.length > 0) {
      const componentName = words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
      // Skip if a similar component already exists in domain templates
      const lowerName = componentName.toLowerCase();
      if (!existingNames.has(lowerName)) {
        treeLines.push(`├── ${componentName}`);
      }
    }
  }

  return treeLines.join("\n");
}

/**
 * Derive a data flow description from domain template.
 *
 * @param domainTemplate - The detected domain template
 * @returns A data flow description string
 */
export function deriveSemanticDataFlow(
  domainTemplate: DomainTemplate,
): string {
  if (domainTemplate.dataFlowTemplate && domainTemplate.dataFlowTemplate.length > 0) {
    return domainTemplate.dataFlowTemplate;
  }
  return "User interacts with application → frontend sends requests to API → API processes and validates → data stored in database → response returned to frontend → UI updates accordingly";
}

/**
 * Get the architecture pattern from domain template.
 *
 * @param domainTemplate - The detected domain template
 * @returns An architecture pattern description
 */
export function deriveArchitecturePattern(
  domainTemplate: DomainTemplate,
): string {
  return domainTemplate.architecturePattern || "";
}
