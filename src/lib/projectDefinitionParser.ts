// ──────────────────────────────────────────────
// projectDefinitionParser — parse & normalize JSON
// ──────────────────────────────────────────────

import {
  type ProjectDefinition,
  type ProjectInfo,
  type ProductInfo,
  type TechStack,
  type ArchitectureInfo,
  type RoadmapInfo,
  type MemoryConfig,
  type AgentsInfo,
  type QualityRules,
  type ProjectOptions,
  type ProjectStatus,
  type TaskStatus,
  type RepositoryState,
  type Phase,
  type Task,
  type MemoryFile,
  type Agent,
  defaultProjectDefinition,
} from "../types/projectDefinition";


// ── Public types ──────────────────────────────

export type SchemaType = "flat" | "nested" | "unknown";

export interface ParseResult {
  success: boolean;
  data: ProjectDefinition;
  error: string | null;
  schemaType: SchemaType;
  warnings: string[];
  missingFields: string[];
}

export interface NormalizeResult {
  data: ProjectDefinition;
  schemaType: SchemaType;
  warnings: string[];
  missingFields: string[];
}

// ── Known top-level keys (flat mode) ──────────

const KNOWN_FLAT_KEYS = new Set([
  "name", "tagline", "version", "description", "status",
  "repositoryState", "projectState", "mode", "projectMode",
  "targetUsers", "problemStatement", "problem", "solution", "userStories", "stories", "mvpScope", "scope",
  "languages", "language", "frameworks", "framework", "stack", "tools", "dependencies", "deps", "constraints",
  "pattern", "architecturePattern", "directoryStructure", "directory", "componentTree", "components", "dataFlow", "dataflow",
  "roadmap", "memory", "agents", "quality", "options",
]);


const KNOWN_NESTED_KEYS = new Set([
  "project", "product", "tech", "architecture", "roadmap", "memory", "agents", "quality", "options",
]);

// ── Public API ────────────────────────────────

/**
 * Parse a raw JSON string into a ProjectDefinition.
 * Returns a ParseResult — never throws.
 */
export function parseProjectDefinitionJson(rawJson: string): ParseResult {
  // 1. Empty input
  if (!rawJson || rawJson.trim().length === 0) {
    return {
      success: false,
      data: { ...defaultProjectDefinition },
      error: "Input is empty. Please paste a Project Definition JSON.",
      schemaType: "unknown",
      warnings: [],
      missingFields: [],
    };
  }

  // 2. Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (e) {
    return {
      success: false,
      data: { ...defaultProjectDefinition },
      error: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
      schemaType: "unknown",
      warnings: [],
      missingFields: [],
    };
  }

  // 3. Must be an object (or array — we handle arrays too)
  if (parsed === null || typeof parsed !== "object") {
    return {
      success: false,
      data: { ...defaultProjectDefinition },
      error: "JSON must be an object (or array of objects). Received: " + typeof parsed,
      schemaType: "unknown",
      warnings: [],
      missingFields: [],
    };
  }

  // 4. Normalize
  const result = normalizeProjectDefinition(parsed);
  return {
    success: true,
    data: result.data,
    error: null,
    schemaType: result.schemaType,
    warnings: result.warnings,
    missingFields: result.missingFields,
  };
}

// ── Normalizer ────────────────────────────────

/**
 * Normalize any unknown input into a valid ProjectDefinition.
 * Supports two forms:
 *   - Full nested: { project: { name, tagline, ... }, product: { ... }, ... }
 *   - Flat:        { name, description, stack, architecture, roadmap, ... }
 *
 * Returns a NormalizeResult with warnings and missing-fields info.
 */
export function normalizeProjectDefinition(input: unknown): NormalizeResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  if (input === null || typeof input !== "object") {
    warnings.push("Input is not an object — using default project definition.");
    return { data: { ...defaultProjectDefinition }, schemaType: "unknown", warnings, missingFields };
  }

  const raw = input as Record<string, unknown>;

  // Detect flat vs nested: if top-level has "project" as object, treat as nested
  const isNested =
    raw.project !== undefined &&
    raw.project !== null &&
    typeof raw.project === "object";

  let data: ProjectDefinition;
  let schemaType: SchemaType;

  if (isNested) {
    schemaType = "nested";
    data = normalizeNested(raw, warnings, missingFields);
  } else {
    schemaType = "flat";
    data = normalizeFlat(raw, warnings, missingFields);
  }

  // Detect unknown top-level keys
  const knownKeys = isNested ? KNOWN_NESTED_KEYS : KNOWN_FLAT_KEYS;
  const unknownKeys = Object.keys(raw).filter((k) => !knownKeys.has(k));
  for (const key of unknownKeys) {
    warnings.push(`Unknown field "${key}" — will be ignored.`);
  }

  return { data, schemaType, warnings, missingFields };
}

