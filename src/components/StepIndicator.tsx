// ──────────────────────────────────────────────
// StepIndicator — visual step progress bar
// Shows 6 steps with labels and active/completed states
// ──────────────────────────────────────────────

import type { WizardStep } from "../hooks/useWizard";
import { WIZARD_LABELS } from "../hooks/useWizard";

interface Props {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}

const STEP_NUMBERS: WizardStep[] = [1, 2, 3, 4, 5, 6];

export default function StepIndicator({ currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-3xl mx-auto">
      {STEP_NUMBERS.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isClickable = step <= currentStep && onStepClick;

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Step circle + label */}
            <button
              onClick={isClickable ? () => onStepClick(step) : undefined}
              disabled={!isClickable}
              className={`
                flex flex-col items-center gap-1.5 group transition-all duration-200
                ${isClickable ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {/* Circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${
                    isActive
                      ? "bg-brand text-on-brand ring-2 ring-brand ring-offset-2 ring-offset-app"
                      : isCompleted
                        ? "bg-success/80 text-on-brand"
                        : "bg-elevated text-muted"
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[11px] font-medium tracking-wide uppercase whitespace-nowrap
                  transition-colors duration-200
                  ${isActive ? "text-brand" : isCompleted ? "text-success" : "text-muted"}
                `}
              >
                {WIZARD_LABELS[step]}
              </span>
            </button>

            {/* Connector line (not after last step) */}
            {index < STEP_NUMBERS.length - 1 && (
              <div className="flex-1 mx-2 mb-6">
                <div
                  className={`
                    h-0.5 rounded-full transition-colors duration-300
                    ${step <= currentStep ? "bg-brand/60" : "bg-elevated"}
                  `}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
