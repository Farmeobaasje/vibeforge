// ──────────────────────────────────────────────
// Architect Agent — Epic 24.2 + 24.3
// Stateless "analysis layer" between the project
// requirements and the LLM.
//
// Re-exports all public types, classes, and
// factory functions for the Architect Agent
// and the Architect Session service layer.
// ──────────────────────────────────────────────

export type {
  ArchitectInput,
  ArchitectAgentResult,
  ArchitectAgentConfig,
} from "./architectTypes";

export {
  SYSTEM_PROMPT,
  buildConversationSummary,
  buildArchitectPrompt,
} from "./architectPrompts";

export {
  ArchitectAgent,
  createArchitectAgent,
} from "./ArchitectAgent";

// ── Epic 24.3 — Architect Session ─────────────

export type {
  ArchitectSessionInput,
  ArchitectSessionResult,
  ArchitectSessionDebugInfo,
} from "./architectSession";

export {
  runArchitectSession,
  reRunArchitectSession,
} from "./architectSession";
