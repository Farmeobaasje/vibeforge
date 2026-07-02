// ──────────────────────────────────────────────
// ProviderConfig — Epic 4 (refactored)
// Provider configuration model
//
// Architecture: Endpoint → Provider → Model
//
// - EndpointType: "official" | "gateway" | "local"
// - ModelProvider: the model family (openai, anthropic, deepseek, etc.)
// - ModelInfo: full model metadata including provider, capabilities, pricing
//
// This allows the same model (e.g. DeepSeek V3) to be available via
// multiple endpoints (official API, OpenRouter, Ollama, etc.)
// ──────────────────────────────────────────────

import type { AICapability } from "./capabilities";

// ── Provider categories for UI grouping ───────

export type ProviderCategory =
  | "frontier"
  | "coding"
  | "openrouter"
  | "local";

// ── Endpoint type ─────────────────────────────

export type EndpointType = "official" | "gateway" | "local";

// ── Model provider (the model family/creator) ──

export type ModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "meta"
  | "qwen"
  | "mistral"
  | "mock";

// ── Pricing tier (visual indicator) ───────────

export type PricingTier = "$" | "$$" | "$$$" | "$$$$";

// ── Model info (rich metadata) ────────────────

export interface ModelInfo {
  /** Model identifier (e.g. "gpt-4o", "deepseek-chat") */
  id: string;
  /** Human-readable name */
  name: string;
  /** The model family/provider */
  provider: ModelProvider;
  /** Optional sub-family (e.g. "V3", "R1", "Sonnet") */
  family?: string;
  /** Capabilities this model supports */
  capabilities: AICapability[];
  /** Context window size in tokens */
  contextWindow: number;
  /** Max output tokens */
  maxOutputTokens: number;
  /** Pricing tier for visual comparison */
  pricing: PricingTier;
  /** Whether this model is recommended for VibeForge users */
  recommended?: boolean;
  /** Short description of what this model excels at */
  tagline?: string;
}

// ── Endpoint config ───────────────────────────

/**
 * A single AI endpoint configuration.
 * One endpoint (e.g. OpenRouter) can serve many models
 * from different providers (OpenAI, Anthropic, DeepSeek, etc.)
 */
export interface EndpointConfig {
  /** Unique identifier for this endpoint */
  id: string;
  /** Human-readable label */
  label: string;
  /** The type of endpoint */
  endpointType: EndpointType;
  /** The provider family (openai, anthropic, etc.) */
  providerId: string;
  /** The model name (e.g. "gpt-4o", "claude-sonnet-4-20250514") */
  model: string;
  /** The API base URL */
  baseUrl: string;
  /** Capabilities this endpoint supports */
  capabilities: AICapability[];
  /** Whether this endpoint requires an API key */
  requiresApiKey: boolean;
  /** Placeholder for the API key input field */
  apiKeyPlaceholder?: string;
  /** Optional context window size in tokens */
  contextWindow?: number;
  /** Optional max output tokens */
  maxOutputTokens?: number;
  /** Whether this is a local endpoint (Ollama, LM Studio) */
  isLocal: boolean;
  /** UI category for grouping */
  category: ProviderCategory;
  /** Pricing tier indicator */
  pricing?: PricingTier;
  /** Rich model metadata (for OpenRouter dynamic models) */
  modelInfo?: ModelInfo;
}

// ── Built-in recommended models ───────────────

/**
 * Small curated list of recommended models for quick start.
 * Users can always add more via OpenRouter "Refresh Models".
 */
export const RECOMMENDED_MODELS: ModelInfo[] = [
  // ── Frontier ──────────────────────────────
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    family: "Sonnet",
    capabilities: ["streaming", "thinking", "vision", "tool-use", "json-schema", "structured-output", "reasoning"],
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    pricing: "$$$",
    recommended: true,
    tagline: "Best overall coding & reasoning",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    family: "GPT-4",
    capabilities: ["streaming", "vision", "function-calling", "structured-output", "json-schema", "tool-use", "reasoning", "web-search"],
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    pricing: "$$$",
    recommended: true,
    tagline: "Strong all-rounder with tool use",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    family: "Gemini",
    capabilities: ["streaming", "vision", "function-calling", "json-schema", "structured-output", "tool-use", "reasoning"],
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    pricing: "$$$",
    recommended: true,
    tagline: "Massive 1M context window",
  },
  // ── Coding ────────────────────────────────
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    family: "V3",
    capabilities: ["streaming", "function-calling", "json-schema", "structured-output", "tool-use", "reasoning"],
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    pricing: "$",
    recommended: true,
    tagline: "Best price/performance for coding",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    family: "R1",
    capabilities: ["streaming", "reasoning", "json-schema", "structured-output"],
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    pricing: "$",
    recommended: true,
    tagline: "Strong reasoning for complex problems",
  },
  {
    id: "qwen-coder",
    name: "Qwen Coder",
    provider: "qwen",
    family: "Qwen",
    capabilities: ["streaming", "function-calling", "json-schema", "structured-output", "tool-use"],
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    pricing: "$",
    recommended: false,
    tagline: "Open-weight coding specialist",
  },
  {
    id: "llama-4",
    name: "Llama 4",
    provider: "meta",
    family: "Llama",
    capabilities: ["streaming", "function-calling", "json-schema", "structured-output", "tool-use"],
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    pricing: "$",
    recommended: false,
    tagline: "Open-source general purpose",
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "mistral",
    family: "Mistral",
    capabilities: ["streaming", "function-calling", "json-schema", "structured-output", "tool-use", "reasoning"],
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    pricing: "$$",
    recommended: false,
    tagline: "Efficient European LLM",
  },
];

