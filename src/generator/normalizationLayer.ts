// ──────────────────────────────────────────────
// normalizationLayer — Epic 25.2
// Pipeline stage: Normalization
//
// Normalizes raw LLM output before it enters
// the Resolution Pipeline. Strips meta-fields,
// normalizes enums, deduplicates arrays, and
// trims whitespace.
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import type { PerFieldConfidence } from "./confidenceTypes";
import { defaultProjectDefinition } from "../types/projectDefinition";

/**
 * Raw LLM output that may include _confidence meta-field.
 */
export interface RawLLMOutput {
  /** The ProjectDefinition fields */
  [key: string]: unknown;
  /** Optional _confidence meta-field */
  _confidence?: {
    overall: number;
    fields: Record<string, number>;
    sections: Record<string, number>;
  };
}

/**
 * Result of normalizing raw LLM output.
 */
export interface NormalizationResult {
  /** Clean ProjectDefinition (no meta-fields) */
  projectDefinition: ProjectDefinition;
  /** Extracted confidence scores */
  confidence: PerFieldConfidence;
  /** Warnings generated during normalization */
  warnings: string[];
}

/**
 * Normalize raw LLM output into a clean ProjectDefinition.
 *
 * Steps:
 * 1. Strip _confidence meta-field
 * 2. Normalize enums (project.status, project.repositoryState)
 * 3. Normalize arrays (deduplicate, sort)
 * 4. Normalize strings (trim whitespace)
 * 5. Fill missing fields with defaults
 *
 * @param raw - Raw LLM output (may include _confidence)
 * @returns Normalized result
 */
export function normalizeOutput(raw: RawLLMOutput): NormalizationResult {
  const warnings: string[] = [];

  // 1. Extract and strip _confidence
  let confidence: PerFieldConfidence = {
    overall: 0,
    fields: {},
    sections: {},
  };

  if (raw._confidence && typeof raw._confidence === "object") {
    const c = raw._confidence as {
      overall?: number;
      fields?: Record<string, number>;
      sections?: Record<string, number>;
    };
    confidence = {
      overall: typeof c.overall === "number" ? c.overall : 0,
      fields: c.fields ?? {},
      sections: c.sections ?? {},
    };
  }

  // 2. Build clean object without _confidence
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key !== "_confidence") {
      clean[key] = value;
    }
  }

  // 3. Normalize the result into a ProjectDefinition
  const pd = normalizeToProjectDefinition(clean, warnings);

  return {
    projectDefinition: pd,
    confidence,
    warnings,
  };
}

/**
 * Normalize a raw object into a valid ProjectDefinition.
 * Fills missing fields with defaults and normalizes values.
 */
