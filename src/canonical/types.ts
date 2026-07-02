// ──────────────────────────────────────────────
// Canonical Extraction Layer — types
//
// These types exist ONLY within the extraction
// layer. After extraction, all data is mapped
// into ProjectDefinition — the single source
// of truth.
//
// Each canonical object is:
//   - Typed (TypeScript interface, no `any`)
//   - Scored (per-field confidence 0-100)
//   - Traceable (source: "llm" | "deterministic" | "fallback")
// ──────────────────────────────────────────────

// ── Source tracing ────────────────────────────

export type ExtractionSource = "llm" | "deterministic" | "fallback";

// ── Identity ──────────────────────────────────

export interface CanonicalIdentity {
  projectName: string;
  domain: CanonicalDomain;
  /** Free-text domain label from LLM, e.g. "aerospace digital twin" */
  domainLabel: string;
  /** Broad domain category, e.g. "industrial_analytics" */
  domainCategory: string;
  projectType: string;
  category: string;
  /** Template ID for fallback — optional when LLM provides domainLabel */
  templateId: string;
  /** Project tagline — LLM-generated or derived from projectName + projectType */
  tagline?: string;
  confidence: number;
  source: ExtractionSource;
}

// ── Domain (multi-score) ──────────────────────

export interface CanonicalDomain {
  /** Primary domain ID (highest score) */
  id: string;
  /** All domain scores — multi-domain probability */
  scores: Record<string, number>;
  /** Evidence strings explaining why each domain scored */
  evidence: string[];
  confidence: number;
  source: ExtractionSource;
}

// ── Users / Personas ──────────────────────────

export interface CanonicalPersona {
  name: string;
  description?: string;
  confidence: number;
}

export interface CanonicalUsers {
  personas: CanonicalPersona[];
  source: ExtractionSource;
  confidence: number;
}

// ── MVP Features ──────────────────────────────

export interface CanonicalFeature {
  name: string;
  description?: string;
  category?: string; // "auth", "core", "ui", "data", "integration", etc.
  confidence: number;
}

export interface CanonicalMvpFeatures {
  features: CanonicalFeature[];
  source: ExtractionSource;
  confidence: number;
}

// ── Tech Stack ────────────────────────────────

export interface CanonicalTechItem {
  name: string;
  category: "language" | "frontend" | "backend" | "database" | "infrastructure" | "deployment" | "integration" | "tool" | "other";
  canonicalName: string;
  confidence: number;
}

export interface CanonicalTechStack {
  items: CanonicalTechItem[];
  source: ExtractionSource;
  confidence: number;
}

// ── Architecture ──────────────────────────────

export interface CanonicalArchitecture {
  pattern: string;
  componentTree: string;
  dataFlow: string;
  confidence: number;
  source: ExtractionSource;
}

// ── Roadmap ───────────────────────────────────

export interface CanonicalRoadmapPhase {
  title: string;
  tasks: string[];
  confidence: number;
}

export interface CanonicalRoadmap {
  phases: CanonicalRoadmapPhase[];
  source: ExtractionSource;
  confidence: number;
}

// ── Integrations ──────────────────────────────

export interface CanonicalIntegration {
  name: string;
  confidence: number;
}

export interface CanonicalIntegrations {
  items: CanonicalIntegration[];
  source: ExtractionSource;
  confidence: number;
}

// ── Constraints ───────────────────────────────

export interface CanonicalConstraint {
  description: string;
  confidence: number;
}

export interface CanonicalConstraints {
  items: CanonicalConstraint[];
  source: ExtractionSource;
  confidence: number;
}

// ── Goals ─────────────────────────────────────

export interface CanonicalGoal {
  description: string;
  confidence: number;
}

export interface CanonicalGoals {
  items: CanonicalGoal[];
  source: ExtractionSource;
  confidence: number;
}

// ── Risks ─────────────────────────────────────

export interface CanonicalRisk {
  description: string;
  confidence: number;
}

export interface CanonicalRisks {
  items: CanonicalRisk[];
  source: ExtractionSource;
  confidence: number;
}

// ── Entities ──────────────────────────────────

export interface CanonicalEntity {
  name: string;
  confidence: number;
}

export interface CanonicalEntities {
  items: CanonicalEntity[];
  source: ExtractionSource;
  confidence: number;
}

// ── Complete extraction result ────────────────

export interface CanonicalExtractionResult {
  identity: CanonicalIdentity;
  users: CanonicalUsers;
  mvpFeatures: CanonicalMvpFeatures;
  techStack: CanonicalTechStack;
  architecture: CanonicalArchitecture;
  roadmap: CanonicalRoadmap;
  integrations: CanonicalIntegrations;
  constraints: CanonicalConstraints;
  goals: CanonicalGoals;
  risks: CanonicalRisks;
  entities: CanonicalEntities;

  /** Global confidence (0-100) across all fields */
  overallConfidence: number;
  /** Per-field confidence scores */
  confidenceByField: Record<string, number>;
  /** Warnings generated during extraction */
  warnings: string[];
  /** Which source was used overall */
  source: ExtractionSource;
}
