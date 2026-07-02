// ──────────────────────────────────────────────
// localStorage wrapper for ProjectRequirements
// ──────────────────────────────────────────────

import {
  type ProjectRequirements,
  createEmptyProjectRequirements,
} from "../models/projectRequirements";

const STORAGE_KEY = "vibeforge-project-requirements";

/**
 * Load a ProjectRequirements from localStorage.
 * Returns an empty requirements object when nothing is stored or on error.
 */
export function loadProjectRequirements(): ProjectRequirements {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProjectRequirements();

    const parsed = JSON.parse(raw);
    // Basic sanity check: must be an object with an `id` and `vision` field
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !parsed.id ||
      typeof parsed.vision !== "string"
    ) {
      return createEmptyProjectRequirements();
    }

    return parsed as ProjectRequirements;
  } catch {
    return createEmptyProjectRequirements();
  }
}

/**
 * Persist a ProjectRequirements to localStorage.
 * Silently fails when storage is full or unavailable.
 */
export function saveProjectRequirements(data: ProjectRequirements): void {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Remove the stored ProjectRequirements from localStorage.
 */
export function clearProjectRequirements(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}
