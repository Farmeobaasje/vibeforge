// ──────────────────────────────────────────────
// ArchitectAgent — Epic 24.2
// Stateless "analysis layer" between the project
// requirements and the LLM.
//
// The Architect Agent:
// - Takes ProjectRequirements (and optionally
//   ConversationMemory and/or existing
//   ArchitectureAnalysis)
// - Wraps them in a structured LLM prompt using
//   the architect system prompt
// - Sends it via the Orchestrator/Gateway
// - Parses and normalises the JSON response into
//   a complete ArchitectureAnalysis
//
// It holds NO state — all state lives in the
// models layer.
// ──────────────────────────────────────────────

import type { Orchestrator } from "../../orchestrator";
import type { ChatMessage } from "../gateway";
import type { ArchitectureAnalysis, RiskImpact, RiskLikelihood, RiskStatus, RecommendationPriority, EffortLevel } from "../../models/architectureAnalysis";
import {
  createEmptyArchitectureAnalysis,
} from "../../models/architectureAnalysis";
import {
  SYSTEM_PROMPT,
  buildArchitectPrompt,
} from "./architectPrompts";
import type {
  ArchitectInput,
  ArchitectAgentResult,
  ArchitectAgentConfig,
} from "./architectTypes";

// ── Default config ────────────────────────────

const DEFAULT_CONFIG: Required<ArchitectAgentConfig> = {
  systemPrompt: SYSTEM_PROMPT,
  temperature: 0.3,
  maxTokens: 4096,
  structuredOutput: true,
};

// ── JSON extraction helpers ───────────────────

/**
 * Extract JSON from an LLM response that may contain
 * markdown fences, preamble text, or trailing commentary.
 *
 * @param content - The raw LLM response text
 * @returns The extracted JSON string, or the original if no fences found
 */
function extractJsonFromResponse(content: string): string {
  let cleaned = content.trim();

  // Try to find a JSON code block first (most common with markdown-wrapping models)
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find a JSON object directly (starts with {)
  const objectMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    return objectMatch[1].trim();
  }

  return cleaned;
}

/**
 * Safely parse a JSON string into an object.
 *
 * @param json - The JSON string to parse
 * @returns The parsed object, or null if parsing failed
 */
