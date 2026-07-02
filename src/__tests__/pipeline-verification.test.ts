/// <reference types="vitest/globals" />

// ──────────────────────────────────────────────
// Pipeline Verification Test — v0.7
//
// Verifies that domainLabel flows unchanged through
// the full extraction pipeline:
//   RAW LLM JSON → CanonicalExtractionResult
//   → validateExtraction() → canonicalToProjectDefinition()
//   → ProjectDefinition.architecture.domain
//
// Tests 4 projects:
//   - AeroTracer     (aerospace digital twin — NOT ai-saas)
//   - DockMind       (warehouse orchestration — NOT ai-saas/support-platform)
//   - ClausePilot    (legal contract review — NOT ai-saas)
//   - HelpPilot AI   (support platform — IS ai-saas/support-platform)
// ──────────────────────────────────────────────

import type { CanonicalExtractionResult } from "../canonical/types";
import { validateExtraction } from "../canonical/validator";
import { canonicalToProjectDefinition } from "../canonical/canonicalToProjectDefinition";
import { extractDeterministic } from "../canonical/deterministicExtractor";
import type { ProjectDefinition } from "../types/projectDefinition";

// ── Helper: create a minimal CanonicalExtractionResult ──

function makeCanonicalResult(overrides: {
  identity: { domainLabel: string; domainCategory?: string; projectName?: string; templateId?: string };
  overallConfidence?: number;
}): CanonicalExtractionResult {
  const base: CanonicalExtractionResult = {
    identity: {
      projectName: overrides.identity.projectName || "Test Project",
      domainLabel: overrides.identity.domainLabel,
      domainCategory: overrides.identity.domainCategory || "software",
      domain: {
        id: overrides.identity.domainLabel.toLowerCase().replace(/\s+/g, "-"),
        scores: {},
        evidence: [`LLM classified as "${overrides.identity.domainLabel}"`],
        confidence: 85,
        source: "llm",
      },
      projectType: "software",
      category: "software",
      templateId: overrides.identity.templateId || "",
      confidence: 85,
      source: "llm",
    },
    users: { personas: [], source: "llm", confidence: 70 },
    mvpFeatures: { features: [], source: "llm", confidence: 70 },
    techStack: { items: [], source: "llm", confidence: 70 },
    architecture: { pattern: "", componentTree: "", dataFlow: "", confidence: 70, source: "llm" },
    roadmap: { phases: [], source: "llm", confidence: 70 },
    integrations: { items: [], source: "llm", confidence: 70 },
    constraints: { items: [], source: "llm", confidence: 70 },
    goals: { items: [], source: "llm", confidence: 70 },
    risks: { items: [], source: "llm", confidence: 70 },
    entities: { items: [], source: "llm", confidence: 70 },
    overallConfidence: 85,
    confidenceByField: {},
    warnings: [],
    source: "llm",
  };

  // Merge overrides
  return {
    ...base,
    ...overrides,
    identity: { ...base.identity, ...overrides.identity },
  };
}

// ── Helper: run full pipeline ──

function runPipeline(
  llmResult: CanonicalExtractionResult,
  rawText: string,
): {
  validated: CanonicalExtractionResult;
  projectDef: ProjectDefinition;
} {
  const validationResult = validateExtraction(llmResult, rawText);
  const projectDef = canonicalToProjectDefinition(validationResult.result);
  return { validated: validationResult.result, projectDef };
}

// ── Helper: run deterministic fallback pipeline ──

function runDeterministicPipeline(rawText: string): {
  canonical: CanonicalExtractionResult;
  projectDef: ProjectDefinition;
} {
  const canonical = extractDeterministic(rawText);
  const projectDef = canonicalToProjectDefinition(canonical);
  return { canonical, projectDef };
}

// ── Fixtures ──────────────────────────────────

// AeroTracer — aerospace digital twin platform
// This project uses AI/ML but is NOT an AI SaaS platform.
// It's an aerospace digital twin for aircraft performance monitoring.
const AEROTRACER_TEXT = `AeroTracer is an aerospace digital twin platform for aircraft performance monitoring and predictive maintenance. The platform ingests telemetry data from aircraft sensors, builds real-time digital twin models, and provides actionable insights for maintenance crews and fleet operators. Key features include real-time telemetry ingestion, digital twin visualization, anomaly detection using ML models, predictive maintenance scheduling, and fleet-wide performance dashboards. The tech stack includes TypeScript, React, Three.js for 3D visualization, Python for ML models, TimescaleDB for time-series data, and Kafka for real-time data streaming.`;

