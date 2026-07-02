// ──────────────────────────────────────────────
// Orchestrator — Epic 1 + Epic 22.4
// Project Orchestrator layer
// Manages workflow state, project lifecycle,
// conversation memory, validation, generation,
// provider selection, retries, and fallback.
// The orchestrator owns the workflow.
// It does NOT know provider SDKs.
// ──────────────────────────────────────────────

import type { AIGateway, GenerateOptions, GenerateResult } from "../ai/gateway";
import { DefaultGateway } from "../ai/gateway/DefaultGateway";
import type { UserEndpoint } from "../ai/provider-config";
import { getDefaultUserEndpoints } from "../ai/provider-config";
import { loadEndpoints, loadActiveEndpointId, getApiKeyForEndpoint } from "../ai/settings";
import type { AICapability } from "../ai/capabilities";

// ── Epic 22.4 — Conversation Engine re-exports ──

export type {
  InterviewPhase,
  InterviewState,
  StateTransition,
  InterviewAction,
} from "./interviewStateMachine";
export {
  createInitialInterviewState,
  interviewReducer,
  getNextTopic,
  DEFAULT_TOPIC_ORDER,
  confidenceToLevel,
  levelToConfidence,
} from "./interviewStateMachine";

export type {
  PlannedQuestion,
  PlannerInput,
  PlannerResult,
} from "./interviewPlanner";
export { planNextQuestion } from "./interviewPlanner";

export type {
  FollowUpQuestion,
  FollowUpInput,
} from "./followUpEngine";
export {
  generateFollowUp,
  hasExistingFollowUp,
  getLastUserMessage,
} from "./followUpEngine";

export type {
  AssumptionInput,
  AssumptionCheckResult,
} from "./assumptionManager";
export {
  checkDefaultAssumption,
  processAnswerAgainstAssumptions,
} from "./assumptionManager";

export type {
  CompletionBreakdown,
  CompletionInput,
} from "./completionScore";
export {
  calculateCompletion,
  completionLabel,
  progressBar,
} from "./completionScore";

export type {
  EngineResult,
  EngineConfig,
} from "./conversationEngine";
export {
  ConversationEngine,
  createConversationEngine,
} from "./conversationEngine";

export type {
  RequirementsBuildResult,
  RequirementsUpdate,
  MissingField,
  OpenQuestion,
  ConfidenceChange,
} from "./requirementsTypes";

export { buildRequirements } from "./requirementsBuilder";

// ── Epic 23.6A — RequirementExtractor + CompletionEvaluator ──

export type {
  ExtractedField,
  ExtractedFields,
  ExtractionResult,
} from "./requirementExtractor";
export {
  extractRequirements,
  isFieldExtracted,
  getExtractedValue,
  summarizeExtraction,
} from "./requirementExtractor";

export type {
  TopicCompletion,
  CompletionEvaluationResult,
} from "./completionEvaluator";
export {
  evaluateCompletion,
  getTopicCompletion,
  isTopicComplete,
  summarizeCompletion,
} from "./completionEvaluator";

// ── TopicValidator (rule-based completion) ──

export type {
  TopicValidation,
  ValidationResult,
} from "./topicValidator";
export {
  validateTopics,
  validateTopic,
  isTopicComplete as isTopicValidated,
  summarizeValidation,
} from "./topicValidator";

// ── Interview Topics (single source of truth) ──

export type { InterviewTopic } from "./interviewTopics";
export {
  INTERVIEW_TOPICS,
  getTopicById,
  getTopicByField,
  fieldToTopicId,
  topicIdToField,
  topicLabel,
  topicQuestion,
  topicPriority,
  getAllTopicIds,
  getAllRequirementFields,
  TOTAL_TOPICS,
  getRequiredInterviewTopics,
  getRequiredTopicIds,
  REQUIRED_TOPIC_COUNT,
} from "./interviewTopics";

// ── Workflow States ───────────────────────────

export type WorkflowState =
  | "idle"
  | "describing"
  | "interviewing"
  | "reviewing"
  | "generating"
  | "exporting"
  | "error";

export interface WorkflowStatus {
  state: WorkflowState;
  message: string;
  progress?: number; // 0-100
}

// ── Orchestrator Config ───────────────────────

export interface OrchestratorConfig {
  /** The gateway to use for AI calls */
  gateway: AIGateway;
  /** Available endpoints */
  endpoints: UserEndpoint[];
  /** Default endpoint ID to use */
  defaultEndpointId: string;
  /** Maximum retries for failed AI calls */
  maxRetries: number;
  /** Whether to enable fallback to other endpoints */
  enableFallback: boolean;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  gateway: DefaultGateway,
  endpoints: getDefaultUserEndpoints(),
  defaultEndpointId: "openai-gpt-4o",
  maxRetries: 2,
  enableFallback: true,
};

// ── Orchestrator ──────────────────────────────

export interface Orchestrator {
  /** Get current workflow status */
  getStatus(): WorkflowStatus;

  /** Get the active endpoint */
  getActiveEndpoint(): UserEndpoint;

  /** Set the active endpoint by ID */
  setActiveEndpoint(endpointId: string): void;

  /** Get all configured endpoints */
  getEndpoints(): UserEndpoint[];

  /** Update endpoint configuration */
  updateEndpoint(endpoint: UserEndpoint): void;

  /** Get the orchestrator config */
  getConfig(): OrchestratorConfig;

  /**
   * Send a prompt to the AI and get a response.
   * Handles retries and optional fallback.
   */
  generate(
    messages: GenerateOptions["messages"],
    options?: Partial<GenerateOptions>,
  ): Promise<GenerateResult>;

