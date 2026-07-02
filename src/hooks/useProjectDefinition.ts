// ──────────────────────────────────────────────
// useProjectDefinition — single source of truth hook
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import {
  type ProjectDefinition,
  defaultProjectDefinition,
} from "../types/projectDefinition";
import {
  loadProjectDefinition,
  saveProjectDefinition,
  clearProjectDefinition,
} from "../lib/storage";

export interface UseProjectDefinitionReturn {
  /** The current ProjectDefinition */
  projectDefinition: ProjectDefinition;
  /** Timestamp of the last successful save, or null */
  lastSavedAt: Date | null;
  /** Error message from the last save attempt, or null */
  saveError: string | null;
  /** Merge a partial update into the current definition and persist */
  updateProjectDefinition: (partial: Partial<ProjectDefinition>) => void;
  /** Replace the entire definition (used after JSON import) and persist */
  setProjectDefinition: (data: ProjectDefinition) => void;
  /** Reset to default definition and clear localStorage */
  resetProjectDefinition: () => void;
  /** Clear localStorage draft without changing in-memory state */
  clearDraft: () => void;
}

export function useProjectDefinition(): UseProjectDefinitionReturn {
  const [projectDefinition, setProjectDefinition] =
    useState<ProjectDefinition>(loadProjectDefinition);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep a ref to the latest value so callbacks always have fresh data
  const ref = useRef(projectDefinition);
  ref.current = projectDefinition;

  const persist = useCallback((data: ProjectDefinition) => {
    try {
      saveProjectDefinition(data);
      setLastSavedAt(new Date());
      setSaveError(null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Failed to save draft"
      );
    }
  }, []);

  const updateProjectDefinition = useCallback(
    (partial: Partial<ProjectDefinition>) => {
      setProjectDefinition((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  /** Replace the entire definition (used after JSON import) */
  const replaceProjectDefinition = useCallback(
    (data: ProjectDefinition) => {
      setProjectDefinition(data);
      persist(data);
    },
    [persist]
  );

  const resetProjectDefinition = useCallback(() => {
    const fresh = { ...defaultProjectDefinition };
    clearProjectDefinition();
    setProjectDefinition(fresh);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  const clearDraft = useCallback(() => {
    clearProjectDefinition();
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  return {
    projectDefinition,
    lastSavedAt,
    saveError,
    updateProjectDefinition,
    setProjectDefinition: replaceProjectDefinition,
    resetProjectDefinition,
    clearDraft,
  };
}