// ── Nested normalizer ─────────────────────────

function normalizeNested(
  raw: Record<string, unknown>,
  warnings: string[],
  missingFields: string[],
): ProjectDefinition {
  const result: ProjectDefinition = {
    project: normalizeProjectInfo(raw.project, "project", warnings, missingFields),
    product: normalizeProductInfo(raw.product, "product", warnings),
    tech: normalizeTechStack(raw.tech, "tech", warnings),
    architecture: normalizeArchitectureInfo(raw.architecture, "architecture", warnings),
    roadmap: normalizeRoadmapInfo(raw.roadmap, "roadmap", warnings),
    memory: normalizeMemoryConfig(raw.memory, "memory", warnings),
    agents: normalizeAgentsInfo(raw.agents, "agents", warnings),
    quality: normalizeQualityRules(raw.quality, "quality", warnings),
    options: normalizeProjectOptions(raw.options, "options", warnings),
    generatedFiles: undefined,
  };

  // Check for missing top-level sections
  for (const key of ["project", "product", "tech", "architecture", "roadmap", "memory", "agents", "quality", "options"]) {
    if (raw[key] === undefined) {
      warnings.push(`Missing section "${key}" — using defaults.`);
    }
  }

  return result;
}

// ── Flat normalizer ───────────────────────────

function normalizeFlat(
  raw: Record<string, unknown>,
  warnings: string[],
  missingFields: string[],
): ProjectDefinition {
  const def = { ...defaultProjectDefinition };

  // ── Project ──
  def.project = {
    name: toString(raw.name, def.project.name),
    tagline: toString(raw.tagline, def.project.tagline),
    version: toString(raw.version, def.project.version),
    description: toString(raw.description, def.project.description),
    status: normalizeStatus(raw.status),
    repositoryState: normalizeRepositoryState(raw.repositoryState ?? raw.projectState ?? raw.mode ?? raw.projectMode),
  };


  // ── Product ──
  def.product = {
    targetUsers: toStringArray(raw.targetUsers ?? raw.targetUsers, def.product.targetUsers),
    problemStatement: toString(raw.problemStatement ?? raw.problem, def.product.problemStatement),
    solution: toString(raw.solution, def.product.solution),
    userStories: toStringArray(raw.userStories ?? raw.stories, def.product.userStories),
    mvpScope: toString(raw.mvpScope ?? raw.scope, def.product.mvpScope),
    mvpFeatures: toStringArray(raw.mvpFeatures, def.product.mvpFeatures),
  };

  // ── Tech ──
  def.tech = {
    languages: toStringArray(raw.languages ?? raw.language, def.tech.languages),
    frameworks: toStringArray(raw.frameworks ?? raw.framework ?? raw.stack, def.tech.frameworks),
    tools: toStringArray(raw.tools, def.tech.tools),
    dependencies: toStringArray(raw.dependencies ?? raw.deps, def.tech.dependencies),
    constraints: toStringArray(raw.constraints, def.tech.constraints),
  };

  // ── Architecture ──
  def.architecture = {
    pattern: toString(raw.pattern ?? raw.architecturePattern, def.architecture.pattern),
    directoryStructure: toString(raw.directoryStructure ?? raw.directory, def.architecture.directoryStructure),
    componentTree: toString(raw.componentTree ?? raw.components, def.architecture.componentTree),
    dataFlow: toString(raw.dataFlow ?? raw.dataflow, def.architecture.dataFlow),
  };

  // ── Roadmap ──
  def.roadmap = normalizeRoadmapInfo(raw.roadmap, "roadmap", warnings);

  // ── Memory ──
  def.memory = normalizeMemoryConfig(raw.memory, "memory", warnings);

  // ── Agents ──
  def.agents = normalizeAgentsInfo(raw.agents, "agents", warnings);

  // ── Quality ──
  def.quality = normalizeQualityRules(raw.quality, "quality", warnings);

  // ── Options ──
  def.options = normalizeProjectOptions(raw.options, "options", warnings);

  // Detect missing core fields
  checkMissingCoreFields(def, missingFields, warnings);

  return def;
}

// ── Missing core field detection ──────────────

function checkMissingCoreFields(
  data: ProjectDefinition,
  missingFields: string[],
  warnings: string[],
): void {
  if (!data.project.name || data.project.name === defaultProjectDefinition.project.name) {
    missingFields.push("project.name");
    warnings.push('Core field "project.name" is missing or using default — consider setting a project name.');
  }
  if (!data.project.description || data.project.description === defaultProjectDefinition.project.description) {
    missingFields.push("project.description");
    warnings.push('Core field "project.description" is missing or empty — consider adding a description.');
  }
}

