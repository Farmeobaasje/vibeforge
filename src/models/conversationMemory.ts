// ──────────────────────────────────────────────
// ConversationMemory — AI interview state
// ──────────────────────────────────────────────

export type ConfidenceLevel = "low" | "medium" | "high" | "confirmed";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO timestamp
}

export interface InterviewQuestion {
  id: string;
  topic: string;
  question: string;
  answer: string;
  confidence: ConfidenceLevel;
  skipped: boolean;
  createdAt: string; // ISO timestamp
  answeredAt: string | null; // ISO timestamp
}

export interface Assumption {
  id: string;
  description: string;
  confidence: ConfidenceLevel;
  validated: boolean;
  createdAt: string; // ISO timestamp
}

export interface Decision {
  id: string;
  description: string;
  rationale: string;
  alternatives: string[];
  createdAt: string; // ISO timestamp
}

export interface ConversationMemory {
  /** Unique identifier */
  id: string;
  /** When the conversation was started */
  createdAt: string; // ISO timestamp
  /** When the conversation was last updated */
  updatedAt: string; // ISO timestamp
  /** Full chat log */
  messages: ChatMessage[];
  /** Questions asked and answers given */
  questions: InterviewQuestion[];
  /** Assumptions made during the conversation */
  assumptions: Assumption[];
  /** Decisions made during the conversation */
  decisions: Decision[];
  /** Ideas the user explicitly rejected */
  rejectedIdeas: string[];
  /** Topics that still need to be explored */
  openQuestions: string[];
  /** Overall confidence that we understand the project */
  confidence: ConfidenceLevel;
}

// ── Default ──────────────────────────────────

export function createEmptyConversationMemory(): ConversationMemory {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    messages: [],
    questions: [],
    assumptions: [],
    decisions: [],
    rejectedIdeas: [],
    openQuestions: [],
    confidence: "low",
  };
}
