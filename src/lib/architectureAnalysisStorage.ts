// ──────────────────────────────────────────────
// localStorage wrapper for ArchitectureAnalysis
// ──────────────────────────────────────────────

import {
  type ArchitectureAnalysis,
  createEmptyArchitectureAnalysis,
} from "../models/architectureAnalysis";

const STORAGE_KEY = "vibeforge-architecture-analysis";

/**
 * Load an ArchitectureAnalysis from localStorage.
 * Returns an empty analysis when nothing is stored or on error.
 */
export function loadArchitectureAnalysis(): ArchitectureAnalysis {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyArchitectureAnalysis();

    const parsed = JSON.parse(raw);
    // Basic sanity check: must be an object with an `id` and `executiveSummary` field
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !parsed.id ||
      typeof parsed.executiveSummary !== "string"
    ) {
      return createEmptyArchitectureAnalysis();
    }

    return parsed as ArchitectureAnalysis;
  } catch {
    return createEmptyArchitectureAnalysis();
  }
}

/**
 * Persist an ArchitectureAnalysis to localStorage.
 * Silently fails when storage is full or unavailable.
 */
export function saveArchitectureAnalysis(data: ArchitectureAnalysis): void {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Remove the stored ArchitectureAnalysis from localStorage.
 */
export function clearArchitectureAnalysis(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}
