// ──────────────────────────────────────────────
// useProjectRequirements — raw project input hook
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import {
  type ProjectRequirements,
  type ConfidenceLevel,
  type RepositoryState,
  createEmptyProjectRequirements,
} from "../models/projectRequirements";
import {
  loadProjectRequirements,
  saveProjectRequirements,
  clearProjectRequirements,
} from "../lib/projectRequirementsStorage";

export interface UseProjectRequirementsReturn {
  /** The current ProjectRequirements */
  requirements: ProjectRequirements;
  /** Timestamp of the last successful save, or null */
  lastSavedAt: Date | null;
  /** Error message from the last save attempt, or null */
  saveError: string | null;

  // ── Setters for each field ──────────────────

  setVision: (value: string) => void;
  setProjectName: (value: string) => void;
  setGoals: (values: string[]) => void;
  setTargetUsers: (values: string[]) => void;
  setProblems: (values: string[]) => void;
  setSolutionIdeas: (values: string[]) => void;
  setMvpScope: (value: string) => void;
  setIntegrations: (values: string[]) => void;
  setConstraints: (values: string[]) => void;
  setPreferredTech: (values: string[]) => void;
  setAiWorkflowTarget: (value: string) => void;
  setRepositoryState: (value: RepositoryState) => void;
  setRisks: (values: string[]) => void;
  setUnknowns: (values: string[]) => void;
  setConfidence: (value: ConfidenceLevel) => void;

  /** Reset to empty requirements and clear localStorage */
  resetRequirements: () => void;
}

export function useProjectRequirements(): UseProjectRequirementsReturn {
  const [requirements, setRequirements] = useState<ProjectRequirements>(
    loadProjectRequirements
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep a ref to the latest value so callbacks always have fresh data
  const ref = useRef(requirements);
  ref.current = requirements;

  const persist = useCallback((data: ProjectRequirements) => {
    try {
      saveProjectRequirements(data);
      setLastSavedAt(new Date());
      setSaveError(null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Failed to save requirements"
      );
    }
  }, []);

  // ── Generic helper for string fields ────────

  const makeStringSetter = useCallback(
    (field: keyof Pick<ProjectRequirements, "vision" | "mvpScope" | "aiWorkflowTarget" | "projectName">) =>
      (value: string) => {
        setRequirements((prev) => {
          const next = { ...prev, [field]: value };
          persist(next);
          return next;
        });
      },
    [persist]
  );

  // ── Generic helper for string[] fields ──────

  const makeStringArraySetter = useCallback(
    (
      field: keyof Pick<
        ProjectRequirements,
        | "goals"
        | "targetUsers"
        | "problems"
        | "solutionIdeas"
        | "integrations"
        | "constraints"
        | "preferredTech"
        | "risks"
        | "unknowns"
      >
    ) =>
      (values: string[]) => {
        setRequirements((prev) => {
          const next = { ...prev, [field]: values };
          persist(next);
          return next;
        });
      },
    [persist]
  );

  // ── Individual setters ──────────────────────

  const setVision = useMemoized(makeStringSetter("vision"));
  const setProjectName = useMemoized(makeStringSetter("projectName"));
  const setMvpScope = useMemoized(makeStringSetter("mvpScope"));
  const setAiWorkflowTarget = useMemoized(makeStringSetter("aiWorkflowTarget"));

  const setGoals = useMemoized(makeStringArraySetter("goals"));
  const setTargetUsers = useMemoized(makeStringArraySetter("targetUsers"));
  const setProblems = useMemoized(makeStringArraySetter("problems"));
  const setSolutionIdeas = useMemoized(makeStringArraySetter("solutionIdeas"));
  const setIntegrations = useMemoized(makeStringArraySetter("integrations"));
  const setConstraints = useMemoized(makeStringArraySetter("constraints"));
  const setPreferredTech = useMemoized(makeStringArraySetter("preferredTech"));
  const setRisks = useMemoized(makeStringArraySetter("risks"));
  const setUnknowns = useMemoized(makeStringArraySetter("unknowns"));

  const setRepositoryState = useCallback(
    (value: RepositoryState) => {
      setRequirements((prev) => {
        const next = { ...prev, repositoryState: value };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setConfidence = useCallback(
    (value: ConfidenceLevel) => {
      setRequirements((prev) => {
        const next = { ...prev, confidence: value };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetRequirements = useCallback(() => {
    const fresh = createEmptyProjectRequirements();
    clearProjectRequirements();
    setRequirements(fresh);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  return {
    requirements,
    lastSavedAt,
    saveError,
    setVision,
    setProjectName,
    setGoals,
    setTargetUsers,
    setProblems,
    setSolutionIdeas,
    setMvpScope,
    setIntegrations,
    setConstraints,
    setPreferredTech,
    setAiWorkflowTarget,
    setRepositoryState,
    setRisks,
    setUnknowns,
    setConfidence,
    resetRequirements,
  };
}

// ── Tiny helper: stable reference for callback results ──

function useMemoized<T extends (...args: never[]) => unknown>(fn: T): T {
  return useCallback(fn, [fn]);
}
