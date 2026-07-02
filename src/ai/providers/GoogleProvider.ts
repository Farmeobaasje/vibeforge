// ──────────────────────────────────────────────
// GoogleProvider — Epic 16
// Provider adapter for Google Gemini API.
// Uses the Gemini API at
// https://generativelanguage.googleapis.com/v1beta.
// Supports Gemini 2.5 Pro and other Gemini models.
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";
import { generateProjectDefinitionPrompt } from "../../lib/aiPromptTemplate";

/**
 * Google provider — direct access to Gemini models
 * via the official Google AI API.
 *
 * API docs: https://ai.google.dev/api
 */
export const GoogleProvider: AIProvider = {
  config: {
    id: "google",
    label: "Google (Gemini 2.5 Pro)",
    requiresApiKey: true,
    apiKeyPlaceholder: "AIza...",
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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || [])
        .filter((m: { name: string }) => m.name.includes("gemini"))
        .map((m: { name: string; displayName?: string }) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName || m.name,
        }));
    } catch {
      return [];
    }
  },

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    if (!apiKey) return { success: false, message: "No API key provided.", latencyMs: 0 };
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) return { success: true, message: "Connected to Google Gemini.", latencyMs };
      return { success: false, message: `Google API error (${response.status})`, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, message: err instanceof Error ? err.message : "Connection failed", latencyMs };
    }
  },

  async generate(rawIdea: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error("Google API key is required.");
    }

    const systemPrompt = generateProjectDefinitionPrompt();

    // Gemini uses a different API structure than OpenAI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${rawIdea}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown error");
      throw new Error(`Google API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Google Gemini returned an empty response.");
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
