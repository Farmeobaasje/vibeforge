// ──────────────────────────────────────────────
// followUpEngine — generates context-dependent
// follow-up questions based on user answers
// ──────────────────────────────────────────────

import type { ConversationMemory, ChatMessage } from "../models/conversationMemory";

// ── Types ─────────────────────────────────────

export interface FollowUpQuestion {
  /** The topic this follow-up belongs to */
  topic: string;
  /** The follow-up question text */
  question: string;
  /** Why this follow-up is needed */
  rationale: string;
}

export interface FollowUpInput {
  /** The current conversation memory */
  memory: ConversationMemory;
  /** The topic that was just answered */
  currentTopic: string;
  /** The user's last answer text */
  lastAnswer: string;
}

// ── Follow-up rule ────────────────────────────

interface FollowUpRule {
  /** Topics this rule applies to */
  topics: string[];
  /** Keywords to trigger this rule (case-insensitive match) */
  keywords: string[];
  /** The follow-up question to ask */
  question: string;
  /** Rationale template (use {keyword} placeholder) */
  rationale: string;
  /** Whether this rule requires ALL keywords to match (default: any) */
  requireAll?: boolean;
}

// ── Rules ─────────────────────────────────────
// Conservative: only trigger follow-ups when there's
// a clear signal that more detail is needed.

const FOLLOW_UP_RULES: FollowUpRule[] = [
  // ── Vision follow-ups ──
  {
    topics: ["vision"],
    keywords: ["website", "web app", "webapp", "site", "platform"],
    question: "What is the main purpose or goal of this platform?",
    rationale: "User mentioned a platform/website — need to clarify purpose.",
  },
  {
    topics: ["vision"],
    keywords: ["game", "gaming", "roblox", "minecraft", "unity", "unreal"],
    question: "What platform should this game target (PC, mobile, console, web)?",
    rationale: "User mentioned a game — need to clarify target platform.",
  },
  {
    topics: ["vision"],
    keywords: ["mobile", "ios", "android", "app"],
    question: "Is this a native mobile app, a cross-platform app, or a mobile web app?",
    rationale: "User mentioned mobile — need to clarify approach.",
  },
  {
    topics: ["vision"],
    keywords: ["api", "backend", "server", "service", "microservice"],
    question: "Who will be the consumers of this API or service?",
    rationale: "User mentioned an API/service — need to clarify consumers.",
  },
  {
    topics: ["vision"],
    keywords: ["tool", "utility", "cli", "library", "package", "sdk"],
    question: "Who is the primary user of this tool or library?",
    rationale: "User mentioned a tool/library — need to clarify target user.",
  },

  // ── Target Users follow-ups ──
  {
    topics: ["target-users"],
    keywords: ["developer", "developer", "programmer", "engineer", "coder"],
    question: "What skill level should the developer experience target (beginner, intermediate, expert)?",
    rationale: "User mentioned developers — need to clarify skill level.",
  },
  {
    topics: ["target-users"],
    keywords: ["child", "kid", "teen", "student", "age"],
    question: "Are there any safety or privacy considerations for this age group?",
    rationale: "User mentioned an age group — safety may be a concern.",
  },
  {
    topics: ["target-users"],
    keywords: ["business", "enterprise", "company", "organization", "team"],
    question: "How many users do you expect to use this within the organization?",
    rationale: "User mentioned business/enterprise — need to clarify scale.",
  },
  {
    topics: ["target-users"],
    keywords: ["everyone", "general", "public", "all", "anyone"],
    question: "Is there a specific segment of users you want to focus on first?",
    rationale: "Broad audience — narrowing down the initial target helps scope MVP.",
  },

  // ── Problems follow-ups ──
  {
    topics: ["problems"],
    keywords: ["slow", "slowly", "time-consuming", "takes too long", "inefficient"],
    question: "How much time or effort is currently being lost to this problem?",
    rationale: "User mentioned inefficiency — quantifying the pain helps prioritize.",
  },
  {
    topics: ["problems"],
    keywords: ["expensive", "cost", "costly", "budget", "money"],
    question: "Do you have a sense of the current cost or potential savings?",
    rationale: "User mentioned cost — quantifying helps build the business case.",
  },
  {
    topics: ["problems"],
    keywords: ["manual", "by hand", "repetitive", "tedious", "boring"],
    question: "How often does this manual process need to be done?",
    rationale: "User mentioned manual work — frequency helps determine automation value.",
  },
  {
    topics: ["problems"],
    keywords: ["error", "mistake", "bug", "broken", "crash", "fail"],
    question: "What is the impact when this error occurs?",
    rationale: "User mentioned errors — impact helps prioritize reliability.",
  },

  // ── Solution follow-ups ──
  {
    topics: ["solution"],
    keywords: ["ai", "machine learning", "ml", "llm", "gpt", "claude", "neural"],
    question: "Which specific AI model or provider are you considering?",
    rationale: "User mentioned AI — need to clarify model/provider choice.",
  },
  {
    topics: ["solution"],
    keywords: ["database", "db", "sql", "nosql", "postgres", "mongodb"],
    question: "Do you have a preference for the database technology?",
    rationale: "User mentioned a database — need to clarify specific technology.",
  },
  {
    topics: ["solution"],
    keywords: ["cloud", "aws", "azure", "gcp", "google cloud", "deploy", "hosting"],
    question: "Do you have a preferred cloud provider or hosting platform?",
    rationale: "User mentioned cloud/hosting — need to clarify provider preference.",
  },
  {
    topics: ["solution"],
    keywords: ["open source", "oss", "github", "mit", "apache", "license"],
    question: "What license are you considering for this project?",
    rationale: "User mentioned open source — need to clarify licensing.",
  },

  // ── Tech Stack follow-ups ──
  {
    topics: ["tech-stack"],
    keywords: ["react", "vue", "angular", "svelte", "solid"],
    question: "Do you need server-side rendering, static generation, or a client-side SPA?",
    rationale: "User mentioned a frontend framework — need to clarify rendering strategy.",
  },
  {
    topics: ["tech-stack"],
    keywords: ["python", "django", "flask", "fastapi"],
    question: "Which version of Python are you targeting?",
    rationale: "User mentioned Python — version choice affects compatibility.",
  },
  {
    topics: ["tech-stack"],
    keywords: ["node", "node.js", "nodejs", "express", "nestjs", "next"],
    question: "Which runtime version are you targeting (LTS or latest)?",
    rationale: "User mentioned Node.js — version choice affects features.",
  },
  {
    topics: ["tech-stack"],
    keywords: ["typescript", "javascript", "ts", "js"],
    question: "Do you want strict TypeScript mode or a more relaxed configuration?",
    rationale: "User mentioned TypeScript — strictness affects development experience.",
  },

  // ── MVP follow-ups ──
  {
    topics: ["mvp"],
    keywords: ["weeks", "months", "days", "sprint", "quarter"],
    question: "Is there a specific deadline or target date for the MVP?",
    rationale: "User mentioned a timeframe — deadline affects scope decisions.",
  },
  {
    topics: ["mvp"],
    keywords: ["user", "login", "auth", "signup", "register", "account"],
    question: "Do you need authentication for the MVP, or can that come later?",
    rationale: "User mentioned auth — deciding MVP inclusion affects scope.",
  },
  {
    topics: ["mvp"],
    keywords: ["payment", "pay", "billing", "subscription", "stripe", "checkout"],
    question: "Is payment processing required for the MVP?",
    rationale: "User mentioned payments — MVP inclusion is a key scope decision.",
  },

  // ── Constraints follow-ups ──
  {
    topics: ["constraints"],
    keywords: ["budget", "money", "cost", "funding", "cheap", "free"],
    question: "Do you have a specific budget range for hosting or third-party services?",
    rationale: "User mentioned budget — need to clarify spending limits.",
  },
  {
    topics: ["constraints"],
    keywords: ["time", "deadline", "launch", "release date"],
    question: "What is the hard deadline, and what happens if it's missed?",
    rationale: "User mentioned a deadline — understanding consequences helps prioritize.",
  },
  {
    topics: ["constraints"],
    keywords: ["team", "solo", "alone", "just me", "single"],
    question: "Are you working alone or with a team?",
    rationale: "Team size affects project complexity and timeline.",
  },
  {
    topics: ["constraints"],
    keywords: ["mobile", "ios", "android", "cross-platform"],
    question: "Do you need to support both iOS and Android from the start?",
    rationale: "Platform support affects development effort significantly.",
  },

  // ── Integrations follow-ups ──
  {
    topics: ["integrations"],
    keywords: ["api", "rest", "graphql", "endpoint"],
    question: "Do you have documentation or a spec for this API?",
    rationale: "API documentation helps plan integration effort.",
  },
  {
    topics: ["integrations"],
    keywords: ["webhook", "webhook", "callback", "event"],
    question: "How should the system handle webhook failures or retries?",
    rationale: "Webhook reliability affects system design.",
  },
];