// ── Built-in endpoints ───────────────────────

/**
 * Built-in endpoint configurations grouped by category.
 * Uses a small curated list — the full OpenRouter catalog
 * is fetched dynamically via "Refresh Models".
 */
export const BUILTIN_ENDPOINTS: EndpointConfig[] = [
  // ── 🏆 Frontier Models ────────────────────
  {
    id: "openai-gpt-4o",
    label: "OpenAI GPT-4o",
    endpointType: "official",
    providerId: "openai",
    model: "gpt-4o",
    baseUrl: "https://api.openai.com/v1",
    capabilities: [
      "streaming", "vision", "function-calling", "structured-output",
      "json-schema", "tool-use", "reasoning", "web-search",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    isLocal: false,
    category: "frontier",
    pricing: "$$$",
  },
  {
    id: "anthropic-claude-sonnet-4",
    label: "Anthropic Claude Sonnet 4",
    endpointType: "official",
    providerId: "anthropic",
    model: "claude-sonnet-4-20250514",
    baseUrl: "https://api.anthropic.com/v1",
    capabilities: [
      "streaming", "thinking", "vision", "tool-use",
      "json-schema", "structured-output", "reasoning",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-ant-...",
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "frontier",
    pricing: "$$$",
  },
  {
    id: "google-gemini-pro",
    label: "Google Gemini 2.5 Pro",
    endpointType: "official",
    providerId: "google",
    model: "gemini-2.5-pro",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    capabilities: [
      "streaming", "vision", "function-calling",
      "json-schema", "structured-output", "tool-use", "reasoning",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "AIza...",
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "frontier",
    pricing: "$$$",
  },

  // ── 💻 Coding Models ──────────────────────
  {
    id: "deepseek-v3",
    label: "DeepSeek V3",
    endpointType: "official",
    providerId: "deepseek",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use", "reasoning",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "coding",
    pricing: "$",
  },
  {
    id: "deepseek-r1",
    label: "DeepSeek R1",
    endpointType: "official",
    providerId: "deepseek",
    model: "deepseek-reasoner",
    baseUrl: "https://api.deepseek.com/v1",
    capabilities: [
      "streaming", "reasoning", "json-schema", "structured-output",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "coding",
    pricing: "$",
  },
  {
    id: "qwen-coder",
    label: "Qwen Coder",
    endpointType: "official",
    providerId: "qwen",
    model: "qwen-coder",
    baseUrl: "https://api.qwen.ai/v1",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "coding",
    pricing: "$",
  },
  {
    id: "llama-4",
    label: "Llama 4",
    endpointType: "official",
    providerId: "meta",
    model: "llama-4",
    baseUrl: "https://api.meta.ai/v1",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "coding",
    pricing: "$",
  },
  {
    id: "mistral-large",
    label: "Mistral Large",
    endpointType: "official",
    providerId: "mistral",
    model: "mistral-large-latest",
    baseUrl: "https://api.mistral.ai/v1",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use", "reasoning",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "coding",
    pricing: "$$",
  },

  // ── 🌍 OpenRouter ─────────────────────────
  {
    id: "openrouter-auto",
    label: "OpenRouter Auto",
    endpointType: "gateway",
    providerId: "openrouter",
    model: "openrouter/auto",
    baseUrl: "https://openrouter.ai/api/v1",
    capabilities: [
      "streaming", "vision", "function-calling", "json-schema",
      "structured-output", "tool-use", "reasoning",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-v1-...",
    contextWindow: 200_000,
    maxOutputTokens: 16_384,
    isLocal: false,
    category: "openrouter",
    pricing: "$$",
  },
  {
    id: "openrouter-best",
    label: "OpenRouter Best",
    endpointType: "gateway",
    providerId: "openrouter",
    model: "openrouter/best",
    baseUrl: "https://openrouter.ai/api/v1",
    capabilities: [
      "streaming", "vision", "function-calling", "json-schema",
      "structured-output", "tool-use", "reasoning",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-v1-...",
    contextWindow: 200_000,
    maxOutputTokens: 16_384,
    isLocal: false,
    category: "openrouter",
    pricing: "$$$",
  },
  {
    id: "openrouter-cheapest",
    label: "OpenRouter Cheapest",
    endpointType: "gateway",
    providerId: "openrouter",
    model: "openrouter/cheapest",
    baseUrl: "https://openrouter.ai/api/v1",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-v1-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "openrouter",
    pricing: "$",
  },
  {
    id: "openrouter-fastest",
    label: "OpenRouter Fastest",
    endpointType: "gateway",
    providerId: "openrouter",
    model: "openrouter/fastest",
    baseUrl: "https://openrouter.ai/api/v1",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use",
    ],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-or-v1-...",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    isLocal: false,
    category: "openrouter",
    pricing: "$",
  },

  // ── 🏠 Local ──────────────────────────────
  {
    id: "ollama-local",
    label: "Ollama (local)",
    endpointType: "local",
    providerId: "local",
    model: "llama3.2",
    baseUrl: "http://localhost:11434",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use",
    ],
    requiresApiKey: false,
    contextWindow: 8_192,
    maxOutputTokens: 4_096,
    isLocal: true,
    category: "local",
    pricing: "$",
  },
  {
    id: "lm-studio-local",
    label: "LM Studio (local)",
    endpointType: "local",
    providerId: "local",
    model: "local-model",
    baseUrl: "http://localhost:1234",
    capabilities: [
      "streaming", "function-calling", "json-schema",
      "structured-output", "tool-use",
    ],
    requiresApiKey: false,
    contextWindow: 8_192,
    maxOutputTokens: 4_096,
    isLocal: true,
    category: "local",
    pricing: "$",
  },
  {
    id: "mock-local",
    label: "Mock (offline, no key needed)",
    endpointType: "local",
    providerId: "mock",
    model: "mock",
    baseUrl: "local",
    capabilities: ["streaming"],
    requiresApiKey: false,
    contextWindow: 4_096,
    maxOutputTokens: 4_096,
    isLocal: true,
    category: "local",
    pricing: "$",
  },
];

// ── User endpoint ─────────────────────────────

/**
 * User-defined endpoint configuration (stored in localStorage).
 * Extends EndpointConfig with user-specific fields.
 */
export interface UserEndpoint extends EndpointConfig {
  /** User-defined label override */
  userLabel?: string;
  /** Whether this endpoint is enabled */
  enabled: boolean;
  /** Optional user-defined base URL override */
  baseUrlOverride?: string;
}

/**
 * Create a default user endpoint from a built-in config.
 */
export function createUserEndpoint(builtin: EndpointConfig): UserEndpoint {
  return {
    ...builtin,
    enabled: true,
  };
}

/**
 * Get all default user endpoints.
 */
export function getDefaultUserEndpoints(): UserEndpoint[] {
  return BUILTIN_ENDPOINTS.map(createUserEndpoint);
}

// ── Helpers ───────────────────────────────────

/**
 * Get category display info.
 */
export const CATEGORY_INFO: Record<ProviderCategory, { label: string; icon: string }> = {
  frontier: { label: "Frontier Models", icon: "🏆" },
  coding: { label: "Coding Models", icon: "💻" },
  openrouter: { label: "OpenRouter", icon: "🌍" },
  local: { label: "Local", icon: "🏠" },
};

/**
 * Get pricing tier display.
 */
export function getPricingLabel(tier?: PricingTier): string {
  switch (tier) {
    case "$": return "Free / Cheap";
    case "$$": return "Moderate";
    case "$$$": return "Expensive";
    case "$$$$": return "Very expensive";
    default: return "Unknown";
  }
}

/**
 * Get model provider display color class.
 */
export function getProviderColor(provider: ModelProvider): string {
  const colors: Record<string, string> = {
    openai: "text-green-400 bg-green-900/30",
    anthropic: "text-orange-400 bg-orange-900/30",
    google: "text-blue-400 bg-blue-900/30",
    deepseek: "text-cyan-400 bg-cyan-900/30",
    meta: "text-purple-400 bg-purple-900/30",
    qwen: "text-yellow-400 bg-yellow-900/30",
    mistral: "text-pink-400 bg-pink-900/30",
    mock: "text-gray-400 bg-gray-800",
  };
  return colors[provider] ?? "text-gray-400 bg-gray-800";
}
