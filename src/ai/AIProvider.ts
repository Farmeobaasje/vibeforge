// ──────────────────────────────────────────────
// AIProvider — Phase 6.2 / Epic 5
// Types & interface voor AI providers
// Elke provider declareert zijn capabilities.
//
// Architecture: Endpoint → Provider → Model
// ProviderId is the transport/adapter type, not the model family.
// ──────────────────────────────────────────────

import type { AICapability } from "./capabilities";

export type ProviderId = "mock" | "openai" | "anthropic" | "google" | "deepseek" | "local" | "openrouter";

export interface AIProviderConfig {
  /** Human-readable label */
  label: string;
  /** Unique identifier */
  id: ProviderId;
  /** Whether this provider requires an API key */
  requiresApiKey: boolean;
  /** Placeholder text for the API key input */
  apiKeyPlaceholder?: string;
  /** Capabilities this provider supports */
  capabilities: AICapability[];
}

export interface AIProvider {
  /** Provider metadata */
  config: AIProviderConfig;
  /**
   * Generate a ProjectDefinition JSON string from raw input.
   * Returns the raw JSON string — caller is responsible for parsing.
   */
  generate(rawIdea: string, apiKey?: string): Promise<string>;

  /**
   * List available models for this provider.
   * Returns basic model info. May be empty if dynamic listing is unsupported.
   */
  listModels?(apiKey?: string): Promise<Array<{ id: string; name: string }>>;

  /**
   * Test whether the provider connection works.
   * Returns success status with optional latency.
   */
  testConnection?(apiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }>;
}

/** Built-in provider configurations */
export const PROVIDER_CONFIGS: AIProviderConfig[] = [
  {
    id: "mock",
    label: "Mock (offline, no key needed)",
    requiresApiKey: false,
    capabilities: ["streaming"],
  },
  {
    id: "openai",
    label: "OpenAI (GPT-4o)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    capabilities: [
      "streaming", "vision", "function-calling", "structured-output",
      "json-schema", "tool-use", "reasoning", "web-search",
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude Sonnet 4)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-ant-...",
    capabilities: [
      "streaming", "thinking", "vision", "tool-use",
      "json-schema", "structured-output", "reasoning",
    ],
  },
  {
    id: "google",
    label: "Google (Gemini 2.5 Pro)",
    requiresApiKey: true,
    apiKeyPlaceholder: "AIza...",
    capabilities: [
      "streaming", "vision", "function-calling",
      "json-schema", "structured-output", "tool-use", "reasoning",
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek (V3 / R1)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use", "reasoning",
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter (multi-model gateway)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-v1-...",
    capabilities: [
      "streaming", "vision", "function-calling", "json-schema",
      "structured-output", "tool-use", "reasoning",
    ],
  },
];
