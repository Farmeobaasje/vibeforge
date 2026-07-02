// ──────────────────────────────────────────────
// useWorkspace — Epic 24.6
// Centrale workspace state hook.
// Werkt naast bestaande hooks — vervangt ze niet.
// Leest/schrijft naar eigen localStorage key.
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import type {
  WorkspaceState,
  WorkspaceMetadata,
  ExecutionState,
  AgentHistoryEntry,
  GeneratedFile,
  AgentType,
} from "../models/workspaceState";
import { createEmptyWorkspaceState } from "../models/workspaceState";
import type { ConversationMemory } from "../models/conversationMemory";
import type { ProjectRequirements } from "../models/projectRequirements";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";
import type { ProjectDefinition } from "../types/projectDefinition";
import {
  loadWorkspace,
  saveWorkspace,
  clearWorkspace,
} from "../lib/workspaceStorage";

// ── Return type ───────────────────────────────

export interface UseWorkspaceReturn {
  /** The complete workspace state */
  workspace: WorkspaceState;

  // ── Convenience accessors (read-only views) ──

  /** Conversation memory from the interview phase */
  conversation: ConversationMemory;
  /** Extracted project requirements */
  requirements: ProjectRequirements;
  /** Architecture analysis from the architect agent */
  architecture: ArchitectureAnalysis;
  /** The compiled project definition (may be null) */
  projectDefinition: ProjectDefinition | null;

  // ── Substate mutators ──

  /** Replace the entire conversation memory */
  setConversation: (memory: ConversationMemory) => void;
  /** Replace the entire project requirements */
  setRequirements: (req: ProjectRequirements) => void;
  /** Replace the entire architecture analysis */
  setArchitecture: (analysis: ArchitectureAnalysis) => void;
  /** Set or clear the project definition */
  setProjectDefinition: (pd: ProjectDefinition | null) => void;
  /** Add a generated document */
  addGeneratedDocument: (doc: GeneratedFile) => void;
  /** Clear all generated documents */
  clearGeneratedDocuments: () => void;

  // ── Execution state ──

  /** Update parts of the execution state */
  setExecutionState: (partial: Partial<ExecutionState>) => void;

  // ── Agent history ──

  /** Add an entry to the agent history */
  addAgentHistoryEntry: (entry: AgentHistoryEntry) => void;
  /** Add a simplified agent history entry */
  addAgentAction: (
    agentId: string,
    agentType: AgentType,
    action: string,
    status: "success" | "error" | "skipped",
    summary: string,
    duration?: number,
  ) => void;

  // ── Metadata ──

  /** Update parts of the workspace metadata */
  updateMetadata: (partial: Partial<WorkspaceMetadata>) => void;

  // ── Lifecycle ──

  /** Reset to empty workspace and clear localStorage */
  resetWorkspace: () => void;
  /** Error message from the last save attempt, or null */
  saveError: string | null;
  /** Timestamp of the last successful save, or null */
  lastSavedAt: Date | null;
}

// ── Helpers ───────────────────────────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Hook ──────────────────────────────────────

export function useWorkspace(): UseWorkspaceReturn {
  const [workspace, setWorkspace] = useState<WorkspaceState>(loadWorkspace);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep a ref to the latest value so callbacks always have fresh data
  const ref = useRef(workspace);
  ref.current = workspace;

  const persist = useCallback((data: WorkspaceState) => {
    try {
      saveWorkspace(data);
      setLastSavedAt(new Date());
      setSaveError(null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Failed to save workspace",
      );
    }
  }, []);

  // ── Substate mutators ──

  const setConversation = useCallback(
    (conversation: ConversationMemory) => {
      setWorkspace((prev) => {
        const next = { ...prev, conversation };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setRequirements = useCallback(
    (requirements: ProjectRequirements) => {
      setWorkspace((prev) => {
        const next = { ...prev, requirements };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setArchitecture = useCallback(
    (architecture: ArchitectureAnalysis) => {
      setWorkspace((prev) => {
        const next = { ...prev, architecture };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setProjectDefinition = useCallback(
    (projectDefinition: ProjectDefinition | null) => {
      setWorkspace((prev) => {
        const next = { ...prev, projectDefinition };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addGeneratedDocument = useCallback(
    (doc: GeneratedFile) => {
      setWorkspace((prev) => {
        const next = {
          ...prev,
          generatedDocuments: [...prev.generatedDocuments, doc],
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearGeneratedDocuments = useCallback(() => {
    setWorkspace((prev) => {
      const next = { ...prev, generatedDocuments: [] };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Execution state ──

  const setExecutionState = useCallback(
    (partial: Partial<ExecutionState>) => {
      setWorkspace((prev) => {
        const next = {
          ...prev,
          execution: { ...prev.execution, ...partial },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Agent history ──

  const addAgentHistoryEntry = useCallback(
    (entry: AgentHistoryEntry) => {
      setWorkspace((prev) => {
        const next = {
          ...prev,
          agentHistory: [...prev.agentHistory, entry],
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addAgentAction = useCallback(
    (
      agentId: string,
      agentType: AgentType,
      action: string,
      status: "success" | "error" | "skipped",
      summary: string,
      duration: number = 0,
    ) => {
      const entry: AgentHistoryEntry = {
        id: generateId(),
        agentId,
        agentType,
        action,
        timestamp: new Date().toISOString(),
        duration,
        status,
        summary,
      };
      setWorkspace((prev) => {
        const next = {
          ...prev,
          agentHistory: [...prev.agentHistory, entry],
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Metadata ──

  const updateMetadata = useCallback(
    (partial: Partial<WorkspaceMetadata>) => {
      setWorkspace((prev) => {
        const next = {
          ...prev,
          metadata: { ...prev.metadata, ...partial },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Reset ──

  const resetWorkspace = useCallback(() => {
    const fresh = createEmptyWorkspaceState();
    clearWorkspace();
    setWorkspace(fresh);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  // ── Return ──

  return {
    workspace,
    conversation: workspace.conversation,
    requirements: workspace.requirements,
    architecture: workspace.architecture,
    projectDefinition: workspace.projectDefinition,
    setConversation,
    setRequirements,
    setArchitecture,
    setProjectDefinition,
    addGeneratedDocument,
    clearGeneratedDocuments,
    setExecutionState,
    addAgentHistoryEntry,
    addAgentAction,
    updateMetadata,
    resetWorkspace,
    saveError,
    lastSavedAt,
  };
}