// ── Field normalizers ─────────────────────────

function normalizeProjectInfo(
  value: unknown,
  prefix: string,
  warnings: string[],
  missingFields: string[],
): ProjectInfo {
  const def = defaultProjectDefinition.project;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  const result: ProjectInfo = {
    name: toString(v.name, def.name),
    tagline: toString(v.tagline, def.tagline),
    version: toString(v.version, def.version),
    description: toString(v.description, def.description),
    status: normalizeStatus(v.status),
    repositoryState: normalizeRepositoryState(v.repositoryState ?? v.projectState ?? v.mode),
  };

  // Check core fields

  if (!result.name || result.name === def.name) {
    missingFields.push(`${prefix}.name`);
    warnings.push(`Core field "${prefix}.name" is missing or using default — consider setting a project name.`);
  }
  if (!result.description || result.description === def.description) {
    missingFields.push(`${prefix}.description`);
    warnings.push(`Core field "${prefix}.description" is missing or empty — consider adding a description.`);
  }

  return result;
}

function normalizeProductInfo(
  value: unknown,
  prefix: string,
  warnings: string[],
): ProductInfo {
  const def = defaultProjectDefinition.product;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    targetUsers: toStringArray(v.targetUsers, def.targetUsers),
    problemStatement: toString(v.problemStatement, def.problemStatement),
    solution: toString(v.solution, def.solution),
    userStories: toStringArray(v.userStories, def.userStories),
    mvpScope: toString(v.mvpScope, def.mvpScope),
    mvpFeatures: toStringArray(v.mvpFeatures, def.mvpFeatures),
  };
}

function normalizeTechStack(
  value: unknown,
  prefix: string,
  warnings: string[],
): TechStack {
  const def = defaultProjectDefinition.tech;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    languages: toStringArray(v.languages, def.languages),
    frameworks: toStringArray(v.frameworks, def.frameworks),
    tools: toStringArray(v.tools, def.tools),
    dependencies: toStringArray(v.dependencies, def.dependencies),
    constraints: toStringArray(v.constraints, def.constraints),
  };
}

function normalizeArchitectureInfo(
  value: unknown,
  prefix: string,
  warnings: string[],
): ArchitectureInfo {
  const def = defaultProjectDefinition.architecture;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    pattern: toString(v.pattern, def.pattern),
    directoryStructure: toString(v.directoryStructure, def.directoryStructure),
    componentTree: toString(v.componentTree, def.componentTree),
    dataFlow: toString(v.dataFlow, def.dataFlow),
  };
}

function normalizeRoadmapInfo(
  value: unknown,
  prefix: string,
  warnings: string[],
): RoadmapInfo {
  const def = defaultProjectDefinition.roadmap;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    phases: normalizePhases(v.phases),
    activePhaseId: toString(v.activePhaseId, def.activePhaseId),
  };
}

function normalizePhases(value: unknown): Phase[] {
  if (!Array.isArray(value)) return [];
  return value.map((p, i) => normalizePhase(p, i));
}

function normalizePhase(value: unknown, index: number): Phase {
  const def: Phase = { id: `phase-${index + 1}`, title: "", tasks: [] };
  if (!value || typeof value !== "object") return def;
  const v = value as Record<string, unknown>;
  return {
    id: toString(v.id, def.id),
    title: toString(v.title, `Phase ${index + 1}`),
    tasks: normalizeTasks(v.tasks),
  };
}

function normalizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return [];
  return value.map((t, i) => normalizeTask(t, i));
}

function normalizeTask(value: unknown, index: number): Task {
  const def: Task = { id: `task-${index + 1}`, title: "", status: "pending" };
  if (!value || typeof value !== "object") return def;
  const v = value as Record<string, unknown>;
  return {
    id: toString(v.id, def.id),
    title: toString(v.title, `Task ${index + 1}`),
    status: normalizeTaskStatus(v.status),
  };
}

function normalizeMemoryConfig(
  value: unknown,
  prefix: string,
  warnings: string[],
): MemoryConfig {
  const def = defaultProjectDefinition.memory;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    files: normalizeMemoryFiles(v.files),
    updateCadence: toString(v.updateCadence, def.updateCadence),
    patterns: toStringArray(v.patterns, def.patterns),
  };
}

function normalizeMemoryFiles(value: unknown): MemoryFile[] {
  if (!Array.isArray(value)) return defaultProjectDefinition.memory.files;
  return value.map((f, i) => normalizeMemoryFile(f, i));
}

