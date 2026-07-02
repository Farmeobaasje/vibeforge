// ──────────────────────────────────────────────
// canonical/llmExtractor — LLM-first extraction
//
// PRIMARY extraction path. Uses the AI Provider
// system to call an LLM for high-quality
// canonical extraction.
//
// Falls back to deterministic extraction if:
//   - No provider is configured
//   - No API key is available
//   - The LLM call fails
//   - The LLM output is invalid JSON
//   - LLM confidence is below threshold
//
// The LLM outputs a CanonicalExtractionResult
// JSON object which is validated and normalized.
// ──────────────────────────────────────────────

import type { CanonicalExtractionResult, ExtractionSource } from "./types";
import { buildCanonicalSystemPrompt, buildCanonicalUserPrompt } from "./llmPrompt";
import { extractDeterministic } from "./deterministicExtractor";
import { validateExtraction } from "./validator";
import { loadEndpoints, getApiKeyForEndpoint } from "../ai/settings";
import type { UserEndpoint } from "../ai/provider-config";

/**
 * Result of a canonical LLM extraction attempt.
 */
export interface CanonicalLlmResult {
  success: boolean;
  result?: CanonicalExtractionResult;
  error?: string;
  usedFallback: boolean;
}

/**
 * Minimum confidence threshold for LLM extraction to be accepted.
 * If overall confidence is below this, fall back to deterministic.
 */
const MIN_CONFIDENCE_THRESHOLD = 40;

/**
 * Extract canonical project information using an LLM.
 *
 * PRIMARY path. Falls back to deterministic extraction if
 * the LLM is unavailable or produces low-quality output.
 *
 * @param rawText - The raw conversational text
 * @param providerId - The provider ID to use (e.g. "openai", "anthropic")
 * @param preferredTech - Optional array of explicitly mentioned tech from ProjectRequirements
 * @returns A CanonicalLlmResult with the extracted result
 */
export async function extractCanonicalWithLlm(
  rawText: string,
  providerId?: string,
  preferredTech?: string[],
): Promise<CanonicalLlmResult> {
  // If no provider specified, fall back to deterministic
  if (!providerId) {
    const result = extractDeterministic(rawText, preferredTech);
    return {
      success: true,
      result,
      usedFallback: true,
    };
  }

  // Find the endpoint config for this provider
  const endpoints = loadEndpoints();
  const endpoint = endpoints.find(
    (e) => e.providerId === providerId || e.id === providerId,
  );

  if (!endpoint) {
    const result = extractDeterministic(rawText, preferredTech);
    return {
      success: true,
      result,
      usedFallback: true,
      error: `Provider "${providerId}" not found in settings — used deterministic fallback`,
    };
  }

  // Get API key for this endpoint
  const apiKey = getApiKeyForEndpoint(endpoint);
  if (!apiKey && endpoint.requiresApiKey) {
    const result = extractDeterministic(rawText, preferredTech);
    return {
      success: true,
      result,
      usedFallback: true,
      error: `No API key configured for "${endpoint.label}" — used deterministic fallback`,
    };
  }

  try {
    const systemPrompt = buildCanonicalSystemPrompt();
    const userPrompt = buildCanonicalUserPrompt(rawText);

    // Attempt LLM call via provider system
    const response = await callLlmForCanonical(systemPrompt, userPrompt, endpoint, apiKey ?? undefined);
    const parsed = parseCanonicalResponse(response);

    if (parsed) {
      // Validate the LLM output
      const validated = validateCanonicalResult(parsed, rawText);

      // Check confidence threshold
      if (validated.overallConfidence >= MIN_CONFIDENCE_THRESHOLD) {
        return {
          success: true,
          result: validated,
          usedFallback: false,
        };
      }

      // LLM confidence too low — fall back
      const fallback = extractDeterministic(rawText, preferredTech);
      return {
        success: true,
        result: {
          ...fallback,
          warnings: [
            ...fallback.warnings,
            `LLM confidence (${validated.overallConfidence}) below threshold (${MIN_CONFIDENCE_THRESHOLD}) — used deterministic fallback`,
          ],
        },
        usedFallback: true,
        error: `LLM confidence too low (${validated.overallConfidence}) — used deterministic fallback`,
      };
    }

    // LLM returned invalid JSON — fall back
    const fallback = extractDeterministic(rawText, preferredTech);
    return {
      success: true,
      result: fallback,
      usedFallback: true,
      error: "LLM returned invalid JSON — used deterministic fallback",
    };
  } catch (err) {
    const fallback = extractDeterministic(rawText, preferredTech);
    return {
      success: true,
      result: fallback,
      usedFallback: true,
      error: `LLM call failed: ${err instanceof Error ? err.message : String(err)}`,
    };

  }
}

/**
 * Call the LLM API using the provider's endpoint configuration.
 * Supports OpenAI-compatible, Anthropic, and generic OpenAI-compatible APIs.
 */
