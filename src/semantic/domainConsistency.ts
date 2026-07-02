// ──────────────────────────────────────────────
// domainConsistency — Domain consistency validator
//
// Checks that all generated output is consistent
// with the canonical domain identity stored in
// ProjectDefinition.architecture.domain.
//
// v0.5: Uses multi-domain probability scores
// instead of FORBIDDEN_VOCABULARY word lists.
// Domain consistency is now score-driven:
// - If the primary domain has high confidence (>=70)
//   and other domains have low scores (<30), the
//   output is considered consistent.
// - If multiple domains have similar scores, the
//   output may be ambiguous — this is flagged as
//   a warning, not an error.
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { ConsistencyCheck, ConsistencyReport } from "../types/domainIdentity";
import { emptyProjectDomain } from "../types/domainIdentity";

/**
 * Minimum confidence threshold for a domain to be considered "primary".
 * Below this, the domain detection is too uncertain to enforce consistency.
 */
const MIN_PRIMARY_CONFIDENCE = 50;

/**
 * Maximum score ratio between top and second domain.
 * If the top domain's score is less than this ratio of the second,
 * the output is flagged as ambiguous.
 * Example: top=0.50, second=0.40 → ratio=0.80 → flagged (0.80 > 0.50)
 */
const AMBIGUITY_RATIO = 0.5;

/**
 * Fields to check for domain consistency.
 */
const CHECK_FIELDS = [
  "tagline",
  "description",
  "architecture.pattern",
  "architecture.componentTree",
  "architecture.dataFlow",
  "roadmap.phases",
] as const;

/**
 * Extract text content from a ProjectDefinition field for consistency checking.
 */
function extractFieldText(pd: ProjectDefinition, field: string): string {
  switch (field) {
    case "tagline":
      return pd.project.tagline || "";
    case "description":
      return pd.project.description || "";
    case "architecture.pattern":
      return pd.architecture.pattern || "";
    case "architecture.componentTree":
      return pd.architecture.componentTree || "";
    case "architecture.dataFlow":
      return pd.architecture.dataFlow || "";
    case "roadmap.phases":
      return pd.roadmap.phases.map((p) => `${p.title}: ${p.tasks.map((t) => t.title).join(", ")}`).join(" ");
    default:
      return "";
  }
}

/**
 * Check if domain scores indicate ambiguity.
 * Returns true if the top two domains have similar scores.
 */
function isAmbiguousDomain(scores: Record<string, number>): boolean {
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length < 2) return false;

  const topScore = sorted[0][1];
  const secondScore = sorted[1][1];

  // If second score is close to top score, it's ambiguous
  return secondScore / topScore > AMBIGUITY_RATIO;
}

/**
 * Get a human-readable description of domain scores.
 */
function describeDomainScores(scores: Record<string, number>): string {
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Show top 5

  if (sorted.length === 0) return "no domain scores available";

  return sorted
    .map(([domain, score]) => `${domain}: ${(score * 100).toFixed(0)}%`)
    .join(", ");
}

/**
 * Run consistency checks on a ProjectDefinition.
 *
 * Uses multi-domain probability scores instead of forbidden word lists.
 * A project is consistent if:
 *   1. The primary domain has confidence >= MIN_PRIMARY_CONFIDENCE
 *   2. The domain scores don't indicate ambiguity
 *   3. All fields have non-empty content
 *
 * @param pd - The ProjectDefinition to validate
 * @returns A ConsistencyReport with all check results
 */
