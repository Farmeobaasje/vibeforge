// ──────────────────────────────────────────────
// OpenAIProvider — Phase 6.2
// Roept OpenAI Chat Completions API aan met
// de bestaande prompt + ruwe input.
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";
import { generateProjectDefinitionPrompt } from "../../lib/aiPromptTemplate";

export const OpenAIProvider: AIProvider = {
  config: {
    id: "openai",
    label: "OpenAI (GPT-4o)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    capabilities: [
      "streaming",
      "vision",
      "function-calling",
      "structured-output",
      "json-schema",
      "tool-use",
      "reasoning",
      "web-search",
    ],
  },

  async listModels(apiKey?: string): Promise<Array<{ id: string; name: string }>> {
    if (!apiKey) return [];
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.data || []).slice(0, 50).map((m: { id: string }) => ({
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
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) return { success: true, message: "Connected to OpenAI.", latencyMs };
      return { success: false, message: `OpenAI error (${response.status})`, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, message: err instanceof Error ? err.message : "Connection failed", latencyMs };
    }
  },

  async generate(rawIdea: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error("OpenAI API key is required.");
    }

    const systemPrompt = generateProjectDefinitionPrompt();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
        `OpenAI API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();
    const content: string | undefined =
      data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned an empty response.");
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
