// ──────────────────────────────────────────────
// AIGateway — Epic 2
// Single interface between the orchestrator and
// all AI providers. The gateway knows nothing
// about roadmaps, interviews, or bootstrap logic.
// It only translates requests to providers.
// ──────────────────────────────────────────────

import type { AICapability } from "../capabilities";
import type { EndpointConfig } from "../provider-config";

// ── Types ─────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  /** The endpoint to use */
  endpoint: EndpointConfig;
  /** Messages to send */
  messages: ChatMessage[];
  /** API key (if required) */
  apiKey?: string;
  /** Temperature (0-1) */
  temperature?: number;
  /** Max output tokens */
  maxTokens?: number;
  /** Request a JSON structured output */
  structuredOutput?: boolean;
  /** Signal for aborting the request */
  signal?: AbortSignal;
}

export interface GenerateResult {
  /** The generated text content */
  content: string;
  /** The model that was used */
  model: string;
  /** Optional token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Whether the response was streamed */
  streamed: boolean;
}

export interface StreamChunk {
  /** The text delta for this chunk */
  delta: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Optional accumulated usage info (only on final chunk) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  capabilities: AICapability[];
  contextWindow: number;
  maxOutputTokens: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  models?: ModelInfo[];
}

// ── Gateway Interface ─────────────────────────

export interface AIGateway {
  /**
   * Generate a complete response from the given messages.
   */
  generate(options: GenerateOptions): Promise<GenerateResult>;

  /**
   * Stream a response chunk by chunk.
   * Calls onChunk for each chunk as it arrives.
   */
  stream(
    options: GenerateOptions,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<GenerateResult>;

  /**
   * List available models for a given endpoint.
   */
  listModels(endpoint: EndpointConfig, apiKey?: string): Promise<ModelInfo[]>;

  /**
   * Test whether a connection to an endpoint works.
   */
  validateConnection(
    endpoint: EndpointConfig,
    apiKey?: string,
  ): Promise<ConnectionTestResult>;
}

// ── Error types ───────────────────────────────

export class GatewayError extends Error {
  readonly code: GatewayErrorCode;
  readonly statusCode?: number;

  constructor(
    message: string,
    code: GatewayErrorCode,
    statusCode?: number,
  ) {
    super(message);
    this.name = "GatewayError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export type GatewayErrorCode =
  | "authentication"
  | "rate-limited"
  | "timeout"
  | "invalid-request"
  | "model-unavailable"
  | "context-too-long"
  | "internal"
  | "network";
