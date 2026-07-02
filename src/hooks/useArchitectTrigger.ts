// ──────────────────────────────────────────────
// useArchitectTrigger — Epic 24.4
// Lightweight hook that bridges the interview flow
// to the Architect Agent.
//
// Manual trigger only — no auto-run on interview
// completion. The user must explicitly click to
// run the analysis, since it may consume API tokens.
//
// Wraps useArchitectAnalysis for use inside
// InterviewStep. Provides:
//   runAnalysis, isAnalyzing, analysisError,
//   analysisReady, lastAnalyzedAt, analysisStatus
// ──────────────────────────────────────────────

import { useMemo } from "react";
import { useProjectRequirements } from "./useProjectRequirements";
import { useConversationMemory } from "./useConversationMemory";
import { useArchitectureAnalysis } from "./useArchitectureAnalysis";
import { useArchitectAnalysis } from "./useArchitectAnalysis";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";

// ── Status type ───────────────────────────────

export type ArchitectTriggerStatus =
  | "idle"      // Not yet triggered
  | "analyzing" // Analysis in progress
  | "ready"     // Analysis completed successfully
  | "error";    // Analysis failed

// ── Return type ───────────────────────────────

export interface UseArchitectTriggerReturn {
  /** Trigger a new architecture analysis */
  runAnalysis: () => Promise<void>;
  /** Whether an analysis is currently in progress */
  isAnalyzing: boolean;
  /** Error message from the last analysis attempt, or null */
  analysisError: string | null;
  /** Whether a successful analysis result is available */
  analysisReady: boolean;
  /** Timestamp of the last successful analysis, or null */
  lastAnalyzedAt: Date | null;
  /** Current status of the analysis trigger */
  analysisStatus: ArchitectTriggerStatus;
  /** The current architecture analysis data */
  analysis: ArchitectureAnalysis;
}

// ── Hook ──────────────────────────────────────

/**
 * Hook that wires ProjectRequirements, ConversationMemory,
 * and ArchitectureAnalysis into the ArchitectAgent.
 *
 * Manual trigger only — call runAnalysis() explicitly.
 *
 * @example
 * ```tsx
 * const {
 *   runAnalysis,
 *   isAnalyzing,
 *   analysisError,
 *   analysisReady,
 *   analysisStatus,
 * } = useArchitectTrigger();
 *
 * // In JSX:
 * {analysisStatus === "idle" && (
 *   <button onClick={runAnalysis}>Run Architecture Analysis</button>
 * )}
 * {analysisStatus === "analyzing" && <span>Analyzing...</span>}
 * {analysisStatus === "ready" && <span>✅ Architecture analysis ready</span>}
 * {analysisStatus === "error" && <span>❌ {analysisError}</span>}
 * ```
 */
export function useArchitectTrigger(): UseArchitectTriggerReturn {
  // ── Sub-hooks ─────────────────────────────
  const requirementsHook = useProjectRequirements();
  const memoryHook = useConversationMemory();
  const analysisHook = useArchitectureAnalysis();

  // ── Architect orchestration hook ──────────
  const {
    runAnalysis: runArchitectAnalysis,
    isAnalyzing,
    error,
    lastAnalyzedAt,
  } = useArchitectAnalysis(
    {
      requirements: requirementsHook,
      memory: memoryHook,
      analysis: analysisHook,
    },
  );

  // ── Derived status ────────────────────────
  const analysisStatus = useMemo<ArchitectTriggerStatus>(() => {
    if (isAnalyzing) return "analyzing";
    if (error) return "error";
    if (lastAnalyzedAt) return "ready";
    return "idle";
  }, [isAnalyzing, error, lastAnalyzedAt]);

  const analysisReady = analysisStatus === "ready";

  return {
    runAnalysis: runArchitectAnalysis,
    isAnalyzing,
    analysisError: error,
    analysisReady,
    lastAnalyzedAt,
    analysisStatus,
    analysis: analysisHook.analysis,
  };
}
