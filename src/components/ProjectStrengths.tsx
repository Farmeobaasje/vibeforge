// ──────────────────────────────────────────────
// ProjectStrengths — Step 3 sub-component
// Shows what's already strong about the project.
// Only renders if actual strengths are detected.
// NEVER fabricates positive observations.
// ──────────────────────────────────────────────

import type { Strength } from "../lib/architectureInsights";

interface Props {
  strengths: Strength[];
}

export default function ProjectStrengths({ strengths }: Props) {
  // If no meaningful strengths, omit entirely
  if (strengths.length === 0) return null;

  return (
    <div className="card p-6 mb-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-xl">✅</span>
        <h3 className="text-base font-semibold text-app">Project Strengths</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {strengths.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-sm text-success bg-success/10 border border-success/30 px-3 py-1.5 rounded-lg"
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