  /**
   * Test a connection to an endpoint.
   */
  testConnection(endpointId: string, apiKey?: string): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }>;

  /**
   * Find the best endpoint for a given capability.
   */
  findEndpointForCapability(capability: AICapability): UserEndpoint | null;
}

// ── Implementation ────────────────────────────

export function createOrchestrator(
  config: Partial<OrchestratorConfig> = {},
): Orchestrator {
  // Initialize from persisted settings, with caller config taking precedence
  const persistedEndpoints = loadEndpoints();
  const persistedActiveId = loadActiveEndpointId();
  const mergedConfig: OrchestratorConfig = {
    ...DEFAULT_CONFIG,
    endpoints: persistedEndpoints,
    defaultEndpointId: persistedActiveId,
    ...config,
  };
  let activeEndpointId = mergedConfig.defaultEndpointId;
  console.log(`[orchestrator] createOrchestrator → ${mergedConfig.endpoints.length} endpoints, activeId="${activeEndpointId}"`);
  let status: WorkflowStatus = { state: "idle", message: "Ready" };

  function setStatus(newStatus: Partial<WorkflowStatus>): void {
    status = { ...status, ...newStatus };
  }

  function getActiveEndpoint(): UserEndpoint {
    const endpoint = mergedConfig.endpoints.find(
      (e) => e.id === activeEndpointId,
    );
    return endpoint ?? mergedConfig.endpoints[0];
  }

  return {
    getStatus(): WorkflowStatus {
      return { ...status };
    },

    getActiveEndpoint(): UserEndpoint {
      return getActiveEndpoint();
    },

    setActiveEndpoint(endpointId: string): void {
      const exists = mergedConfig.endpoints.some((e) => e.id === endpointId);
      if (exists) {
        activeEndpointId = endpointId;
      }
    },

    getEndpoints(): UserEndpoint[] {
      // Always read fresh from storage so AI Settings changes are reflected immediately
      return loadEndpoints();
    },

    updateEndpoint(endpoint: UserEndpoint): void {
      const idx = mergedConfig.endpoints.findIndex(
        (e) => e.id === endpoint.id,
      );
      if (idx >= 0) {
        mergedConfig.endpoints[idx] = endpoint;
      }
    },

    getConfig(): OrchestratorConfig {
      return { ...mergedConfig };
    },

    async generate(
      messages: GenerateOptions["messages"],
      options?: Partial<GenerateOptions>,
    ): Promise<GenerateResult> {
      const endpoint = getActiveEndpoint();
      let lastError: Error | null = null;

      // Auto-resolve API key: caller-provided key wins, otherwise resolve from storage
      const resolvedApiKey =
        options?.apiKey ??
        getApiKeyForEndpoint(endpoint) ??
        undefined;

      if (import.meta.env.DEV) {
        console.log(`[orchestrator] generate: endpoint="${endpoint.id}", hasApiKey=${!!resolvedApiKey}`);
      }

      for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
        try {
          setStatus({
            state: "generating",
            message: `Generating (attempt ${attempt + 1})...`,
            progress: Math.round((attempt / (mergedConfig.maxRetries + 1)) * 50),
          });

          const result = await mergedConfig.gateway.generate({
            endpoint: {
              ...endpoint,
              // Allow overriding endpoint fields
              ...(options?.endpoint ? { ...options.endpoint } : {}),
            },
            messages,
            apiKey: resolvedApiKey,
            temperature: options?.temperature ?? 0.3,
            maxTokens: options?.maxTokens ?? 4096,
            structuredOutput: options?.structuredOutput,
            signal: options?.signal,
          });

          setStatus({
            state: "idle",
            message: "Generation complete.",
            progress: 100,
          });

          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          // Don't retry auth errors
          if (
            lastError.message.includes("API key") ||
            lastError.message.includes("401")
          ) {
            break;
          }

          // Try fallback endpoint if enabled
          if (
            mergedConfig.enableFallback &&
            attempt === mergedConfig.maxRetries - 1
          ) {
            const fallback = mergedConfig.endpoints.find(
              (e) => e.id !== activeEndpointId && e.enabled,
            );
            if (fallback) {
              setStatus({
                state: "generating",
                message: `Falling back to ${fallback.label}...`,
              });
              // Temporarily switch for this call
              const fallbackKey =
                getApiKeyForEndpoint(fallback) ?? undefined;
              const result = await mergedConfig.gateway.generate({
                endpoint: fallback,
                messages,
                apiKey: fallbackKey,
                temperature: options?.temperature ?? 0.3,
                maxTokens: options?.maxTokens ?? 4096,
              });
              setStatus({ state: "idle", message: "Generation complete (fallback).", progress: 100 });
              return result;
            }
          }
        }
      }

      setStatus({
        state: "error",
        message: lastError?.message ?? "Generation failed.",
      });

      throw lastError ?? new Error("Generation failed after all retries.");
    },

    async testConnection(endpointId: string, apiKey?: string) {
      const endpoint = mergedConfig.endpoints.find(
        (e) => e.id === endpointId,
      );
      if (!endpoint) {
        return { success: false, message: `Unknown endpoint: ${endpointId}` };
      }

      return mergedConfig.gateway.validateConnection(endpoint, apiKey);
    },

    findEndpointForCapability(capability: AICapability): UserEndpoint | null {
      // First try the active endpoint
      const active = getActiveEndpoint();
      if (active.capabilities.includes(capability)) {
        return active;
      }

      // Fall back to any enabled endpoint with the capability
      return (
        mergedConfig.endpoints.find(
          (e) => e.enabled && e.capabilities.includes(capability),
        ) ?? null
      );
    },
  };
}
