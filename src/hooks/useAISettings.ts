// ──────────────────────────────────────────────
// useAISettings — Epic 14
// React hook for AI settings management.
// Provides stateful access to endpoints, API keys,
// and connection testing.
// ──────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import type { UserEndpoint } from "../ai/provider-config";
import { DefaultGateway } from "../ai/gateway/DefaultGateway";
import {
  loadEndpoints,
  saveEndpoints,
  loadActiveEndpointId,
  saveActiveEndpointId,
  getApiKey,
  getApiKeyForEndpoint,
  saveApiKey,
  removeApiKey,
  resetEndpoints,
} from "../ai/settings";

export interface UseAISettingsReturn {
  /** All configured endpoints */
  endpoints: UserEndpoint[];
  /** The active endpoint ID */
  activeEndpointId: string;
  /** Get the active endpoint object */
  getActiveEndpoint: () => UserEndpoint | undefined;
  /** Set the active endpoint by ID */
  setActiveEndpoint: (id: string) => void;
  /** Toggle endpoint enabled/disabled */
  toggleEndpoint: (id: string) => void;
  /** Add a custom endpoint */
  addEndpoint: (endpoint: UserEndpoint) => void;
  /** Remove an endpoint */
  removeEndpoint: (id: string) => void;
  /** Update an endpoint's configuration */
  updateEndpoint: (id: string, updates: Partial<UserEndpoint>) => void;
  /** Reset to built-in defaults */
  resetToDefaults: () => void;
  /** Get the stored API key for an endpoint */
  getEndpointApiKey: (id: string) => string | null;
  /** Set the API key for an endpoint */
  setEndpointApiKey: (id: string, key: string) => void;
  /** Remove the API key for an endpoint */
  removeEndpointApiKey: (id: string) => void;
  /** Test a connection to an endpoint */
  testConnection: (id: string) => Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }>;
  /** Connection test state */
  testingId: string | null;
  /** Connection test results keyed by endpoint ID */
  testResults: Record<string, { success: boolean; message: string; latencyMs?: number }>;
}

export function useAISettings(): UseAISettingsReturn {
  const [endpoints, setEndpoints] = useState<UserEndpoint[]>(loadEndpoints);
  const [activeEndpointId, setActiveEndpointIdState] = useState<string>(loadActiveEndpointId);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string; latencyMs?: number }>
  >({});

  // Persist endpoints whenever they change
  useEffect(() => {
    saveEndpoints(endpoints);
  }, [endpoints]);

  const setActiveEndpoint = useCallback(
    (id: string) => {
      setActiveEndpointIdState(id);
      saveActiveEndpointId(id);
    },
    [],
  );

  const getActiveEndpoint = useCallback(
    () => endpoints.find((e) => e.id === activeEndpointId),
    [endpoints, activeEndpointId],
  );

  const toggleEndpoint = useCallback((id: string) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)),
    );
  }, []);

  const addEndpoint = useCallback((endpoint: UserEndpoint) => {
    setEndpoints((prev) => [...prev, endpoint]);
  }, []);

  const removeEndpoint = useCallback((id: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
    // Also clean up the API key
    removeApiKey(id);
  }, []);

  const updateEndpoint = useCallback(
    (id: string, updates: Partial<UserEndpoint>) => {
      setEndpoints((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [],
  );

  const resetToDefaults = useCallback(() => {
    const defaults = resetEndpoints();
    setEndpoints(defaults);
    setActiveEndpointIdState("anthropic-claude-sonnet-4");
    saveActiveEndpointId("anthropic-claude-sonnet-4");
  }, []);

  const getEndpointApiKey = useCallback((id: string) => {
    const key = getApiKey(id);
    if (import.meta.env.DEV) {
      console.log(`[useAISettings] getEndpointApiKey("${id}") → ${key ? "found" : "null"}`);
    }
    return key;
  }, []);

  const setEndpointApiKey = useCallback((id: string, key: string) => {
    if (import.meta.env.DEV) {
      console.log(`[useAISettings] setEndpointApiKey("${id}", len=${key.length})`);
    }
    saveApiKey(id, key);
    // Verify immediately
    const saved = getApiKey(id);
    if (import.meta.env.DEV) {
      console.log(`[useAISettings] verify after save → getApiKey("${id}") ${saved ? "exists" : "MISSING!"}`);
    }
  }, []);

  const removeEndpointApiKey = useCallback((id: string) => {
    removeApiKey(id);
  }, []);

  const testConnection = useCallback(
    async (id: string) => {
      const endpoint = endpoints.find((e) => e.id === id);
      if (!endpoint) {
        return { success: false, message: `Unknown endpoint: ${id}` };
      }

      setTestingId(id);
      try {
        // Use the unified helper: tries providerId first, then endpoint.id
        const apiKey = getApiKeyForEndpoint(endpoint) ?? undefined;
        if (import.meta.env.DEV) {
          console.log(`[useAISettings] testConnection("${id}"): providerId="${endpoint.providerId}", apiKey=${apiKey ? "found" : "null"}`);
        }
        const result = await DefaultGateway.validateConnection(endpoint, apiKey);
        setTestResults((prev) => ({ ...prev, [id]: result }));
        return result;
      } catch (err) {
        const result = {
          success: false,
          message: err instanceof Error ? err.message : "Connection test failed",
        };
        setTestResults((prev) => ({ ...prev, [id]: result }));
        return result;
      } finally {
        setTestingId(null);
      }
    },
    [endpoints],
  );

  return {
    endpoints,
    activeEndpointId,
    getActiveEndpoint,
    setActiveEndpoint,
    toggleEndpoint,
    addEndpoint,
    removeEndpoint,
    updateEndpoint,
    resetToDefaults,
    getEndpointApiKey,
    setEndpointApiKey,
    removeEndpointApiKey,
    testConnection,
    testingId,
    testResults,
  };
}
