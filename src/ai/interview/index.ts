// ──────────────────────────────────────────────
// Interview Agent — Epic 23
// Thin "voice layer" between the Conversation
// Engine and the LLM.
//
// Re-exports all public types, classes, and
// factory functions for the Interview Agent.
// ──────────────────────────────────────────────

export type {
  AgentQuestion,
  AgentAnswer,
  InterviewAgentResult,
  InterviewAgentConfig,
  ContextBuilderInput,
} from "./interviewAgentTypes";

export {
  SYSTEM_PROMPT,
  buildPlannedQuestionMessage,
  buildFollowUpQuestionMessage,
  buildHistoryContextMessage,
  buildConversationSummary,
} from "./interviewPrompts";

export {
  InterviewAgent,
  createInterviewAgent,
  buildInterviewContext,
  parseInterviewResponse,
} from "./InterviewAgent";

export type {
  InterviewSessionConfig,
  InterviewSessionResult,
} from "./interviewSession";
export {
  processUserAnswer,
  processUserAnswerDemo,
  startNewInterview,
  skipTopic,
} from "./interviewSession";
