// ──────────────────────────────────────────────
// projectDefinitionDiff — compare two ProjectDefinitions
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";

// ── Types ─────────────────────────────────────

export type DiffType = "added" | "removed" | "changed";

export interface FieldDiff {
  fieldPath: string;
  type: DiffType;
  oldValue: unknown;
  newValue: unknown;
}

export interface SectionDiff {
  section: SectionKey;
  label: string;
  fields: FieldDiff[];
}

export interface ProjectDefinitionDiff {
  sections: SectionDiff[];
  totalChanges: number;
}

export type SectionKey =
  | "project"
  | "product"
  | "tech"
  | "architecture"
  | "roadmap"
  | "memory"
  | "agents"
  | "quality"
  | "options";

const SECTION_LABELS: Record<SectionKey, string> = {
  project: "Project",
  product: "Product",
  tech: "Tech Stack",
  architecture: "Architecture",
  roadmap: "Roadmap",
  memory: "Memory Bank",
  agents: "Agents",
  quality: "Quality",
  options: "Options",
};

// ── Public API ────────────────────────────────

/**
 * Compare two ProjectDefinitions and return the differences grouped by section.
 * Only fields that differ are included — unchanged fields are omitted.
 */
export function diffProjectDefinitions(
  before: ProjectDefinition,
  after: ProjectDefinition,
): ProjectDefinitionDiff {
  const sections: SectionDiff[] = [];
  let totalChanges = 0;

  for (const key of SECTION_KEYS) {
    const beforeSection = before[key];
    const afterSection = after[key];
    const fields = diffSections(key, beforeSection, afterSection);

    if (fields.length > 0) {
      sections.push({
        section: key,
        label: SECTION_LABELS[key],
        fields,
      });
      totalChanges += fields.length;
    }
  }

  return { sections, totalChanges };
}

// ── Section differs ───────────────────────────

const SECTION_KEYS: SectionKey[] = [
  "project",
  "product",
  "tech",
  "architecture",
  "roadmap",
  "memory",
  "agents",
  "quality",
  "options",
];

function diffSections(
  section: SectionKey,
  before: unknown,
  after: unknown,
): FieldDiff[] {
  // Cast to Record<string, unknown> — the ProjectDefinition interfaces are
  // plain objects without index signatures, but Object.keys works on them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const beforeObj: Record<string, unknown> = ((before ?? {}) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterObj: Record<string, unknown> = ((after ?? {}) as any);
  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  const fields: FieldDiff[] = [];

  for (const key of allKeys) {
    // Skip generatedFiles — not part of the core definition comparison
    if (key === "generatedFiles") continue;

    const hasBefore = key in beforeObj;
    const hasAfter = key in afterObj;

    if (!hasBefore && hasAfter) {
      // Added
      fields.push({
        fieldPath: `${section}.${key}`,
        type: "added",
        oldValue: undefined,
        newValue: afterObj[key],
      });
    } else if (hasBefore && !hasAfter) {
      // Removed
      fields.push({
        fieldPath: `${section}.${key}`,
        type: "removed",
        oldValue: beforeObj[key],
        newValue: undefined,
      });
    } else {
      // Both exist — compare values
      const bVal = beforeObj[key];
      const aVal = afterObj[key];

      if (!valuesEqual(bVal, aVal)) {
        fields.push({
          fieldPath: `${section}.${key}`,
          type: "changed",
          oldValue: bVal,
          newValue: aVal,
        });
      }
    }
  }

  return fields;
}

// ── Deep equality helpers ─────────────────────

/**
 * Compare two values for deep equality.
 * Handles primitives, arrays, objects, and null/undefined.
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  // Same reference or both null/undefined
  if (a === b) return true;
  if (a == null || b == null) return a === b;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => valuesEqual(val, b[i]));
  }

  // Objects (plain)
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) =>
        key in (b as Record<string, unknown>) &&
        valuesEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
    );
  }

  // Primitives (string, number, boolean)
  return a === b;
}

// ── Value formatting for display ──────────────

/**
 * Format a value for display in the diff panel.
 * Handles strings, arrays, objects, null, undefined.
 */
export function formatDiffValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") {
    if (value.length === 0) return "(empty)";
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "(empty array)";
    return value.map((v) => String(v ?? "")).join("\n");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
