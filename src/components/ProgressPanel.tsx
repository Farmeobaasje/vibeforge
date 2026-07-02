// ──────────────────────────────────────────────
// ProgressPanel — left sidebar of the Interview workspace
// Shows "Project Discovery" progress per topic
// ──────────────────────────────────────────────

export interface TopicProgress {
  /** Topic identifier */
  topic: string;
  /** Display label */
  label: string;
  /** Whether this topic has been discussed */
  discussed: boolean;
  /** Confidence level for this topic (0-100) */
  confidence: number;
}

interface Props {
  /** List of topics with their progress status */
  topics: TopicProgress[];
  /** Overall confidence percentage (0-100) */
  overallConfidence: number;
  /** Current active topic */
  activeTopic?: string;
}

function topicIcon(discussed: boolean, isActive: boolean): string {
  if (isActive) return "●";
  if (discussed) return "✓";
  return "○";
}

function topicColor(discussed: boolean, isActive: string): string {
  if (isActive === "active") return "border-brand/30 bg-brand/10";
  if (discussed) return "border-success/30 bg-success/10";
  return "border-muted";
}

function topicLabelColor(discussed: boolean, isActive: boolean): string {
  if (isActive) return "text-brand";
  if (discussed) return "text-app";
  return "text-muted";
}

export default function ProgressPanel({ topics, overallConfidence, activeTopic }: Props) {
  const gathered = topics.filter((t) => t.discussed).length;
  const total = topics.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-divider">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Project Discovery
        </h3>
        <div className="text-xs text-secondary mb-2">
          {gathered} of {total} topics completed
        </div>
        <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
            style={{ width: `${Math.round(overallConfidence)}%` }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-[11px] text-muted tabular-nums font-medium">
            {Math.round(overallConfidence)}% complete
          </span>
        </div>
      </div>

      {/* Topic list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {topics.map((t) => {
          const isActive = t.topic === activeTopic;
          const color = topicColor(t.discussed, isActive ? "active" : "");
          const labelColor = topicLabelColor(t.discussed, isActive);

          return (
            <div
              key={t.topic}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-200 ${color}`}
            >
              <span className="text-sm font-bold shrink-0 w-4 text-center">
                {topicIcon(t.discussed, isActive)}
              </span>
              <span className={`text-xs font-medium ${labelColor} flex-1`}>
                {t.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-divider">
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="text-success">✓</span> Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="text-brand">●</span> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="text-muted">○</span> Pending
          </span>
        </div>
      </div>
    </div>
  );
}