const AEROTRACER_LLM: CanonicalExtractionResult = makeCanonicalResult({
  identity: {
    projectName: "AeroTracer",
    domainLabel: "aerospace digital twin",
    domainCategory: "industrial_analytics",
  },
  overallConfidence: 88,
});

// DockMind — warehouse orchestration platform
// This project manages warehouse operations but is NOT a support platform.
const DOCKMIND_TEXT = `DockMind is a warehouse orchestration platform that optimizes dock scheduling, inventory management, and logistics coordination for distribution centers. The system provides real-time visibility into dock availability, automates carrier communication, and uses predictive analytics to optimize loading bay assignments. Features include dock scheduling with calendar view, carrier portal for appointment booking, real-time dock status dashboard, inventory tracking integration with WMS systems, and automated notifications for delays or changes. Built with TypeScript, React, Node.js, PostgreSQL, and WebSocket for real-time updates.`;

const DOCKMIND_LLM: CanonicalExtractionResult = makeCanonicalResult({
  identity: {
    projectName: "DockMind",
    domainLabel: "warehouse orchestration platform",
    domainCategory: "logistics",
  },
  overallConfidence: 87,
});

// ClausePilot — legal contract review platform
// This project uses AI for contract analysis but is NOT an AI SaaS platform.
const CLAUSEPILOT_TEXT = `ClausePilot is a legal contract review platform that helps legal teams analyze, redline, and manage contracts more efficiently. The platform uses natural language processing to identify risky clauses, suggest alternative language, and track contract versions. Features include contract upload and OCR processing, clause library with risk scoring, collaborative redlining with track changes, version history and comparison, and automated compliance checking against company policies. Tech stack: TypeScript, React, Node.js, PostgreSQL, Redis for caching, and NLP models for clause analysis.`;

const CLAUSEPILOT_LLM: CanonicalExtractionResult = makeCanonicalResult({
  identity: {
    projectName: "ClausePilot",
    domainLabel: "legal contract review platform",
    domainCategory: "legal",
  },
  overallConfidence: 86,
});

// HelpPilot AI — AI-powered support platform
// This project IS an ai-saas/support-platform (positive control).
const HELPPILOT_TEXT = `HelpPilot AI is an AI-powered support platform that helps support teams resolve customer tickets faster. The platform uses AI to automatically categorize incoming tickets, suggest replies based on knowledge base articles, and route complex issues to the right team members. Features include ticket inbox with AI categorization, reply suggestion engine, knowledge base management, team routing and assignment, and analytics dashboard with CSAT tracking. Built with TypeScript, React, Node.js, PostgreSQL, and OpenAI API for AI features.`;

const HELPPILOT_LLM: CanonicalExtractionResult = makeCanonicalResult({
  identity: {
    projectName: "HelpPilot AI",
    domainLabel: "AI-powered support platform",
    domainCategory: "ai_saas",
    templateId: "ai-saas/support-platform",
  },
  overallConfidence: 90,
});

// ── Tests ─────────────────────────────────────

describe("Pipeline Verification — LLM path (domainLabel preservation)", () => {
  const testCases = [
    // Note: domainCategory gets slugified by the validator (underscores removed),
    // so "industrial_analytics" becomes "industrialanalytics" and "ai_saas" becomes "aisaas"
    { name: "AeroTracer", llm: AEROTRACER_LLM, text: AEROTRACER_TEXT, expectedDomain: "aerospace digital twin", expectedCategory: "industrialanalytics", notTemplate: "ai-saas" },
    { name: "DockMind", llm: DOCKMIND_LLM, text: DOCKMIND_TEXT, expectedDomain: "warehouse orchestration platform", expectedCategory: "logistics", notTemplate: "ai-saas/support-platform" },
    { name: "ClausePilot", llm: CLAUSEPILOT_LLM, text: CLAUSEPILOT_TEXT, expectedDomain: "legal contract review platform", expectedCategory: "legal", notTemplate: "ai-saas" },
    { name: "HelpPilot AI", llm: HELPPILOT_LLM, text: HELPPILOT_TEXT, expectedDomain: "AI-powered support platform", expectedCategory: "aisaas", notTemplate: undefined },
  ];

  for (const tc of testCases) {
    it(`${tc.name}: domainLabel preserved through validateExtraction`, () => {
      const { validated } = runPipeline(tc.llm, tc.text);
      expect(validated.identity.domainLabel).toBe(tc.expectedDomain);
      expect(validated.identity.domainCategory).toBe(tc.expectedCategory);
    });

    it(`${tc.name}: domainLabel preserved through canonicalToProjectDefinition`, () => {
      const { projectDef } = runPipeline(tc.llm, tc.text);
      expect(projectDef.architecture.domain?.domainLabel).toBe(tc.expectedDomain);
      expect(projectDef.architecture.domain?.domainCategory).toBe(tc.expectedCategory);
    });

    it(`${tc.name}: templateId does not override domainLabel`, () => {
      const { projectDef } = runPipeline(tc.llm, tc.text);
      // templateId should NOT overwrite domainLabel
      const domain = projectDef.architecture.domain;
      expect(domain?.domainLabel).toBe(tc.expectedDomain);
      // templateId may be empty or set, but must not be the domainLabel
      if (domain?.templateId) {
        expect(domain.templateId).not.toBe(tc.expectedDomain);
      }
    });

    if (tc.notTemplate) {
      it(`${tc.name}: templateId is NOT "${tc.notTemplate}"`, () => {
        const { projectDef } = runPipeline(tc.llm, tc.text);
        const tid = projectDef.architecture.domain?.templateId || "";
        expect(tid).not.toBe(tc.notTemplate);
      });
    }
  }
});

