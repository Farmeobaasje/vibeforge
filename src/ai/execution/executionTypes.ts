// ──────────────────────────────────────────────
// ExecutionTypes — Epic 21.1
// Types for the AI Execution Pipeline.
// Each step in the pipeline has a status, timing,
// and optional error message.
// ──────────────────────────────────────────────

export type ExecutionStepStatus =
  | "pending"
  | "active"
  | "completed"
  | "error";

export type ExecutionStepId =
  | "prepare"
  | "connect"
  | "generate"
  | "validate"
  | "build";

export interface ExecutionStep {
  id: ExecutionStepId;
  label: string;
  description: string;
  status: ExecutionStepStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface ExecutionState {
  isRunning: boolean;
  providerLabel: string;
  model: string;
  endpoint?: string;
  estimatedTime?: string;
  steps: ExecutionStep[];
  error?: string;
}

/**
 * Create the initial execution state with all steps pending.
 */
export function createInitialExecutionState(
  providerLabel: string,
  model: string,
  endpoint?: string,
): ExecutionState {
  return {
    isRunning: true,
    providerLabel,
    model,
    endpoint,
    estimatedTime: estimateTime(providerLabel),
    steps: [
      {
        id: "prepare",
        label: "Preparing prompt",
        description: "Building the AI prompt from your project idea",
        status: "pending",
      },
      {
        id: "connect",
        label: "Connecting to provider",
        description: `Establishing connection to ${providerLabel}`,
        status: "pending",
      },
      {
        id: "generate",
        label: "Waiting for model response",
        description: `${providerLabel} is analysing your project...`,
        status: "pending",
      },
      {
        id: "validate",
        label: "Validating ProjectDefinition",
        description: "Checking the AI response for valid JSON",
        status: "pending",
      },
      {
        id: "build",
        label: "Building summary",
        description: "Preparing your project overview",
        status: "pending",
      },
    ],
  };
}

/**
 * Update a specific step's status in the execution state.
 */
export function updateStepStatus(
  state: ExecutionState,
  stepId: ExecutionStepId,
  status: ExecutionStepStatus,
  error?: string,
): ExecutionState {
  return {
    ...state,
    steps: state.steps.map((step) => {
      if (step.id !== stepId) return step;
      const now = performance.now();
      return {
        ...step,
        status,
        startedAt: status === "active" ? now : step.startedAt,
        completedAt: status === "completed" || status === "error" ? now : undefined,
        error,
      };
    }),
    error: status === "error" ? error : state.error,
  };
}

/**
 * Mark the entire execution as completed.
 */
export function completeExecution(state: ExecutionState): ExecutionState {
  return {
    ...state,
    isRunning: false,
  };
}

/**
 * Mark the entire execution as failed with an error.
 */
export function failExecution(state: ExecutionState, error: string): ExecutionState {
  return {
    ...state,
    isRunning: false,
    error,
  };
}

/**
 * Estimate the time for a provider based on its name.
 */
function estimateTime(providerLabel: string): string {
  const lower = providerLabel.toLowerCase();
  if (lower.includes("mock")) return "< 1 sec";
  if (lower.includes("deepseek")) return "15–40 sec";
  if (lower.includes("claude") || lower.includes("anthropic")) return "10–30 sec";
  if (lower.includes("gpt") || lower.includes("openai")) return "10–25 sec";
  if (lower.includes("gemini") || lower.includes("google")) return "10–25 sec";
  if (lower.includes("local") || lower.includes("ollama") || lower.includes("lm studio")) return "5–30 sec";
  return "10–40 sec";
}
