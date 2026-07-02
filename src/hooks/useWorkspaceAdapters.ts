// ──────────────────────────────────────────────
// useWorkspaceAdapters — Epic 24.6
// Read-only adapters die useWorkspace data omzetten
// naar de interfaces van bestaande hooks.
//
// Hiermee kunnen componenten één voor één migreren
// zonder breaking changes.
// ──────────────────────────────────────────────

import { useMemo } from "react";
import { useWorkspace } from "./useWorkspace";
import type { UseConversationMemoryReturn } from "./useConversationMemory";
import type { UseArchitectureAnalysisReturn } from "./useArchitectureAnalysis";

/**
 * Adapter that exposes workspace.conversation as UseConversationMemoryReturn.
 *
 * NOTE: This is a READ-ONLY adapter. Mutators (addMessage, addQuestion, etc.)
 * are NOT implemented — they throw a descriptive error.
 *
 * Use this to gradually migrate components that only READ conversation state.
 * For write access, use useWorkspace().setConversation() directly.
 */
export function useConversationFromWorkspace(): UseConversationMemoryReturn {
  const { conversation, saveError, lastSavedAt } = useWorkspace();

  return useMemo(
    () => ({
      memory: conversation,
      lastSavedAt,
      saveError,

      // ── Read-only stubs ──
      addMessage: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      addQuestion: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      skipQuestion: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      updateQuestionAnswer: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      addAssumption: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      validateAssumption: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      addDecision: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      addRejectedIdea: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      addOpenQuestion: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      removeOpenQuestion: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      setConfidence: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      replaceMemory: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().setConversation() for writes",
        );
      },
      resetMemory: () => {
        throw new Error(
          "[useConversationFromWorkspace] Use useWorkspace().resetWorkspace() for writes",
        );
      },
    }),

    [conversation, lastSavedAt, saveError],
  );
}

/**
 * Adapter that exposes workspace.architecture as UseArchitectureAnalysisReturn.
 *
 * NOTE: This is a READ-ONLY adapter. Mutators are NOT implemented.
 */
export function useArchitectureFromWorkspace(): UseArchitectureAnalysisReturn {
  const { architecture, saveError, lastSavedAt } = useWorkspace();

  return useMemo(
    () => ({
      analysis: architecture,
      lastSavedAt,
      saveError,

      // ── Read-only stubs ──
      setExecutiveSummary: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setOverallScore: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setFunctionalAnalysis: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setTechnicalAnalysis: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      addRisk: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      updateRisk: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      removeRisk: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      addRecommendation: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      removeRecommendation: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      addTradeoff: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      removeTradeoff: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setUnknowns: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      addUnknown: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      removeUnknown: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setSuggestedStack: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setSuggestedArchitecture: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setEstimatedComplexity: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setEstimatedTimeline: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setConfidence: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      setAnalysis: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().setArchitecture() for writes",
        );
      },
      resetAnalysis: () => {
        throw new Error(
          "[useArchitectureFromWorkspace] Use useWorkspace().resetWorkspace() for writes",
        );
      },
    }),
    [architecture, lastSavedAt, saveError],
  );
}
