// ──────────────────────────────────────────────
// DefaultGateway — Epic 2
// Concrete implementation of AIGateway.
// Translates gateway calls to provider-specific
// API calls. No business logic — only transport.
// ──────────────────────────────────────────────

import type {
  AIGateway,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  ModelInfo,
  ConnectionTestResult,
} from "./index";
import { GatewayError, type GatewayErrorCode } from "./index";
import type { EndpointConfig } from "../provider-config";
import type { ProviderId } from "../AIProvider";
import { getProvider } from "../AIService";

/**
 * Default gateway implementation.
 * Routes requests to the appropriate provider adapter
 * based on the endpoint's providerId.
 */
export const DefaultGateway: AIGateway = {
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const { endpoint, messages, apiKey } = options;

    try {
      // Build a prompt from messages (simple concatenation for now)
      const prompt = buildPromptFromMessages(messages);

      // Get the provider adapter
      const provider = getProvider(endpoint.providerId as ProviderId);

      // Call the provider
      const content = await provider.generate(prompt, apiKey);

      return {
        content,
        model: endpoint.model,
        streamed: false,
      };
    } catch (err) {
      throw translateError(err);
    }
  },

  async stream(
    options: GenerateOptions,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<GenerateResult> {
    // For now, fall back to non-streaming and emit the full result
    // Streaming support will be added per-provider in Epic 3
    const result = await DefaultGateway.generate(options);

    onChunk({
      delta: result.content,
      done: true,
    });

    return result;
  },

  async listModels(
    endpoint: EndpointConfig,
    _apiKey?: string,
  ): Promise<ModelInfo[]> {
    // For built-in endpoints, return the endpoint itself as the only model
    // Dynamic model listing (OpenRouter, Ollama, etc.) comes in Epics 15-16
    return [
      {
        id: endpoint.model,
        name: endpoint.label,
        providerId: endpoint.providerId,
        capabilities: [...endpoint.capabilities],
        contextWindow: endpoint.contextWindow ?? 4096,
        maxOutputTokens: endpoint.maxOutputTokens ?? 4096,
      },
    ];
  },

  async validateConnection(
    endpoint: EndpointConfig,
    apiKey?: string,
  ): Promise<ConnectionTestResult> {
    const startTime = performance.now();

    try {
      if (endpoint.isLocal) {
        // Local endpoints (mock) always succeed
        return {
          success: true,
          message: "Local endpoint is available.",
          latencyMs: 0,
        };
      }

      // Try a simple generation to test the connection
      await DefaultGateway.generate({
        endpoint,
        messages: [{ role: "user", content: "Respond with: ok" }],
        apiKey,
        maxTokens: 10,
      });

      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        message: `Connected successfully (${latencyMs}ms).`,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      const message =
        err instanceof Error ? err.message : "Unknown connection error";

      return {
        success: false,
        message,
        latencyMs,
      };
    }
  },
};

// ── Helpers ───────────────────────────────────

function buildPromptFromMessages(messages: GenerateOptions["messages"]): string {
  return messages
    .map((m) => {
      switch (m.role) {
        case "system":
          return `System: ${m.content}`;
        case "user":
          return `User: ${m.content}`;
        case "assistant":
          return `Assistant: ${m.content}`;
        default:
          return m.content;
      }
    })
    .join("\n\n");
}

function translateError(err: unknown): GatewayError {
  if (err instanceof GatewayError) return err;

  const message = err instanceof Error ? err.message : "Unknown error";

  // Try to detect common error patterns
  let code: GatewayErrorCode = "internal";
  let statusCode: number | undefined;

  if (message.includes("API key") || message.includes("401") || message.includes("unauthorized")) {
    code = "authentication";
    statusCode = 401;
  } else if (message.includes("429") || message.includes("rate limit")) {
    code = "rate-limited";
    statusCode = 429;
  } else if (message.includes("timeout") || message.includes("timed out")) {
    code = "timeout";
  } else if (message.includes("fetch") || message.includes("network") || message.includes("ENOTFOUND")) {
    code = "network";
  } else if (message.includes("context length") || message.includes("too many tokens")) {
    code = "context-too-long";
  } else if (message.includes("model") && (message.includes("not found") || message.includes("unavailable"))) {
    code = "model-unavailable";
  }

  return new GatewayError(message, code, statusCode);
}