function normalizeToProjectDefinition(
  raw: Record<string, unknown>,
  warnings: string[],
): ProjectDefinition {
  // Start with defaults
  const pd: ProjectDefinition = JSON.parse(
    JSON.stringify(defaultProjectDefinition),
  );

  // Normalize project section
  if (raw.project && typeof raw.project === "object") {
    const p = raw.project as Record<string, unknown>;
    if (typeof p.name === "string") pd.project.name = p.name.trim();
    if (typeof p.tagline === "string") pd.project.tagline = p.tagline.trim();
    if (typeof p.version === "string") pd.project.version = p.version.trim();
    if (typeof p.description === "string")
      pd.project.description = p.description.trim();
    if (typeof p.status === "string") {
      const normalized = normalizeStatus(p.status);
      if (normalized) {
        pd.project.status = normalized;
      } else {
        warnings.push(
          `Invalid project.status "${p.status}". Using default "idea".`,
        );
      }
    }
    if (typeof p.repositoryState === "string") {
      const normalized = normalizeRepositoryState(p.repositoryState);
      if (normalized) {
        pd.project.repositoryState = normalized;
      } else {
        warnings.push(
          `Invalid project.repositoryState "${p.repositoryState}". Using default "greenfield".`,
        );
      }
    }
  }

  // Normalize product section
  if (raw.product && typeof raw.product === "object") {
    const p = raw.product as Record<string, unknown>;
    if (Array.isArray(p.targetUsers))
      pd.product.targetUsers = normalizeStringArray(p.targetUsers);
    if (typeof p.problemStatement === "string")
      pd.product.problemStatement = p.problemStatement.trim();
    if (typeof p.solution === "string")
      pd.product.solution = p.solution.trim();
    if (Array.isArray(p.userStories))
      pd.product.userStories = normalizeStringArray(p.userStories);
    if (typeof p.mvpScope === "string")
      pd.product.mvpScope = p.mvpScope.trim();
  }

  // Normalize tech section
  if (raw.tech && typeof raw.tech === "object") {
    const t = raw.tech as Record<string, unknown>;
    if (Array.isArray(t.languages))
      pd.tech.languages = normalizeStringArray(t.languages);
    if (Array.isArray(t.frameworks))
      pd.tech.frameworks = normalizeStringArray(t.frameworks);
    if (Array.isArray(t.tools))
      pd.tech.tools = normalizeStringArray(t.tools);
    if (Array.isArray(t.dependencies))
      pd.tech.dependencies = normalizeStringArray(t.dependencies);
    if (Array.isArray(t.constraints))
      pd.tech.constraints = normalizeStringArray(t.constraints);
  }

  // Normalize architecture section
  if (raw.architecture && typeof raw.architecture === "object") {
    const a = raw.architecture as Record<string, unknown>;
    if (typeof a.pattern === "string") pd.architecture.pattern = a.pattern.trim();
    if (typeof a.directoryStructure === "string")
      pd.architecture.directoryStructure = a.directoryStructure.trim();
    if (typeof a.componentTree === "string")
      pd.architecture.componentTree = a.componentTree.trim();
    if (typeof a.dataFlow === "string")
      pd.architecture.dataFlow = a.dataFlow.trim();
  }

  // Normalize roadmap section
  if (raw.roadmap && typeof raw.roadmap === "object") {
    const r = raw.roadmap as Record<string, unknown>;
    if (Array.isArray(r.phases)) {
      pd.roadmap.phases = r.phases.map(
        (phase: unknown, index: number) => {
          if (typeof phase === "object" && phase !== null) {
            const p = phase as Record<string, unknown>;
            return {
              id:
                typeof p.id === "string"
                  ? p.id.trim()
                  : `phase-${index + 1}`,
              title:
                typeof p.title === "string"
                  ? p.title.trim()
                  : `Phase ${index + 1}`,
              tasks: Array.isArray(p.tasks)
                ? p.tasks.map((task: unknown, tIndex: number) => {
                    if (typeof task === "object" && task !== null) {
                      const t = task as Record<string, unknown>;
                      return {
                        id:
                          typeof t.id === "string"
                            ? t.id.trim()
                            : `task-${index + 1}-${tIndex + 1}`,
                        title:
                          typeof t.title === "string"
                            ? t.title.trim()
                            : `Task ${tIndex + 1}`,
                        status:
                          typeof t.status === "string" &&
                          (t.status === "pending" || t.status === "done")
                            ? t.status
                            : "pending",
                      };
                    }
                    return {
                      id: `task-${index + 1}-${tIndex + 1}`,
                      title: `Task ${tIndex + 1}`,
                      status: "pending" as const,
                    };
                  })
                : [],
            };
          }
          return {
            id: `phase-${index + 1}`,
            title: `Phase ${index + 1}`,
            tasks: [],
          };
        },
      );
    }
    if (typeof r.activePhaseId === "string")
      pd.roadmap.activePhaseId = r.activePhaseId.trim();
  }

  // Normalize memory section
  if (raw.memory && typeof raw.memory === "object") {
    const m = raw.memory as Record<string, unknown>;
    if (Array.isArray(m.files)) {
      pd.memory.files = m.files.map((file: unknown) => {
        if (typeof file === "object" && file !== null) {
          const f = file as Record<string, unknown>;
          return {
            path: typeof f.path === "string" ? f.path.trim() : "",
            description:
              typeof f.description === "string"
                ? f.description.trim()
                : "",
            required:
              typeof f.required === "boolean" ? f.required : true,
          };
        }
        return { path: "", description: "", required: true };
      });
    }
    if (typeof m.updateCadence === "string")
      pd.memory.updateCadence = m.updateCadence.trim();
    if (Array.isArray(m.patterns))
      pd.memory.patterns = normalizeStringArray(m.patterns);
  }

  // Normalize agents section
  if (raw.agents && typeof raw.agents === "object") {
    const a = raw.agents as Record<string, unknown>;
    if (Array.isArray(a.agents)) {
      pd.agents.agents = a.agents.map((agent: unknown) => {
        if (typeof agent === "object" && agent !== null) {
          const ag = agent as Record<string, unknown>;
          return {
            role: typeof ag.role === "string" ? ag.role.trim() : "",
            model: typeof ag.model === "string" ? ag.model.trim() : "",
            promptTemplate:
              typeof ag.promptTemplate === "string"
                ? ag.promptTemplate.trim()
                : "",
          };
        }
        return { role: "", model: "", promptTemplate: "" };
      });
    }
  }

  // Normalize quality section
  if (raw.quality && typeof raw.quality === "object") {
    const q = raw.quality as Record<string, unknown>;
    if (typeof q.codeStyle === "string")
      pd.quality.codeStyle = q.codeStyle.trim();
    if (typeof q.testingStrategy === "string")
      pd.quality.testingStrategy = q.testingStrategy.trim();
    if (Array.isArray(q.validationRules))
      pd.quality.validationRules = normalizeStringArray(q.validationRules);
    if (typeof q.fallbackBehavior === "string")
      pd.quality.fallbackBehavior = q.fallbackBehavior.trim();
  }

  // Normalize options section
  if (raw.options && typeof raw.options === "object") {
    const o = raw.options as Record<string, unknown>;
    if (typeof o.compression === "boolean")
      pd.options.compression = o.compression;
    if (typeof o.orchestratorModel === "string")
      pd.options.orchestratorModel = o.orchestratorModel.trim();
    if (typeof o.focusChain === "boolean")
      pd.options.focusChain = o.focusChain;
    if (Array.isArray(o.extraDocs))
      pd.options.extraDocs = normalizeStringArray(o.extraDocs);
  }

  return pd;
}

/**
 * Normalize a project status string.
 */
function normalizeStatus(
  status: string,
): "idea" | "draft" | "ready" | "bootstrapped" | null {
  const valid = ["idea", "draft", "ready", "bootstrapped"] as const;
  const normalized = status.toLowerCase().trim();
  if (valid.includes(normalized as typeof valid[number])) {
    return normalized as typeof valid[number];
  }
  return null;
}

/**
 * Normalize a repository state string.
 */
function normalizeRepositoryState(
  state: string,
): "greenfield" | "empty-repository" | "existing-project" | null {
  const valid = ["greenfield", "empty-repository", "existing-project"] as const;
  const normalized = state.toLowerCase().trim().replace(/\s+/g, "-");
  if (valid.includes(normalized as typeof valid[number])) {
    return normalized as typeof valid[number];
  }
  return null;
}

/**
 * Normalize an array of strings: trim, deduplicate, sort, remove empty.
 */
function normalizeStringArray(arr: unknown[]): string[] {
  const trimmed = arr
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const unique = [...new Set(trimmed)];
  return unique.sort();
}
