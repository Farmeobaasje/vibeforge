// ──────────────────────────────────────────────
// AISettings — Epic 14
// Persistent settings for AI endpoints, API keys,
// and user preferences. All stored in localStorage.
// ──────────────────────────────────────────────

import type { UserEndpoint } from "./provider-config";
import { getDefaultUserEndpoints } from "./provider-config";

// ── Storage keys ──────────────────────────────

const ENDPOINTS_KEY = "vibeforge-ai-endpoints";
const API_KEYS_KEY = "vibeforge-ai-api-keys";
const ACTIVE_ENDPOINT_KEY = "vibeforge-ai-active-endpoint";
const AI_ASSIST_MODE_KEY = "vibeforge-ai-assist-mode";

// ── Types ─────────────────────────────────────

export type AiAssistMode = "off" | "hybrid";

export interface AISettings {
  /** User-configured endpoints */
  endpoints: UserEndpoint[];
  /** Active endpoint ID */
  activeEndpointId: string;
  /** AI Assist mode: off = deterministic only, hybrid = AI + deterministic fallback */
  aiAssistMode: AiAssistMode;
}

// ── API Key storage (separate from endpoints for security) ──

/**
 * Store an API key for a given endpoint.
 * Keys are stored in localStorage — this is a local-only MVP.
 * In production, consider using a more secure storage mechanism.
 */
export function saveApiKey(endpointId: string, apiKey: string): void {
  try {
    const raw = localStorage.getItem(API_KEYS_KEY);
    const keys: Record<string, string> = raw ? JSON.parse(raw) : {};
    keys[endpointId] = apiKey;
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
    if (import.meta.env.DEV) {
      console.log(`[settings] saveApiKey("${endpointId}") → saved (${maskKey(apiKey)})`);
    }
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Retrieve an API key for a given endpoint.
 */
export function getApiKey(endpointId: string): string | null {
  try {
    const raw = localStorage.getItem(API_KEYS_KEY);
    if (!raw) return null;
    const keys: Record<string, string> = JSON.parse(raw);
    return keys[endpointId] ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the API key for an endpoint, trying providerId first, then endpoint.id.
 * This is the single helper to use everywhere.
 */
export function getApiKeyForEndpoint(endpoint: { providerId: string; id: string }): string | null {
  const key = getApiKey(endpoint.providerId) ?? getApiKey(endpoint.id);
  if (import.meta.env.DEV) {
    console.log(`[settings] getApiKeyForEndpoint("${endpoint.id}") → ${key ? "found" : "null"}`);
  }
  return key;
}

/**
 * Remove an API key for a given endpoint.
 */
export function removeApiKey(endpointId: string): void {
  try {
    const raw = localStorage.getItem(API_KEYS_KEY);
    if (!raw) return;
    const keys: Record<string, string> = JSON.parse(raw);
    delete keys[endpointId];
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
  } catch {
    // fail silently
  }
}

/**
 * Get all stored API key IDs (not the keys themselves).
 */
export function getStoredApiKeyIds(): string[] {
  try {
    const raw = localStorage.getItem(API_KEYS_KEY);
    if (!raw) return [];
    return Object.keys(JSON.parse(raw));
  } catch {
    return [];
  }
}

// ── Endpoint storage ──────────────────────────

/**
 * Load user endpoints from localStorage.
 * Falls back to built-in defaults.
 */
export function loadEndpoints(): UserEndpoint[] {
  try {
    const raw = localStorage.getItem(ENDPOINTS_KEY);
    if (!raw) return getDefaultUserEndpoints();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getDefaultUserEndpoints();
    }
    return parsed as UserEndpoint[];
  } catch {
    return getDefaultUserEndpoints();
  }
}

/**
 * Save user endpoints to localStorage.
 */
export function saveEndpoints(endpoints: UserEndpoint[]): void {
  try {
    localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(endpoints));
  } catch {
    // fail silently
  }
}

/**
 * Reset endpoints to built-in defaults.
 */
export function resetEndpoints(): UserEndpoint[] {
  const defaults = getDefaultUserEndpoints();
  saveEndpoints(defaults);
  return defaults;
}

// ── Active endpoint ───────────────────────────

/**
 * Load the active endpoint ID from localStorage.
 */
export function loadActiveEndpointId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_ENDPOINT_KEY);
    if (id) return id;
  } catch {
    // fall through to default
  }
  return "anthropic-claude-sonnet-4";
}

/**
 * Save the active endpoint ID to localStorage.
 */
export function saveActiveEndpointId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_ENDPOINT_KEY, id);
  } catch {
    // fail silently
  }
}

// ── AI Assist mode ────────────────────────────

/**
 * Load the AI Assist mode from localStorage.
 * Defaults to "off" (deterministic only).
 */
export function loadAiAssistMode(): AiAssistMode {
  try {
    const mode = localStorage.getItem(AI_ASSIST_MODE_KEY);
    if (mode === "off" || mode === "hybrid") return mode;
  } catch {
    // fall through to default
  }
  return "off";
}

/**
 * Save the AI Assist mode to localStorage.
 */
export function saveAiAssistMode(mode: AiAssistMode): void {
  try {
    localStorage.setItem(AI_ASSIST_MODE_KEY, mode);
  } catch {
    // fail silently
  }
}

// ── Composite operations ──────────────────────

/**
 * Load all AI settings from localStorage.
 */
export function loadAISettings(): AISettings {
  return {
    endpoints: loadEndpoints(),
    activeEndpointId: loadActiveEndpointId(),
    aiAssistMode: loadAiAssistMode(),
  };
}

/**
 * Save all AI settings to localStorage.
 */
export function saveAISettings(settings: AISettings): void {
  saveEndpoints(settings.endpoints);
  saveActiveEndpointId(settings.activeEndpointId);
  saveAiAssistMode(settings.aiAssistMode);
}

// ── Helpers ───────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}
