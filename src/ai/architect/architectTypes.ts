// ──────────────────────────────────────────────
// ArchitectAgent — Epic 24.2
// Types for the AI Architect Agent layer.
//
// The Architect Agent is a stateless "analysis
// layer" that takes ProjectRequirements (and
// optionally ConversationMemory and/or an
// existing ArchitectureAnalysis) and produces
// a structured ArchitectureAnalysis.
//
// It holds NO state — all state lives in the
// models layer (projectRequirements.ts,
// architectureAnalysis.ts, conversationMemory.ts).
// ──────────────────────────────────────────────

import type { ChatMessage } from "../gateway";
import type { ProjectRequirements } from "../../models/projectRequirements";
import type { ArchitectureAnalysis } from "../../models/architectureAnalysis";
import type { ConversationMemory } from "../../models/conversationMemory";
import type { WorkspaceState } from "../../models/workspaceState";
import type { ProjectDefinition } from "../../types/projectDefinition";

// ── Agent input ───────────────────────────────

/**
 * Input for the Architect Agent.
 *
 * @property requirements - The project requirements to analyse
 * @property memory - Optional conversation history for richer context
 * @property existingAnalysis - Optional existing analysis for re-analysis / delta
 * @property enrichedDefinition - Optional enriched ProjectDefinition for richer context
 * @property workspace - Optional workspace state (alternative to passing individual fields)
 */
export interface ArchitectInput {
  /** The project requirements to analyse */
  requirements: ProjectRequirements;
  /** Optional conversation history for richer context */
  memory?: ConversationMemory;
  /** Optional existing analysis for re-analysis / delta */
  existingAnalysis?: ArchitectureAnalysis;
  /** Optional latest raw user message for immediate context */
  latestUserMessage?: string;
  /** Optional enriched ProjectDefinition for richer context */
  enrichedDefinition?: ProjectDefinition;
  /** Optional workspace state — alternative to passing individual fields */
  workspace?: WorkspaceState;
}

// ── Agent result ──────────────────────────────

/**
 * The complete result of running the Architect Agent.
 */
export interface ArchitectAgentResult {
  /** The parsed and normalised architecture analysis */
  analysis: ArchitectureAnalysis;
  /** The messages that were sent to the LLM (for debugging/transparency) */
  messages: ChatMessage[];
  /** Whether the call succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// ── Agent configuration ───────────────────────

/**
 * Configuration for the Architect Agent.
 * All fields are optional — sensible defaults apply.
 */
export interface ArchitectAgentConfig {
  /** System prompt to use (defaults to architectPrompts.SYSTEM_PROMPT) */
  systemPrompt?: string;
  /** Temperature for the LLM call (default: 0.3) */
  temperature?: number;
  /** Max tokens for the response (default: 4096) */
  maxTokens?: number;
  /** Whether to request structured JSON output (default: true) */
  structuredOutput?: boolean;
}
