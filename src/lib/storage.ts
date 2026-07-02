// ──────────────────────────────────────────────
// localStorage wrapper for ProjectDefinition
// ──────────────────────────────────────────────

import {
  type ProjectDefinition,
  defaultProjectDefinition,
} from "../types/projectDefinition";
import { normalizeProjectDefinition } from "./projectDefinitionParser";

const STORAGE_KEY = "vibeforge-project-definition";

/**
 * Load a ProjectDefinition from localStorage.
 * Returns the default fallback when nothing is stored or on error.
 * Runs the normalizer to migrate old data (e.g. `mode` → `repositoryState`).
 */
export function loadProjectDefinition(): ProjectDefinition {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProjectDefinition };

    const parsed = JSON.parse(raw);
    // Basic sanity check: must be an object with a `project` key
    if (typeof parsed !== "object" || parsed === null || !parsed.project) {
      return { ...defaultProjectDefinition };
    }

    // Normalize to migrate old data (mode → repositoryState, etc.)
    const result = normalizeProjectDefinition(parsed);
    return result.data;
  } catch {
    return { ...defaultProjectDefinition };
  }
}

/**
 * Persist a ProjectDefinition to localStorage.
 * Silently fails when storage is full or unavailable.
 */
export function saveProjectDefinition(data: ProjectDefinition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Remove the stored ProjectDefinition from localStorage.
 */
export function clearProjectDefinition(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

// ── Workspace-wide reset ──────────────────────

/**
 * All known localStorage keys used by VibeForge.
 * Keep this list in sync when adding new storage modules.
 */
const ALL_STORAGE_KEYS = [
  "vibeforge-project-definition",
  "vibeforge-conversation-memory",
  "vibeforge-project-requirements",
  "vibeforge-architecture-analysis",
  "vibeforge-workspace-state",
];

/**
 * Remove ALL VibeForge data from localStorage.
 * This is the nuclear reset — use only for "New Project" / "Reset Workspace".
 *
 * Clears:
 *   - ProjectDefinition
 *   - ConversationMemory
 *   - ProjectRequirements
 *   - ArchitectureAnalysis
 *   - WorkspaceState
 */
export function clearAllStorage(): void {
  for (const key of ALL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // fail silently per key
    }
  }
}
