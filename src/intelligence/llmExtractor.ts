// ──────────────────────────────────────────────
// llmExtractor — AI Assist extraction
//
// Uses the AI Provider system to call an LLM for
// higher-quality extraction. Falls back to
// deterministic extraction if:
//   - No provider is configured
//   - No API key is available
//   - The LLM call fails
//   - The LLM output is invalid JSON
//
// The LLM outputs a StructuredRequirements JSON
// object which is then validated and normalized
// by the deterministic layer.
// ──────────────────────────────────────────────

import type { StructuredRequirements } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./llmPrompt";
import { extractRequirements } from "./requirementsIntelligence";
import { loadEndpoints, getApiKeyForEndpoint } from "../ai/settings";
import type { UserEndpoint } from "../ai/provider-config";

/**
 * Result of an LLM extraction attempt.
 */
export interface LlmExtractionResult {
  success: boolean;
  requirements?: StructuredRequirements;
  error?: string;
  usedFallback: boolean;
}

/**
 * Extract requirements using an LLM via the AI Provider system.
 *
 * Falls back to deterministic extraction if:
 *   - No providerId is given
 *   - No API key is available for the provider
 *   - The LLM call fails
 *   - The LLM output is invalid JSON
 *
 * @param rawText - The raw conversational text
 * @param providerId - The provider ID to use (e.g. "openai", "anthropic")
 * @returns An LlmExtractionResult with the extracted requirements
 */
export async function extractWithLlm(
  rawText: string,
  providerId?: string,
): Promise<LlmExtractionResult> {
  // If no provider specified, fall back to deterministic
  if (!providerId) {
    const requirements = extractRequirements(rawText);
    return {
      success: true,
      requirements,
      usedFallback: true,
    };
  }

  // Find the endpoint config for this provider
  const endpoints = loadEndpoints();
  const endpoint = endpoints.find(
    (e) => e.providerId === providerId || e.id === providerId,
  );

  if (!endpoint) {
    const requirements = extractRequirements(rawText);
    return {
      success: true,
      requirements,
      usedFallback: true,
      error: `Provider "${providerId}" not found in settings — used deterministic fallback`,
    };
  }

  // Get API key for this endpoint
  const apiKey = getApiKeyForEndpoint(endpoint);
  if (!apiKey && endpoint.requiresApiKey) {
    const requirements = extractRequirements(rawText);
    return {
      success: true,
      requirements,
      usedFallback: true,
      error: `No API key configured for "${endpoint.label}" — used deterministic fallback`,
    };
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(rawText);

    // Attempt LLM call via provider system
    const response = await callLlmViaProvider(systemPrompt, userPrompt, endpoint, apiKey ?? undefined);
    const parsed = parseLlmResponse(response);

    if (parsed) {
      // Validate and normalize the LLM output
      const validated = validateAndNormalize(parsed, rawText);
      return {
        success: true,
        requirements: validated,
        usedFallback: false,
      };
    }

    // LLM returned invalid JSON — fall back
    const fallback = extractRequirements(rawText);
    return {
      success: true,
      requirements: fallback,
      usedFallback: true,
      error: "LLM returned invalid JSON — used deterministic fallback",
    };
  } catch (err) {
    const fallback = extractRequirements(rawText);
    return {
      success: true,
      requirements: fallback,
      usedFallback: true,
      error: `LLM call failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Call the LLM API using the provider's endpoint configuration.
 * Supports OpenAI-compatible, Anthropic, and generic OpenAI-compatible APIs.
 */
async function callLlmViaProvider(
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
 * Parse the LLM response as JSON.
 * Handles both raw JSON and JSON within code fences.
 */
function parseLlmResponse(response: string): Partial<StructuredRequirements> | null {
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
 * Fills in missing fields with deterministic extraction results.
 */
function validateAndNormalize(
  parsed: Partial<StructuredRequirements>,
  rawText: string,
): StructuredRequirements {
  const fallback = extractRequirements(rawText);

  return {
    projectName: parsed.projectName || fallback.projectName,
    tagline: parsed.tagline || fallback.tagline,
    description: parsed.description || fallback.description,
    targetUsers: parsed.targetUsers?.length ? parsed.targetUsers : fallback.targetUsers,
    goals: parsed.goals?.length ? parsed.goals : fallback.goals,
    mvpFeatures: parsed.mvpFeatures?.length ? parsed.mvpFeatures : fallback.mvpFeatures,
    integrations: parsed.integrations?.length ? parsed.integrations : fallback.integrations,
    constraints: parsed.constraints?.length ? parsed.constraints : fallback.constraints,
    risks: parsed.risks?.length ? parsed.risks : fallback.risks,
    entities: parsed.entities?.length ? parsed.entities : fallback.entities,
    services: parsed.services?.length ? parsed.services : fallback.services,
    preferredTech: parsed.preferredTech?.length ? parsed.preferredTech : fallback.preferredTech,
    domain: parsed.domain || fallback.domain,
    projectType: parsed.projectType || fallback.projectType,
    language: parsed.language || fallback.language,
    componentTree: parsed.componentTree || fallback.componentTree,
    dataFlow: parsed.dataFlow || fallback.dataFlow,
    roadmap: parsed.roadmap?.length ? parsed.roadmap : fallback.roadmap,
    confidence: parsed.confidence || fallback.confidence,
    confidenceByField: parsed.confidenceByField || fallback.confidenceByField,
    warnings: parsed.warnings?.length ? parsed.warnings : fallback.warnings,
  };
}
