// ──────────────────────────────────────────────
// Semantic Extraction Layer — types
// StructuredRequirements is the single source of
// truth between raw input and ProjectDefinition.
// ──────────────────────────────────────────────

import type { Phase } from "../types/projectDefinition";

/**
 * Project type classification.
 */
export type ProjectType = "website" | "saas" | "mobile" | "api" | "desktop";

/**
 * Detected language of the input text.
 */
export type InputLanguage = "nl" | "en";

/**
 * Per-field confidence score (0-100).
 */
export interface FieldConfidence {
  projectName: number;
  users: number;
  mvp: number;
  roadmap: number;
  architecture: number;
}

/**
 * Normalised, validated, structured requirements
 * produced by the Semantic Extraction Layer.
 *
 * This is the bridge between raw conversational input
 * and the ProjectDefinition mapper.
 */
export interface StructuredRequirements {
  // ── Extracted fields ────────────────────────
  projectName: string;
  tagline: string;
  description: string;
  targetUsers: string[];
  goals: string[];
  mvpFeatures: string[];
  integrations: string[];
  constraints: string[];
  risks: string[];
  entities: string[];
  services: string[];
  preferredTech: string[];

  // ── Derived fields ──────────────────────────
  domain: string;
  projectType: ProjectType;
  language: InputLanguage;
  componentTree: string;
  dataFlow: string;
  roadmap: Phase[];

  // ── Quality ─────────────────────────────────
  confidence: number;
  confidenceByField: FieldConfidence;
  warnings: string[];
}

/**
 * Result of a single extraction operation.
 */
export interface ExtractionResult<T> {
  value: T;
  confidence: number;
  warnings: string[];
}

/**
 * Domain information used for domain-specific generation.
 */
export interface DomainInfo {
  name: string;
  keywords: string[];
  taglineTemplate: (projectName: string) => string;
  componentTemplates: string[];
  dataFlowTemplate: string;
  roadmapPhases: Array<{
    title: string;
    tasks: string[];
  }>;
}
