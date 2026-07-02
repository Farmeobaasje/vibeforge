// ──────────────────────────────────────────────
// DeepSeekProvider — Epic 16
// Provider adapter for DeepSeek API.
// Uses OpenAI-compatible chat completions API
// at https://api.deepseek.com/v1.
// Supports DeepSeek V3 (deepseek-chat) and
// DeepSeek R1 (deepseek-reasoner).
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";
import { generateProjectDefinitionPrompt } from "../../lib/aiPromptTemplate";

/**
 * DeepSeek provider — direct access to DeepSeek models
 * via their official API.
 *
 * API docs: https://api-docs.deepseek.com/
 */
export const DeepSeekProvider: AIProvider = {
  config: {
    id: "deepseek",
    label: "DeepSeek (V3 / R1)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    capabilities: [
      "streaming",
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
      const response = await fetch("https://api.deepseek.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.data || []).map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
      }));
    } catch {
      return [];
    }
  },

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    if (!apiKey) return { success: false, message: "No API key provided.", latencyMs: 0 };
    try {
      const response = await fetch("https://api.deepseek.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) return { success: true, message: "Connected to DeepSeek.", latencyMs };
      return { success: false, message: `DeepSeek error (${response.status})`, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, message: err instanceof Error ? err.message : "Connection failed", latencyMs };
    }
  },

  async generate(rawIdea: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error("DeepSeek API key is required.");
    }

    const systemPrompt = generateProjectDefinitionPrompt();

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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
      throw new Error(`DeepSeek API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek returned an empty response.");
    }

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
