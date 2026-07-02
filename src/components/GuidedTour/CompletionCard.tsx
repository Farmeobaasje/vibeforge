// ──────────────────────────────────────────────
// CompletionCard — "What happened?" summary overlay
// Shown after all demo interview steps are done
// ──────────────────────────────────────────────

import { useEffect, useState } from "react";

interface CompletionCardProps {
  projectName: string;
  topicCount: number;
  onContinue: () => void;
  onExit: () => void;
}

export default function CompletionCard({
  projectName,
  topicCount,
  onContinue,
  onExit,
}: CompletionCardProps) {
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  const achievements = [
    "Interview completed",
    "Project Definition created",
    "Requirements extracted",
    "Technical decisions identified",
    "AI workspace prepared",
  ];

  const nextSteps = [
    "PRD (Product Requirements Document)",
    "SPEC (Technical Specification)",
    "README",
    "Roadmap",
    "Bootstrap Package",
    "Memory Bank",
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-500
          ${isEntered ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Card */}
      <div
        className={`
          relative w-[520px] max-w-[90vw] max-h-[85vh] overflow-y-auto
          rounded-2xl border border-success/20
          bg-elevated shadow-app-lg
          transition-all duration-500 ease-out
          ${isEntered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}
        `}
      >
        {/* Success accent bar */}
        <div className="h-1.5 bg-success rounded-t-2xl" />

        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-app mb-1">Demo Complete</h2>
          <p className="text-sm text-secondary mb-6">
            {projectName} has been fully interviewed by the AI.
          </p>

          {/* What happened section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-app uppercase tracking-wider mb-3">
              What happened
            </h3>
            <div className="space-y-2">
              {achievements.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topics covered */}
          <div className="mb-6 px-4 py-3 rounded-xl bg-brand/5 border border-brand/10">
            <span className="text-xs text-brand font-medium">
              {topicCount} topics covered
            </span>
            <span className="text-xs text-muted ml-2">
              — from vision to AI workflow
            </span>
          </div>

          {/* Next steps */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-app uppercase tracking-wider mb-3">
              Next, VibeForge can generate
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {nextSteps.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-app/50">
                  <svg className="w-3.5 h-3.5 text-brand-soft shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[11px] text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onContinue}
              className="btn-primary px-6 py-3 text-sm flex-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Continue to Summary
            </button>
            <button
              onClick={onExit}
              className="btn-secondary px-4 py-3 text-sm"
            >
              Exit demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
