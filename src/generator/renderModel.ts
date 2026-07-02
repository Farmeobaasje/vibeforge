// ──────────────────────────────────────────────
// renderModel — single rendering model
// Replaces RuleModel entirely.
//
// Architecture rule: "Renderers never derive.
// Renderers only format."
//
// All business logic (extraction, derivation,
// canonicalization) lives in the Semantic
// Extraction Layer or requirementsToProjectDefinition.
// RenderModel is a pre-computed view model that
// generators consume directly.
//
// v0.4: Uses canonical stack from semantic/
// canonicalStack.ts. NO duplicate categorization.
// v0.5: Reads canonical identity/confidence from
// ProjectDefinition.identity and .confidence.
// ──────────────────────────────────────────────

import type { ProjectDefinition, Phase, MemoryFile, CompressionMode } from "../types/projectDefinition";
import type { DomainModel } from "../semantic/domainModelTypes";
import type { SemanticConfidence } from "../semantic/semanticConfidence";
import type { CategorizedTechStack } from "../semantic/canonicalStack";
import { emptyCategorizedTechStack } from "../semantic/canonicalStack";


// ── RenderModel Identity ──────────────────────

export interface RenderIdentity {
  shortName: string;
  fullName: string;
  slug: string;
  tagline: string;
  description: string;
}

// ── RenderModel Meta ──────────────────────────

export interface RenderMeta {
  language: string;
  projectType: string;
  confidence: number;
  generatedAt: string;
}

// ── RenderModel ───────────────────────────────

export interface RenderModel {
  identity: RenderIdentity;
  meta: RenderMeta;
  version: string;
  status: string;
  repositoryState: string;

  quality: {
    rules: string[];
    codeStyle: string;
    testingStrategy: string;
    fallbackBehavior: string;
  };

  tech: {
    /** Human-readable summary e.g. "TypeScript / React · Vite" */
    summary: string;
    /** Categorized tech stack — THE canonical categorization */
    categorized: CategorizedTechStack;
    /**
     * Flat lists for backward compatibility.
     * @deprecated Renderers should use `categorized` instead.
     */
    languages: string[];
    frameworks: string[];
    tools: string[];
    dependencies: string[];
    constraints: string[];
  };

  product: {
    targetUsers: string[];
    problemStatement: string;
    solution: string;
    userStories: string[];
    mvpFeatures: string[];
    mvpScope: string;
  };

  workflow: {
    planAct: string[];
    slashCommands: string[];
    focusChain: boolean;
    memoryCadence: string;
  };

  memory: {
    files: MemoryFile[];
    updateCadence: string;
    patterns: string[];
  };

  communication: {
    compressionMode: CompressionMode;
    verbosity: string;
  };

  architecture: {
    pattern: string;
    directoryStructure: string;
    componentTree: string;
    dataFlow: string;
  };

  roadmap: {
    phases: Phase[];
    activePhaseId: string | null;
  };

  agents: {
    agents: Array<{ role: string; model: string; promptTemplate: string }>;
  };

  options: {
    orchestratorModel: string;
    focusChain: boolean;
    extraDocs: string[];
  };

  /** Domain model — structured entity graph */
  domainModel: DomainModel;
  /** Per-field semantic confidence scores */
  semanticConfidence: SemanticConfidence;
  /** Detected domain name (e.g. "ai-saas/support-platform") */
  domainName: string;

  /** Extraction source tracing — from canonical pipeline */
  extractionSource?: string;
  /** Per-field confidence scores — from canonical pipeline */
  confidenceByField?: Record<string, number>;
  /** Multi-domain probability scores */
  domainScores?: Record<string, number>;
  /** Domain detection evidence */
  domainEvidence?: string[];
}


// ── Default RenderModel ───────────────────────

