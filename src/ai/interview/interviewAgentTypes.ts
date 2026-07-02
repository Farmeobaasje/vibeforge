// ──────────────────────────────────────────────
// InterviewAgent — Epic 23
// Types for the AI Interview Agent layer.
//
// The Interview Agent is a thin "voice layer"
// between the Conversation Engine and the LLM.
// It translates planned questions into natural
// LLM prompts, sends them via the gateway, and
// parses/normalizes the response.
//
// It holds NO state — the Conversation Engine
// and ConversationMemory own all state.
// ──────────────────────────────────────────────

import type { ChatMessage } from "../gateway";
import type { PlannedQuestion } from "../../orchestrator/interviewPlanner";
import type { FollowUpQuestion } from "../../orchestrator/followUpEngine";
import type { ConversationMemory } from "../../models/conversationMemory";

// ── Question input ────────────────────────────

/**
 * A question ready to be asked by the Interview Agent.
 * Can be either a planned topic question or a follow-up.
 */
export type AgentQuestion =
  | { type: "planned"; question: PlannedQuestion }
  | { type: "follow-up"; question: FollowUpQuestion };

// ── Answer output ─────────────────────────────

/**
 * The parsed and normalized answer from the LLM.
 */
export interface AgentAnswer {
  /** The raw text content from the LLM response */
  content: string;
  /** The model that generated the response */
  model: string;
  /** Optional token usage info */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ── Agent result ──────────────────────────────

/**
 * The complete result of asking a question via the Interview Agent.
 */
export interface InterviewAgentResult {
  /** The parsed answer */
  answer: AgentAnswer;
  /** The messages that were sent to the LLM (for debugging/transparency) */
  messages: ChatMessage[];
  /** Whether the call succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// ── Agent configuration ───────────────────────

/**
 * Configuration for the Interview Agent.
 * All fields are optional — sensible defaults apply.
 */
export interface InterviewAgentConfig {
  /** System prompt to use (defaults to interviewPrompts.SYSTEM_PROMPT) */
  systemPrompt?: string;
  /** Temperature for the LLM call (default: 0.3) */
  temperature?: number;
  /** Max tokens for the response (default: 1024) */
  maxTokens?: number;
  /** Whether to request structured JSON output (default: false) */
  structuredOutput?: boolean;
}

// ── Context builder input ─────────────────────

/**
 * Input for building the LLM context from conversation memory.
 */
export interface ContextBuilderInput {
  /** The current conversation memory */
  memory: ConversationMemory;
  /** The question to ask */
  question: AgentQuestion;
  /** Optional additional context to include */
  additionalContext?: string;
}
