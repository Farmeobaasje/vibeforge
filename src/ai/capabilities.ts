// ──────────────────────────────────────────────
// AICapability — Epic 5
// Capability system for AI providers
// Every provider declares what it can do.
// The UI uses this to enable/disable functionality.
// ──────────────────────────────────────────────

/**
 * Every capability an AI provider may support.
 * Add new capabilities here as the ecosystem grows.
 */
export type AICapability =
  | "streaming"
  | "thinking"
  | "vision"
  | "function-calling"
  | "json-schema"
  | "structured-output"
  | "tool-use"
  | "mcp"
  | "images"
  | "reasoning"
  | "web-search";

/** Human-readable metadata for a capability */
export interface CapabilityInfo {
  id: AICapability;
  label: string;
  description: string;
}

/** Registry of all known capabilities with metadata */
export const CAPABILITY_REGISTRY: Record<AICapability, CapabilityInfo> = {
  streaming: {
    id: "streaming",
    label: "Streaming",
    description: "Supports token-by-token streaming responses",
  },
  thinking: {
    id: "thinking",
    label: "Thinking",
    description: "Supports extended thinking / chain-of-thought",
  },
  vision: {
    id: "vision",
    label: "Vision",
    description: "Can process images as input",
  },
  "function-calling": {
    id: "function-calling",
    label: "Function Calling",
    description: "Can call external functions/tools",
  },
  "json-schema": {
    id: "json-schema",
    label: "JSON Schema",
    description: "Accepts JSON Schema for output validation",
  },
  "structured-output": {
    id: "structured-output",
    label: "Structured Output",
    description: "Guarantees structured JSON responses",
  },
  "tool-use": {
    id: "tool-use",
    label: "Tool Use",
    description: "Can use tools defined by the application",
  },
  mcp: {
    id: "mcp",
    label: "MCP",
    description: "Supports Model Context Protocol",
  },
  images: {
    id: "images",
    label: "Images",
    description: "Can generate images",
  },
  reasoning: {
    id: "reasoning",
    label: "Reasoning",
    description: "Supports deep reasoning / step-by-step analysis",
  },
  "web-search": {
    id: "web-search",
    label: "Web Search",
    description: "Can search the web for up-to-date information",
  },
};

/** All known capability IDs as a readonly array */
export const ALL_CAPABILITIES: readonly AICapability[] = Object.keys(
  CAPABILITY_REGISTRY,
) as AICapability[];

/**
 * Check if a set of capabilities includes a specific capability.
 */
export function hasCapability(
  capabilities: AICapability[],
  capability: AICapability,
): boolean {
  return capabilities.includes(capability);
}

/**
 * Filter capabilities to only those that are known.
 * Useful when parsing provider declarations from config.
 */
export function filterKnownCapabilities(
  capabilities: string[],
): AICapability[] {
  const known = new Set<AICapability>(ALL_CAPABILITIES);
  return capabilities.filter((c): c is AICapability => known.has(c as AICapability));
}
