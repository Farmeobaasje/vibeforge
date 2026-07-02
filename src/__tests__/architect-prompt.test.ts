/// <reference types="vitest/globals" />

// ──────────────────────────────────────────────
// Architect Prompt Tests — v0.2.0
// Verifies that buildArchitectPrompt() produces
// correct content ordering and uses enriched
// ProjectDefinition as primary context.
//
// Key regression test: the prompt must NOT contain
// fallback text like "(not specified)" when the
// enriched definition has actual values. It must
// contain real data (React, NestJS, PostgreSQL,
// MVP features, target users, etc.).
// ──────────────────────────────────────────────

import { buildArchitectPrompt } from "../ai/architect/architectPrompts";
import type { ProjectRequirements } from "../models/projectRequirements";
import type { ProjectDefinition } from "../types/projectDefinition";

// ── Fixture: BioBatch Sentinel (biotech lab platform) ──
// This fixture simulates a fully populated project to test
// that the prompt uses enriched data, not fallback text.

const biobatchRequirements: ProjectRequirements = {
  id: "test-biobatch-001",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  vision: "A laboratory operations platform for biotech labs",
  projectName: "BioBatch Sentinel",
  goals: [
    "Track samples through the lab workflow",
    "Manage batch workflows",
    "Integrate with lab equipment via APIs",
    "Provide real-time dashboards for QC metrics",
  ],
  targetUsers: ["Lab technicians", "Quality control managers", "Lab directors"],
  problems: [
    "Lab technicians waste time manually tracking samples",
    "QC metrics are scattered across multiple systems",
  ],
  solutionIdeas: [
    "Centralized sample tracking with barcode scanning",
    "Automated batch workflow management",
    "Real-time QC dashboard",
  ],
  mvpScope: "Sample tracking with barcode scanning\nBatch workflow management\nQC metrics dashboard\nLab equipment API integration",
  integrations: ["Lab equipment APIs", "LIMS systems"],
  constraints: ["Must comply with GLP/GMP regulations", "Audit trail required for all operations"],
  preferredTech: ["React", "NestJS", "PostgreSQL", "Docker"],
  aiWorkflowTarget: "Cline",
  repositoryState: "greenfield",
  risks: ["Integration complexity with legacy lab equipment"],
  unknowns: ["Exact lab equipment API protocols"],
  confidence: "medium",
};