function safeJsonParse(json: string): Record<string, unknown> | null {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── Normalisation helpers ─────────────────────

/**
 * Normalise a raw parsed object into a valid ArchitectureAnalysis.
 * Fills any missing fields with defaults so the app never breaks.
 *
 * @param raw - The raw parsed object from the LLM
 * @returns A complete, valid ArchitectureAnalysis
 */
function normaliseAnalysis(raw: Record<string, unknown>): ArchitectureAnalysis {
  const now = new Date().toISOString();
  const defaults = createEmptyArchitectureAnalysis();

  // Helper to get a string field with fallback
  const str = (val: unknown, fallback: string): string =>
    typeof val === "string" ? val : fallback;

  // Helper to get a number field with fallback
  const num = (val: unknown, fallback: number): number =>
    typeof val === "number" ? val : fallback;

  // Helper to get a string array with fallback
  const strArr = (val: unknown, fallback: string[]): string[] =>
    Array.isArray(val) ? val.filter((v): v is string => typeof v === "string") : fallback;

  // Helper to get an object with fallback
  const obj = (val: unknown, fallback: Record<string, unknown>): Record<string, unknown> =>
    typeof val === "object" && val !== null && !Array.isArray(val)
      ? (val as Record<string, unknown>)
      : fallback;

  // ── Executive Summary ──
  const executiveSummary = str(raw.executiveSummary, defaults.executiveSummary);
  let overallScore = Math.max(0, Math.min(100, num(raw.overallScore, defaults.overallScore)));

  // ── Sanity check: if executiveSummary says requirements are sparse/empty,
  //     force score and confidence low regardless of what LLM returned ──
  //     NOTE: This check is intentionally broad to catch LLMs that hallucinate
  //     "sparse requirements" even when enriched data is present. The
  //     buildArchitectPrompt() now includes an explicit instruction NOT to treat
  //     the project as sparse when the Resolved Project Definition has data.
  //     If the LLM still says "sparse" despite populated enriched data, we
  //     still apply the cap — but the prompt fix should prevent this.
  const summaryLower = executiveSummary.toLowerCase();
  const sparseIndicators = [
    "requirements are sparse",
    "requirements are incomplete",
    "requirements are empty",
    "requirements are limited",
    "requirements are minimal",
    "requirements are vague",
    "requirements are not provided",
    "requirements are not specified",
    "no requirements provided",
    "no requirements specified",
    "very limited information",
    "very limited requirements",
    "insufficient information",
    "insufficient requirements",
    "sparse requirements",
    "empty requirements",
    "limited information provided",
    "no information provided",
    "not enough information",
    "not enough requirements",
    "cannot perform a full analysis",
    "cannot provide a complete analysis",
    "best-effort analysis",
    "default empty analysis",
  ];
  const hasSparseIndicator = sparseIndicators.some((indicator) => summaryLower.includes(indicator));
  if (hasSparseIndicator) {
    // Cap score at 30 when requirements are clearly sparse
    overallScore = Math.min(overallScore, 30);
  }

  // ── Confidence (with same sanity check) ──
  let confidence = Math.max(0, Math.min(100, num(raw.confidence, defaults.confidence)));
  if (hasSparseIndicator) {
    // Cap confidence at 30 when requirements are clearly sparse
    confidence = Math.min(confidence, 30);
  }

  // ── Functional Analysis ──
  const rawFunctional = obj(raw.functionalAnalysis, {});
  const functionalAnalysis = {
    coreFeatures: strArr(rawFunctional.coreFeatures, defaults.functionalAnalysis.coreFeatures),
    userFlows: strArr(rawFunctional.userFlows, defaults.functionalAnalysis.userFlows),
    edgeCases: strArr(rawFunctional.edgeCases, defaults.functionalAnalysis.edgeCases),
    scalabilityConcerns: strArr(rawFunctional.scalabilityConcerns, defaults.functionalAnalysis.scalabilityConcerns),
  };

  // ── Technical Analysis ──
  const rawTechnical = obj(raw.technicalAnalysis, {});
  const technicalAnalysis = {
    architecturePattern: str(rawTechnical.architecturePattern, defaults.technicalAnalysis.architecturePattern),
    dataModel: str(rawTechnical.dataModel, defaults.technicalAnalysis.dataModel),
    apiDesign: str(rawTechnical.apiDesign, defaults.technicalAnalysis.apiDesign),
    security: str(rawTechnical.security, defaults.technicalAnalysis.security),
    performance: str(rawTechnical.performance, defaults.technicalAnalysis.performance),
    deployment: str(rawTechnical.deployment, defaults.technicalAnalysis.deployment),
  };

  // ── Risks ──
  const rawRisks = Array.isArray(raw.risks) ? raw.risks : [];
  const risks = rawRisks.map((r: unknown, i: number) => {
    const risk = typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {};
    const impactVal = str(risk.impact, "medium");
    const likelihoodVal = str(risk.likelihood, "medium");
    const statusVal = str(risk.status, "open");
    return {
      id: str(risk.id, `risk-${i + 1}`),
      category: str(risk.category, "general"),
      description: str(risk.description, ""),
      impact: (["low", "medium", "high", "critical"].includes(impactVal) ? impactVal : "medium") as RiskImpact,
      likelihood: (["low", "medium", "high"].includes(likelihoodVal) ? likelihoodVal : "medium") as RiskLikelihood,
      mitigation: str(risk.mitigation, ""),
      status: (["open", "mitigated", "accepted"].includes(statusVal) ? statusVal : "open") as RiskStatus,
    };
  });

  // ── Recommendations ──
  const rawRecs = Array.isArray(raw.recommendations) ? raw.recommendations : [];
  const recommendations = rawRecs.map((r: unknown, i: number) => {
    const rec = typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {};
    const priorityVal = str(rec.priority, "recommended");
    const effortVal = str(rec.effort, "medium");
    return {
      id: str(rec.id, `rec-${i + 1}`),
      category: str(rec.category, "general"),
      priority: (["essential", "recommended", "optional"].includes(priorityVal) ? priorityVal : "recommended") as RecommendationPriority,
      description: str(rec.description, ""),
      rationale: str(rec.rationale, ""),
      effort: (["low", "medium", "high"].includes(effortVal) ? effortVal : "medium") as EffortLevel,
    };
  });

  // ── Trade-offs ──
  const rawTradeoffs = Array.isArray(raw.tradeoffs) ? raw.tradeoffs : [];
  const tradeoffs = rawTradeoffs.map((t: unknown, i: number) => {
    const trade = typeof t === "object" && t !== null ? (t as Record<string, unknown>) : {};
    const chosenVal = str(trade.chosen, "neither");
    return {
      id: str(trade.id, `tradeoff-${i + 1}`),
      decision: str(trade.decision, ""),
      optionA: str(trade.optionA, ""),
      optionB: str(trade.optionB, ""),
      chosen: (["a", "b", "neither"].includes(chosenVal) ? chosenVal : "neither") as "a" | "b" | "neither",
      rationale: str(trade.rationale, ""),
    };
  });

  // ── Unknowns ──
  const unknowns = strArr(raw.unknowns, defaults.unknowns);

  // ── Suggested Stack ──
  const rawStack = obj(raw.suggestedStack, {});
  const suggestedStack = {
    frontend: str(rawStack.frontend, defaults.suggestedStack.frontend),
    backend: str(rawStack.backend, defaults.suggestedStack.backend),
    database: str(rawStack.database, defaults.suggestedStack.database),
    infrastructure: str(rawStack.infrastructure, defaults.suggestedStack.infrastructure),
    ai: str(rawStack.ai, defaults.suggestedStack.ai),
    testing: str(rawStack.testing, defaults.suggestedStack.testing),
    monitoring: str(rawStack.monitoring, defaults.suggestedStack.monitoring),
  };

  // ── Suggested Architecture ──
  const suggestedArchitecture = str(raw.suggestedArchitecture, defaults.suggestedArchitecture);

  // ── Complexity & Timeline ──
  const validComplexities = ["low", "medium", "high", "very-high"];
  const estimatedComplexity = validComplexities.includes(str(raw.estimatedComplexity, ""))
    ? (raw.estimatedComplexity as string)
    : defaults.estimatedComplexity;

  const estimatedTimeline = str(raw.estimatedTimeline, defaults.estimatedTimeline);

  return {
    id: defaults.id,
    createdAt: defaults.createdAt,
    updatedAt: now,
    executiveSummary,
    overallScore,
    functionalAnalysis,
    technicalAnalysis,
    risks,
    recommendations,
    tradeoffs,
    unknowns,
    suggestedStack,
    suggestedArchitecture,
    estimatedComplexity: estimatedComplexity as ArchitectureAnalysis["estimatedComplexity"],
    estimatedTimeline,
    confidence,
  };
}

// ── Architect Agent ───────────────────────────

/**
 * ArchitectAgent — analyses project requirements via the LLM
 * and returns a structured ArchitectureAnalysis.
 *
 * This is a stateless "analysis layer" that:
 * 1. Takes ProjectRequirements (and optional context)
 * 2. Builds an LLM context with the architect system prompt
 * 3. Sends it via the Orchestrator
 * 4. Parses and normalises the JSON response
 *
 * @example
 * ```typescript
 * const agent = new ArchitectAgent(orchestrator);
 * const result = await agent.analyze({
 *   requirements: projectRequirements,
 *   memory: conversationMemory,
 * });
 * ```
 */
export class ArchitectAgent {
  private orchestrator: Orchestrator;
  private config: Required<ArchitectAgentConfig>;

  constructor(
    orchestrator: Orchestrator,
    config: ArchitectAgentConfig = {},
  ) {
    this.orchestrator = orchestrator;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the current agent configuration.
   */
  getConfig(): Required<ArchitectAgentConfig> {
    return { ...this.config };
  }

  /**
   * Update the agent configuration.
   */
  updateConfig(config: Partial<ArchitectAgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Analyse project requirements and produce an ArchitectureAnalysis.
   *
   * @param input - The architect input (requirements + optional context)
   * @returns The agent result with the parsed and normalised analysis
   */
  async analyze(input: ArchitectInput): Promise<ArchitectAgentResult> {
    try {
      // ── Step 1: Build context ──
      const messages = this.buildContext(input);

      // ── Step 2: Send to LLM via orchestrator ──
      const result = await this.orchestrator.generate(messages, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        structuredOutput: this.config.structuredOutput,
      });

      // ── Step 3: Extract and parse JSON ──
      const jsonStr = extractJsonFromResponse(result.content);
      const parsed = safeJsonParse(jsonStr);

      if (!parsed) {
        // JSON parsing failed — return a best-effort analysis with low score
        const fallback = createEmptyArchitectureAnalysis();
        fallback.executiveSummary =
          "The LLM response could not be parsed as valid JSON. " +
          "A default empty analysis is provided. Please try again or check the LLM output.";
        fallback.unknowns = [
          "The architectural analysis could not be completed due to a parsing error.",
          "Review the raw LLM output and retry the analysis.",
        ];
        fallback.confidence = 0;

        return {
          analysis: fallback,
          messages,
          success: true,
          error: "Failed to parse LLM response as JSON. A fallback analysis was provided.",
        };
      }

      // ── Step 4: Normalise ──
      const analysis = normaliseAnalysis(parsed);

      return {
        analysis,
        messages,
        success: true,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during architecture analysis";

      // Return a best-effort analysis rather than failing hard
      const fallback = createEmptyArchitectureAnalysis();
      fallback.executiveSummary =
        "The architecture analysis could not be completed due to a technical error. " +
        "A default empty analysis is provided.";
      fallback.unknowns = [
        "The architectural analysis could not be completed.",
        `Error: ${errorMessage}`,
        "Check your API configuration and try again.",
      ];
      fallback.confidence = 0;

      return {
        analysis: fallback,
        messages: [],
        success: true,
        error: errorMessage,
      };
    }
  }

  /**
   * Re-analyse project requirements, taking an existing analysis
   * into account for delta updates.
   *
   * Convenience wrapper around analyze().
   *
   * @param input - The architect input (must include existingAnalysis)
   * @returns The agent result with the updated analysis
   */
  async reAnalyze(input: ArchitectInput): Promise<ArchitectAgentResult> {
    return this.analyze(input);
  }

  // ── Private helpers ─────────────────────────

  /**
   * Build the LLM context (messages array) from the architect input.
   *
   * @param input - The architect input
   * @returns An array of ChatMessages ready to send to the LLM
   */
  private buildContext(input: ArchitectInput): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // ── System prompt ──
    messages.push({
      role: "system",
      content: this.config.systemPrompt,
    });

    // ── User message with requirements + context ──
    const userContent = buildArchitectPrompt(
      input.requirements,
      input.memory,
      input.existingAnalysis,
      input.latestUserMessage,
      input.enrichedDefinition,
    );

    messages.push({
      role: "user",
      content: userContent,
    });

    return messages;
  }
}

// ── Factory function ──────────────────────────

/**
 * Create a new ArchitectAgent instance.
 *
 * @param orchestrator - The orchestrator to use for LLM calls
 * @param config - Optional configuration
 * @returns A new ArchitectAgent
 */
export function createArchitectAgent(
  orchestrator: Orchestrator,
  config?: ArchitectAgentConfig,
): ArchitectAgent {
  return new ArchitectAgent(orchestrator, config);
}