function normalizeMemoryFile(value: unknown, index: number): MemoryFile {
  const def: MemoryFile = {
    path: `memory-bank/file-${index + 1}.md`,
    description: "",
    required: false,
  };
  if (!value || typeof value !== "object") return def;
  const v = value as Record<string, unknown>;
  return {
    path: toString(v.path, def.path),
    description: toString(v.description, def.description),
    required: typeof v.required === "boolean" ? v.required : def.required,
  };
}

function normalizeAgentsInfo(
  value: unknown,
  prefix: string,
  warnings: string[],
): AgentsInfo {
  const def = defaultProjectDefinition.agents;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    agents: normalizeAgents(v.agents),
  };
}

function normalizeAgents(value: unknown): Agent[] {
  if (!Array.isArray(value)) return defaultProjectDefinition.agents.agents;
  return value.map((a, i) => normalizeAgent(a, i));
}

function normalizeAgent(value: unknown, index: number): Agent {
  const def: Agent = {
    role: `agent-${index + 1}`,
    model: "gpt-4o",
    promptTemplate: "",
  };
  if (!value || typeof value !== "object") return def;
  const v = value as Record<string, unknown>;
  return {
    role: toString(v.role, def.role),
    model: toString(v.model, def.model),
    promptTemplate: toString(v.promptTemplate ?? v.prompt, def.promptTemplate),
  };
}

function normalizeQualityRules(
  value: unknown,
  prefix: string,
  warnings: string[],
): QualityRules {
  const def = defaultProjectDefinition.quality;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;
  return {
    codeStyle: toString(v.codeStyle, def.codeStyle),
    testingStrategy: toString(v.testingStrategy, def.testingStrategy),
    validationRules: toStringArray(v.validationRules, def.validationRules),
    fallbackBehavior: toString(v.fallbackBehavior, def.fallbackBehavior),
  };
}

function normalizeProjectOptions(
  value: unknown,
  prefix: string,
  warnings: string[],
): ProjectOptions {
  const def = defaultProjectDefinition.options;
  if (!value || typeof value !== "object") {
    warnings.push(`"${prefix}" section is missing or invalid — using defaults.`);
    return { ...def };
  }
  const v = value as Record<string, unknown>;

  // Resolve compressionMode with backward compatibility
  let compressionMode: "normal" | "compact" | "caveman-lite" | "handoff" | undefined;
  const rawMode = v.compressionMode;
  if (typeof rawMode === "string" && ["normal", "compact", "caveman-lite", "handoff"].includes(rawMode)) {
    compressionMode = rawMode as "normal" | "compact" | "caveman-lite" | "handoff";
  }

  // Backward compat: old boolean maps to mode
  const compression = typeof v.compression === "boolean" ? v.compression : def.compression;
  if (!compressionMode && typeof v.compression === "boolean") {
    compressionMode = v.compression ? "caveman-lite" : "normal";
  }

  return {
    compression,
    compressionMode,
    orchestratorModel: toString(v.orchestratorModel, def.orchestratorModel),
    focusChain: typeof v.focusChain === "boolean" ? v.focusChain : def.focusChain,
    extraDocs: toStringArray(v.extraDocs, def.extraDocs),
  };
}

// ── Helpers ───────────────────────────────────

function normalizeRepositoryState(value: unknown): RepositoryState {
  const valid: RepositoryState[] = ["greenfield", "empty-repository", "existing-project"];
  if (typeof value === "string" && valid.includes(value as RepositoryState)) {
    return value as RepositoryState;
  }
  return "greenfield";
}

function normalizeStatus(value: unknown): ProjectStatus {
  const valid: ProjectStatus[] = ["idea", "draft", "ready", "bootstrapped"];
  if (typeof value === "string" && valid.includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }
  return "idea";
}


function normalizeTaskStatus(value: unknown): TaskStatus {
  const valid: TaskStatus[] = ["pending", "done"];
  if (typeof value === "string" && valid.includes(value as TaskStatus)) {
    return value as TaskStatus;
  }
  return "pending";
}

/** Convert a value to string. Arrays become newline-joined. */
function toString(value: unknown, fallback: string | null): string {
  if (value === null || value === undefined) return fallback ?? "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join("\n");
  return String(value);
}

/**
 * Convert a value to string array.
 * - strings stay as-is (single-element array)
 * - newline strings get split
 * - arrays stay as-is
 */
function toStringArray(value: unknown, fallback: string[]): string[] {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) {
    return value.map((v) => (v == null ? "" : String(v)));
  }
  if (typeof value === "string") {
    if (value.includes("\n")) {
      return value.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    return [value];
  }
  return [String(value)];
}
