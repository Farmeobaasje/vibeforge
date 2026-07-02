// ──────────────────────────────────────────────
// domainIdentity — Canonical domain identity
//
// Single source of truth for project domain.
// Set once in the Semantic Layer, consumed
// everywhere downstream. No re-detection.
// ──────────────────────────────────────────────

/**
 * Canonical domain identity.
 * Set once during semantic extraction, immutable thereafter.
 */
export interface ProjectDomain {
  /** Domain identifier, e.g. "ai_saas_support", "restaurant", "emulator" */
  id: string;
  /** Free-text domain label from LLM, e.g. "aerospace digital twin" */
  domainLabel?: string;
  /** Broad domain category, e.g. "industrial_analytics" */
  domainCategory?: string;
  /** Domain category, e.g. "ai_saas", "hospitality", "gaming" */
  category: string;
  /** Template ID used for generation */
  templateId: string;
  /** Detection confidence 0-100 */
  confidence: number;
  /** Multi-domain probability scores — all domains with their scores */
  scores?: Record<string, number>;
  /** Evidence strings explaining domain detection */
  evidence?: string[];
  /** Source of domain detection */
  source?: "llm" | "deterministic" | "fallback";
}

/**
 * Default/empty domain identity.
 */
export const emptyProjectDomain: ProjectDomain = {
  id: "generic",
  category: "software",
  templateId: "generic",
  confidence: 0,
};

/**
 * Consistency check result for a single field.
 */
export interface ConsistencyCheck {
  field: string;
  expected: string;
  actual: string;
  match: boolean;
  severity: "error" | "warning" | "info";
}

/**
 * Full consistency report.
 */
export interface ConsistencyReport {
  valid: boolean;
  domain: ProjectDomain;
  checks: ConsistencyCheck[];
  warnings: string[];
}
