// ──────────────────────────────────────────────
// consistencyValidator — Cross-document identity
// equality checks.
//
// Verifies that identity fields (shortName, fullName,
// slug, tagline, description) are consistent across
// ALL generated documents.
//
// Architecture rule: "Renderers never derive.
// Renderers only format." This validator only READS
// generated output — it never modifies it.
// ──────────────────────────────────────────────

import type { GeneratedFile } from "../types/projectDefinition";
import type { RenderModel } from "./renderModel";

// ── Consistency Issue ─────────────────────────

export interface ConsistencyIssue {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
  files: string[];
  expected: string;
  actual: string;
}

// ── Consistency Report ────────────────────────

export interface ConsistencyReport {
  valid: boolean;
  issues: ConsistencyIssue[];
  checkedFields: string[];
  filesChecked: number;
}

// ── Identity fields to check ──────────────────

const IDENTITY_FIELDS = [
  "shortName",
  "fullName",
  "slug",
  "tagline",
  "description",
] as const;

type IdentityField = (typeof IDENTITY_FIELDS)[number];

// ── Extract identity from generated content ───

/**
 * Extract an identity field value from generated file content.
 * Uses heuristics to find the project name, tagline, etc.
 * in markdown content.
 */
function extractFieldFromContent(
  content: string,
  field: IdentityField,
  rm: RenderModel,
): string | null {
  switch (field) {
    case "shortName":
    case "fullName": {
      // Look for "# Project: Name" or "# Name" or "# Project Brief — Name"
      const namePatterns = [
        new RegExp(`^#\\s+Project:\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Project Brief —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Product Context —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Active Context —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+System Patterns —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Tech Context —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Progress —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Technical Specification —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Product Requirements Document —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Roadmap —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+Cline Bootstrap —\\s+(.+)$`, "m"),
        new RegExp(`^#\\s+(.+)$`, "m"),
      ];
      for (const pattern of namePatterns) {
        const match = content.match(pattern);
        if (match) {
          const extracted = match[1].trim();
          // Skip generic headers like "Roadmap & Status Protocol"
          if (
            extracted.length > 0 &&
            extracted !== rm.identity.fullName &&
            extracted !== rm.identity.shortName &&
            !extracted.includes("&") &&
            !extracted.includes("Protocol") &&
            !extracted.includes("Discipline") &&
            !extracted.includes("Principles") &&
            !extracted.includes("Rules") &&
            !extracted.includes("Policy") &&
            !extracted.includes("Checklist") &&
            !extracted.includes("Guide")
          ) {
            return extracted;
          }
        }
      }
      // Fallback: look for "**Name:** Name" in bootstrap prompt
      const nameMatch = content.match(/\*\*Name:\*\*\s+(.+)$/m);
      if (nameMatch) return nameMatch[1].trim();
      return null;
    }

    case "tagline": {
      // Look for "> tagline" (README) or tagline after project name
      const blockquoteMatch = content.match(/^>\s+(.+)$/m);
      if (blockquoteMatch) return blockquoteMatch[1].trim();

      // Look for "**Tagline:** tagline" in bootstrap prompt
      const taglineMatch = content.match(/\*\*Tagline:\*\*\s+(.+)$/m);
      if (taglineMatch) return taglineMatch[1].trim();

      // Look for tagline as second line after "# Project: Name"
      const lines = content.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^#\s+Project:\s+/.test(lines[i])) {
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && nextLine.length > 0 && !nextLine.startsWith("#") && !nextLine.startsWith("---")) {
            return nextLine;
          }
        }
      }
      return null;
    }

    case "slug": {
      // Slugs are rarely written explicitly in generated content.
      // We derive them from the project name in the content.
      const name = extractFieldFromContent(content, "fullName", rm);
      if (name) {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          || "project";
      }
      return null;
    }

    case "description": {
      // Look for "**Description:**" in bootstrap prompt
      const descMatch = content.match(/\*\*Description:\*\*\s*\n([\s\S]+?)(?:\n\n|\n##|\n---|$)/);
      if (descMatch) return descMatch[1].trim();

      // Look for "## Overview" section in README
      const overviewMatch = content.match(/## Overview\s*\n([\s\S]+?)(?:\n##|\n---|$)/);
      if (overviewMatch) return overviewMatch[1].trim();

      // Look for "## What we're building" in 00-project.md
      const buildingMatch = content.match(/## What we're building\s*\n([\s\S]+?)(?:\n##|\n---|$)/);
      if (buildingMatch) return buildingMatch[1].trim();

      return null;
    }

    default:
      return null;
  }
}

// ── Domain consistency keywords ──────────────

/**
 * Domain-specific keywords that should appear in generated content
 * for a given domain. Used by validateDomainConsistency() to check
 * that generated files reference the correct domain.
 */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  biotech: ["sample", "batch", "assay", "instrument", "reagent", "protocol", "lab", "biotech", "bio"],
  emulator: ["game", "emulator", "rom", "console", "save state", "controller", "retro"],
  restaurant: ["restaurant", "menu", "reservation", "order", "dining", "table", "kitchen"],
  marketplace: ["marketplace", "product", "listing", "seller", "buyer", "shop", "ecommerce"],
  crm: ["crm", "contact", "deal", "pipeline", "customer", "sales", "lead"],
  fitness: ["fitness", "workout", "exercise", "health", "goal", "training", "personal"],
  healthcare: ["healthcare", "patient", "doctor", "appointment", "medical", "clinic", "health"],
  education: ["education", "course", "student", "learning", "module", "class", "teach"],
  construction: ["construction", "project", "task", "material", "building", "contractor", "site"],
  agency: ["agency", "client", "project", "invoice", "service", "portfolio", "freelance"],
  "ai-saas": ["ai", "saas", "model", "automation", "intelligence", "ml", "machine learning"],
  "ai-saas/support-platform": ["support", "ticket", "conversation", "customer service", "helpdesk", "ai"],
  website: ["website", "page", "blog", "portfolio", "landing", "content", "web"],
  travel: ["travel", "trip", "destination", "itinerary", "budget", "vacation", "journey"],
  "solar-energy": ["solar", "panel", "energy", "installation", "sun", "renewable", "green"],
  "project-management": ["project", "task", "board", "sprint", "backlog", "team", "workflow"],
};

/**
 * Validate domain consistency across generated files.
 *
 * Checks that the domain label in generated files matches the
 * RenderModel domain. For example, if the domain is "biotech",
 * generated files should contain biotech-related keywords.
 *
 * @param files - All generated files to check
 * @param rm    - The RenderModel used to generate the files
 * @returns A ConsistencyReport with all issues found
 */
export function validateDomainConsistency(
  files: GeneratedFile[],
  rm: RenderModel,
): ConsistencyReport {
  const issues: ConsistencyIssue[] = [];
  const checkedFields: string[] = [];
  const domainName = rm.domainName || rm.identity.slug;

  // Get domain-specific keywords
  const keywords = DOMAIN_KEYWORDS[domainName] || [];

  // If no domain-specific keywords, skip domain consistency check
  if (keywords.length === 0) {
    return {
      valid: true,
      issues: [],
      checkedFields: ["domain"],
      filesChecked: files.length,
    };
  }

  // Check each generated file for domain keywords
  for (const file of files) {
    const content = file.content.toLowerCase();
    const foundKeywords = keywords.filter((kw) => content.includes(kw.toLowerCase()));

    if (foundKeywords.length === 0) {
      issues.push({
        field: `domain:${domainName}`,
        severity: "warning",
        message: `File "${file.path}" contains no domain-specific keywords for "${domainName}"`,
        files: [file.path],
        expected: `At least one domain keyword from: ${keywords.join(", ")}`,
        actual: "No domain keywords found",
      });
    } else {
      issues.push({
        field: `domain:${domainName}`,
        severity: "info",
        message: `File "${file.path}" contains ${foundKeywords.length} domain keyword(s) for "${domainName}": ${foundKeywords.join(", ")}`,
        files: [file.path],
        expected: `Domain keywords for "${domainName}"`,
        actual: `Found: ${foundKeywords.join(", ")}`,
      });
    }
    checkedFields.push(`domain:${domainName} in ${file.path}`);
  }

  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
    checkedFields,
    filesChecked: files.length,
  };
}