export const defaultRenderModel: RenderModel = {
  identity: {
    shortName: "My Project",
    fullName: "My Project",
    slug: "my-project",
    tagline: "A brief description of what this project does",
    description: "",
  },
  meta: {
    language: "en",
    projectType: "software",
    confidence: 0,
    generatedAt: new Date().toISOString(),
  },
  version: "0.1.0",
  status: "idea",
  repositoryState: "greenfield",

  quality: {
    rules: [
      "JSON parse errors must show a clear message",
      "Import accepts arrays and newline-delimited strings",
      "Missing fields must not break the generator",
      "Empty sections get useful fallbacks, not bare placeholders",
    ],
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },

  tech: {
    summary: "",
    categorized: { ...emptyCategorizedTechStack },
    languages: [],
    frameworks: [],
    tools: [],
    dependencies: [],
    constraints: [],
  },

  product: {
    targetUsers: [],
    problemStatement: "",
    solution: "",
    userStories: [],
    mvpFeatures: [],
    mvpScope: "",
  },

  workflow: {
    planAct: [
      "Start in PLAN mode for non-trivial changes; present plan and WAIT for approval.",
      "Switch to ACT mode only after approval.",
      "Do not auto-switch Plan -> Act.",
    ],
    slashCommands: [
      "/newphase <title> before a new phase -> produces implementation_plan.md.",
      "/newtask at phase boundaries -> clean handoff.",
      "/smol or Auto Compact when context fills.",
    ],
    focusChain: true,
    memoryCadence: "Read ALL memory-bank files at start of every task. Update activeContext.md after each session. Run 'update memory bank' at milestones.",
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

  communication: {
    compressionMode: "normal",
    verbosity: "normal",
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

  agents: {
    agents: [
      { role: "orchestrator", model: "gpt-4o", promptTemplate: "Convert raw project ideas into a structured ProjectDefinition JSON." },
      { role: "plan", model: "claude-sonnet-4-20250514", promptTemplate: "Read the bootstrap prompt and present a file-by-file implementation plan." },
      { role: "act", model: "claude-sonnet-4-20250514", promptTemplate: "Write the exact files specified in the plan." },
    ],
  },

  options: {
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },

  domainModel: { entities: [], relationships: [] },
  semanticConfidence: {
    tagline: 0,
    roadmap: 0,
    architecture: 0,
    entities: 0,
    dataFlow: 0,
    componentTree: 0,
    techStack: 0,
    overall: 0,
  },
  domainName: "",
};


// ── Helpers ───────────────────────────────────

/**
 * Create a URL-friendly slug from a project name.
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "project";
}

/**
 * Resolve the compression mode from a ProjectDefinition.
 * Handles backward compatibility: old `compression: boolean` maps to mode.
 */
function resolveCompressionMode(pd: ProjectDefinition): CompressionMode {
  const mode = (pd.options as unknown as Record<string, unknown>).compressionMode as string | undefined;
  if (mode && ["normal", "compact", "caveman-lite", "handoff"].includes(mode)) {
    return mode as CompressionMode;
  }
  if (typeof pd.options.compression === "boolean") {
    return pd.options.compression ? "caveman-lite" : "normal";
  }
  return "normal";
}

/**
 * Build a tech stack summary string from the ProjectDefinition.
 */
function buildTechSummary(pd: ProjectDefinition): string {
  const parts: string[] = [];
  if (pd.tech.languages.length > 0 && pd.tech.frameworks.length > 0) {
    parts.push(`${pd.tech.languages.join(" / ")} · ${pd.tech.frameworks.join(" / ")}`);
  } else if (pd.tech.languages.length > 0) {
    parts.push(pd.tech.languages.join(" / "));
  } else if (pd.tech.frameworks.length > 0) {
    parts.push(pd.tech.frameworks.join(" / "));
  }
  if (pd.tech.tools.length > 0) {
    parts.push(pd.tech.tools.join(", "));
  }
  return parts.join(" · ");
}

// ── Build RenderModel from ProjectDefinition ──

/**
 * Build a RenderModel from a ProjectDefinition.
 *
 * This is the SINGLE entry point for creating the rendering model.
 * All generators consume this model — they never access ProjectDefinition directly.
 *
 * Architecture rule: "Renderers never derive. Renderers only format."
 * All derivation/business logic happens BEFORE this function is called.
 *
 * The tech.categorized field is read from pd.tech — it was populated by
 * the canonical stack in requirementsToProjectDefinition. NO re-categorization here.
 *
 * v0.5: Reads canonical identity/confidence from pd.identity and pd.confidence.
 *       Reads domain scores/evidence from pd.architecture.domain.
 */
export function buildRenderModel(pd: ProjectDefinition): RenderModel {
  const name = pd.project.name || defaultRenderModel.identity.shortName;
  const tagline = pd.project.tagline || defaultRenderModel.identity.tagline;
  const description = pd.project.description || defaultRenderModel.identity.description;

  // Build categorized from pd.tech flat arrays using the canonical stack
  // This is a READ-ONLY mapping — no derivation, just format
  const categorized = buildCategorizedFromTech(pd);

  // Resolve domain name: prefer canonical domain.id, fall back to entity detection
  const domainName = pd.architecture.domain
    ? pd.architecture.domain.id
    : pd.architecture.domainModel
      ? detectDomainNameFromEntities(pd.architecture.domainModel)
      : "";

  // Resolve confidence: prefer canonical confidence, fall back to semantic
  const confidence = pd.confidence?.overall ?? 0;

  // Resolve domain scores and evidence from canonical domain
  const domainScores = pd.architecture.domain?.scores;
  const domainEvidence = pd.architecture.domain?.evidence;

  return {
    identity: {
      shortName: name,
      fullName: name,
      slug: toSlug(name),
      tagline,
      description,
    },
    meta: {
      language: "en",
      projectType: "software",
      confidence,
      generatedAt: new Date().toISOString(),
    },
    version: pd.project.version || defaultRenderModel.version,
    status: pd.project.status || defaultRenderModel.status,
    repositoryState: pd.project.repositoryState || defaultRenderModel.repositoryState,

    quality: {
      rules:
        pd.quality.validationRules.length > 0
          ? pd.quality.validationRules
          : defaultRenderModel.quality.rules,
      codeStyle: pd.quality.codeStyle || defaultRenderModel.quality.codeStyle,
      testingStrategy: pd.quality.testingStrategy || defaultRenderModel.quality.testingStrategy,
      fallbackBehavior: pd.quality.fallbackBehavior || defaultRenderModel.quality.fallbackBehavior,
    },

    tech: {
      summary: buildTechSummary(pd),
      categorized,
      languages: pd.tech.languages,
      frameworks: pd.tech.frameworks,
      tools: pd.tech.tools,
      dependencies: pd.tech.dependencies,
      constraints: pd.tech.constraints,
    },

    product: {
      targetUsers: pd.product.targetUsers,
      problemStatement: pd.product.problemStatement,
      solution: pd.product.solution,
      userStories: pd.product.userStories,
      mvpFeatures: pd.product.mvpFeatures,
      mvpScope: pd.product.mvpScope,
    },

    workflow: {
      planAct: defaultRenderModel.workflow.planAct,
      slashCommands: defaultRenderModel.workflow.slashCommands,
      focusChain: pd.options.focusChain,
      memoryCadence: defaultRenderModel.workflow.memoryCadence,
    },

    memory: {
      files:
        pd.memory.files.length > 0
          ? pd.memory.files
          : defaultRenderModel.memory.files,
      updateCadence: pd.memory.updateCadence || defaultRenderModel.memory.updateCadence,
      patterns: pd.memory.patterns,
    },

    communication: {
      compressionMode: resolveCompressionMode(pd),
      verbosity: "normal",
    },

    architecture: {
      pattern: pd.architecture.pattern,
      directoryStructure: pd.architecture.directoryStructure,
      componentTree: pd.architecture.componentTree,
      dataFlow: pd.architecture.dataFlow,
    },

    roadmap: {
      phases: pd.roadmap.phases,
      activePhaseId: pd.roadmap.activePhaseId,
    },

    agents: {
      agents:
        pd.agents.agents.length > 0
          ? pd.agents.agents
          : defaultRenderModel.agents.agents,
    },

    options: {
      orchestratorModel: pd.options.orchestratorModel || defaultRenderModel.options.orchestratorModel,
      focusChain: pd.options.focusChain,
      extraDocs: pd.options.extraDocs,
    },

    domainModel: pd.architecture.domainModel || defaultRenderModel.domainModel,
    semanticConfidence: pd.architecture.semanticConfidence || defaultRenderModel.semanticConfidence,
    domainName,

    // Canonical pipeline data
    extractionSource: pd.identity?.source,
    confidenceByField: pd.confidence?.byField,
    domainScores,
    domainEvidence,
  };
}

/**
 * Build categorized tech stack from pd.tech flat arrays.
 * This is a READ-ONLY mapping — it just places items into buckets
 * based on their known category. No derivation, no hallucination.
 */
function buildCategorizedFromTech(pd: ProjectDefinition): CategorizedTechStack {
  const categorized: CategorizedTechStack = {
    frontend: [],
    backend: [],
    database: [],
    infrastructure: [],
    deployment: [],
    integrations: [],
    uncategorized: [],
  };

  // Known bucket mappings (lowercase → bucket key)
  const bucketMap: Record<string, keyof CategorizedTechStack> = {
    // Frontend
    "react": "frontend", "vue": "frontend", "angular": "frontend", "svelte": "frontend",
    "next.js": "frontend", "nextjs": "frontend", "nuxt": "frontend",
    "tailwind css": "frontend", "tailwind": "frontend", "bootstrap": "frontend",
    "shadcn/ui": "frontend", "shadcn": "frontend",
    "material ui": "frontend", "material-ui": "frontend", "chakra ui": "frontend", "chakra": "frontend",
    "vite": "frontend",
    // Backend
    "node.js": "backend", "node": "backend", "deno": "backend", "bun": "backend",
    "express": "backend", "fastify": "backend", "django": "backend", "flask": "backend",
    "fastapi": "backend", "spring": "backend", "spring boot": "backend",
    "rails": "backend", "laravel": "backend", "asp.net": "backend", "blazor": "backend",
    "nestjs": "backend", "nest.js": "backend", "nest": "backend",
    // Database
    "postgresql": "database", "postgres": "database", "mysql": "database",
    "mongodb": "database", "redis": "database", "sqlite": "database",
    "prisma": "database", "typeorm": "database", "drizzle orm": "database", "drizzle": "database",
    // Infrastructure
    "docker": "infrastructure", "kubernetes": "infrastructure",
    "aws": "infrastructure", "azure": "infrastructure", "gcp": "infrastructure",
    "vercel": "infrastructure", "netlify": "infrastructure",
    "firebase": "infrastructure", "supabase": "infrastructure",
    // Deployment
    "github actions": "deployment", "ci/cd": "deployment",
    "terraform": "deployment", "ansible": "deployment", "helm": "deployment",
    // Integrations
    "stripe": "integrations", "paypal": "integrations",
    "twilio": "integrations", "sendgrid": "integrations", "resend": "integrations",
    "clerk": "integrations", "auth0": "integrations",
    "openai": "integrations", "openai-compatible": "integrations",
    "anthropic": "integrations",
    "graphql": "integrations", "apollo": "integrations", "trpc": "integrations",
    "rest": "integrations", "grpc": "integrations", "websocket": "integrations",
    "supabase storage": "integrations", "supabase-storage": "integrations",
  };

  const seen = {
    frontend: new Set<string>(),
    backend: new Set<string>(),
    database: new Set<string>(),
    infrastructure: new Set<string>(),
    deployment: new Set<string>(),
    integrations: new Set<string>(),
    uncategorized: new Set<string>(),
  };

  // Collect all tech items from flat arrays
  const allItems = [
    ...pd.tech.languages,
    ...pd.tech.frameworks,
    ...pd.tech.tools,
    ...pd.tech.dependencies,
  ];

  for (const item of allItems) {
    const lower = item.toLowerCase().trim();
    const bucket = bucketMap[lower];
    if (bucket) {
      const seenKey = item.trim().toLowerCase();
      if (!seen[bucket].has(seenKey)) {
        seen[bucket].add(seenKey);
        categorized[bucket].push(item.trim());
      }
    } else {
      // Unknown item → uncategorized bucket (preserved, never dropped)
      const seenKey = item.trim().toLowerCase();
      if (!seen.uncategorized.has(seenKey)) {
        seen.uncategorized.add(seenKey);
        categorized.uncategorized.push(item.trim());
      }
    }
  }

  return categorized;
}

/**
 * Detect domain name from domain model entities.
 * Uses the first entity's context to infer the domain.
 */
function detectDomainNameFromEntities(domainModel: DomainModel): string {
  if (!domainModel.entities || domainModel.entities.length === 0) return "";
  // Heuristic: look for domain-specific entity patterns
  const entityNames = domainModel.entities.map((e) => e.name.toLowerCase());
  if (entityNames.some((n) => ["ticket", "workspace", "conversation"].includes(n))) return "ai-saas/support-platform";
  if (entityNames.some((n) => ["product", "listing", "seller", "buyer"].includes(n))) return "marketplace";
  if (entityNames.some((n) => ["reservation", "menu", "table"].includes(n))) return "restaurant";
  if (entityNames.some((n) => ["contact", "deal", "pipeline"].includes(n))) return "crm";
  if (entityNames.some((n) => ["workout", "exercise", "goal"].includes(n))) return "fitness";
  if (entityNames.some((n) => ["patient", "appointment", "doctor"].includes(n))) return "healthcare";
  if (entityNames.some((n) => ["course", "student", "module"].includes(n))) return "education";
  if (entityNames.some((n) => ["project", "task", "material"].includes(n))) return "construction";
  if (entityNames.some((n) => ["client", "invoice", "timeentry"].includes(n))) return "agency";
  if (entityNames.some((n) => ["model", "prompt", "result"].includes(n))) return "ai-saas";
  return "";
}