const biobatchEnriched: ProjectDefinition = {
  project: {
    name: "BioBatch Sentinel",
    tagline: "Biotech Lab Operations Platform",
    version: "0.1.0",
    description: "A laboratory operations platform for biotech labs that tracks samples, manages batch workflows, integrates with lab equipment via APIs, and provides real-time dashboards for QC metrics.",
    status: "draft",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Lab Technicians", "Quality Control Managers", "Lab Directors"],
    problemStatement: "Lab technicians waste time manually tracking samples and QC metrics are scattered across multiple systems, leading to inefficiencies and errors in biotech lab operations.",
    solution: "A centralized laboratory operations platform with sample tracking, automated batch workflows, real-time QC dashboards, and lab equipment API integration.",
    userStories: [
      "As a lab technician, I want to scan barcodes to track samples through the workflow.",
      "As a QC manager, I want to see real-time QC metrics on a dashboard.",
      "As a lab director, I want audit trails for all operations to comply with GLP/GMP.",
    ],
    mvpScope: "Sample tracking with barcode scanning\nBatch workflow management\nQC metrics dashboard\nLab equipment API integration",
    mvpFeatures: [
      "Sample tracking with barcode scanning",
      "Batch workflow management",
      "QC metrics dashboard",
      "Lab equipment API integration",
    ],
  },
  tech: {
    languages: ["TypeScript"],
    frameworks: ["React", "NestJS"],
    tools: ["Docker"],
    dependencies: ["PostgreSQL"],
    constraints: ["Must comply with GLP/GMP regulations", "Audit trail required for all operations"],
  },
  architecture: {
    pattern: "Modular monolith with REST API",
    directoryStructure: "",
    componentTree: "App\n├── Dashboard\n│   ├── QCMetrics\n│   └── BatchStatus\n├── Samples\n│   ├── SampleTracker\n│   └── BarcodeScanner\n├── Workflows\n│   └── BatchManager\n└── Integrations\n    └── EquipmentAPI",
    dataFlow: "Client → REST API → Service Layer → PostgreSQL\nLab Equipment → API Gateway → Service Layer",
  },
  roadmap: {
    phases: [
      { id: "phase-1", title: "Foundation & Setup", tasks: [{ id: "t1", title: "Project scaffold opzetten", status: "pending" }] },
      { id: "phase-2", title: "MVP — Core Features", tasks: [{ id: "t2", title: "Sample tracking", status: "pending" }] },
    ],
    activePhaseId: "phase-1",
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    validationRules: ["Sample data must be validated before storage", "Audit trail must be immutable"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

// ── Fixture: empty requirements (edge case) ──

const emptyRequirements: ProjectRequirements = {
  id: "test-empty-001",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  vision: "",
  projectName: "",
  goals: [],
  targetUsers: [],
  problems: [],
  solutionIdeas: [],
  mvpScope: "",
  integrations: [],
  constraints: [],
  preferredTech: [],
  aiWorkflowTarget: "",
  repositoryState: "greenfield",
  risks: [],
  unknowns: [],
  confidence: "low",
};

// ── Tests ──────────────────────────────────────

describe("buildArchitectPrompt — section ordering", () => {
  it("places Resolved Project Definition before Raw Project Requirements", () => {
    const prompt = buildArchitectPrompt(biobatchRequirements, undefined, undefined, undefined, biobatchEnriched);

    // Find positions of key section headers
    const resolvedPos = prompt.indexOf("## Resolved Project Definition");
    const rawPos = prompt.indexOf("## Raw Project Requirements");
    const conversationPos = prompt.indexOf("## Conversation Context");

    // Resolved must come first
    expect(resolvedPos).toBeGreaterThanOrEqual(0);
    expect(rawPos).toBeGreaterThan(resolvedPos);

    // Conversation context should come after raw requirements (or not be present)
    if (conversationPos >= 0) {
      expect(conversationPos).toBeGreaterThan(rawPos);
    }
  });

  it("includes Instructions section at the end", () => {
    const prompt = buildArchitectPrompt(biobatchRequirements, undefined, undefined, undefined, biobatchEnriched);
    expect(prompt).toContain("## Instructions");
    // Instructions should be the last section
    const instructionsPos = prompt.indexOf("## Instructions");
    const lastSectionPos = prompt.lastIndexOf("## ");
    expect(instructionsPos).toBe(lastSectionPos);
  });
});

describe("buildArchitectPrompt — enriched data usage", () => {
  it("contains actual project data (not fallback text) when enriched definition is provided", () => {
    const prompt = buildArchitectPrompt(biobatchRequirements, undefined, undefined, undefined, biobatchEnriched);

    // Must contain actual project name
    expect(prompt).toContain("BioBatch Sentinel");

    // Must contain actual tech stack from enriched definition
    expect(prompt).toContain("React");
    expect(prompt).toContain("NestJS");
    expect(prompt).toContain("PostgreSQL");

    // Must contain actual target users from enriched definition
    expect(prompt).toContain("Lab Technicians");
    expect(prompt).toContain("Quality Control Managers");

    // Must contain actual MVP features
    expect(prompt).toContain("Sample tracking with barcode scanning");
    expect(prompt).toContain("QC metrics dashboard");

    // Must contain actual problem/solution
    expect(prompt).toContain("Lab technicians waste time");
    expect(prompt).toContain("centralized laboratory operations platform");

    // Must contain actual architecture pattern
    expect(prompt).toContain("Modular monolith with REST API");

    // Must contain actual component tree
    expect(prompt).toContain("SampleTracker");
    expect(prompt).toContain("BarcodeScanner");

    // Must contain actual user stories
    expect(prompt).toContain("scan barcodes to track samples");
    expect(prompt).toContain("audit trails for all operations");

    // Must contain actual roadmap phases
    expect(prompt).toContain("Foundation & Setup");
    expect(prompt).toContain("MVP — Core Features");
  });

  it("does NOT contain fallback text like '(not specified)' for fields that have enriched data", () => {
    const prompt = buildArchitectPrompt(biobatchRequirements, undefined, undefined, undefined, biobatchEnriched);

    // The Resolved Project Definition section should NOT have fallback text for populated fields
    const resolvedSection = prompt.substring(
      prompt.indexOf("## Resolved Project Definition"),
      prompt.indexOf("## Raw Project Requirements"),
    );

    // These fields are populated in the enriched definition, so no fallback
    expect(resolvedSection).not.toContain("(not specified)");
    expect(resolvedSection).not.toContain("(none specified)");
    expect(resolvedSection).not.toContain("(not defined)");
    expect(resolvedSection).not.toContain("(not provided)");
  });

  it("contains the explicit instruction about Resolved Project Definition being primary", () => {
    const prompt = buildArchitectPrompt(biobatchRequirements, undefined, undefined, undefined, biobatchEnriched);

    // The IMPORTANT instruction must be present
    expect(prompt).toContain("PRIMARY source of truth");
    expect(prompt).toContain("Do NOT treat the project as having sparse requirements");
  });
});

describe("buildArchitectPrompt — without enriched definition", () => {
  it("still works correctly when no enriched definition is provided", () => {
    const prompt = buildArchitectPrompt(biobatchRequirements);

    // Should still contain the raw requirements section
    expect(prompt).toContain("## Raw Project Requirements");

    // Should NOT contain the Resolved Project Definition section
    expect(prompt).not.toContain("## Resolved Project Definition");

    // Should still contain actual data from requirements
    expect(prompt).toContain("BioBatch Sentinel");
    expect(prompt).toContain("Lab technicians");
  });

  it("handles empty requirements gracefully", () => {
    const prompt = buildArchitectPrompt(emptyRequirements);

    // Should not crash
    expect(prompt).toBeTruthy();

    // Should contain fallback text for empty fields
    expect(prompt).toContain("(not provided)");
    expect(prompt).toContain("(none specified)");

    // Should still have the instructions section
    expect(prompt).toContain("## Instructions");
  });
});

describe("buildArchitectPrompt — with conversation memory", () => {
  it("includes conversation context when memory is provided", () => {
    const memory = {
      id: "mem-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      messages: [],
      questions: [
        { id: "q1", question: "What is the target audience?", answer: "Lab technicians and QC managers", topic: "users", skipped: false, confidence: "high" as const, createdAt: "2026-01-01T00:00:00.000Z", answeredAt: "2026-01-01T00:00:00.000Z" },
      ],
      decisions: [],
      assumptions: [],
      rejectedIdeas: [],
      openQuestions: [],
      confidence: "high" as const,
    };

    const prompt = buildArchitectPrompt(biobatchRequirements, memory, undefined, undefined, biobatchEnriched);

    // Conversation context should be present
    expect(prompt).toContain("## Conversation Context");

    // It should come AFTER raw requirements
    const rawPos = prompt.indexOf("## Raw Project Requirements");
    const convPos = prompt.indexOf("## Conversation Context");
    expect(convPos).toBeGreaterThan(rawPos);

    // Should contain the answered question
    expect(prompt).toContain("Lab technicians and QC managers");
  });
});

describe("buildArchitectPrompt — with existing analysis", () => {
  it("includes existing analysis section when provided", () => {
    const existingAnalysis = {
      id: "analysis-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      executiveSummary: "Previous analysis",
      overallScore: 45,
      functionalAnalysis: { coreFeatures: [], userFlows: [], edgeCases: [], scalabilityConcerns: [] },
      technicalAnalysis: { architecturePattern: "", dataModel: "", apiDesign: "", security: "", performance: "", deployment: "" },
      risks: [],
      recommendations: [],
      tradeoffs: [],
      unknowns: ["Some open question"],
      suggestedStack: { frontend: "", backend: "", database: "", infrastructure: "", ai: "", testing: "", monitoring: "" },
      suggestedArchitecture: "",
      estimatedComplexity: "medium" as const,
      estimatedTimeline: "",
      confidence: 30,
    };

    const prompt = buildArchitectPrompt(biobatchRequirements, undefined, existingAnalysis, undefined, biobatchEnriched);

    // Existing analysis section should be present
    expect(prompt).toContain("## Existing Architecture Analysis");

    // Should reference previous score
    expect(prompt).toContain("Previous overall score: 45");

    // Should come after raw requirements
    const rawPos = prompt.indexOf("## Raw Project Requirements");
    const existingPos = prompt.indexOf("## Existing Architecture Analysis");
    expect(existingPos).toBeGreaterThan(rawPos);
  });
});
