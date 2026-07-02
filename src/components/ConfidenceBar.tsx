// ──────────────────────────────────────────────
// ConfidenceBar — live confidence meter
// Shows overall confidence level as a progress bar
// with neutral label and percentage
// ──────────────────────────────────────────────

interface Props {
  /** Confidence percentage 0-100 */
  percentage: number;
  /** Optional label override (auto-derived if omitted) */
  label?: string;
  /** Optional compact mode for sidebar use */
  compact?: boolean;
}

export default function ConfidenceBar({ percentage, label, compact = false }: Props) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const displayLabel = label ?? "Project Understanding";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="text-xs font-medium text-secondary shrink-0 tabular-nums">
          {Math.round(clamped)}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0 min-w-[120px] justify-end">
        <span className="text-xs text-secondary">{displayLabel}</span>
        <span className="text-xs text-muted tabular-nums font-medium">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}
