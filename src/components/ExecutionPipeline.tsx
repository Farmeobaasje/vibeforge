// ──────────────────────────────────────────────
// ExecutionPipeline — Epic 21.1
// Displays the AI execution pipeline with visible
// steps: Prepare → Connect → Generate → Validate → Build
// Each step shows its status with icons and timing.
// ──────────────────────────────────────────────

import type { ExecutionState, ExecutionStep } from "../ai/execution/executionTypes";

interface Props {
  state: ExecutionState;
}

export default function ExecutionPipeline({ state }: Props) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-4">
      {/* Provider header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-200">
              {state.providerLabel}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {state.model}
          </p>
          {state.endpoint && (
            <p className="text-[11px] text-gray-600 mt-0.5 font-mono truncate">
              {state.endpoint}
            </p>
          )}
        </div>
        {state.estimatedTime && (
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-gray-500">Est. time</span>
            <p className="text-xs text-gray-400 font-medium">{state.estimatedTime}</p>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {state.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>

      {/* Error summary */}
      {state.error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/30 text-xs text-red-400">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{state.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step Row ──────────────────────────────────

function StepRow({ step }: { step: ExecutionStep }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Status icon */}
      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
        {step.status === "completed" && (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {step.status === "active" && (
          <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {step.status === "error" && (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {step.status === "pending" && (
          <div className="w-2 h-2 rounded-full bg-gray-700" />
        )}
      </div>

      {/* Step content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              step.status === "completed"
                ? "text-green-400"
                : step.status === "active"
                  ? "text-indigo-300"
                  : step.status === "error"
                    ? "text-red-400"
                    : "text-gray-500"
            }`}
          >
            {step.label}
          </span>
          {step.status === "active" && (
            <span className="text-[10px] text-indigo-500 animate-pulse">●</span>
          )}
        </div>
        <p
          className={`text-[11px] mt-0.5 ${
            step.status === "pending" ? "text-gray-600" : "text-gray-500"
          }`}
        >
          {step.status === "error" && step.error ? step.error : step.description}
        </p>
      </div>

      {/* Timing */}
      {step.completedAt && step.startedAt && (
        <span className="shrink-0 text-[10px] text-gray-600">
          {((step.completedAt - step.startedAt) / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}
