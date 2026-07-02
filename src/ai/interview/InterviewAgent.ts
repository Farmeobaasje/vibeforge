// ──────────────────────────────────────────────
// InterviewAgent — Epic 23
// Thin "voice layer" between the Conversation
// Engine and the LLM.
//
// The Interview Agent:
// - Takes a PlannedQuestion or FollowUpQuestion
//   from the Conversation Engine
// - Wraps it in a natural LLM prompt using the
//   conversation history as context
// - Sends it via the AIGateway/Orchestrator
// - Returns the parsed and normalized answer
//
// It holds NO state — the Conversation Engine
// and ConversationMemory own all state.
// ──────────────────────────────────────────────

import type { Orchestrator } from "../../orchestrator";
import type { ChatMessage } from "../gateway";
import type { ConversationMemory } from "../../models/conversationMemory";
import type { PlannedQuestion } from "../../orchestrator/interviewPlanner";
import type { FollowUpQuestion } from "../../orchestrator/followUpEngine";
import {
  SYSTEM_PROMPT,
  buildPlannedQuestionMessage,
  buildFollowUpQuestionMessage,
  buildConversationSummary,
} from "./interviewPrompts";
import type {
  AgentQuestion,
  AgentAnswer,
  InterviewAgentResult,
  InterviewAgentConfig,
  ContextBuilderInput,
} from "./interviewAgentTypes";

// ── Default config ────────────────────────────

const DEFAULT_CONFIG: Required<InterviewAgentConfig> = {
  systemPrompt: SYSTEM_PROMPT,
  temperature: 0.3,
  maxTokens: 1024,
  structuredOutput: false,
};

// ── Context builder ───────────────────────────

/**
 * Build the LLM context (messages array) from a question and conversation memory.
 *
 * @param input - The context builder input
 * @param config - The agent config (for system prompt)
 * @returns An array of ChatMessages ready to send to the LLM
 */
export function buildInterviewContext(
  input: ContextBuilderInput,
  config: Required<InterviewAgentConfig> = DEFAULT_CONFIG,
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // ── System prompt ──
  messages.push({
    role: "system",
    content: config.systemPrompt,
  });

  // ── Conversation history (if any) ──
  const historySummary = buildConversationSummary(input.memory);
  if (historySummary !== "No previous answers yet — this is the first question.") {
    messages.push({
      role: "system",
      content: `Here is the conversation so far for context:\n\n${historySummary}\n\nUse this context to make your question feel natural, but do NOT repeat information the user already provided.`,
    });
  }

  // ── Additional context (if provided) ──
  if (input.additionalContext) {
    messages.push({
      role: "system",
      content: input.additionalContext,
    });
  }

  // ── The question ──
  let userMessage: string;

  switch (input.question.type) {
    case "planned":
      userMessage = buildPlannedQuestionMessage(
        input.question.question.question,
        input.question.question.topic,
        input.question.question.rationale,
      );
      break;

    case "follow-up": {
      // For follow-ups, we need the last user answer from memory
      const lastUserMessage = input.memory.messages
        .filter((m) => m.role === "user")
        .pop();
      const lastAnswer = lastUserMessage?.content ?? "";

      userMessage = buildFollowUpQuestionMessage(
        input.question.question.question,
        input.question.question.topic,
        lastAnswer,
        input.question.question.rationale,
      );
      break;
    }
  }

  messages.push({
    role: "user",
    content: userMessage,
  });

  return messages;
}

// ── Response parser ───────────────────────────

/**
 * Parse the LLM response into a clean AgentAnswer.
 *
 * Strips any markdown formatting, preamble, or extra text
 * that the LLM might add beyond the question itself.
 *
 * @param content - The raw LLM response text
 * @param model - The model that generated the response
 * @param usage - Optional token usage info
 * @returns A normalized AgentAnswer
 */
