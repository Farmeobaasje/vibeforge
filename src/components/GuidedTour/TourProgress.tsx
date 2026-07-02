// ──────────────────────────────────────────────
// TourProgress — Top-left step indicator
// Shows "Step X of Y" + mini roadmap during demo
// ──────────────────────────────────────────────

interface TourProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export default function TourProgress({
  currentStep,
  totalSteps,
  stepTitles,
}: TourProgressProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-elevated/80 border border-app/50">
      {/* Step counter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">
          Guided Tour
        </span>
        <span className="text-[10px] text-muted">
          · Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Mini dots */}
      <div className="flex items-center gap-1">
        {stepTitles.map((title, i) => {
          const isActive = i === currentStep - 1;
          const isPast = i < currentStep - 1;
          return (
            <div
              key={i}
              className={`
                w-1.5 h-1.5 rounded-full transition-all duration-300
                ${isActive
                  ? "bg-brand w-3"
                  : isPast
                    ? "bg-brand/40"
                    : "bg-muted/30"
                }
              `}
              title={title}
            />
          );
        })}
      </div>
    </div>
  );
}
