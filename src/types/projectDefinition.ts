// ──────────────────────────────────────────────
// ProjectDefinition — single source of truth
// ──────────────────────────────────────────────

export type ProjectStatus = "idea" | "draft" | "ready" | "bootstrapped";
export type TaskStatus = "pending" | "done";
export type GeneratedFileLanguage = "markdown" | "json" | "typescript" | "text";
export type RepositoryState =
  | "greenfield"
  | "empty-repository"
  | "existing-project";

// ── Project ───────────────────────────────────

export interface ProjectInfo {
  name: string;
  tagline: string;
  version: string;
  description: string;
  status: ProjectStatus;
  repositoryState: RepositoryState;
}

// ── Product ───────────────────────────────────

export interface ProductInfo {
  targetUsers: string[];
  problemStatement: string;
  solution: string;
  userStories: string[];
  mvpScope: string;
  /** Derived from mvpScope — individual features parsed from the scope text */
  mvpFeatures: string[];
}

// ── Tech ──────────────────────────────────────

export interface TechStack {
  languages: string[];
  frameworks: string[];
  tools: string[];
  dependencies: string[];
  constraints: string[];
}

// ── Architecture ──────────────────────────────

export interface ArchitectureInfo {
  pattern: string;
  directoryStructure: string;
  componentTree: string;
  dataFlow: string;
  /** Domain model — structured entity graph from semantic extraction */
  domainModel?: import("../semantic/domainModelTypes").DomainModel;
  /** Per-field semantic confidence scores */
  semanticConfidence?: import("../semantic/semanticConfidence").SemanticConfidence;
  /** Canonical domain identity — set once in Semantic Layer, immutable downstream */
  domain?: import("./domainIdentity").ProjectDomain;
}

// ── Roadmap ───────────────────────────────────

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Phase {
  id: string;
  title: string;
  tasks: Task[];
}

export interface RoadmapInfo {
  phases: Phase[];
  activePhaseId: string | null;
}

// ── Memory Bank ───────────────────────────────

export interface MemoryFile {
  path: string;
  description: string;
  required: boolean;
}

export interface MemoryConfig {
  files: MemoryFile[];
  updateCadence: string;
  patterns: string[];
}

// ── Agents ────────────────────────────────────

export interface Agent {
  role: string;
  model: string;
  promptTemplate: string;
}

export interface AgentsInfo {
  agents: Agent[];
}

// ── Quality ───────────────────────────────────

export interface QualityRules {
  codeStyle: string;
  testingStrategy: string;
  validationRules: string[];
  fallbackBehavior: string;
}

// ── Options ───────────────────────────────────

export type CompressionMode = "normal" | "compact" | "caveman-lite" | "handoff";

export interface ProjectOptions {
  /** @deprecated Use compressionMode instead. Kept for backward compatibility. */
  compression: boolean;
  /** Compression mode for agent communication. Replaces compression boolean. */
  compressionMode?: CompressionMode;
  orchestratorModel: string;
  focusChain: boolean;
  extraDocs: string[];
}

// ── Generated File ────────────────────────────

export interface GeneratedFile {
  path: string;
  language: GeneratedFileLanguage;
  content: string;
}

// ── Extraction Identity ───────────────────────

export interface ExtractionIdentity {
  /** Source of extraction: LLM, deterministic, or fallback */
  source: "llm" | "deterministic" | "fallback";
  /** Per-field source tracing */
  fieldSources: Record<string, "llm" | "deterministic" | "fallback">;
}

// ── Confidence ────────────────────────────────

export interface ConfidenceScores {
  /** Global confidence (0-100) across all fields */
  overall: number;
  /** Per-field confidence scores */
  byField: Record<string, number>;
}

// ── Root ──────────────────────────────────────

export interface ProjectDefinition {
  project: ProjectInfo;
  product: ProductInfo;
  tech: TechStack;
  architecture: ArchitectureInfo;
  roadmap: RoadmapInfo;
  memory: MemoryConfig;
  agents: AgentsInfo;
  quality: QualityRules;
  options: ProjectOptions;
  generatedFiles?: GeneratedFile[];
  /** Extraction identity — source tracing for all fields */
  identity?: ExtractionIdentity;
  /** Confidence scores — global + per-field */
  confidence?: ConfidenceScores;
}

// ── Default fallback ──────────────────────────

export const defaultProjectDefinition: ProjectDefinition = {
  project: {
    name: "My Project",
    tagline: "A brief description of what this project does",
    version: "0.1.0",
    description: "",
    status: "idea",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: [],
    problemStatement: "",
    solution: "",
    userStories: [],
    mvpScope: "",
    mvpFeatures: [],
  },
  tech: {
    languages: [],
    frameworks: [],
    tools: [],
    dependencies: [],
    constraints: [],
  },
  architecture: {
    pattern: "",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [],
    activePhaseId: null,
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
  agents: {
    agents: [
      {
        role: "orchestrator",
        model: "gpt-4o",
        promptTemplate: "You are an orchestrator. Convert raw project ideas into a structured ProjectDefinition JSON.",
      },
      {
        role: "plan",
        model: "claude-sonnet-4-20250514",
        promptTemplate: "You are a Cline Plan agent. Read the bootstrap prompt and present a file-by-file implementation plan.",
      },
      {
        role: "act",
        model: "claude-sonnet-4-20250514",
        promptTemplate: "You are a Cline Act agent. Write the exact files specified in the plan.",
      },
    ],
  },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    validationRules: [
      "JSON parse errors must show a clear message",
      "Import accepts arrays and newline-delimited strings",
      "Missing fields must not break the generator",
      "Empty sections get useful fallbacks, not bare placeholders",
    ],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};
