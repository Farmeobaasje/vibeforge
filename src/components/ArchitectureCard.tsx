// ──────────────────────────────────────────────
// ArchitectureCard — Step 3 sub-component
// Visual card showing the recommended architecture
// pattern with explanation, benefits, and evolution.
// ──────────────────────────────────────────────

interface Props {
  architecture: string;
}

export default function ArchitectureCard({ architecture }: Props) {
  if (!architecture || architecture.trim().length === 0) return null;

  // Try to extract a pattern name from the first line
  const lines = architecture.trim().split("\n");
  const firstLine = lines[0].replace(/^[#*\-•]\s*/, "").trim();
  const rest = lines.slice(1).join("\n").trim();

  return (
    <div className="bg-gradient-to-br from-indigo-950/30 to-gray-900/50 border border-indigo-800/40 rounded-xl p-6 mb-5 shadow-lg shadow-indigo-900/10">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-100">Architecture Recommendation</h3>
      </div>

      <div className="space-y-3">
        {/* Pattern name */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended Pattern</span>
          <p className="text-lg font-bold text-indigo-300 mt-1">{firstLine}</p>
        </div>

        {/* Details */}
        {rest && (
          <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap bg-gray-800/20 rounded-lg p-4 border border-gray-800/50">
            {rest}
          </div>
        )}
      </div>
    </div>
  );
}
