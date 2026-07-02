// ──────────────────────────────────────────────
// OpenRouterProvider — Epic 16
// Provider adapter for OpenRouter API gateway.
// Uses OpenAI-compatible chat completions API
// at https://openrouter.ai/api/v1.
// Supports model routing via the "model" field.
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";
import { generateProjectDefinitionPrompt } from "../../lib/aiPromptTemplate";

/**
 * OpenRouter provider — routes requests through
 * the OpenRouter API gateway to access many models
 * (OpenAI, Anthropic, Google, Meta, Mistral, etc.)
 * through a single endpoint.
 *
 * API docs: https://openrouter.ai/docs/api-reference
 */
export const OpenRouterProvider: AIProvider = {
  config: {
    id: "openrouter",
    label: "OpenRouter (multi-model gateway)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-v1-...",
    capabilities: [
      "streaming",
      "vision",
      "function-calling",
      "json-schema",
      "structured-output",
      "tool-use",
      "reasoning",
    ],
  },

  async listModels(apiKey?: string): Promise<Array<{ id: string; name: string }>> {
    if (!apiKey) return [];
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      // OpenRouter returns { data: [{ id, name, ... }] }
      return (data.data || []).slice(0, 100).map((m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name || m.id,
      }));
    } catch {
      return [];
    }
  },

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    if (!apiKey) return { success: false, message: "No API key provided.", latencyMs: 0 };
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) return { success: true, message: "Connected to OpenRouter.", latencyMs };
      return { success: false, message: `OpenRouter error (${response.status})`, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, message: err instanceof Error ? err.message : "Connection failed", latencyMs };
    }
  },

  async generate(rawIdea: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required.");
    }

    const systemPrompt = generateProjectDefinitionPrompt();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter recommends these headers for identification
        "HTTP-Referer": "https://vibeforge.app",
        "X-Title": "VibeForge",
      },
      body: JSON.stringify({
        // Default model — users can override via endpoint config
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawIdea },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown error");
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();
    const content: string | undefined =
      data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter returned an empty response.");
    }

    // Strip markdown fences if the model wrapped the JSON
    return stripFences(content);
  },
};

/** Remove markdown code fences if present */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
