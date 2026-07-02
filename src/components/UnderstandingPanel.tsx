// ──────────────────────────────────────────────
// UnderstandingPanel — right sidebar of the Interview workspace
// Shows "Live Project Definition" as the AI builds it
// Displays actual Project Definition fields being filled
// ──────────────────────────────────────────────

import { useState } from "react";

export interface UnderstandingData {
  /** Project vision / description */
  vision?: string;
  /** Target users */
  targetUsers?: string[];
  /** Problem statement */
  problem?: string;
  /** Solution direction */
  solution?: string;
  /** Architecture pattern */
  architecture?: string;
  /** Tech stack preferences */
  techStack?: string[];
  /** Constraints */
  constraints?: string[];
  /** Assumptions the AI is making */
  assumptions?: string[];
  /** Next objective / what the AI wants to explore next */
  nextObjective?: string;
}

interface Props {
  /** The current understanding data */
  data: UnderstandingData;
  /** Whether data is still being gathered (show loading state) */
  isLoading?: boolean;
}

function FieldCard({ label, children, isEmpty }: { label: string; children: React.ReactNode; isEmpty?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border transition-colors duration-200 ${isEmpty ? "border-muted" : "border-app"}`}>
      <h4 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
        {label}
      </h4>
      {isEmpty ? (
        <p className="text-xs text-muted italic">Waiting for input</p>
      ) : (
        <div className="text-xs text-app leading-relaxed">{children}</div>
      )}
    </div>
  );
}

function TagList({ items, empty }: { items?: string[]; empty: string }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-muted italic">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="badge-brand text-[10px]">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function UnderstandingPanel({ data, isLoading = false }: Props) {
  const [assumptionsExpanded, setAssumptionsExpanded] = useState(false);

  const hasVision = !!data.vision;
  const hasUsers = !!data.targetUsers?.length;
  const hasProblem = !!data.problem;
  const hasSolution = !!data.solution;
  const hasArch = !!data.architecture;
  const hasTech = !!data.techStack?.length;
  const hasConstraints = !!data.constraints?.length;
  const hasAssumptions = !!data.assumptions?.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-divider">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
          Live Project Definition
          {isLoading && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          )}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Vision */}
        <FieldCard label="Vision" isEmpty={!hasVision}>
          <p>{data.vision}</p>
        </FieldCard>

        {/* Target Users */}
        <FieldCard label="Users" isEmpty={!hasUsers}>
          <TagList items={data.targetUsers} empty="Waiting for input" />
        </FieldCard>

        {/* Problem */}
        <FieldCard label="Problem" isEmpty={!hasProblem}>
          <p>{data.problem}</p>
        </FieldCard>

        {/* Solution */}
        <FieldCard label="Solution" isEmpty={!hasSolution}>
          <p>{data.solution}</p>
        </FieldCard>

        {/* Architecture */}
        <FieldCard label="Architecture" isEmpty={!hasArch}>
          <p>{data.architecture}</p>
        </FieldCard>

        {/* Tech Stack */}
        <FieldCard label="Tech Stack" isEmpty={!hasTech}>
          <TagList items={data.techStack} empty="Waiting for input" />
        </FieldCard>

        {/* Constraints */}
        <FieldCard label="Constraints" isEmpty={!hasConstraints}>
          <TagList items={data.constraints} empty="Waiting for input" />
        </FieldCard>

        {/* Assumptions — collapsible, hidden when empty */}
        {hasAssumptions ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 overflow-hidden">
            <button
              onClick={() => setAssumptionsExpanded(!assumptionsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-semibold text-warning uppercase tracking-wider"
              aria-expanded={assumptionsExpanded}
            >
              <span>Needs Clarification ({data.assumptions?.length})</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${assumptionsExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {assumptionsExpanded && (
              <div className="px-3 pb-3 space-y-1">
                {data.assumptions?.map((a, i) => (
                  <p key={i} className="text-[11px] text-warning leading-relaxed">
                    • {a}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-muted">
            <h4 className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Needs Clarification
            </h4>
            <p className="text-xs text-muted italic">No assumptions yet</p>
          </div>
        )}

        {/* Next Objective — prominent */}
        {data.nextObjective && (
          <div className="p-3 rounded-lg border border-brand/30 bg-brand/10 mt-3">
            <h4 className="text-[10px] font-semibold text-brand uppercase tracking-wider mb-1.5">
              Next Objective
            </h4>
            <p className="text-xs text-brand leading-relaxed">{data.nextObjective}</p>
          </div>
        )}
      </div>
    </div>
  );
}