async function callLlmForCanonical(
  systemPrompt: string,
  userPrompt: string,
  endpoint: UserEndpoint,
  apiKey?: string,
): Promise<string> {
  const baseUrl = endpoint.baseUrlOverride || endpoint.baseUrl;
  const model = endpoint.model;

  switch (endpoint.providerId) {
    case "anthropic": {
      // Anthropic Messages API
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          max_tokens: 4096,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown error");
        throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const content: string | undefined = data?.content?.[0]?.text;
      if (!content) throw new Error("Anthropic returned an empty response.");
      return stripFences(content);
    }

    default: {
      // OpenAI-compatible API (OpenAI, DeepSeek, Google, OpenRouter, LocalAI, etc.)
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown error");
        throw new Error(`LLM API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned an empty response.");
      return stripFences(content);
    }
  }
}

/** Remove markdown code fences if present */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Parse the LLM response as a CanonicalExtractionResult.
 * Handles both raw JSON and JSON within code fences.
 */
function parseCanonicalResponse(response: string): Partial<CanonicalExtractionResult> | null {
  const trimmed = response.trim();

  // Try direct JSON parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try extracting from code fences
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Validate and normalize LLM output.
 * Fills in missing fields with sensible defaults.
 * Ensures all required fields are present.
 *
 * v0.6: LLM-first domain extraction.
 * - If LLM provides domainLabel with confidence > 70, it WINS.
 * - templateId is optional — NOT forced from deterministic fallback.
 * - domain.id is slugified from domainLabel when possible.
 * - Deterministic fallback is only used for EMPTY fields, not to override LLM.
 *
 * Then runs the result through the deterministic validator
 * for hallucination checking, cross-document consistency, etc.
 */
function validateCanonicalResult(
  parsed: Partial<CanonicalExtractionResult>,
  rawText: string,
): CanonicalExtractionResult {
  const fallback = extractDeterministic(rawText);

  // Helper: pick LLM value or fallback (only for empty/missing fields)
  const orFallback = <T>(llmVal: T | undefined | null, fbVal: T): T =>
    llmVal !== undefined && llmVal !== null ? llmVal : fbVal;

  // ── LLM-first domain extraction ─────────────
  // If LLM provides domainLabel with confidence > 70, it WINS.
  // templateId is optional — NOT forced from deterministic fallback.
  // domain.id is slugified from domainLabel when possible.
  //
  // FALLBACK DOMINANCE FIX (v0.7):
  // If LLM provides ANY domainLabel AND the deterministic fallback
  // is a broad/generic template (ai-saas, ai-saas/support-platform,
  // generic, website), let LLM win regardless of confidence.
  // This prevents broad keyword matching from overwriting correct
  // LLM domain labels like "aerospace digital twin".
  const llmDomainLabel = parsed.identity?.domainLabel;
  const llmDomainCategory = parsed.identity?.domainCategory;
  const llmDomainConfidence = parsed.identity?.domain?.confidence ?? 0;
  const llmHasStrongDomain = llmDomainLabel && llmDomainLabel.trim().length > 0 && llmDomainConfidence > 70;

  // Broad templates that should not override a valid LLM domainLabel
  const BROAD_TEMPLATES = new Set([
    "ai-saas",
    "ai-saas/support-platform",
    "generic",
    "website",
  ]);

  const llmHasAnyDomain = llmDomainLabel && llmDomainLabel.trim().length > 0;
  const fallbackIsBroad = BROAD_TEMPLATES.has(fallback.identity.templateId);

  let domainId: string;
  let domainLabel: string;
  let domainCategory: string;
  let templateId: string;

  if (llmHasStrongDomain) {
    // LLM-first: use LLM's domainLabel, slugify domain.id from it
    domainLabel = llmDomainLabel.trim();
    domainCategory = llmDomainCategory?.trim() || fallback.identity.domainCategory;
    domainId = parsed.identity?.domain?.id?.trim()
      || slugifyDomainLabel(domainLabel)
      || fallback.identity.domain.id;
    // templateId is OPTIONAL — only use if LLM explicitly provided it
    templateId = parsed.identity?.templateId?.trim() || "";
  } else if (llmHasAnyDomain && fallbackIsBroad) {
    // FALLBACK DOMINANCE FIX: LLM has a domainLabel but low confidence,
    // and deterministic fallback is a broad template. LLM wins.
    domainLabel = llmDomainLabel.trim();
    domainCategory = llmDomainCategory?.trim() || fallback.identity.domainCategory;
    domainId = parsed.identity?.domain?.id?.trim()
      || slugifyDomainLabel(domainLabel)
      || fallback.identity.domain.id;
    templateId = parsed.identity?.templateId?.trim() || "";
  } else {
    // Fallback: use deterministic extraction
    domainLabel = orFallback(llmDomainLabel, fallback.identity.domainLabel);
    domainCategory = orFallback(llmDomainCategory, fallback.identity.domainCategory);
    domainId = orFallback(parsed.identity?.domain?.id, fallback.identity.domain.id);
    templateId = orFallback(parsed.identity?.templateId, fallback.identity.templateId);
  }


  // Build identity with LLM-first domain
  const llmDomainWins = llmHasStrongDomain || (llmHasAnyDomain && fallbackIsBroad);
  const identity = {
    projectName: orFallback(parsed.identity?.projectName, fallback.identity.projectName),
    domainLabel,
    domainCategory,
    domain: {
      id: domainId,
      scores: orFallback(parsed.identity?.domain?.scores, fallback.identity.domain.scores),
      evidence: orFallback(parsed.identity?.domain?.evidence, fallback.identity.domain.evidence),
      confidence: llmDomainWins
        ? Math.max(llmDomainConfidence, orFallback(parsed.identity?.domain?.confidence, fallback.identity.domain.confidence))
        : orFallback(parsed.identity?.domain?.confidence, fallback.identity.domain.confidence),
      source: llmDomainWins ? "llm" : (parsed.identity?.domain?.source || fallback.identity.domain.source),
    },

    projectType: orFallback(parsed.identity?.projectType, fallback.identity.projectType),
    category: orFallback(parsed.identity?.category, fallback.identity.category),
    templateId,
    tagline: parsed.identity?.tagline, // preserve LLM tagline if provided
    confidence: orFallback(parsed.identity?.confidence, fallback.identity.confidence),
    source: "llm" as ExtractionSource,
  };

  const source: ExtractionSource = "llm";


  // Build the full result
  const result: CanonicalExtractionResult = {
    identity,
    users: {
      personas: orFallback(parsed.users?.personas, fallback.users.personas),
      source,
      confidence: orFallback(parsed.users?.confidence, fallback.users.confidence),
    },
    mvpFeatures: {
      features: orFallback(parsed.mvpFeatures?.features, fallback.mvpFeatures.features),
      source,
      confidence: orFallback(parsed.mvpFeatures?.confidence, fallback.mvpFeatures.confidence),
    },
    techStack: {
      items: orFallback(parsed.techStack?.items, fallback.techStack.items),
      source,
      confidence: orFallback(parsed.techStack?.confidence, fallback.techStack.confidence),
    },
    architecture: {
      pattern: orFallback(parsed.architecture?.pattern, fallback.architecture.pattern),
      componentTree: orFallback(parsed.architecture?.componentTree, fallback.architecture.componentTree),
      dataFlow: orFallback(parsed.architecture?.dataFlow, fallback.architecture.dataFlow),
      confidence: orFallback(parsed.architecture?.confidence, fallback.architecture.confidence),
      source,
    },
    roadmap: {
      phases: orFallback(parsed.roadmap?.phases, fallback.roadmap.phases),
      source,
      confidence: orFallback(parsed.roadmap?.confidence, fallback.roadmap.confidence),
    },
    integrations: {
      items: orFallback(parsed.integrations?.items, fallback.integrations.items),
      source,
      confidence: orFallback(parsed.integrations?.confidence, fallback.integrations.confidence),
    },
    constraints: {
      items: orFallback(parsed.constraints?.items, fallback.constraints.items),
      source,
      confidence: orFallback(parsed.constraints?.confidence, fallback.constraints.confidence),
    },
    goals: {
      items: orFallback(parsed.goals?.items, fallback.goals.items),
      source,
      confidence: orFallback(parsed.goals?.confidence, fallback.goals.confidence),
    },
    risks: {
      items: orFallback(parsed.risks?.items, fallback.risks.items),
      source,
      confidence: orFallback(parsed.risks?.confidence, fallback.risks.confidence),
    },
    entities: {
      items: orFallback(parsed.entities?.items, fallback.entities.items),
      source,
      confidence: orFallback(parsed.entities?.confidence, fallback.entities.confidence),
    },
    overallConfidence: orFallback(parsed.overallConfidence, fallback.overallConfidence),
    confidenceByField: orFallback(parsed.confidenceByField, fallback.confidenceByField),
    warnings: orFallback(parsed.warnings, fallback.warnings),
    source,
  };

  // Run through the deterministic validator for hallucination checking,
  // cross-document consistency, normalization, and deduplication
  const validationResult = validateExtraction(result, rawText);
  return validationResult.result;
}

/**
 * Slugify a domain label into a machine-readable ID.
 * "Warehouse Orchestration Platform" → "warehouse-orchestration-platform"
 * "Carbon Accounting for Enterprises" → "carbon-accounting"
 */
function slugifyDomainLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")          // spaces to hyphens
    .replace(/-+/g, "-")           // collapse multiple hyphens
    .replace(/^-|-$/g, "")         // trim leading/trailing hyphens
    .trim();
}
