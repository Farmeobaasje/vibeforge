// ──────────────────────────────────────────────
// requirementExtractor — Epic 23.6A
// Scans ALL conversation messages (not just
// memory.questions[]) to extract requirement
// fields using keyword heuristics.
//
// Pure functions, no AI calls, no side effects.
// Conservative: prefers to leave fields empty
// rather than aggressively inferring.
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";

// ── Types ─────────────────────────────────────

/**
 * Extracted fields with confidence scores.
 * Each field has a value (if found) and a confidence (0-1).
 */
export interface ExtractedField {
  /** The extracted value, or empty string / empty array */
  value: string | string[];
  /** Confidence that this extraction is correct (0-1) */
  confidence: number;
  /** Which message(s) contributed to this extraction */
  sources: string[];
}

export type ExtractedFields = Record<string, ExtractedField>;

/**
 * Result of extracting requirements from a conversation.
 */
export interface ExtractionResult {
  /** All extracted fields keyed by requirementField name */
  fields: ExtractedFields;
  /** Fields that are still missing (empty or low confidence) */
  missingFields: string[];
  /** Fields that have sufficient confidence to be considered "filled" */
  filledFields: string[];
}

// ── Confidence thresholds ─────────────────────

const CONFIDENCE_THRESHOLD = 0.4;

// ── Keyword matchers per field ─────────────────
// Each matcher returns a score (0-1) and the
// extracted value if a match is found.
//
// Strategy: look for topic-relevant keywords in
// the answer. The more keywords match, the higher
// the confidence.

interface MatchResult {
  value: string | string[];
  confidence: number;
}

type FieldMatcher = (text: string) => MatchResult | null;

// ── Vision matcher ─────────────────────────────

const VISION_KEYWORDS = [
  "vision", "purpose", "mission", "goal of the project",
  "aim", "objective", "build a", "create a", "develop a",
  "platform", "system", "application", "app", "tool",
  "workspace", "dashboard", "portal", "hub",
];

function matchVision(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;
  let matched = "";

  for (const kw of VISION_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.15;
      if (kw.length > matched.length) matched = kw;
    }
  }

  // If the text describes what the project IS, that's a vision statement
  if (score >= 0.3) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Target Users matcher ───────────────────────

const USERS_KEYWORDS = [
  "user", "users", "audience", "target", "customer", "customers",
  "developer", "developers", "engineer", "engineers",
  "team", "teams", "organization", "company", "companies",
  "business", "enterprise", "consumer", "client", "clients",
  "student", "students", "kid", "kids", "children",
  "professional", "professionals", "everyone", "general public",
  "softwarebedrijf", "softwarebedrijven", "bedrijf", "bedrijven",
];

function matchTargetUsers(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of USERS_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.12;
    }
  }

  if (score >= 0.24) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Problems matcher ───────────────────────────

const PROBLEMS_KEYWORDS = [
  "problem", "problems", "issue", "issues", "pain", "struggle",
  "difficult", "hard to", "challenge", "challenges",
  "frustrat", "annoying", "waste", "wasting",
  "too many", "too much", "not enough", "missing",
  "slow", "slowly", "time-consuming", "inefficient",
  "expensive", "costly", "manual", "repetitive", "tedious",
  "error", "mistake", "bug", "broken", "crash", "fail",
  "losse tools", "te veel", "geen", "niet",
];

function matchProblems(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of PROBLEMS_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.12;
    }
  }

  if (score >= 0.24) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Goals matcher ──────────────────────────────

const GOALS_KEYWORDS = [
  "goal", "goals", "objective", "objectives", "aim", "aims",
  "target", "targets", "milestone", "milestones",
  "want to achieve", "hope to", "should accomplish",
  "key result", "key results", "success criteria",
  "deliverable", "deliverables", "outcome", "outcomes",
];

function matchGoals(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of GOALS_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.15;
    }
  }

  if (score >= 0.3) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Solution matcher ───────────────────────────

const SOLUTION_KEYWORDS = [
  "solution", "approach", "architecture", "design",
  "build with", "using", "technology", "tech stack",
  "framework", "library", "language",
  "microservice", "monolith", "serverless",
  "api", "rest", "graphql", "database",
  "frontend", "backend", "full-stack", "full stack",
  "cloud", "on-premise", "self-hosted",
];

function matchSolution(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of SOLUTION_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.12;
    }
  }

  if (score >= 0.24) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Safety/Privacy matcher ─────────────────────

const SAFETY_KEYWORDS = [
  "safety", "safe", "privacy", "private", "gdpr",
  "security", "secure", "encrypt", "encryption",
  "compliance", "compliant", "regulation", "regulatory",
  "data protection", "personal data", "pii",
  "auth", "authentication", "authorization", "access control",
  "hipaa", "sox", "pci", "iso",
];