// ── Main validator ────────────────────────────

/**
 * Validate cross-document identity consistency.
 *
 * Checks that identity fields (shortName, fullName, slug,
 * tagline, description) are consistent across ALL generated
 * files.
 *
 * @param files - All generated files to check
 * @param rm    - The RenderModel used to generate the files
 * @returns A ConsistencyReport with all issues found
 */
export function validateConsistency(
  files: GeneratedFile[],
  rm: RenderModel,
): ConsistencyReport {
  const issues: ConsistencyIssue[] = [];
  const checkedFields: string[] = [];

  for (const field of IDENTITY_FIELDS) {
    checkedFields.push(field);
    const expected = rm.identity[field];
    const fieldIssues: ConsistencyIssue[] = [];

    for (const file of files) {
      const actual = extractFieldFromContent(file.content, field, rm);

      if (actual !== null && actual !== expected) {
        fieldIssues.push({
          field,
          severity: "error",
          message: `Identity field "${field}" mismatch in ${file.path}: expected "${expected}", found "${actual}"`,
          files: [file.path],
          expected,
          actual,
        });
      }
    }

    issues.push(...fieldIssues);
  }

  return {
    valid: issues.length === 0,
    issues,
    checkedFields,
    filesChecked: files.length,
  };
}

/**
 * Validate consistency for a complete set of generated files.
 * Builds the RenderModel internally.
 *
 * @param files - All generated files to check
 * @param pd    - The ProjectDefinition used to generate the files
 * @returns A ConsistencyReport
 */
export function validateGeneratedFiles(
  files: GeneratedFile[],
  rm: RenderModel,
): ConsistencyReport {
  return validateConsistency(files, rm);
}
