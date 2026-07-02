// ──────────────────────────────────────────────
// architectSession — Epic 24.3
// Service layer that wires ProjectRequirements,
// ConversationMemory, and ArchitectureAnalysis
// into the ArchitectAgent.
//
// This is a pure orchestration layer:
// - No UI imports
// - No storage writes
// - Returns the full ArchitectAgentResult
// ──────────────────────────────────────────────

import type { ProjectRequirements } from "../../models/projectRequirements";
import type { ConversationMemory } from "../../models/conversationMemory";
import type { ArchitectureAnalysis } from "../../models/architectureAnalysis";
import type { ProjectDefinition } from "../../types/projectDefinition";
import type { ChatMessage } from "../gateway";
import type { OrchestratorConfig } from "../../orchestrator";
import { createOrchestrator } from "../../orchestrator";
import { createArchitectAgent } from "./ArchitectAgent";
import type { ArchitectAgentConfig } from "./architectTypes";

// ── Types ─────────────────────────────────────

export interface ArchitectSessionInput {
  /** The project requirements to analyse */
  requirements: ProjectRequirements;
  /** Optional enriched ProjectDefinition for richer context */
  enrichedDefinition?: ProjectDefinition;
  /** Optional conversation history for richer context */
  memory?: ConversationMemory;
  /** Optional existing analysis for re-analysis / delta */
  existingAnalysis?: ArchitectureAnalysis;
  /** Optional latest raw user message for immediate context */
  latestUserMessage?: string;
  /** Optional orchestrator configuration (endpoints, retries, etc.) */
  orchestratorConfig?: Partial<OrchestratorConfig>;
  /** Optional agent configuration (temperature, maxTokens, etc.) */
  agentConfig?: ArchitectAgentConfig;
}

export interface ArchitectSessionDebugInfo {
  /** The model that was used */
  model: string;
  /** Optional token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Round-trip latency in milliseconds */
  latencyMs: number;
}

export interface ArchitectSessionResult {
  /** The parsed and normalised architecture analysis */
  analysis: ArchitectureAnalysis;
  /** The messages that were sent to the LLM (for debugging/transparency) */
  messages: ChatMessage[];
  /** Whether the call succeeded */
  success: boolean;
  /** Error message if the call failed */
  error?: string;
  /** Debug information about the LLM call */
  debugInfo?: ArchitectSessionDebugInfo;
}

// ── Session runner ────────────────────────────

/**
 * Run a full architect analysis session.
 *
 * Creates an Orchestrator and ArchitectAgent, sends the
 * project requirements (with optional memory and existing
 * analysis) to the LLM, and returns the parsed result.
 *
 * This function is stateless — it does NOT read or write
 * to localStorage or any other storage layer.
 *
 * @param input - The session input (requirements + optional context + config)
 * @returns The session result with analysis, messages, and debug info
 *
 * @example
 * ```typescript
 * const result = await runArchitectSession({
 *   requirements: myRequirements,
 *   memory: myConversationMemory,
 *   orchestratorConfig: { maxRetries: 3 },
 * });
 *
 * if (result.success) {
 *   console.log(result.analysis.executiveSummary);
 * }
 * ```
 */
export async function runArchitectSession(
  input: ArchitectSessionInput,
): Promise<ArchitectSessionResult> {
  const startTime = performance.now();

  try {
    // ── Step 1: Create orchestrator ──
    const orchestrator = createOrchestrator(input.orchestratorConfig);

    // ── Step 2: Create architect agent ──
    const agent = createArchitectAgent(orchestrator, input.agentConfig);

    // ── Step 3: Run analysis ──
    const result = await agent.analyze({
      requirements: input.requirements,
      memory: input.memory,
      existingAnalysis: input.existingAnalysis,
      latestUserMessage: input.latestUserMessage,
      enrichedDefinition: input.enrichedDefinition,
    });

    const latencyMs = Math.round(performance.now() - startTime);

    // ── Step 4: Build debug info from the orchestrator's active endpoint ──
    const activeEndpoint = orchestrator.getActiveEndpoint();
    const debugInfo: ArchitectSessionDebugInfo = {
      model: activeEndpoint.model,
      latencyMs,
    };

    return {
      analysis: result.analysis,
      messages: result.messages,
      success: result.success,
      error: result.error,
      debugInfo,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error in architect session";

    return {
      analysis: null as unknown as ArchitectureAnalysis,
      messages: [],
      success: false,
      error: errorMessage,
      debugInfo: {
        model: "unknown",
        latencyMs,
      },
    };
  }
}

/**
 * Run a re-analysis session, explicitly passing an existing
 * ArchitectureAnalysis for delta updates.
 *
 * Convenience wrapper around runArchitectSession that ensures
 * existingAnalysis is always set.
 *
 * @param input - The session input (must include existingAnalysis)
 * @returns The session result with the updated analysis
 */
export async function reRunArchitectSession(
  input: ArchitectSessionInput & {
    existingAnalysis: ArchitectureAnalysis;
  },
): Promise<ArchitectSessionResult> {
  return runArchitectSession(input);
}