// ── Engine ────────────────────────────────────

/**
 * Generate a follow-up question based on the user's last answer.
 *
 * Uses keyword matching against a set of conservative rules.
 * Returns null when no follow-up is needed (avoids over-questioning).
 *
 * @param input - The follow-up input context
 * @returns A follow-up question, or null
 */
export function generateFollowUp(input: FollowUpInput): FollowUpQuestion | null {
  const { currentTopic, lastAnswer } = input;

  const answerLower = lastAnswer.toLowerCase();

  // Find matching rules for the current topic
  const matchingRules = FOLLOW_UP_RULES.filter((rule) => {
    // Rule must apply to the current topic
    if (!rule.topics.includes(currentTopic)) return false;

    // Check keyword matching
    if (rule.requireAll) {
      // All keywords must match
      return rule.keywords.every((kw) => answerLower.includes(kw));
    } else {
      // Any keyword can match
      return rule.keywords.some((kw) => answerLower.includes(kw));
    }
  });

  if (matchingRules.length === 0) return null;

  // Pick the first matching rule (most specific match)
  const rule = matchingRules[0];

  return {
    topic: currentTopic,
    question: rule.question,
    rationale: rule.rationale,
  };
}

/**
 * Check if a follow-up has already been asked for a given topic
 * in the conversation memory. Prevents asking the same follow-up twice.
 */
export function hasExistingFollowUp(
  memory: ConversationMemory,
  topic: string,
  question: string,
): boolean {
  return memory.questions.some(
    (q) => q.topic === topic && q.question === question && !q.skipped,
  );
}

/**
 * Get the last user message from the conversation memory.
 * Returns null if there are no user messages.
 */
export function getLastUserMessage(
  memory: ConversationMemory,
): ChatMessage | null {
  const userMessages = memory.messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return null;
  return userMessages[userMessages.length - 1];
}