export function checkDomainConsistency(pd: ProjectDefinition): ConsistencyReport {
  const domain = pd.architecture.domain || emptyProjectDomain;
  const checks: ConsistencyCheck[] = [];
  const warnings: string[] = [];

  // 1. Check domain confidence
  if (domain.confidence < MIN_PRIMARY_CONFIDENCE && domain.id !== "generic") {
    checks.push({
      field: "domain.confidence",
      expected: `>= ${MIN_PRIMARY_CONFIDENCE} for reliable domain detection`,
      actual: `${domain.confidence}`,
      match: false,
      severity: "warning",
    });
    warnings.push(
      `Domain "${domain.id}" has low confidence (${domain.confidence}). Consider manual review.`
    );
  }

  // 2. Check domain scores for ambiguity
  if (domain.scores && Object.keys(domain.scores).length > 1) {
    if (isAmbiguousDomain(domain.scores)) {
      checks.push({
        field: "domain.scores",
        expected: `Clear primary domain (ratio < ${AMBIGUITY_RATIO})`,
        actual: `Ambiguous: ${describeDomainScores(domain.scores)}`,
        match: false,
        severity: "warning",
      });
      warnings.push(
        `Domain scores are ambiguous: ${describeDomainScores(domain.scores)}. ` +
        `The project may span multiple domains.`
      );
    } else {
      checks.push({
        field: "domain.scores",
        expected: `Clear primary domain`,
        actual: describeDomainScores(domain.scores),
        match: true,
        severity: "info",
      });
    }
  } else if (domain.scores && Object.keys(domain.scores).length === 1) {
    checks.push({
      field: "domain.scores",
      expected: `Single domain detected`,
      actual: describeDomainScores(domain.scores),
      match: true,
      severity: "info",
    });
  } else {
    checks.push({
      field: "domain.scores",
      expected: `Domain scores available`,
      actual: "No domain scores",
      match: false,
      severity: "info",
    });
  }

  // 3. Check each field for domain-appropriate content
  for (const field of CHECK_FIELDS) {
    const text = extractFieldText(pd, field);
    if (!text) {
      checks.push({
        field,
        expected: `Non-empty content for domain "${domain.id}"`,
        actual: "(empty)",
        match: false,
        severity: "warning",
      });
      continue;
    }

    // Check that field content references the domain appropriately
    // (soft check — just verify it's not completely generic)
    const lower = text.toLowerCase();

    // Use domainLabel for keyword matching when available (LLM-first),
    // fall back to hardcoded domain ID keywords for backward compatibility
    const domainKeywords = domain.domainLabel
      ? getDomainLabelKeywords(domain.domainLabel)
      : getDomainKeywords(domain.id);

    if (domainKeywords.length > 0) {
      const foundKeywords = domainKeywords.filter((kw) => lower.includes(kw));
      if (foundKeywords.length === 0 && domain.confidence >= MIN_PRIMARY_CONFIDENCE) {
        checks.push({
          field,
          expected: `Content relevant to domain "${domain.domainLabel || domain.id}"`,
          actual: "No domain-specific keywords found",
          match: false,
          severity: "info",
        });
      } else {
        checks.push({
          field,
          expected: `Content relevant to domain "${domain.domainLabel || domain.id}"`,
          actual: foundKeywords.length > 0
            ? `Contains domain keywords: ${foundKeywords.slice(0, 5).join(", ")}`
            : "No domain keywords (low confidence domain)",
          match: true,
          severity: "info",
        });
      }
    }
  }

  // 4. Check domain model entities match the domain
  if (pd.architecture.domainModel?.entities) {
    const entityNames = pd.architecture.domainModel.entities.map((e) => e.name.toLowerCase());
    const domainSpecificEntities: Record<string, string[]> = {
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

    const expectedEntities = domainSpecificEntities[domain.id] || [];
    if (expectedEntities.length > 0) {
      const missingEntities = expectedEntities.filter(
        (e) => !entityNames.some((name) => name === e || name.includes(e))
      );
      if (missingEntities.length > 0) {
        checks.push({
          field: "domainModel.entities",
          expected: `Entities matching domain "${domain.id}"`,
          actual: `Missing expected entities: ${missingEntities.join(", ")}`,
          match: false,
          severity: "warning",
        });
      } else {
        checks.push({
          field: "domainModel.entities",
          expected: `Entities matching domain "${domain.id}"`,
          actual: "All expected entities present",
          match: true,
          severity: "info",
        });
      }
    }
  }

  const valid = checks.every((c) => c.severity !== "error");

  return {
    valid,
    domain,
    checks,
    warnings,
  };
}

/**
 * Get domain-specific keywords for soft consistency checking.
 * These are NOT forbidden words — they're expected keywords that
 * indicate the content is relevant to the domain.
 */
function getDomainKeywords(domainId: string): string[] {
  const keywords: Record<string, string[]> = {
    emulator: ["game", "emulator", "rom", "console", "save state", "controller"],
    restaurant: ["restaurant", "menu", "reservation", "order", "dining", "table"],
    marketplace: ["marketplace", "product", "listing", "seller", "buyer", "shop"],
    crm: ["crm", "contact", "deal", "pipeline", "customer", "sales"],
    fitness: ["fitness", "workout", "exercise", "health", "goal", "training"],
    healthcare: ["healthcare", "patient", "doctor", "appointment", "medical", "clinic"],
    education: ["education", "course", "student", "learning", "module", "class"],
    construction: ["construction", "project", "task", "material", "building", "contractor"],
    agency: ["agency", "client", "project", "invoice", "service", "portfolio"],
    "ai-saas": ["ai", "saas", "model", "automation", "intelligence", "ml"],
    "ai-saas/support-platform": ["support", "ticket", "conversation", "customer service", "helpdesk", "ai"],
    website: ["website", "page", "blog", "portfolio", "landing", "content"],
  };

  return keywords[domainId] || [];
}

/**
 * Extract keywords from a free-text domainLabel for consistency checking.
 * Splits the label into meaningful terms and uses them as keywords.
 * This is the LLM-first path — works with any domain label, not just hardcoded ones.
 *
 * @param domainLabel - Free-text domain label, e.g. "aerospace digital twin"
 * @returns Array of lowercase keywords to check against field content
 */
function getDomainLabelKeywords(domainLabel: string): string[] {
  // Split label into individual words, filter out very short words and common words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "need",
    "de", "het", "een", "en", "of", "maar", "in", "op", "aan", "bij",
    "voor", "met", "van", "uit", "naar", "over", "door", "tot", "als",
    "is", "was", "zijn", "wordt", "heeft", "moet", "kan", "zal", "zou",
    "dit", "dat", "die", "deze", "geen", "niet", "wel", "nog", "al",
  ]);

  const words = domainLabel
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Also add the full label as a phrase keyword
  const keywords = [...words];
  if (domainLabel.length > 3) {
    keywords.push(domainLabel.toLowerCase());
  }

  return keywords;
}

/**
 * Check if a ProjectDefinition has a valid domain identity set.
 */
export function hasValidDomain(pd: ProjectDefinition): boolean {
  const domain = pd.architecture.domain;
  if (!domain) return false;
  if (domain.id === "generic" && domain.confidence === 0) return false;
  return true;
}

/**
 * Get a human-readable summary of the domain consistency report.
 */
export function formatConsistencyReport(report: ConsistencyReport): string {
  const lines: string[] = [];
  lines.push(`# Domain Consistency Report`);
  lines.push(`Domain: ${report.domain.id} (${report.domain.category})`);
  lines.push(`Confidence: ${report.domain.confidence}%`);

  // Show domain scores if available
  if (report.domain.scores && Object.keys(report.domain.scores).length > 0) {
    lines.push(`Domain Scores: ${describeDomainScores(report.domain.scores)}`);
  }

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
