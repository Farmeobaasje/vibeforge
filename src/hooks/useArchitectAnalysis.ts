// ──────────────────────────────────────────────
// useArchitectAnalysis — Epic 24.3
// Orchestration hook that wires ProjectRequirements,
// ConversationMemory, and ArchitectureAnalysis into
// the ArchitectAgent via architectSession.
//
// This hook:
// - Reads current state from the three data hooks
// - Calls runArchitectSession / reRunArchitectSession
// - Writes the result to architecture-analysis storage
// - Exposes isAnalyzing, error, lastAnalyzedAt
//
// It does NOT manage individual field setters — that
// is the responsibility of useArchitectureAnalysis.ts.
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import type { OrchestratorConfig } from "../orchestrator";
import type { ArchitectAgentConfig } from "../ai/architect";
import {
  runArchitectSession,
  reRunArchitectSession,
} from "../ai/architect";
import type { UseProjectRequirementsReturn } from "./useProjectRequirements";
import type { UseConversationMemoryReturn } from "./useConversationMemory";
import type { UseArchitectureAnalysisReturn } from "./useArchitectureAnalysis";
import { requirementsToProjectDefinition } from "../lib/requirementsToProjectDefinition";

// ── Types ─────────────────────────────────────

export interface UseArchitectAnalysisReturn {
  /** Run a new architecture analysis using current requirements + memory */
  runAnalysis: () => Promise<void>;
  /** Re-run analysis, passing the current analysis as existing context */
  reRunAnalysis: () => Promise<void>;
  /** Whether an analysis is currently in progress */
  isAnalyzing: boolean;
  /** Error message from the last analysis attempt, or null */
  error: string | null;
  /** Timestamp of the last successful analysis, or null */
  lastAnalyzedAt: Date | null;
}

// ── Hook ──────────────────────────────────────

/**
 * Orchestration hook that connects ProjectRequirements,
 * ConversationMemory, and ArchitectureAnalysis to the
 * ArchitectAgent.
 *
 * @param deps - The three data hooks this hook depends on
 * @param config - Optional orchestrator and agent configuration
 * @returns Analysis control functions and status
 *
 * @example
 * ```typescript
 * const reqHook = useProjectRequirements();
 * const memHook = useConversationMemory();
 * const archHook = useArchitectureAnalysis();
 *
 * const { runAnalysis, isAnalyzing, error } = useArchitectAnalysis({
 *   requirements: reqHook,
 *   memory: memHook,
 *   analysis: archHook,
 * });
 * ```
 */
export function useArchitectAnalysis(
  deps: {
    requirements: UseProjectRequirementsReturn;
    memory: UseConversationMemoryReturn;
    analysis: UseArchitectureAnalysisReturn;
  },
  config?: {
    orchestrator?: Partial<OrchestratorConfig>;
    agent?: ArchitectAgentConfig;
  },
): UseArchitectAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);

  // Ref to prevent concurrent runs
  const runningRef = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsAnalyzing(true);
    setError(null);

    try {
      // Enrich requirements into a ProjectDefinition for richer context
      const enriched = requirementsToProjectDefinition(deps.requirements.requirements);

      const result = await runArchitectSession({
        requirements: deps.requirements.requirements,
        enrichedDefinition: enriched,
        memory: deps.memory.memory,
        orchestratorConfig: config?.orchestrator,
        agentConfig: config?.agent,
      });

      if (result.success && result.analysis) {
        // Write the result to storage via the analysis hook
        deps.analysis.setAnalysis(result.analysis);
        setLastAnalyzedAt(new Date());
        setError(null);
      } else {
        setError(result.error ?? "Analysis completed but returned no data");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error during analysis";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
      runningRef.current = false;
    }
  }, [
    deps.requirements.requirements,
    deps.memory.memory,
    deps.analysis,
    config?.orchestrator,
    config?.agent,
  ]);

  const reRunAnalysis = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsAnalyzing(true);
    setError(null);

    try {
      // Enrich requirements into a ProjectDefinition for richer context
      const enriched = requirementsToProjectDefinition(deps.requirements.requirements);

      const result = await reRunArchitectSession({
        requirements: deps.requirements.requirements,
        enrichedDefinition: enriched,
        memory: deps.memory.memory,
        existingAnalysis: deps.analysis.analysis,
        orchestratorConfig: config?.orchestrator,
        agentConfig: config?.agent,
      });

      if (result.success && result.analysis) {
        deps.analysis.setAnalysis(result.analysis);
        setLastAnalyzedAt(new Date());
        setError(null);
      } else {
        setError(result.error ?? "Re-analysis completed but returned no data");
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unknown error during re-analysis";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
      runningRef.current = false;
    }
  }, [
    deps.requirements.requirements,
    deps.memory.memory,
    deps.analysis.analysis,
    deps.analysis.setAnalysis,
    config?.orchestrator,
    config?.agent,
  ]);

  return {
    runAnalysis,
    reRunAnalysis,
    isAnalyzing,
    error,
    lastAnalyzedAt,
  };
}