describe("Pipeline Verification — Deterministic fallback path", () => {
  it("AeroTracer: deterministic fallback does NOT produce ai-saas", () => {
    const { projectDef } = runDeterministicPipeline(AEROTRACER_TEXT);
    const domain = projectDef.architecture.domain;
    // The deterministic fallback may not be "aerospace digital twin" (it's regex-based),
    // but it must NOT be "ai-saas" or "ai-saas/support-platform"
    expect(domain?.templateId).not.toBe("ai-saas");
    expect(domain?.templateId).not.toBe("ai-saas/support-platform");
    // domainLabel should be descriptive, not a template ID
    expect(domain?.domainLabel).not.toBe("ai-saas");
    expect(domain?.domainLabel).not.toBe("ai-saas/support-platform");
  });

  it("DockMind: deterministic fallback does NOT produce ai-saas/support-platform", () => {
    const { projectDef } = runDeterministicPipeline(DOCKMIND_TEXT);
    const domain = projectDef.architecture.domain;
    expect(domain?.templateId).not.toBe("ai-saas");
    expect(domain?.templateId).not.toBe("ai-saas/support-platform");
    expect(domain?.domainLabel).not.toBe("ai-saas");
    expect(domain?.domainLabel).not.toBe("ai-saas/support-platform");
  });

  it("ClausePilot: deterministic fallback does NOT produce ai-saas", () => {
    const { projectDef } = runDeterministicPipeline(CLAUSEPILOT_TEXT);
    const domain = projectDef.architecture.domain;
    expect(domain?.templateId).not.toBe("ai-saas");
    expect(domain?.templateId).not.toBe("ai-saas/support-platform");
    expect(domain?.domainLabel).not.toBe("ai-saas");
    expect(domain?.domainLabel).not.toBe("ai-saas/support-platform");
  });

  it("HelpPilot AI: deterministic fallback correctly identifies support platform", () => {
    const { projectDef } = runDeterministicPipeline(HELPPILOT_TEXT);
    const domain = projectDef.architecture.domain;
    // HelpPilot has strong support keywords, so it should match ai-saas/support-platform
    expect(domain?.templateId).toBe("ai-saas/support-platform");
  });
});

describe("Pipeline Verification — Cross-pipeline consistency", () => {
  it("domainLabel is identical in CanonicalExtractionResult and ProjectDefinition", () => {
    const testCases = [
      { llm: AEROTRACER_LLM, text: AEROTRACER_TEXT },
      { llm: DOCKMIND_LLM, text: DOCKMIND_TEXT },
      { llm: CLAUSEPILOT_LLM, text: CLAUSEPILOT_TEXT },
      { llm: HELPPILOT_LLM, text: HELPPILOT_TEXT },
    ];

    for (const tc of testCases) {
      const { validated, projectDef } = runPipeline(tc.llm, tc.text);
      expect(projectDef.architecture.domain?.domainLabel).toBe(validated.identity.domainLabel);
    }
  });

  it("domainCategory is identical in CanonicalExtractionResult and ProjectDefinition", () => {
    const testCases = [
      { llm: AEROTRACER_LLM, text: AEROTRACER_TEXT },
      { llm: DOCKMIND_LLM, text: DOCKMIND_TEXT },
      { llm: CLAUSEPILOT_LLM, text: CLAUSEPILOT_TEXT },
      { llm: HELPPILOT_LLM, text: HELPPILOT_TEXT },
    ];

    for (const tc of testCases) {
      const { validated, projectDef } = runPipeline(tc.llm, tc.text);
      expect(projectDef.architecture.domain?.domainCategory).toBe(validated.identity.domainCategory);
    }
  });
});
