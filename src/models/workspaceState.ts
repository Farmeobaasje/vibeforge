// ──────────────────────────────────────────────
// WorkspaceState — Epic 24.6
// Centraal model dat alle substates verenigt.
// Agents werken met één workspace-object i.p.v.
// losse silo's (conversation, requirements, etc.)
// ──────────────────────────────────────────────

import type { ConversationMemory } from "./conversationMemory";
import { createEmptyConversationMemory } from "./conversationMemory";
import type { ProjectRequirements } from "./projectRequirements";
import { createEmptyProjectRequirements } from "./projectRequirements";
import type { ArchitectureAnalysis } from "./architectureAnalysis";
import { createEmptyArchitectureAnalysis } from "./architectureAnalysis";
import type { ProjectDefinition } from "../types/projectDefinition";

// ── Sub-types ─────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkspaceMetadata {
  /** Unique workspace identifier */
  id: string;
  /** Human-readable workspace name */
  name: string;
  /** When the workspace was created */
  createdAt: string; // ISO timestamp
  /** When the workspace was last updated */
  updatedAt: string; // ISO timestamp
  /** When the workspace was last opened */
  lastOpenedAt: string; // ISO timestamp
  /** Schema version for future migrations */
  version: number;
  /** Optional tags for organisation */
  tags: string[];
}

export interface ExecutionState {
  /** Current wizard step */
  currentStep: WizardStep;
  /** Status of the interview phase */
  interviewStatus: "idle" | "in-progress" | "complete" | "skipped";
  /** Status of the architecture analysis phase */
  architectureStatus: "idle" | "in-progress" | "complete" | "failed";
  /** Status of the document generation phase */
  generationStatus: "idle" | "in-progress" | "complete" | "failed";
  /** Status of the export phase */
  exportStatus: "idle" | "in-progress" | "complete" | "failed";
}

export type AgentType = "interview" | "architect" | "generator" | "planner";

export interface AgentHistoryEntry {
  /** Unique identifier for this entry */
  id: string;
  /** Which agent ran */
  agentId: string;
  /** Type of agent */
  agentType: AgentType;
  /** What action was performed */
  action: string;
  /** When the action occurred */
  timestamp: string; // ISO timestamp
  /** How long the action took (ms) */
  duration: number;
  /** Whether the action succeeded */
  status: "success" | "error" | "skipped";
  /** Short human-readable summary */
  summary: string;
}

export interface GeneratedFile {
  /** File path (e.g. "memory-bank/activeContext.md") */
  path: string;
  /** Programming language or file type */
  language: string;
  /** The generated content */
  content: string;
  /** When this file was generated */
  generatedAt: string; // ISO timestamp
}

// ── Main model ────────────────────────────────

export interface WorkspaceState {
  /** Workspace metadata */
  metadata: WorkspaceMetadata;

  /** Conversation memory from the interview phase */
  conversation: ConversationMemory;

  /** Extracted project requirements */
  requirements: ProjectRequirements;

  /** Architecture analysis from the architect agent */
  architecture: ArchitectureAnalysis;

  /** The compiled project definition (may be null before generation) */
  projectDefinition: ProjectDefinition | null;

  /** Files generated during the generation phase */
  generatedDocuments: GeneratedFile[];

  /** Current execution state (wizard step, phase statuses) */
  execution: ExecutionState;

  /** History of all agent actions in this workspace */
  agentHistory: AgentHistoryEntry[];
}

// ── Defaults ──────────────────────────────────

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function createEmptyWorkspaceMetadata(): WorkspaceMetadata {
  const now = nowISO();
  return {
    id: generateId(),
    name: "Untitled Project",
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    version: 1,
    tags: [],
  };
}

export function createEmptyExecutionState(): ExecutionState {
  return {
    currentStep: 1,
    interviewStatus: "idle",
    architectureStatus: "idle",
    generationStatus: "idle",
    exportStatus: "idle",
  };
}

/**
 * Create a complete empty WorkspaceState with all defaults.
 */
export function createEmptyWorkspaceState(): WorkspaceState {
  return {
    metadata: createEmptyWorkspaceMetadata(),
    conversation: createEmptyConversationMemory(),
    requirements: createEmptyProjectRequirements(),
    architecture: createEmptyArchitectureAnalysis(),
    projectDefinition: null,
    generatedDocuments: [],
    execution: createEmptyExecutionState(),
    agentHistory: [],
  };
}
