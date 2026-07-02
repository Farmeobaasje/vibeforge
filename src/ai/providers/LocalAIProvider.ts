// ──────────────────────────────────────────────
// LocalAIProvider — Epic 15
// Provider adapter for local AI endpoints
// (Ollama, LM Studio, LocalAI, etc.)
// Uses OpenAI-compatible chat completions API.
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";

/**
 * Local AI provider — works with any OpenAI-compatible
 * local endpoint (Ollama, LM Studio, LocalAI, etc.).
 *
 * The base URL and model are configured per-endpoint
 * in the provider-config system.
 */
export const LocalAIProvider: AIProvider = {
  config: {
    id: "local",
    label: "Local AI (OpenAI-compatible)",
    requiresApiKey: false,
    apiKeyPlaceholder: "Optional (most local servers don't need one)",
    capabilities: [
      "streaming",
      "function-calling",
      "json-schema",
      "structured-output",
      "tool-use",
    ],
  },

  async listModels(apiKey?: string): Promise<Array<{ id: string; name: string }>> {
    // Try to fetch models from the local endpoint
    // Note: this is a best-effort call since the base URL is dynamic
    try {
      const response = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          return data.models.map((m: { name: string }) => ({
            id: m.name,
            name: m.name,
          }));
        }
      }
    } catch {
      // Ollama not available, try LM Studio format
    }

    // Try LM Studio / OpenAI-compatible /v1/models
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const response = await fetch("http://localhost:1234/v1/models", {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m: { id: string }) => ({
            id: m.id,
            name: m.id,
          }));
        }
      }
    } catch {
      // Neither available
    }

    return [];
  },

  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();

    // Try Ollama first
    try {
      const response = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) {
        return { success: true, message: "Connected to Ollama.", latencyMs };
      }
    } catch {
      // Try LM Studio
    }

    // Try LM Studio
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const response = await fetch("http://localhost:1234/v1/models", {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) {
        return { success: true, message: "Connected to LM Studio.", latencyMs };
      }
      return { success: false, message: "No local AI server found.", latencyMs };
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, message: "No local AI server found. Start Ollama or LM Studio.", latencyMs };
    }
  },

  async generate(rawIdea: string, apiKey?: string): Promise<string> {
    // Try Ollama first
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: `You are a project definition generator. Convert the following raw project idea into a structured JSON object.

Rules:
- Output ONLY valid JSON, no markdown, no explanation
- Use the exact structure shown below
- Fill in all fields with realistic content based on the input
- If the input is vague, make reasonable assumptions

Required JSON structure:
{
  "project": {
    "name": "ProjectName",
    "tagline": "Short description",
    "version": "0.1.0",
    "description": "Full description",
    "status": "idea"
  },
  "product": {
    "targetUsers": ["user type"],
    "problemStatement": "The problem",
    "solution": "The solution",
    "userStories": ["story 1"],
    "mvpScope": "MVP scope"
  },
  "tech": {
    "languages": ["TypeScript"],
    "frameworks": ["React"],
    "tools": ["Git"],
    "dependencies": [],
    "constraints": []
  },
  "architecture": {
    "pattern": "Architecture pattern",
    "directoryStructure": "Directory layout",
    "componentTree": "Component hierarchy",
    "dataFlow": "Data flow description"
  },
  "roadmap": {
    "phases": [
      {
        "id": "phase-1",
        "title": "Foundation",
        "tasks": [
          { "id": "1.1", "title": "Setup", "status": "pending" }
        ]
      }
    ],
    "activePhaseId": "phase-1"
  },
  "memory": {
    "files": [
      { "path": "memory-bank/projectbrief.md", "description": "Core requirements", "required": true }
    ],
    "updateCadence": "After every session",
    "patterns": []
  },
  "agents": {
    "agents": [
      { "role": "orchestrator", "model": "gpt-4o", "promptTemplate": "Orchestrator prompt" }
    ]
  },
  "quality": {
    "codeStyle": "Style guide",
    "testingStrategy": "Testing approach",
    "validationRules": [],
    "fallbackBehavior": "Fallback description"
  },
  "options": {
    "compression": false,
    "orchestratorModel": "gpt-4o",
    "focusChain": true,
    "extraDocs": []
  }
}

Raw idea:
${rawIdea}`,
          stream: false,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          return stripFences(data.response);
        }
      }
    } catch {
      // Ollama failed, try LM Studio
    }

    // Try LM Studio (OpenAI-compatible)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "local-model",
        messages: [
          {
            role: "system",
            content: "You are a project definition generator. Convert raw project ideas into structured JSON. Output ONLY valid JSON, no markdown, no explanation.",
          },
          { role: "user", content: rawIdea },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown error");
      throw new Error(`Local AI error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Local AI returned an empty response.");
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
