// ──────────────────────────────────────────────
// WorkspaceStorage — Epic 24.6
// localStorage wrapper voor WorkspaceState.
// Gebruikt eigen key, conflicteert niet met
// bestaande substate storage keys.
// ──────────────────────────────────────────────

import type { WorkspaceState } from "../models/workspaceState";
import { createEmptyWorkspaceState } from "../models/workspaceState";

const STORAGE_KEY = "vibeforge-workspace-state";

/**
 * Load a WorkspaceState from localStorage.
 * Returns an empty workspace if nothing is stored or if parsing fails.
 */
export function loadWorkspace(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyWorkspaceState();

    const parsed = JSON.parse(raw);

    // Basic validation: must have metadata and conversation
    if (!parsed || typeof parsed !== "object" || !parsed.metadata || !parsed.conversation) {
      console.warn("[workspaceStorage] Invalid workspace state in localStorage, returning empty");
      return createEmptyWorkspaceState();
    }

    // Ensure version field for future migrations
    if (typeof parsed.metadata.version !== "number") {
      parsed.metadata.version = 1;
    }

    return parsed as WorkspaceState;
  } catch (e) {
    console.warn("[workspaceStorage] Failed to load workspace state:", e);
    return createEmptyWorkspaceState();
  }
}

/**
 * Persist a WorkspaceState to localStorage.
 * Updates metadata.updatedAt before saving.
 */
export function saveWorkspace(state: WorkspaceState): void {
  try {
    const withTimestamp = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
  } catch (e) {
    console.error("[workspaceStorage] Failed to save workspace state:", e);
    throw e;
  }
}

/**
 * Remove the stored WorkspaceState from localStorage.
 */
export function clearWorkspace(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[workspaceStorage] Failed to clear workspace state:", e);
  }
}

/**
 * Update metadata.lastOpenedAt to now.
 * Useful when the user opens/reopens the app.
 */
export function touchWorkspace(): void {
  const state = loadWorkspace();
  state.metadata.lastOpenedAt = new Date().toISOString();
  saveWorkspace(state);
}