function matchSafety(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of SAFETY_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.15;
    }
  }

  if (score >= 0.3) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Tech Stack matcher ─────────────────────────

const TECH_KEYWORDS = [
  "typescript", "javascript", "python", "java", "go", "rust",
  "react", "vue", "angular", "svelte", "solid",
  "node", "deno", "bun", "express", "fastify",
  "django", "flask", "fastapi", "spring", "rails",
  "postgres", "postgresql", "mysql", "mongodb", "redis",
  "docker", "kubernetes", "aws", "azure", "gcp",
  "tailwind", "bootstrap", "sass", "css",
  "graphql", "rest", "grpc", "websocket",
];

function matchTechStack(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  const found: string[] = [];
  let score = 0;

  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) {
      found.push(kw);
      score += 0.15;
    }
  }

  if (score >= 0.3) {
    return { value: found, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Constraints matcher ────────────────────────

const CONSTRAINTS_KEYWORDS = [
  "constraint", "constraints", "limitation", "limitations",
  "budget", "cost", "money", "funding",
  "deadline", "timeframe", "timeline", "schedule",
  "platform", "cross-platform", "mobile", "desktop",
  "browser", "ie11", "legacy", "compatibility",
  "must", "required", "requirement", "prerequisite",
  "team size", "solo", "alone", "small team",
];

function matchConstraints(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of CONSTRAINTS_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.12;
    }
  }

  if (score >= 0.24) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Integrations matcher ───────────────────────

const INTEGRATIONS_KEYWORDS = [
  "integration", "integrate", "integrations",
  "api", "rest api", "graphql api", "webhook",
  "third-party", "third party", "external",
  "slack", "discord", "teams", "zoom",
  "stripe", "paypal", "payment", "billing",
  "github", "gitlab", "bitbucket", "jira",
  "auth0", "okta", "keycloak", "sso",
  "sendgrid", "twilio", "mailchimp",
];

function matchIntegrations(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  const found: string[] = [];
  let score = 0;

  for (const kw of INTEGRATIONS_KEYWORDS) {
    if (lower.includes(kw)) {
      found.push(kw);
      score += 0.12;
    }
  }

  if (score >= 0.24) {
    return { value: found, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Risks matcher ──────────────────────────────

const RISKS_KEYWORDS = [
  "risk", "risks", "concern", "concerns", "worry", "worries",
  "uncertain", "uncertainty", "unknown", "unknowns",
  "challenging", "difficult", "complex", "complicated",
  "might not", "could fail", "potential issue",
  "technical debt", "scalability", "performance",
  "vendor lock-in", "dependency", "dependencies",
];

function matchRisks(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of RISKS_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.12;
    }
  }

  if (score >= 0.24) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── MVP Scope matcher ──────────────────────────

const MVP_KEYWORDS = [
  "mvp", "minimum viable", "first version", "v1", "version 1",
  "initial release", "beta", "prototype", "poc",
  "core feature", "essential", "must-have", "must have",
  "scope", "phases", "phase 1", "phase one",
  "launch", "ship", "release",
];

function matchMvp(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of MVP_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.15;
    }
  }

  if (score >= 0.3) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── AI Workflow matcher ────────────────────────

const AI_WORKFLOW_KEYWORDS = [
  "cline", "cursor", "claude", "copilot", "codeium",
  "ai coding", "ai assistant", "ai workflow",
  "vibecode", "vibe coding", "agent",
];

function matchAiWorkflow(text: string): MatchResult | null {
  const lower = text.toLowerCase();
  let score = 0;

  for (const kw of AI_WORKFLOW_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 0.2;
    }
  }

  if (score >= 0.2) {
    return { value: text, confidence: Math.min(score, 1) };
  }

  return null;
}

// ── Matcher registry ───────────────────────────
// Maps requirementField name → matcher function

interface FieldMatcherEntry {
  field: string;
  matcher: FieldMatcher;
}

const FIELD_MATCHERS: FieldMatcherEntry[] = [
  { field: "vision", matcher: matchVision },
  { field: "targetUsers", matcher: matchTargetUsers },
  { field: "problems", matcher: matchProblems },
  { field: "goals", matcher: matchGoals },
  { field: "solutionIdeas", matcher: matchSolution },
  { field: "mvpScope", matcher: matchMvp },
  { field: "preferredTech", matcher: matchTechStack },
  { field: "integrations", matcher: matchIntegrations },
  { field: "constraints", matcher: matchConstraints },
  { field: "risks", matcher: matchRisks },
  { field: "aiWorkflowTarget", matcher: matchAiWorkflow },
];

// Additional safety/privacy field (not in INTERVIEW_TOPICS yet)
const SAFETY_FIELD = "safetyPrivacy";

// ── Main extraction function ───────────────────

/**
 * Extract all requirement fields from a conversation memory.
 *
 * Scans ALL user messages (not just memory.questions[]) to find
 * requirement-relevant content. Each message is checked against
 * all field matchers. Results are aggregated per field.
 *
 * @param memory - The conversation memory to scan
 * @returns ExtractionResult with all found fields
 */
export function extractRequirements(
  memory: ConversationMemory,
): ExtractionResult {
  const fields: ExtractedFields = {};
  const allFieldNames = [
    ...FIELD_MATCHERS.map((e) => e.field),
    SAFETY_FIELD,
  ];

  // Initialize all fields as empty
  for (const fieldName of allFieldNames) {
    fields[fieldName] = {
      value: "",
      confidence: 0,
      sources: [],
    };
  }

  // Collect all user messages (both from messages[] and questions[])
  const userMessages: string[] = [];

  // From messages array
  for (const msg of memory.messages) {
    if (msg.role === "user" && msg.content.trim().length > 0) {
      userMessages.push(msg.content.trim());
    }
  }

  // From questions array (answers)
  for (const q of memory.questions) {
    if (!q.skipped && q.answer.trim().length > 0) {
      userMessages.push(q.answer.trim());
    }
  }

  // Also check the initialContext if stored in messages
  // (already covered by messages loop above)

  // Run each message through all matchers
  for (const msg of userMessages) {
    // Check each field matcher
    for (const entry of FIELD_MATCHERS) {
      const result = entry.matcher(msg);
      if (result && result.confidence > fields[entry.field].confidence) {
        fields[entry.field] = {
          value: result.value,
          confidence: result.confidence,
          sources: [...fields[entry.field].sources, msg.slice(0, 100)],
        };
      }
    }

    // Also check for safety/privacy (special field)
    const safetyResult = matchSafety(msg);
    if (safetyResult && safetyResult.confidence > fields[SAFETY_FIELD].confidence) {
      fields[SAFETY_FIELD] = {
        value: safetyResult.value,
        confidence: safetyResult.confidence,
        sources: [...fields[SAFETY_FIELD].sources, msg.slice(0, 100)],
      };
    }
  }

  // Determine missing vs filled fields
  const missingFields: string[] = [];
  const filledFields: string[] = [];

  for (const fieldName of allFieldNames) {
    const f = fields[fieldName];
    const isEmpty = typeof f.value === "string"
      ? f.value.trim().length === 0
      : f.value.length === 0;

    if (isEmpty || f.confidence < CONFIDENCE_THRESHOLD) {
      missingFields.push(fieldName);
    } else {
      filledFields.push(fieldName);
    }
  }

  return { fields, missingFields, filledFields };
}

/**
 * Check if a specific requirement field has been sufficiently extracted.
 *
 * @param memory - The conversation memory
 * @param fieldName - The requirementField name to check
 * @returns True if the field has sufficient confidence
 */
export function isFieldExtracted(
  memory: ConversationMemory,
  fieldName: string,
): boolean {
  const result = extractRequirements(memory);
  return result.filledFields.includes(fieldName);
}

/**
 * Get the best extracted value for a field.
 *
 * @param memory - The conversation memory
 * @param fieldName - The requirementField name
 * @returns The extracted value, or null if not found
 */
export function getExtractedValue(
  memory: ConversationMemory,
  fieldName: string,
): string | string[] | null {
  const result = extractRequirements(memory);
  const field = result.fields[fieldName];
  if (!field) return null;

  const isEmpty = typeof field.value === "string"
    ? field.value.trim().length === 0
    : field.value.length === 0;

  if (isEmpty || field.confidence < CONFIDENCE_THRESHOLD) return null;

  return field.value;
}

/**
 * Get a human-readable summary of what was extracted.
 *
 * @param memory - The conversation memory
 * @returns A formatted summary string
 */
export function summarizeExtraction(memory: ConversationMemory): string {
  const result = extractRequirements(memory);
  const lines: string[] = [];

  lines.push("=== Requirement Extraction Summary ===");
  lines.push(`Filled fields (${result.filledFields.length}): ${result.filledFields.join(", ") || "none"}`);
  lines.push(`Missing fields (${result.missingFields.length}): ${result.missingFields.join(", ") || "none"}`);
  lines.push("");

  for (const fieldName of result.filledFields) {
    const f = result.fields[fieldName];
    const val = typeof f.value === "string"
      ? f.value.slice(0, 80)
      : f.value.join(", ").slice(0, 80);
    lines.push(`  ${fieldName}: [${(f.confidence * 100).toFixed(0)}%] "${val}"`);
  }

  return lines.join("\n");
}
