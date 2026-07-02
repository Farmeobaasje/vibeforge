// ──────────────────────────────────────────────
// DeveloperTools — Step 3 sub-component
// Collapsible debug section with checkboxes.
// Hidden by default — only for power users.
// ──────────────────────────────────────────────

import { useState } from "react";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";

interface Props {
  analysis: ArchitectureAnalysis;
}

export default function DeveloperTools({ analysis }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);

  if (!isOpen) {
    return (
      <div className="card mb-5 overflow-hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🐛</span>
            <h3 className="text-sm font-semibold text-secondary">Developer Tools</h3>
          </div>
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-5 overflow-hidden">
      <button
        onClick={() => setIsOpen(false)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🐛</span>
          <h3 className="text-sm font-semibold text-secondary">Developer Tools</h3>
        </div>
        <svg
          className="w-4 h-4 text-muted transition-transform rotate-180"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="px-4 pb-4 space-y-3">
        {/* Checkboxes */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={showJson}
            onChange={(e) => setShowJson(e.target.checked)}
            className="w-4 h-4 rounded border-app bg-surface text-brand focus:ring-brand/40 focus:ring-offset-0"
          />
          <span className="text-xs text-secondary group-hover:text-app transition-colors">Show raw architecture analysis (JSON)</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={showScoring}
            onChange={(e) => setShowScoring(e.target.checked)}
            className="w-4 h-4 rounded border-app bg-surface text-brand focus:ring-brand/40 focus:ring-offset-0"
          />
          <span className="text-xs text-secondary group-hover:text-app transition-colors">Show scoring</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={showConfidence}
            onChange={(e) => setShowConfidence(e.target.checked)}
            className="w-4 h-4 rounded border-app bg-surface text-brand focus:ring-brand/40 focus:ring-offset-0"
          />
          <span className="text-xs text-secondary group-hover:text-app transition-colors">Show confidence</span>
        </label>

        {/* Scoring display */}
        {showScoring && (
          <div className="bg-panel rounded-lg p-3 border border-app">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Overall Score</span>
            <p className="text-sm text-secondary mt-0.5">{analysis.overallScore} / 100</p>
          </div>
        )}

        {/* Confidence display */}
        {showConfidence && (
          <div className="bg-panel rounded-lg p-3 border border-app">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Confidence</span>
            <p className="text-sm text-secondary mt-0.5">{analysis.confidence} / 100</p>
          </div>
        )}

        {/* Raw JSON */}
        {showJson && (
          <pre className="text-xs text-muted bg-panel rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto border border-app">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
