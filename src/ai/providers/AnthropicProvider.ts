// ──────────────────────────────────────────────
// AnthropicProvider — Phase 6.2
// Roept Anthropic Messages API aan met
// de bestaande prompt + ruwe input.
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";
import { generateProjectDefinitionPrompt } from "../../lib/aiPromptTemplate";

export const AnthropicProvider: AIProvider = {
  config: {
    id: "anthropic",
    label: "Anthropic (Claude Sonnet 4)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-ant-...",
    capabilities: [
      "streaming",
      "thinking",
      "vision",
      "tool-use",
      "json-schema",
      "structured-output",
      "reasoning",
    ],
  },

  async listModels(_apiKey?: string): Promise<Array<{ id: string; name: string }>> {
    // Anthropic doesn't have a public model listing endpoint
    // Return known models
    return [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
      { id: "claude-haiku-4-20250514", name: "Claude Haiku 4" },
    ];
  },

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    if (!apiKey) return { success: false, message: "No API key provided.", latencyMs: 0 };
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role: "user", content: "ok" }],
        }),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) return { success: true, message: "Connected to Anthropic.", latencyMs };
      return { success: false, message: `Anthropic error (${response.status})`, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, message: err instanceof Error ? err.message : "Connection failed", latencyMs };
    }
  },

  async generate(rawIdea: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error("Anthropic API key is required.");
    }

    const systemPrompt = generateProjectDefinitionPrompt();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system: systemPrompt,
        messages: [
          { role: "user", content: rawIdea },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown error");
      throw new Error(
        `Anthropic API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();
    const content: string | undefined =
      data?.content?.[0]?.text;

    if (!content) {
      throw new Error("Anthropic returned an empty response.");
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