export function parseInterviewResponse(
  content: string,
  model: string,
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number },
): AgentAnswer {
  let cleaned = content.trim();

  // Strip markdown code blocks if present
  const codeBlockMatch = cleaned.match(/```(?:text|markdown)?\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Strip common preamble patterns
  const preamblePatterns = [
    /^(Here's|Here is|Sure|Of course|Certainly|Absolutely|Let me|I'll|I will)[^.]*\.\s*/i,
    /^(As an?|In my|Based on|According to|From the)[^.]*\.\s*/i,
    /^(The question|Your question|The answer)[^.]*\.\s*/i,
  ];

  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Strip leading/trailing quotes
  cleaned = cleaned.replace(/^["'\u201C\u201D]|["'\u201C\u201D]$/g, "").trim();

  // If after cleaning we have nothing, return the original
  if (cleaned.length === 0) {
    cleaned = content.trim();
  }

  return {
    content: cleaned,
    model,
    usage,
  };
}

// ── Interview Agent ───────────────────────────

/**
 * InterviewAgent — asks questions via the LLM and returns parsed answers.
 *
 * This is a stateless "voice layer" that:
 * 1. Takes a question from the Conversation Engine
 * 2. Builds an LLM context with conversation history
 * 3. Sends it via the Orchestrator
 * 4. Parses and normalizes the response
 *
 * @example
 * ```typescript
 * const agent = new InterviewAgent(orchestrator);
 * const result = await agent.ask({
 *   type: "planned",
 *   question: plannedQuestion,
 * }, memory);
 * ```
 */
export class InterviewAgent {
  private orchestrator: Orchestrator;
  private config: Required<InterviewAgentConfig>;

  constructor(
    orchestrator: Orchestrator,
    config: InterviewAgentConfig = {},
  ) {
    this.orchestrator = orchestrator;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the current agent configuration.
   */
  getConfig(): Required<InterviewAgentConfig> {
    return { ...this.config };
  }

  /**
   * Update the agent configuration.
   */
  updateConfig(config: Partial<InterviewAgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Ask a question via the LLM.
   *
   * @param question - The question to ask (planned or follow-up)
   * @param memory - The current conversation memory (for context)
   * @param additionalContext - Optional extra context to include
   * @returns The agent result with the parsed answer
   */
  async ask(
    question: AgentQuestion,
    memory: ConversationMemory,
    additionalContext?: string,
  ): Promise<InterviewAgentResult> {
    try {
      // ── Step 1: Build context ──
      const messages = buildInterviewContext(
        {
          memory,
          question,
          additionalContext,
        },
        this.config,
      );

      // ── Step 2: Send to LLM via orchestrator ──
      const result = await this.orchestrator.generate(messages, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      // ── Step 3: Parse response ──
      const answer = parseInterviewResponse(
        result.content,
        result.model,
        result.usage,
      );

      return {
        answer,
        messages,
        success: true,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during interview question";

      return {
        answer: {
          content: "",
          model: "unknown",
        },
        messages: [],
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Ask a planned topic question.
   * Convenience wrapper around ask().
   *
   * @param question - The planned question from the engine
   * @param memory - The current conversation memory
   * @returns The agent result
   */
  async askPlanned(
    question: PlannedQuestion,
    memory: ConversationMemory,
  ): Promise<InterviewAgentResult> {
    return this.ask({ type: "planned", question }, memory);
  }

  /**
   * Ask a follow-up question.
   * Convenience wrapper around ask().
   *
   * @param question - The follow-up question from the engine
   * @param memory - The current conversation memory
   * @returns The agent result
   */
  async askFollowUp(
    question: FollowUpQuestion,
    memory: ConversationMemory,
  ): Promise<InterviewAgentResult> {
    return this.ask({ type: "follow-up", question }, memory);
  }
}

// ── Factory function ──────────────────────────

/**
 * Create a new InterviewAgent instance.
 *
 * @param orchestrator - The orchestrator to use for LLM calls
 * @param config - Optional configuration
 * @returns A new InterviewAgent
 */
export function createInterviewAgent(
  orchestrator: Orchestrator,
  config?: InterviewAgentConfig,
): InterviewAgent {
  return new InterviewAgent(orchestrator, config);
}
